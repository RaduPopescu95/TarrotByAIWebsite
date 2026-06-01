import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminRtdb } from "./firebaseAdmin";
import { logRtdbMetric } from "../utils/realtimeMetrics";

const CACHE_COLLECTION = "internalCaches";
const MANIFEST_DOC_ID = "publicTarotData";
const CHUNK_PREFIX = "publicTarotData__";
const CACHE_VERSION = 1;
const MAX_DOC_BYTES = 900_000;
const DEFAULT_MEMORY_TTL_MS = 24 * 60 * 60 * 1000;
const parsedMemoryTtl = Number.parseInt(process.env.PUBLIC_TAROT_MEMORY_TTL_MS || "", 10);
const MEMORY_TTL_MS =
  Number.isFinite(parsedMemoryTtl) && parsedMemoryTtl > 0 ? parsedMemoryTtl : DEFAULT_MEMORY_TTL_MS;

export const PUBLIC_TAROT_DATASETS = [
  { category: "Citire-Personalizata", key: "Carti" },
  { category: "Citire-Personalizata", key: "Categorii" },
  { category: "Citire-Viitor", key: "Carti" },
  { category: "Citire-Viitor", key: "Categorii" },
  { category: "Others", key: "Citate-Motivationale" },
  { category: "Others", key: "Culori-Norocoase" },
  { category: "Others", key: "Numere-Norocoase" },
  { category: "Others", key: "Ore-Norocoase" },
];

const memoryEntries =
  globalThis.__PUBLIC_TAROT_MEMORY_CACHE__ ||
  (globalThis.__PUBLIC_TAROT_MEMORY_CACHE__ = new Map());
const datasetInflight =
  globalThis.__PUBLIC_TAROT_DATASET_INFLIGHT__ ||
  (globalThis.__PUBLIC_TAROT_DATASET_INFLIGHT__ = new Map());
const rebuildState =
  globalThis.__PUBLIC_TAROT_REBUILD_STATE__ ||
  (globalThis.__PUBLIC_TAROT_REBUILD_STATE__ = { promise: null });
const manifestMemoryState =
  globalThis.__PUBLIC_TAROT_MANIFEST_MEMORY__ ||
  (globalThis.__PUBLIC_TAROT_MANIFEST_MEMORY__ = { manifest: null, cachedAt: 0 });
const manifestInflight =
  globalThis.__PUBLIC_TAROT_MANIFEST_INFLIGHT__ ||
  (globalThis.__PUBLIC_TAROT_MANIFEST_INFLIGHT__ = { promise: null });
const bulkInflight =
  globalThis.__PUBLIC_TAROT_BULK_INFLIGHT__ ||
  (globalThis.__PUBLIC_TAROT_BULK_INFLIGHT__ = { promise: null });

export function getPublicTarotStorageKey(category, key) {
  return `${String(category)}-${String(key)}`;
}

export function buildPublicTarotBulkPayload(datasetMap) {
  const datasets = {};
  for (const { category, key } of PUBLIC_TAROT_DATASETS) {
    const storageKey = getPublicTarotStorageKey(category, key);
    const rows = datasetMap.get(getDatasetStorageKey(category, key)) || [];
    datasets[storageKey] = {
      category,
      key,
      arr: Array.isArray(rows) ? rows : [],
    };
  }
  return datasets;
}

function buildPublicTarotBulkPayloadFromMemory(source) {
  const datasetMap = new Map(
    PUBLIC_TAROT_DATASETS.map(({ category, key }) => [
      getDatasetStorageKey(category, key),
      getMemoryEntry(category, key)?.arr || [],
    ])
  );
  return {
    datasets: buildPublicTarotBulkPayload(datasetMap),
    source,
  };
}

function isManifestMemoryFresh(now = Date.now()) {
  return (
    !!manifestMemoryState.manifest &&
    now - manifestMemoryState.cachedAt <= MEMORY_TTL_MS
  );
}

async function loadPublicTarotManifest(db) {
  const now = Date.now();
  if (isManifestMemoryFresh(now)) {
    return manifestMemoryState.manifest;
  }

  if (!manifestInflight.promise) {
    manifestInflight.promise = (async () => {
      const manifestSnap = await db.collection(CACHE_COLLECTION).doc(MANIFEST_DOC_ID).get();
      if (!manifestSnap.exists) {
        manifestMemoryState.manifest = null;
        manifestMemoryState.cachedAt = 0;
        return null;
      }

      const manifest = manifestSnap.data() || {};
      if (
        manifest.version !== CACHE_VERSION ||
        !manifest.datasets ||
        typeof manifest.datasets !== "object"
      ) {
        manifestMemoryState.manifest = null;
        manifestMemoryState.cachedAt = 0;
        return null;
      }

      manifestMemoryState.manifest = manifest;
      manifestMemoryState.cachedAt = Date.now();
      return manifest;
    })().finally(() => {
      manifestInflight.promise = null;
    });
  }

  return manifestInflight.promise;
}

