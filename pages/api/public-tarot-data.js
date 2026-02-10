// API endpoint pentru accesarea datelor publice de tarot
// Bypass-ează restricțiile de autentificare client-side

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminRtdb } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, key } = req.query;

  if (!category || !key) {
    return res.status(400).json({ error: 'Missing category or key parameter' });
  }

  try {
    console.log(`🔍 [API] Fetching public tarot data: ${category}/${key}`);
    
    const rtdb = getAdminRtdb();
    const snapshot = await rtdb.ref(`${category}/${key}`).once('value');
    
    let arr = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data) {
        // Convert object to array
        arr = Object.values(data);
      }
    }

    console.log(`✅ [API] Successfully fetched ${arr.length} items for ${category}/${key}`);

    // Firestore logging: only date/time and an incrementing counter per (category,key)
    try {
      const fs = getAdminDb();
      const docId = `${category}__${key}`.replace(/[\s/]+/g, "_");
      await fs
        .collection('PublicTarotFetchesWebsite')
        .doc(docId)
        .set(
          {
            count: FieldValue.increment(1),
            lastFetchedAt: new Date().toISOString(),
          },
          { merge: true }
        );
    } catch (logError) {
      console.error('⚠️ [API] Failed to write fetch log to Firestore:', logError.message);
    }
    
    res.status(200).json({ arr });
  } catch (error) {
    console.error(`❌ [API] Error fetching tarot data:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      details: error.message,
      arr: [] // fallback empty array
    });
  }
} 
