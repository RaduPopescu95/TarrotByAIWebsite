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
const logger = createApiLogger('STATUS');

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
  const startTime = Date.now();
  const queryUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`;
  
  logger.debug('Preparing Agora query request', {
    resourceId: resourceId?.substring(0, 10) + '...',
    sid: sid?.substring(0, 10) + '...',
    url: queryUrl
  });
  
  const response = await fetch(queryUrl, {
    method: 'GET',
    headers: {
      'Authorization': createAgoraAuthHeader(),
      'Content-Type': 'application/json'
    }
  });
  
  const responseTime = Date.now() - startTime;
  
  if (!response.ok) {
    const errorData = await response.text();
    logger.error('Agora query failed', {
      status: response.status,
      error: errorData,
      responseTime,
      resourceId: resourceId?.substring(0, 10) + '...',
      sid: sid?.substring(0, 10) + '...'
    });
    throw new Error(`Agora query failed: ${response.status} - ${errorData}`);
  }
  
  const result = await response.json();
  logger.agoraApiCall('QUERY', response.status, responseTime, {
    resourceId: resourceId?.substring(0, 10) + '...',
    sid: sid?.substring(0, 10) + '...',
    serverResponse: result.serverResponse ? 'present' : 'missing'
  });
  
  return result;
}

export default async function handler(req, res) {
  const requestStart = Date.now();
  
  console.log('📊 [AGORA STATUS] === API CALLED ===');
  console.log('📊 [AGORA STATUS] Method:', req.method);
  console.log('📊 [AGORA STATUS] Body:', JSON.stringify(req.body, null, 2));
  console.log('📊 [AGORA STATUS] Query:', JSON.stringify(req.query, null, 2));
  
  if (req.method !== 'GET' && req.method !== 'POST') {
    console.log('❌ [AGORA STATUS] Invalid method:', req.method);
    logger.warn('Method not allowed', { method: req.method });
    return res.status(405).json({ message: 'Method not allowed' });
  }

  logger.info('Recording status check started', {
    method: req.method,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
  });

  try {
    // Support both GET (with query params) and POST (with body)
    const { sid, meetingCode, resourceId } = req.method === 'GET' ? req.query : req.body;

    logger.debug('Request parameters', {
      hasSid: !!sid,
      sidLength: sid ? sid.length : 0,
      hasMeetingCode: !!meetingCode,
      meetingCode: meetingCode ? meetingCode.substring(0, 20) + '...' : null,
      hasResourceId: !!resourceId
    });

    if (!sid && !meetingCode) {
      logger.warn('Missing required parameters');
      return res.status(400).json({ 
        message: 'SID or Meeting Code is required',
        success: false 
      });
    }

    logger.info('Checking recording status', { 
      identifier: sid || meetingCode,
      searchBy: sid ? 'sid' : 'meetingCode'
    });

    let recordingRef;
    let recordingData;
    
    if (sid) {
      // Find by SID (most reliable)
      logger.debug('Searching by SID in Firestore');
      recordingRef = db.collection('AgoraRecordings').doc(sid);
      const recordingDoc = await recordingRef.get();
      
      if (!recordingDoc.exists) {
        logger.warn('Recording not found by SID', { sid: sid.substring(0, 10) + '...' });
        return res.status(404).json({
          success: false,
          message: 'Recording session not found'
        });
      }
      
      recordingData = recordingDoc.data();
      logger.info('Recording found by SID', {
        status: recordingData.status,
        recordingType: recordingData.recordingType,
        startTime: recordingData.startTime
      });
    } else {
      // Find by meeting code if SID not provided
      logger.debug('Searching by meeting code in Firestore');
      const query = await db.collection('AgoraRecordings')
        .where('meetingCode', '==', meetingCode)
        .where('status', 'in', ['recording', 'completed'])
        .orderBy('startTimestamp', 'desc')
        .limit(1)
        .get();
    
      if (query.empty) {
        logger.warn('Recording not found by meeting code', { meetingCode });
        return res.status(404).json({
          success: false,
          message: 'No recording session found'
        });
      }

      recordingRef = query.docs[0].ref;
      recordingData = query.docs[0].data();
      logger.info('Recording found by meeting code', {
        status: recordingData.status,
        recordingType: recordingData.recordingType,
        documentId: query.docs[0].id
      });
    }

    // Extract recording info from Firestore data
    const finalResourceId = resourceId || recordingData.resourceId;
    const finalSid = sid || recordingData.sid;

    let agoraStatus = null;
    let agoraError = null;

    // Only query Agora if recording is still active
    if (recordingData.status === 'recording' && finalResourceId && finalSid) {
      try {
        logger.info('Querying live Agora status', {
          resourceId: finalResourceId.substring(0, 10) + '...',
          sid: finalSid.substring(0, 10) + '...'
        });
        agoraStatus = await queryAgoraRecording(finalResourceId, finalSid);
        logger.info('Agora status retrieved successfully', {
          hasServerResponse: !!agoraStatus.serverResponse
        });
      } catch (error) {
        logger.error('Failed to query Agora status', {
          error: error.message,
          resourceId: finalResourceId?.substring(0, 10) + '...',
          sid: finalSid?.substring(0, 10) + '...'
        });
        agoraError = error.message;
        
        // If Agora query fails with 404, recording might have ended unexpectedly
        if (error.message.includes('404')) {
          logger.warn('Recording ended unexpectedly, updating status to failed');
          await recordingRef.update({
            status: 'failed',
            errorMessage: 'Recording ended unexpectedly',
            updatedAt: new Date()
          });
        }
      }
    } else {
      logger.debug('Skipping Agora query', {
        reason: recordingData.status !== 'recording' ? 'not_recording' : 'missing_ids',
        status: recordingData.status,
        hasResourceId: !!finalResourceId,
        hasSid: !!finalSid
      });
    }

    // Calculate current duration if recording is active
    let currentDuration = 0;
    if (recordingData.startTimestamp) {
      const endTime = recordingData.endTimestamp || Date.now();
      currentDuration = Math.floor((endTime - recordingData.startTimestamp) / 1000);
      logger.debug('Duration calculated', {
        currentDuration,
        isActive: !recordingData.endTimestamp
      });
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
      storageVendor: recordingData.storageVendor || 'gcs',
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
      logger.debug('Added live Agora status to response');
    }

    // Add error info if present
    if (agoraError) {
      response.agoraError = agoraError;
      logger.debug('Added Agora error to response');
    }

    // Add file information if recording is completed
    if (recordingData.status === 'completed' && recordingData.stopResponse) {
      response.fileList = recordingData.stopResponse.serverResponse?.fileList || [];
      logger.info('Added file list to response', {
        fileCount: response.fileList.length
      });
    }

    const processingTime = Date.now() - requestStart;
    logger.performance('Status check completed', processingTime, {
      status: recordingData.status,
      hasAgoraStatus: !!agoraStatus,
      hasError: !!agoraError,
      fileCount: response.fileList?.length || 0
    });

    res.status(200).json(response);

  } catch (error) {
    const processingTime = Date.now() - requestStart;
    logger.error('Status check failed', {
      error: error.message,
      stack: error.stack,
      processingTime
    });
    res.status(500).json({
      success: false,
      message: 'Failed to check recording status',
      error: error.message
    });
  }
} 