function rowsFromChunkSnaps(chunkDocIds, chunkSnapById) {
  const rows = [];
  for (const docId of chunkDocIds) {
    const chunkSnap = chunkSnapById.get(docId);
    if (!chunkSnap?.exists) return null;
    const chunkData = chunkSnap.data() || {};
    if (chunkData.version !== CACHE_VERSION) return null;
    const normalizedRows = normalizeRows(chunkData.rows);
    if (!normalizedRows) return null;
    rows.push(...normalizedRows);
  }
  return rows;
}

async function loadRowsForManifestEntry(db, manifest, category, key) {
  const datasetKey = getDatasetStorageKey(category, key);
  const entry = manifest.datasets[datasetKey];
  if (!entry) return null;

  const chunkDocIds = Array.isArray(entry.chunkDocIds) ? entry.chunkDocIds : [];
  if (entry.itemCount === 0 && chunkDocIds.length === 0) {
    setMemoryEntry(category, key, [], Date.now());
    return [];
  }
  if (chunkDocIds.length === 0) {
    return null;
  }

  const chunkSnaps = await Promise.all(
    chunkDocIds.map((docId) => db.collection(CACHE_COLLECTION).doc(docId).get())
  );
  const chunkSnapById = new Map(
    chunkDocIds.map((docId, index) => [docId, chunkSnaps[index]])
  );
  const rows = rowsFromChunkSnaps(chunkDocIds, chunkSnapById);
  if (rows === null) return null;

  setMemoryEntry(category, key, rows, Date.now());
  return rows;
}

async function loadAllDatasetsFromFirestore() {
  const db = getAdminDb();
  const manifest = await loadPublicTarotManifest(db);
  if (!manifest) return null;

  const datasetMap = new Map();
  const uniqueChunkDocIds = new Set();

  for (const { category, key } of PUBLIC_TAROT_DATASETS) {
    const datasetKey = getDatasetStorageKey(category, key);
    const entry = manifest.datasets[datasetKey];
    if (!entry) return null;

    const chunkDocIds = Array.isArray(entry.chunkDocIds) ? entry.chunkDocIds : [];
    if (entry.itemCount === 0 && chunkDocIds.length === 0) {
      datasetMap.set(datasetKey, []);
      setMemoryEntry(category, key, [], Date.now());
      continue;
    }
    if (chunkDocIds.length === 0) {
      return null;
    }
    chunkDocIds.forEach((docId) => uniqueChunkDocIds.add(docId));
  }

  const chunkIds = [...uniqueChunkDocIds];
  const chunkSnaps = await Promise.all(
    chunkIds.map((docId) => db.collection(CACHE_COLLECTION).doc(docId).get())
  );
  const chunkSnapById = new Map(chunkIds.map((docId, index) => [docId, chunkSnaps[index]]));

  for (const { category, key } of PUBLIC_TAROT_DATASETS) {
    const datasetKey = getDatasetStorageKey(category, key);
    const entry = manifest.datasets[datasetKey];
    const chunkDocIds = Array.isArray(entry.chunkDocIds) ? entry.chunkDocIds : [];
    if (entry.itemCount === 0 && chunkDocIds.length === 0) {
      continue;
    }

    const rows = rowsFromChunkSnaps(chunkDocIds, chunkSnapById);
    if (rows === null) return null;
    datasetMap.set(datasetKey, rows);
    setMemoryEntry(category, key, rows, Date.now());
  }

  return datasetMap;
}

function getDatasetStorageKey(category, key) {
  return `${String(category)}::${String(key)}`;
}

function toSafeDocId(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function estimateJsonBytes(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch (_) {
    return Number.POSITIVE_INFINITY;
  }
}

function normalizeRows(value) {
  if (!Array.isArray(value)) return null;
  return value.filter((row) => row != null);
}

function toChunkDocId(datasetKey, index) {
  return `${CHUNK_PREFIX}${toSafeDocId(datasetKey)}__chunk_${index}`;
}

function splitRowsIntoChunks(rows, maxChunkBytes) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const chunks = [];
  let currentRows = [];
  let currentBytes = 2;

  for (const row of rows) {
    const rowBytes = estimateJsonBytes(row);
    if (rowBytes > maxChunkBytes) {
      throw new Error(
        `Public tarot row is too large for chunking (${row?.id || "unknown"}, ${rowBytes} bytes).`
      );
    }

    const separatorBytes = currentRows.length === 0 ? 0 : 1;
    if (currentBytes + separatorBytes + rowBytes > maxChunkBytes) {
      chunks.push(currentRows);
      currentRows = [row];
      currentBytes = 2 + rowBytes;
    } else {
      currentRows.push(row);
      currentBytes += separatorBytes + rowBytes;
    }
  }

  if (currentRows.length > 0) {
    chunks.push(currentRows);
  }

  return chunks;
}

