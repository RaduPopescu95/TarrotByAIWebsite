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
    const { sessionId, meetingCode, finalFileSize, duration } = req.body;

    if (!sessionId && !meetingCode) {
      return res.status(400).json({ 
        message: 'Session ID or Meeting Code is required',
        success: false 
      });
    }

    console.log('🛑 [RECORDING STOP] Stopping browser recording for:', sessionId || meetingCode);

    let recordingRef;
    
    if (sessionId) {
      recordingRef = db.collection('BrowserRecordings').doc(sessionId);
    } else {
      // Find by meeting code if sessionId not provided
      const query = await db.collection('BrowserRecordings')
        .where('meetingCode', '==', meetingCode)
        .where('status', '==', 'started')
        .limit(1)
        .get();
      
      if (query.empty) {
        return res.status(404).json({
          success: false,
          message: 'No active recording session found'
        });
      }
      
      recordingRef = query.docs[0].ref;
    }

    // Update recording session with stop information
    const updateData = {
      status: 'stopped',
      endTime: new Date(),
      endTimestamp: Date.now(),
      updatedAt: new Date()
    };

    // Add optional metadata if provided
    if (finalFileSize) updateData.finalFileSize = finalFileSize;
    if (duration) updateData.duration = duration;

    await recordingRef.update(updateData);

    console.log('✅ [RECORDING STOP] Recording session stopped successfully');

    res.status(200).json({
      success: true,
      sessionId: sessionId,
      meetingCode: meetingCode,
      endTime: updateData.endTime,
      message: 'Browser recording session stopped successfully'
    });

  } catch (error) {
    console.error('❌ [RECORDING STOP] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop recording session',
      error: error.message
    });
  }
} 