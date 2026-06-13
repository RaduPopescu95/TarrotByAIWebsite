import {
  getPublicTarotMemorySnapshot,
  loadPublicTarotDataset,
} from "../../lib/loadPublicTarotData";
import { logRtdbMetric } from "../../utils/realtimeMetrics";
import { withFirestoreReadTelemetry } from "../../lib/firestoreCostLogger";

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader("Cache-Control", CACHE_CONTROL);

  const { category, key } = req.query;

  if (!category || !key) {
    return res.status(400).json({ error: 'Missing category or key parameter' });
  }

  const staleSnapshot = getPublicTarotMemorySnapshot(category, key);

  try {
    const { arr, source } = await loadPublicTarotDataset(category, key);
    logRtdbMetric("public_tarot_api_response", {
      category,
      key,
      source,
      count: Array.isArray(arr) ? arr.length : 0,
    });
    res.setHeader("X-Data-Cache", source);
    return res.status(200).json({ arr });
  } catch (error) {
    if (staleSnapshot?.arr) {
      logRtdbMetric("public_tarot_api_response", {
        category,
        key,
        source: "STALE",
        count: Array.isArray(staleSnapshot.arr) ? staleSnapshot.arr.length : 0,
      });
      res.setHeader("X-Data-Cache", "STALE");
      return res.status(200).json({ arr: staleSnapshot.arr });
    }

    console.error(`❌ [API] Error fetching tarot data:`, error);
    return res.status(500).json({
      error: 'Failed to fetch data',
      details: error.message,
      arr: [] // fallback empty array
    });
  }
}

export default withFirestoreReadTelemetry("/api/public-tarot-data", handler);
