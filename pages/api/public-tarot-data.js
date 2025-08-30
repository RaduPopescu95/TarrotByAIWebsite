// API endpoint pentru accesarea datelor publice de tarot
// Bypass-ează restricțiile de autentificare client-side

import { getDatabase } from "firebase-admin/database";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };

  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

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
    
    const db = getDatabase();
    const snapshot = await db.ref(`${category}/${key}`).once('value');
    
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
      const fs = getFirestore();
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