import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createApiLogger } from '../../../utils/logger';

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
const logger = createApiLogger('START');

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

// Helper function to acquire Agora Cloud Recording resource
async function acquireAgoraResource(channelName, uid) {
  const startTime = Date.now();
  const acquireUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/acquire`;
  
  const requestData = {
    cname: channelName,
    uid: Number(uid), // Convert to number as required by Agora spec
    clientRequest: {}
  };

  logger.info('🔄 Acquiring Agora resource', {
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
    logger.error('❌ Agora resource acquisition failed', {
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
  
  logger.agoraApiCall('POST', acquireUrl, requestData, responseData);
  logger.info('✅ Agora resource acquired successfully', {
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
    uid: Number(uid), // Convert to number as required by Agora spec
    clientRequest: {
      token: token,
      storageConfig: {
        ...AGORA_CONFIG.storageConfig,
        fileNamePrefix: ["recordings", channelName] // Organize files in subfolders
      },
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
  
  logger.info('🎬 Starting Agora Cloud Recording', {
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
    logger.error('❌ Agora recording start failed', {
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
  
  logger.agoraApiCall('POST', startUrl, requestBody, responseData);
  logger.recordingStart(channelName, {
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
  
  console.log('🎬 [AGORA START] === API CALLED ===');
  console.log('🎬 [AGORA START] === API CALLED ===');
  console.log('🎬 [AGORA START] === API CALLED ===');
  console.log('🎬 [AGORA START] === API CALLED ===');
  console.log('🎬 [AGORA START] Method:', req.method);
  console.log('🎬 [AGORA START] Body:', JSON.stringify(req.body, null, 2));
  console.log('🎬 [AGORA START] Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ [AGORA START] Invalid method:', req.method);
    logger.warn('Invalid request method', { method: req.method });
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { meetingCode, userRole = 'participant', token = null } = req.body;

    logger.info('📥 Recording start request received', {
      meetingCode,
      userRole,
      hasToken: !!token,
      clientIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    if (!meetingCode) {
      console.log('❌ [AGORA START] Missing meeting code!');
      logger.warn('Missing meeting code in request', { requestBody: req.body });
      return res.status(400).json({ 
        message: 'Meeting code is required',
        success: false 
      });
    }

    console.log('✅ [AGORA START] Meeting code:', meetingCode);

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
      logger.error('Agora Cloud Recording configuration missing', {
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

    logger.info('✅ Configuration validation passed', {
      appId: AGORA_CONFIG.appId,
      storageVendor: 'gcs',
      storageBucket: AGORA_CONFIG.storageConfig.bucket
    });

    // Generate unique UID for recording service (must not conflict with existing users)
    const recordingUID = `999${Math.floor(Math.random() * 1e6).toString().padStart(6, '0')}`;    
    logger.debug('Generated recording UID', { recordingUID, meetingCode });
    
    // Step 1: Acquire resource ID from Agora
    console.log('🚀 [AGORA START] Step 1: Acquiring resource ID...');
    console.log('🚀 [AGORA START] Recording UID:', recordingUID);
    logger.info('📋 Step 1: Acquiring Agora resource ID');
    const acquireResponse = await acquireAgoraResource(meetingCode, recordingUID);
    const resourceId = acquireResponse.resourceId;
    
    if (!resourceId) {
      logger.error('Resource ID acquisition failed', { acquireResponse });
      throw new Error('Failed to acquire Agora resource ID');
    }
    
    // Step 2: Start cloud recording with resource ID
    console.log('🎬 [AGORA START] Step 2: Starting cloud recording...');
    console.log('🎬 [AGORA START] Resource ID:', resourceId);
    logger.info('🎥 Step 2: Starting cloud recording', { resourceId });
    const startResponse = await startAgoraRecording(resourceId, meetingCode, recordingUID, token);
    const sid = startResponse.sid;
    
    if (!sid) {
      logger.error('Recording start failed - no SID returned', { startResponse });
      throw new Error('Failed to start Agora cloud recording');
    }

    // Save recording session to Firestore
    const recordingData = {
      meetingCode: meetingCode,
      channelId: meetingCode, // Channel name is same as meeting code
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

    logger.info('💾 Saving recording session to Firestore', {
      sid,
      meetingCode,
      resourceId,
      collection: 'AgoraRecordings'
    });

    // Save to AgoraRecordings collection (separate from browser recordings)
    const recordingRef = db.collection('AgoraRecordings').doc(sid);
    await recordingRef.set(recordingData);

    const totalDuration = Date.now() - requestStartTime;
    
    logger.performance('Recording start process completed', totalDuration, {
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
      recordingUID: recordingUID,
      startTime: recordingData.startTime,
      processingDuration: `${totalDuration}ms`,
      message: 'Agora Cloud Recording started successfully'
    };

    logger.info('✅ Recording start request completed successfully', response);
    
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
    
    logger.recordingError(req.body.meetingCode || 'unknown', error, {
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