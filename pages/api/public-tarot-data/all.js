import {
  getPublicTarotMemorySnapshot,
  loadPublicTarotAllDatasets,
  PUBLIC_TAROT_DATASETS,
  getPublicTarotStorageKey,
} from "../../../lib/loadPublicTarotData";
import { logRtdbMetric } from "../../../utils/realtimeMetrics";

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

function buildStaleBulkPayload() {
  const datasets = {};
  for (const { category, key } of PUBLIC_TAROT_DATASETS) {
    const snapshot = getPublicTarotMemorySnapshot(category, key);
    datasets[getPublicTarotStorageKey(category, key)] = {
      category,
      key,
      arr: Array.isArray(snapshot?.arr) ? snapshot.arr : [],
    };
  }
  return datasets;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", CACHE_CONTROL);

  try {
    const { datasets, source } = await loadPublicTarotAllDatasets();
    logRtdbMetric("public_tarot_api_bulk_response", {
      source,
      datasetCount: Object.keys(datasets || {}).length,
    });
    res.setHeader("X-Data-Cache", source);
    return res.status(200).json({ datasets, source });
  } catch (error) {
    const staleDatasets = buildStaleBulkPayload();
    const hasStaleData = Object.values(staleDatasets).some(
      (entry) => Array.isArray(entry?.arr) && entry.arr.length > 0
    );

    if (hasStaleData) {
      logRtdbMetric("public_tarot_api_bulk_response", {
        source: "STALE",
        datasetCount: Object.keys(staleDatasets).length,
      });
      res.setHeader("X-Data-Cache", "STALE");
      return res.status(200).json({ datasets: staleDatasets, source: "STALE" });
    }

    console.error("[API] Error fetching bulk tarot data:", error);
    return res.status(500).json({
      error: "Failed to fetch data",
      details: error.message,
      datasets: {},
    });
  }
}