function setMemoryEntry(category, key, arr, cachedAt = Date.now()) {
  memoryEntries.set(getDatasetStorageKey(category, key), {
    arr: Array.isArray(arr) ? arr : [],
    cachedAt,
  });
}

function hydrateMemoryEntries(datasetMap, cachedAt = Date.now()) {
  for (const dataset of PUBLIC_TAROT_DATASETS) {
    const storageKey = getDatasetStorageKey(dataset.category, dataset.key);
    const arr = datasetMap.get(storageKey) || [];
    setMemoryEntry(dataset.category, dataset.key, arr, cachedAt);
  }
}

function getMemoryEntry(category, key) {
  return memoryEntries.get(getDatasetStorageKey(category, key)) || null;
}

function isMemoryFresh(entry, now = Date.now()) {
  return !!entry && now - entry.cachedAt <= MEMORY_TTL_MS;
}

async function logPublicTarotRebuild(datasetMap) {
  try {
    const db = getAdminDb();
    const writes = PUBLIC_TAROT_DATASETS.map(({ category, key }) => {
      const docId = `${category}__${key}`.replace(/[\s/]+/g, "_");
      const arr = datasetMap.get(getDatasetStorageKey(category, key)) || [];
      return db
        .collection("PublicTarotFetchesWebsite")
        .doc(docId)
        .set(
          {
            count: FieldValue.increment(1),
            lastRebuiltAt: new Date().toISOString(),
            itemCount: arr.length,
          },
          { merge: true }
        );
    });
    await Promise.all(writes);
  } catch (error) {
    console.error("[publicTarotCache] failed to log rebuild", error?.message || error);
  }
}

async function readDatasetFromRtdb(category, key) {
  const path = `${category}/${key}`;
  const startedAt = Date.now();
  const rtdb = getAdminRtdb();
  const snapshot = await rtdb.ref(path).once("value");
  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  const rows = data ? Object.values(data) : [];
  logRtdbMetric("server_read_dataset", {
    path,
    count: rows.length,
    elapsedMs: Date.now() - startedAt,
  });
  return rows;
}

async function buildDatasetMapFromRtdb() {
  const results = await Promise.all(
    PUBLIC_TAROT_DATASETS.map(async ({ category, key }) => {
      const arr = await readDatasetFromRtdb(category, key);
      return [getDatasetStorageKey(category, key), arr];
    })
  );
  return new Map(results);
}

async function persistMaterializedCache(datasetMap) {
  const db = getAdminDb();
  const manifestRef = db.collection(CACHE_COLLECTION).doc(MANIFEST_DOC_ID);
  const existingManifestSnap = await manifestRef.get();
  const existingManifest = existingManifestSnap.exists ? existingManifestSnap.data() || {} : {};
  const previousChunkDocIds = [];

  if (existingManifest?.datasets && typeof existingManifest.datasets === "object") {
    for (const entry of Object.values(existingManifest.datasets)) {
      if (entry && Array.isArray(entry.chunkDocIds)) {
        previousChunkDocIds.push(...entry.chunkDocIds);
      }
    }
  }

  const manifestDatasets = {};
  const nextChunkDocIds = [];
  const batch = db.batch();

  for (const { category, key } of PUBLIC_TAROT_DATASETS) {
    const datasetKey = getDatasetStorageKey(category, key);
    const arr = datasetMap.get(datasetKey) || [];
    const chunks = splitRowsIntoChunks(arr, MAX_DOC_BYTES);
    const chunkDocIds = chunks.map((_, index) => toChunkDocId(datasetKey, index));

    manifestDatasets[datasetKey] = {
      category,
      key,
      itemCount: arr.length,
      chunkCount: chunkDocIds.length,
      chunkDocIds,
    };

    chunkDocIds.forEach((docId, index) => {
      batch.set(
        db.collection(CACHE_COLLECTION).doc(docId),
        {
          version: CACHE_VERSION,
          datasetKey,
          index,
          rowCount: chunks[index].length,
          rows: chunks[index],
          updatedAt: new Date().toISOString(),
        },
        { merge: false }
      );
      nextChunkDocIds.push(docId);
    });
  }

  batch.set(
    manifestRef,
    {
      version: CACHE_VERSION,
      updatedAt: new Date().toISOString(),
      datasetCount: PUBLIC_TAROT_DATASETS.length,
      datasets: manifestDatasets,
    },
    { merge: false }
  );

  const staleChunkDocIds = previousChunkDocIds.filter((docId) => !nextChunkDocIds.includes(docId));
  staleChunkDocIds.forEach((docId) => {
    batch.delete(db.collection(CACHE_COLLECTION).doc(docId));
  });

  await batch.commit();

  manifestMemoryState.manifest = {
    version: CACHE_VERSION,
    updatedAt: new Date().toISOString(),
    datasetCount: PUBLIC_TAROT_DATASETS.length,
    datasets: manifestDatasets,
  };
  manifestMemoryState.cachedAt = Date.now();
}

