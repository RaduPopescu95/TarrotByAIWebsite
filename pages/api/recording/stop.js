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

// Agora Cloud Recording Configuration
const AGORA_CONFIG = {
  appId: process.env.PUBLIC_AGORA_APP_ID,
  customerId: process.env.AGORA_CUSTOMER_ID,
  customerSecret: process.env.AGORA_CUSTOMER_SECRET
};

// Helper function to create Basic Auth header for Agora REST API
function createAgoraAuthHeader() {
  const credentials = `${AGORA_CONFIG.customerId}:${AGORA_CONFIG.customerSecret}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
}

// Helper function to stop Agora Cloud Recording
async function stopAgoraRecording(resourceId, sid, channelName, recordingUID) {
  const stopUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`;
  
  const response = await fetch(stopUrl, {
    method: 'POST',
    headers: {
      'Authorization': createAgoraAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cname: channelName,
      uid: recordingUID.toString(),
      clientRequest: {}
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Agora stop failed: ${response.status} - ${errorData}`);
  }
  
  return await response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sid, meetingCode, resourceId, recordingUID } = req.body;

    if (!sid && !meetingCode) {
      return res.status(400).json({ 
        message: 'SID or Meeting Code is required',
        success: false 
      });
    }

    console.log('🛑 [AGORA CLOUD] Stopping cloud recording for:', sid || meetingCode);

    let recordingRef;
    let recordingData;
    
    if (sid) {
      // Find by SID (most reliable)
      recordingRef = db.collection('AgoraRecordings').doc(sid);
      const recordingDoc = await recordingRef.get();
      
      if (!recordingDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Recording session not found'
        });
      }
      
      recordingData = recordingDoc.data();
    } else {
      // Find by meeting code if SID not provided
      const query = await db.collection('AgoraRecordings')
        .where('meetingCode', '==', meetingCode)
        .where('status', '==', 'recording')
        .limit(1)
        .get();
    
      if (query.empty) {
        return res.status(404).json({
          success: false,
          message: 'No active recording session found'
        });
      }

      recordingRef = query.docs[0].ref;
      recordingData = query.docs[0].data();
    }

    // Extract recording info from Firestore data
    const finalResourceId = resourceId || recordingData.resourceId;
    const finalSid = sid || recordingData.sid;
    const finalMeetingCode = meetingCode || recordingData.meetingCode;
    const finalRecordingUID = recordingUID || recordingData.recordingUID;

    if (!finalResourceId || !finalSid || !finalRecordingUID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required recording parameters. Cannot stop recording.'
      });
    }

    // Stop Agora Cloud Recording
    console.log('🛑 [AGORA CLOUD] Calling Agora stop API...');
    const stopResponse = await stopAgoraRecording(
      finalResourceId, 
      finalSid, 
      finalMeetingCode, 
      finalRecordingUID
    );
    
    console.log('✅ [AGORA CLOUD] Recording stopped successfully:', stopResponse);

    // Calculate duration
    const startTime = recordingData.startTimestamp || Date.now();
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000); // in seconds

    // Update recording session with stop information
    const updateData = {
      status: 'completed',
      endTime: new Date(),
      endTimestamp: endTime,
      duration: duration,
      stopResponse: stopResponse,
      updatedAt: new Date()
    };

    await recordingRef.update(updateData);

    console.log('✅ [AGORA CLOUD] Recording session updated in Firestore');

    res.status(200).json({
      success: true,
      sid: finalSid,
      resourceId: finalResourceId,
      meetingCode: finalMeetingCode,
      duration: duration,
      endTime: updateData.endTime,
      fileList: stopResponse.serverResponse?.fileList || [],
      message: 'Agora Cloud Recording stopped successfully'
    });

  } catch (error) {
    console.error('❌ [AGORA CLOUD] Recording stop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop Agora cloud recording',
      error: error.message
    });
  }
} 