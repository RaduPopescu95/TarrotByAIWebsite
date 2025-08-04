console.log('🔥 LOADING START.JS MODULE...');

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

console.log('🔥 IMPORTS OK, CHECKING FIREBASE...');

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  console.log('🔥 INITIALIZING FIREBASE ADMIN...');
  console.log('🔥 ENV CHECK:', {
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
  });
  
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.log('❌ Firebase Admin init failed:', error.message);
    throw error;
  }
} else {
  console.log('🔥 Firebase Admin already initialized');
}

console.log('🔥 GETTING FIRESTORE...');
const db = getFirestore();
console.log('✅ FIRESTORE OK');

console.log('🔥 CHECKING AGORA ENV VARS...');
console.log('🔥 AGORA ENV CHECK:', {
  hasAppId: !!process.env.PUBLIC_AGORA_APP_ID,
  hasCustomerId: !!process.env.AGORA_CUSTOMER_ID,
  hasCustomerSecret: !!process.env.AGORA_CUSTOMER_SECRET,
  hasBucket: !!process.env.AGORA_CLOUD_STORAGE_BUCKET,
  hasAccessKey: !!process.env.GCS_HMAC_ACCESS_KEY,
  hasSecretKey: !!process.env.GCS_HMAC_SECRET_KEY
});

