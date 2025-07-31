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

// Helper function to query Agora Cloud Recording status
async function queryAgoraRecording(resourceId, sid) {
  const queryUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`;
  
  const response = await fetch(queryUrl, {
    method: 'GET',
    headers: {
      'Authorization': createAgoraAuthHeader(),
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Agora query failed: ${response.status} - ${errorData}`);
  }
  
  return await response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Support both GET (with query params) and POST (with body)
    const { sid, meetingCode, resourceId } = req.method === 'GET' ? req.query : req.body;

    if (!sid && !meetingCode) {
      return res.status(400).json({ 
        message: 'SID or Meeting Code is required',
        success: false 
      });
    }

    console.log('📊 [AGORA CLOUD] Checking recording status for:', sid || meetingCode);

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
        .where('status', 'in', ['recording', 'completed'])
        .orderBy('startTimestamp', 'desc')
        .limit(1)
        .get();
    
      if (query.empty) {
        return res.status(404).json({
          success: false,
          message: 'No recording session found'
        });
      }

      recordingRef = query.docs[0].ref;
      recordingData = query.docs[0].data();
    }

    // Extract recording info from Firestore data
    const finalResourceId = resourceId || recordingData.resourceId;
    const finalSid = sid || recordingData.sid;

    let agoraStatus = null;
    let agoraError = null;

    // Only query Agora if recording is still active
    if (recordingData.status === 'recording' && finalResourceId && finalSid) {
      try {
        console.log('📊 [AGORA CLOUD] Querying Agora status...');
        agoraStatus = await queryAgoraRecording(finalResourceId, finalSid);
        console.log('✅ [AGORA CLOUD] Agora status retrieved:', agoraStatus);
      } catch (error) {
        console.warn('⚠️ [AGORA CLOUD] Failed to query Agora status:', error.message);
        agoraError = error.message;
        
        // If Agora query fails with 404, recording might have ended unexpectedly
        if (error.message.includes('404')) {
          await recordingRef.update({
            status: 'failed',
            errorMessage: 'Recording ended unexpectedly',
            updatedAt: new Date()
          });
        }
      }
    }

    // Calculate current duration if recording is active
    let currentDuration = 0;
    if (recordingData.startTimestamp) {
      const endTime = recordingData.endTimestamp || Date.now();
      currentDuration = Math.floor((endTime - recordingData.startTimestamp) / 1000);
    }

    // Prepare response
    const response = {
      success: true,
      sid: finalSid,
      resourceId: finalResourceId,
      meetingCode: recordingData.meetingCode,
      status: recordingData.status,
      recordingType: recordingData.recordingType,
      startTime: recordingData.startTime,
      endTime: recordingData.endTime,
      duration: recordingData.duration || currentDuration,
      storageVendor: recordingData.storageVendor,
      storageBucket: recordingData.storageBucket,
      createdAt: recordingData.createdAt,
      updatedAt: recordingData.updatedAt
    };

    // Add Agora status if available
    if (agoraStatus) {
      response.agoraStatus = {
        resourceId: agoraStatus.resourceId,
        sid: agoraStatus.sid,
        serverResponse: agoraStatus.serverResponse
      };
    }

    // Add error info if present
    if (agoraError) {
      response.agoraError = agoraError;
    }

    // Add file information if recording is completed
    if (recordingData.status === 'completed' && recordingData.stopResponse) {
      response.fileList = recordingData.stopResponse.serverResponse?.fileList || [];
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ [AGORA CLOUD] Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check recording status',
      error: error.message
    });
  }
} 