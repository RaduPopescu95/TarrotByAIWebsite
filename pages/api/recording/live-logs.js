import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  console.log('📊 [LIVE LOGS] === API CALLED ===');
  console.log('📊 [LIVE LOGS] Method:', req.method);
  console.log('📊 [LIVE LOGS] Query:', JSON.stringify(req.query, null, 2));
  
  if (req.method !== 'GET') {
    console.log('❌ [LIVE LOGS] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { since, type, level } = req.query;
    console.log('📊 [LIVE LOGS] Parameters:', { since, type, level });
    
    // Set default timestamp (last 5 minutes)
    const sinceTimestamp = since ? parseInt(since) : Date.now() - (5 * 60 * 1000);
    
    console.log(`📊 [LIVE LOGS] Fetching logs since ${new Date(sinceTimestamp).toISOString()}`);

    let collections = ['ClientLogs', 'RecordingLogs', 'ApiLogs'];
    
    // Filter by type if specified
    if (type === 'client') collections = ['ClientLogs'];
    else if (type === 'recording') collections = ['RecordingLogs'];
    else if (type === 'api') collections = ['ApiLogs'];

    const allLogs = [];

    // Fetch logs from all relevant collections
    for (const collectionName of collections) {
      let query = db.collection(collectionName)
        .where('timestamp', '>=', sinceTimestamp)
        .orderBy('timestamp', 'desc')
        .limit(100);

      // Filter by log level if specified
      if (level) {
        query = query.where('level', '==', level.toUpperCase());
      }

      const snapshot = await query.get();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        allLogs.push({
          id: doc.id,
          collection: collectionName,
          ...data,
          formattedTime: new Date(data.timestamp).toISOString()
        });
      });
    }

    // Sort all logs by timestamp (most recent first)
    allLogs.sort((a, b) => b.timestamp - a.timestamp);

    // Take only the most recent 50 logs to avoid overwhelming the client
    const recentLogs = allLogs.slice(0, 50);

    console.log(`📊 [LIVE LOGS] Returning ${recentLogs.length} logs from ${collections.join(', ')}`);

    res.status(200).json({
      success: true,
      logs: recentLogs,
      totalCount: allLogs.length,
      collections: collections,
      sinceTimestamp,
      serverTime: Date.now()
    });

  } catch (error) {
    console.error('❌ [LIVE LOGS] Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
} 