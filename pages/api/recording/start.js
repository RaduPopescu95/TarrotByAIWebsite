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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { meetingCode, userRole = 'participant', sessionId } = req.body;

    if (!meetingCode) {
      return res.status(400).json({ 
        message: 'Meeting code is required',
        success: false 
    });
  }

    console.log('🎬 [RECORDING START] Starting simple browser recording for:', meetingCode);

    // Create a unique recording session ID
    const recordingSessionId = sessionId || `recording_${meetingCode}_${Date.now()}`;

    // Initialize recording session in Firestore
    const recordingData = {
      meetingCode: meetingCode,
      sessionId: recordingSessionId,
      status: 'started',
      startTime: new Date(),
      startTimestamp: Date.now(),
      userRole: userRole,
      recordingType: 'browser',
      chunks: [],
      totalSize: 0,
      duration: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Firestore
    const recordingRef = db.collection('BrowserRecordings').doc(recordingSessionId);
    await recordingRef.set(recordingData);

    console.log('✅ [RECORDING START] Recording session created:', recordingSessionId);

    res.status(200).json({
      success: true,
      sessionId: recordingSessionId,
      meetingCode: meetingCode,
      startTime: recordingData.startTime,
      message: 'Browser recording session started successfully'
    });

  } catch (error) {
    console.error('❌ [RECORDING START] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start recording session',
      error: error.message
    });
  }
} 