// API endpoint pentru accesarea datelor publice de tarot
// Bypass-ează restricțiile de autentificare client-side

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminRtdb } from "../../lib/firebaseAdmin";

const FRESH_TTL_MS = 24 * 60 * 60 * 1000;
const STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

const tarotDataCache =
  globalThis.__PUBLIC_TAROT_DATA_CACHE__ ||
  (globalThis.__PUBLIC_TAROT_DATA_CACHE__ = new Map());
const tarotDataRefreshes =
  globalThis.__PUBLIC_TAROT_DATA_REFRESHES__ ||
  (globalThis.__PUBLIC_TAROT_DATA_REFRESHES__ = new Map());

const getCacheKey = (category, key) => `${String(category)}::${String(key)}`;

const isWithin = (entry, ttlMs, now = Date.now()) =>
  entry && now - entry.cachedAt <= ttlMs;

async function logRtdbFetch(category, key) {
  try {
    const fs = getAdminDb();
    const docId = `${category}__${key}`.replace(/[\s/]+/g, "_");
    await fs
      .collection("PublicTarotFetchesWebsite")
      .doc(docId)
      .set(
        {
          count: FieldValue.increment(1),
          lastFetchedAt: new Date().toISOString(),
        },
        { merge: true }
      );
  } catch (logError) {
    console.error("⚠️ [API] Failed to write fetch log to Firestore:", logError.message);
  }
}

async function fetchTarotDataFromRtdb(category, key) {
  console.log(`🔍 [API] Fetching public tarot data from RTDB: ${category}/${key}`);

  const rtdb = getAdminRtdb();
  const snapshot = await rtdb.ref(`${category}/${key}`).once("value");

  let arr = [];
  if (snapshot.exists()) {
    const data = snapshot.val();
    if (data) {
      arr = Object.values(data);
    }
  }

  tarotDataCache.set(getCacheKey(category, key), {
    arr,
    cachedAt: Date.now(),
  });

  await logRtdbFetch(category, key);

  console.log(`✅ [API] Successfully fetched ${arr.length} items for ${category}/${key}`);
  return arr;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader("Cache-Control", CACHE_CONTROL);

  const { category, key } = req.query;

  if (!category || !key) {
    return res.status(400).json({ error: 'Missing category or key parameter' });
  }

  const cacheKey = getCacheKey(category, key);
  const cached = tarotDataCache.get(cacheKey);
  const now = Date.now();

  if (isWithin(cached, FRESH_TTL_MS, now)) {
    res.setHeader("X-Data-Cache", "HIT");
    return res.status(200).json({ arr: cached.arr });
  }

  if (isWithin(cached, STALE_TTL_MS, now)) {
    res.setHeader("X-Data-Cache", "STALE");

    if (!tarotDataRefreshes.has(cacheKey)) {
      const refreshPromise = fetchTarotDataFromRtdb(category, key)
        .catch((refreshError) => {
          console.error(`⚠️ [API] Background tarot refresh failed for ${category}/${key}:`, refreshError);
        })
        .finally(() => {
          tarotDataRefreshes.delete(cacheKey);
        });
      tarotDataRefreshes.set(cacheKey, refreshPromise);
    }

    return res.status(200).json({ arr: cached.arr });
  }

  try {
    res.setHeader("X-Data-Cache", "MISS");
    const arr = await fetchTarotDataFromRtdb(category, key);
    res.status(200).json({ arr });
  } catch (error) {
    if (cached?.arr) {
      res.setHeader("X-Data-Cache", "STALE");
      return res.status(200).json({ arr: cached.arr });
    }

    console.error(`❌ [API] Error fetching tarot data:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      details: error.message,
      arr: [] // fallback empty array
    });
  }
} 