async function loadDatasetFromFirestore(category, key) {
  const db = getAdminDb();
  const manifest = await loadPublicTarotManifest(db);
  if (!manifest) return null;
  return loadRowsForManifestEntry(db, manifest, category, key);
}

async function rebuildAllDatasetsInternal() {
  const datasetMap = await buildDatasetMapFromRtdb();
  await persistMaterializedCache(datasetMap);
  await logPublicTarotRebuild(datasetMap);
  hydrateMemoryEntries(datasetMap, Date.now());
  return datasetMap;
}

export async function rebuildPublicTarotMaterializedCache() {
  if (!rebuildState.promise) {
    rebuildState.promise = rebuildAllDatasetsInternal().finally(() => {
      rebuildState.promise = null;
    });
  }
  return rebuildState.promise;
}

export function getPublicTarotMemorySnapshot(category, key) {
  const entry = getMemoryEntry(category, key);
  if (!entry) return null;
  return {
    arr: entry.arr,
    cachedAt: entry.cachedAt,
    fresh: isMemoryFresh(entry),
  };
}

export async function loadPublicTarotAllDatasets() {
  const allMemoryFresh = PUBLIC_TAROT_DATASETS.every(({ category, key }) =>
    isMemoryFresh(getMemoryEntry(category, key))
  );
  if (allMemoryFresh) {
    return buildPublicTarotBulkPayloadFromMemory("MEMORY");
  }

  if (!bulkInflight.promise) {
    bulkInflight.promise = (async () => {
      const firestoreMap = await loadAllDatasetsFromFirestore();
      if (firestoreMap) {
        logRtdbMetric("public_tarot_bulk_load", {
          source: "FIRESTORE",
          datasetCount: PUBLIC_TAROT_DATASETS.length,
        });
        return {
          datasets: buildPublicTarotBulkPayload(firestoreMap),
          source: "FIRESTORE",
        };
      }

      const rebuiltMap = await rebuildPublicTarotMaterializedCache();
      logRtdbMetric("public_tarot_bulk_load", {
        source: "REBUILT",
        datasetCount: PUBLIC_TAROT_DATASETS.length,
      });
      return {
        datasets: buildPublicTarotBulkPayload(rebuiltMap),
        source: "REBUILT",
      };
    })().finally(() => {
      bulkInflight.promise = null;
    });
  }

  return bulkInflight.promise;
}

export async function loadPublicTarotDataset(category, key) {
  const storageKey = getDatasetStorageKey(category, key);
  const memoryEntry = getMemoryEntry(category, key);

  if (isMemoryFresh(memoryEntry)) {
    return {
      arr: memoryEntry.arr,
      source: "MEMORY",
    };
  }

  if (!datasetInflight.has(storageKey)) {
    datasetInflight.set(
      storageKey,
      (async () => {
        const firestoreRows = await loadDatasetFromFirestore(category, key);
        if (firestoreRows !== null) {
          logRtdbMetric("public_tarot_load", {
            category,
            key,
            source: "FIRESTORE",
            count: firestoreRows.length,
          });
          return {
            arr: firestoreRows,
            source: "FIRESTORE",
          };
        }

        const rebuiltMap = await rebuildPublicTarotMaterializedCache();
        const rebuiltRows = rebuiltMap.get(storageKey) || [];
        logRtdbMetric("public_tarot_load", {
          category,
          key,
          source: "REBUILT",
          count: rebuiltRows.length,
        });
        return {
          arr: rebuiltRows,
          source: "REBUILT",
        };
      })().finally(() => {
        datasetInflight.delete(storageKey);
      })
    );
  }

  return datasetInflight.get(storageKey);
}
