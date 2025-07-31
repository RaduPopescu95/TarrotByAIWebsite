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
  appCertificate: process.env.AGORA_APP_CERTIFICATE,
  customerId: process.env.AGORA_CUSTOMER_ID,
  customerSecret: process.env.AGORA_CUSTOMER_SECRET,
  storageConfig: {
    vendor: 6, // Google Cloud Storage
    bucket: process.env.AGORA_CLOUD_STORAGE_BUCKET,
    accessKey: process.env.GCS_HMAC_ACCESS_KEY,
    secretKey: process.env.GCS_HMAC_SECRET_KEY
  }
};

// Helper function to create Basic Auth header for Agora REST API
function createAgoraAuthHeader() {
  const credentials = `${AGORA_CONFIG.customerId}:${AGORA_CONFIG.customerSecret}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
}

// Helper function to acquire Agora Cloud Recording resource
async function acquireAgoraResource(channelName, uid) {
  const acquireUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/acquire`;
  
  const response = await fetch(acquireUrl, {
    method: 'POST',
    headers: {
      'Authorization': createAgoraAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cname: channelName,
      uid: uid.toString(),
      clientRequest: {}
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Agora acquire failed: ${response.status} - ${errorData}`);
  }
  
  return await response.json();
}

// Helper function to start Agora Cloud Recording
async function startAgoraRecording(resourceId, channelName, uid, token = null) {
  const startUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`;

  
  const requestBody = {
    cname: channelName,
    uid: uid.toString(),
    clientRequest: {
      token: token,
      storageConfig: AGORA_CONFIG.storageConfig,
      recordingConfig: {
        channelType: 0, // Communication mode
        streamTypes: 2, // audio + video
        audioProfile: parseInt(process.env.RECORDING_AUDIO_PROFILE || '0'),
        videoStreamType: parseInt(process.env.RECORDING_VIDEO_PROFILE || '0'),
        maxDurationSec: parseInt(process.env.RECORDING_MAX_DURATION || '7200'),
        maxIdleTime: 30,
        subscribeAudioUids: ["#allstream#"],
        subscribeVideoUids: ["#allstream#"]
      }
    }
  };
  
  const response = await fetch(startUrl, {
    method: 'POST',
    headers: {
      'Authorization': createAgoraAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Agora start failed: ${response.status} - ${errorData}`);
  }
  
  return await response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { meetingCode, userRole = 'participant', token = null } = req.body;

    if (!meetingCode) {
      return res.status(400).json({ 
        message: 'Meeting code is required',
        success: false 
      });
    }

    // Validate Agora configuration
    if (!AGORA_CONFIG.appId || !AGORA_CONFIG.customerId || !AGORA_CONFIG.customerSecret) {
      return res.status(500).json({
        success: false,
        message: 'Agora Cloud Recording not configured. Please check environment variables.'
      });
    }

    console.log('🎬 [AGORA CLOUD] Starting cloud recording for:', meetingCode);

    // Generate unique UID for recording service (must not conflict with existing users)
    const recordingUID = `999${Date.now().toString().slice(-6)}`; // Ensures unique 9-digit UID
    
    // Step 1: Acquire resource ID from Agora
    console.log('📋 [AGORA CLOUD] Step 1: Acquiring resource ID...');
    const acquireResponse = await acquireAgoraResource(meetingCode, recordingUID);
    const resourceId = acquireResponse.resourceId;
    
    if (!resourceId) {
      throw new Error('Failed to acquire Agora resource ID');
    }
    
    console.log('✅ [AGORA CLOUD] Resource ID acquired:', resourceId);
    
    // Step 2: Start cloud recording with resource ID
    console.log('🎥 [AGORA CLOUD] Step 2: Starting cloud recording...');
    const startResponse = await startAgoraRecording(resourceId, meetingCode, recordingUID, token);
    const sid = startResponse.sid;
    
    if (!sid) {
      throw new Error('Failed to start Agora cloud recording');
    }
    
    console.log('✅ [AGORA CLOUD] Cloud recording started with SID:', sid);

    // Save recording session to Firestore
    const recordingData = {
      meetingCode: meetingCode,
      resourceId: resourceId,
      sid: sid,
      recordingUID: recordingUID,
      status: 'recording',
      startTime: new Date(),
      startTimestamp: Date.now(),
      userRole: userRole,
      recordingType: 'agora_cloud',
      storageVendor: 'google_cloud',
      storageBucket: AGORA_CONFIG.storageConfig.bucket,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to AgoraRecordings collection (separate from browser recordings)
    const recordingRef = db.collection('AgoraRecordings').doc(sid);
    await recordingRef.set(recordingData);

    console.log('✅ [AGORA CLOUD] Recording session saved to Firestore');

    res.status(200).json({
      success: true,
      sid: sid,
      resourceId: resourceId,
      meetingCode: meetingCode,
      recordingUID: recordingUID,
      startTime: recordingData.startTime,
      message: 'Agora Cloud Recording started successfully'
    });

  } catch (error) {
    console.error('❌ [AGORA CLOUD] Recording start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start Agora cloud recording',
      error: error.message
    });
  }
} 