// Agora Cloud Recording Configuration
const AGORA_CONFIG = {
  appId: process.env.PUBLIC_AGORA_APP_ID,
  customerId: process.env.AGORA_CUSTOMER_ID,
  customerSecret: process.env.AGORA_CUSTOMER_SECRET,
  storageConfig: {
    vendor: parseInt(process.env.AGORA_CLOUD_STORAGE_VENDOR) || 6, // Google Cloud Storage with HMAC
    region: parseInt(process.env.AGORA_GCS_REGION) || 0, // 0 = Global region
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

// Helper function to create valid Agora channel name from meeting code
function createAgoraChannelName(meetingCode) {
  // Agora channel name requirements:
  // - Max 64 characters
  // - Only alphanumeric, underscore, hyphen
  // - Cannot start with underscore or hyphen
  
  // Extract the meaningful part (document ID) from meeting code
  // Format: "uuid__documentId" -> use documentId + short hash of uuid
  const parts = meetingCode.split('__');
  if (parts.length === 2) {
    const documentId = parts[1]; // qGlXABw0d7Av01Ynz3Cw
    const uuidHash = parts[0].replace(/-/g, '').substring(0, 8); // First 8 chars of UUID without dashes
    return `${documentId}_${uuidHash}`; // e.g., qGlXABw0d7Av01Ynz3Cw_8efcd2e4
  }
  
  // Fallback: just truncate to 64 chars and sanitize
  return meetingCode
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace invalid chars with underscore
    .substring(0, 64) // Truncate to max length
    .replace(/^[_-]+/, '') // Remove leading underscores/hyphens
    .replace(/[_-]+$/, ''); // Remove trailing underscores/hyphens
}

// Helper function to acquire Agora Cloud Recording resource
async function acquireAgoraResource(channelName, uid) {
  const startTime = Date.now();
  const acquireUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/acquire`;
  
  const requestData = {
    cname: channelName,
    uid: uid.toString(), // UID as string as per Agora documentation
    clientRequest: {
      scene: 0, // Real-time recording
      resourceExpiredHour: 24
    }
  };

  console.log('🔄 Acquiring Agora resource', {
    channelName,
    uid: uid.toString(),
    url: acquireUrl,
    requestData
  });
  
  const response = await fetch(acquireUrl, {
    method: 'POST',
    headers: {
      'Authorization': createAgoraAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  });
  
  const duration = Date.now() - startTime;
  
  if (!response.ok) {
    const errorData = await response.text();
    console.log('❌ Agora resource acquisition failed', {
      channelName,
      uid: uid.toString(),
      status: response.status,
      statusText: response.statusText,
      errorData,
      duration: `${duration}ms`
    });
    throw new Error(`Agora acquire failed: ${response.status} - ${errorData}`);
  }
  
  const responseData = await response.json();
  
  console.log('📡 Agora API Call POST:', acquireUrl, { requestData, responseData });
  console.log('✅ Agora resource acquired successfully', {
    channelName,
    uid: uid.toString(),
    resourceId: responseData.resourceId,
    duration: `${duration}ms`
  });
  
  return responseData;
}

// Helper function to start Agora Cloud Recording
async function startAgoraRecording(resourceId, channelName, uid, token = null) {
  const startTime = Date.now();
  const startUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`;

  const requestBody = {
    cname: channelName,
    uid: uid.toString(), // UID as string as per Agora documentation
    clientRequest: {
      ...(token && { token: token }), // Only include token if it exists
      storageConfig: {
        ...AGORA_CONFIG.storageConfig,
        fileNamePrefix: ["recordings", channelName.replace(/[^a-zA-Z0-9]/g, "")] // Sanitize channel name for file path
      },
      recordingConfig: {
        channelType: 0, // Communication mode
        streamTypes: 2, // audio + video
        audioProfile: parseInt(process.env.RECORDING_AUDIO_PROFILE || '0'),
        videoStreamType: parseInt(process.env.RECORDING_VIDEO_PROFILE || '0'),
        maxDurationSec: parseInt(process.env.RECORDING_MAX_DURATION || '7200'),
        maxIdleTime: (() => {
          const baseTime = parseInt(process.env.RECORDING_MAX_IDLE_TIME || '300');
          // In development mode, extend idle time significantly to prevent auto-stop during testing
          const isDevelopment = process.env.NODE_ENV === 'development' || process.env.AGORA_DEVELOPMENT_MODE === 'true';
          const finalTime = isDevelopment ? Math.max(baseTime, 900) : baseTime; // Min 15 minutes in dev
          console.log('🕐 [AGORA START] MaxIdleTime configured:', {
            envValue: process.env.RECORDING_MAX_IDLE_TIME,
            baseTime,
            isDevelopment,
            finalTime,
            seconds: finalTime,
            minutes: Math.round(finalTime / 60 * 10) / 10
          });
          return finalTime;
        })(), // Extended idle time in development to prevent auto-stop during testing
        subscribeAudioUids: ["#allstream#"],
        subscribeVideoUids: ["#allstream#"],
        // Development: Keep recording active even with empty channel
        ...(process.env.NODE_ENV === 'development' && {
          transcodingConfig: {
            width: 640,
            height: 480,
            fps: 15,
            bitrate: 500,
            maxResolutionUid: uid.toString(),
            mixedVideoLayout: 1
          }
        })
      }
    }
  };
  
  console.log('🎬 Starting Agora Cloud Recording', {
    resourceId,
    channelName,
    uid: uid.toString(),
    url: startUrl,
    storageVendor: 'gcs',
    storageRegion: AGORA_CONFIG.storageConfig.region,
    storageBucket: AGORA_CONFIG.storageConfig.bucket,
    fileNamePrefix: requestBody.clientRequest.storageConfig.fileNamePrefix,
    maxDuration: requestBody.clientRequest.recordingConfig.maxDurationSec,
    streamTypes: requestBody.clientRequest.recordingConfig.streamTypes
  });
  
  const response = await fetch(startUrl, {
    method: 'POST',
    headers: {
      'Authorization': createAgoraAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  const duration = Date.now() - startTime;
  
  if (!response.ok) {
    const errorData = await response.text();
    console.log('❌ Agora recording start failed', {
      resourceId,
      channelName,
      uid: uid.toString(),
      status: response.status,
      statusText: response.statusText,
      errorData,
      duration: `${duration}ms`
    });
    throw new Error(`Agora start failed: ${response.status} - ${errorData}`);
  }
  
  const responseData = await response.json();
  
  console.log('📡 Agora API Call POST:', startUrl, { requestBody, responseData });
  console.log('🎬 Recording started successfully:', {
    channelName,
    resourceId,
    sid: responseData.sid,
    uid: uid.toString(),
    duration: `${duration}ms`,
    storageVendor: 'gcs'
  });
  
  return responseData;
}

export default async function handler(req, res) {
  const requestStartTime = Date.now();
  
  console.log('🔥🔥🔥 START API HIT - VEZI IN TERMINAL!!! 🔥🔥🔥');
  console.log('🎬 [AGORA START] === API CALLED ===');
  console.log('🎬 [AGORA START] Method:', req.method);
  console.log('🎬 [AGORA START] Body:', JSON.stringify(req.body, null, 2));
  console.log('🎬 [AGORA START] Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ [AGORA START] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { meetingCode, userRole = 'participant', token = null } = req.body;

    console.log('📥 Recording start request received', {
      meetingCode,
      userRole,
      hasToken: !!token,
      clientIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    if (!meetingCode) {
      console.log('❌ [AGORA START] Missing meeting code!');
      return res.status(400).json({ 
        message: 'Meeting code is required',
        success: false 
      });
      }

    console.log('✅ [AGORA START] Meeting code:', meetingCode);

    // Create valid Agora channel name from meeting code
    const agoraChannelName = createAgoraChannelName(meetingCode);
    console.log('🎯 [AGORA START] Agora channel name:', agoraChannelName, `(${agoraChannelName.length} chars)`);

    // Validate Agora configuration
    console.log('🔍 [AGORA START] Validating configuration...');
    console.log('🔍 [AGORA START] Config check:', {
      hasAppId: !!AGORA_CONFIG.appId,
      hasCustomerId: !!AGORA_CONFIG.customerId,
      hasCustomerSecret: !!AGORA_CONFIG.customerSecret,
      hasStorageBucket: !!AGORA_CONFIG.storageConfig.bucket,
      appId: AGORA_CONFIG.appId?.substring(0, 8) + '...',
      bucket: AGORA_CONFIG.storageConfig.bucket
    });
    
    if (!AGORA_CONFIG.appId || !AGORA_CONFIG.customerId || !AGORA_CONFIG.customerSecret) {
      console.log('❌ [AGORA START] Configuration missing!');
      console.log('❌ [AGORA START] Config status:', {
        hasAppId: !!AGORA_CONFIG.appId,
        hasCustomerId: !!AGORA_CONFIG.customerId,
        hasCustomerSecret: !!AGORA_CONFIG.customerSecret,
        hasStorageBucket: !!AGORA_CONFIG.storageConfig.bucket
      });
      return res.status(500).json({
        success: false,
        message: 'Agora Cloud Recording not configured. Please check environment variables.'
      });
    }

    console.log('✅ Configuration validation passed', {
      appId: AGORA_CONFIG.appId,
      storageVendor: 'gcs',
      storageBucket: AGORA_CONFIG.storageConfig.bucket
    });

    // Generate unique UID for recording service (must not conflict with existing users)
    const recordingUID = `999${Math.floor(Math.random() * 1e6).toString().padStart(6, '0')}`;    
    console.log('Generated recording UID:', { recordingUID, meetingCode });
    
    // Step 1: Acquire resource ID from Agora
    console.log('🚀 [AGORA START] Step 1: Acquiring resource ID...');
    console.log('🚀 [AGORA START] Recording UID:', recordingUID);
    const acquireResponse = await acquireAgoraResource(agoraChannelName, recordingUID);
    const resourceId = acquireResponse.resourceId;
    
    if (!resourceId) {
      console.log('❌ Resource ID acquisition failed', { acquireResponse });
      throw new Error('Failed to acquire Agora resource ID');
    }
    
    // Step 2: Start cloud recording with resource ID
    console.log('🎬 [AGORA START] Step 2: Starting cloud recording...');
    console.log('🎬 [AGORA START] Resource ID:', resourceId);
    const startResponse = await startAgoraRecording(resourceId, agoraChannelName, recordingUID, token);
    const sid = startResponse.sid;
    
    if (!sid) {
      console.log('❌ Recording start failed - no SID returned', { startResponse });
      throw new Error('Failed to start Agora cloud recording');
    }

    // Save recording session to Firestore
    const recordingData = {
      meetingCode: meetingCode, // Original meeting code for reference
      channelId: meetingCode, // Keep original meeting code for lookup
      agoraChannelName: agoraChannelName, // Actual channel name used in Agora
      resourceId: resourceId,
      sid: sid,
      recordingUID: recordingUID,
      status: 'recording',
      startTime: new Date(),
      startTimestamp: Date.now(),
      userRole: userRole,
      recordingType: 'agora_cloud',
      storageVendor: 'gcs',
      storageBucket: AGORA_CONFIG.storageConfig.bucket,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Saving recording session to Firestore', {
      sid,
      meetingCode,
      resourceId,
      collection: 'AgoraRecordings'
    });

    // Save to AgoraRecordings collection (separate from browser recordings)
    const recordingRef = db.collection('AgoraRecordings').doc(sid);
    await recordingRef.set(recordingData);

    const totalDuration = Date.now() - requestStartTime;
    
    console.log('✅ Recording start process completed', {
      totalDuration: `${totalDuration}ms`,
      meetingCode,
      sid,
      resourceId,
      recordingUID
    });

    const response = {
      success: true,
      sid: sid,
      resourceId: resourceId,
      meetingCode: meetingCode,
      agoraChannelName: agoraChannelName, // Include for debugging
      recordingUID: recordingUID,
      startTime: recordingData.startTime,
      processingDuration: `${totalDuration}ms`,
      message: 'Agora Cloud Recording started successfully'
    };

    console.log('✅ Recording start request completed successfully', response);
    
    console.log('✅ [AGORA START] === SUCCESS RESPONSE ===');
    console.log('✅ [AGORA START] SID:', sid);
    console.log('✅ [AGORA START] Resource ID:', resourceId);
    console.log('✅ [AGORA START] Response:', JSON.stringify(response, null, 2));
    
    res.status(200).json(response);

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    
    console.log('❌ [AGORA START] === ERROR OCCURRED ===');
    console.log('❌ [AGORA START] Error:', error.message);
    console.log('❌ [AGORA START] Stack:', error.stack);
    console.log('❌ [AGORA START] Duration:', `${totalDuration}ms`);
    
    console.log('❌ Recording error details:', {
      meetingCode: req.body.meetingCode || 'unknown',
      error: error.message,
      requestBody: req.body,
      processingDuration: `${totalDuration}ms`,
      operation: 'start_recording'
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to start Agora cloud recording',
      error: error.message,
      processingDuration: `${totalDuration}ms`
    });
  }
} 