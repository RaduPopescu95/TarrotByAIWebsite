import {
  getPublicTarotMemorySnapshot,
  loadPublicTarotDataset,
} from "../../lib/loadPublicTarotData";

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

export default async function handler(req, res) {
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
    res.setHeader("X-Data-Cache", source);
    return res.status(200).json({ arr });
  } catch (error) {
    if (staleSnapshot?.arr) {
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
