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
const logger = createApiLogger('STOP');

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
  const startTime = Date.now();
  const stopUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`;
  
  const requestData = {
    cname: channelName,
    uid: Number(recordingUID), // Convert to number as required by Agora spec
    clientRequest: {}
  };

  logger.info('🛑 Stopping Agora Cloud Recording', {
    resourceId,
    sid,
    channelName,
    recordingUID: recordingUID.toString(),
    url: stopUrl
  });
  
  const response = await fetch(stopUrl, {
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
    logger.error('❌ Agora recording stop failed', {
      resourceId,
      sid,
      channelName,
      recordingUID: recordingUID.toString(),
      status: response.status,
      statusText: response.statusText,
      errorData,
      duration: `${duration}ms`
    });
    throw new Error(`Agora stop failed: ${response.status} - ${errorData}`);
  }
  
  const responseData = await response.json();
  
  logger.agoraApiCall('POST', stopUrl, requestData, responseData);
  logger.recordingStop(channelName, {
    resourceId,
    sid,
    recordingUID: recordingUID.toString(),
    duration: `${duration}ms`,
    fileList: responseData.serverResponse?.fileList || []
  });
  
  return responseData;
}

export default async function handler(req, res) {
  const requestStartTime = Date.now();
  
  console.log('🛑 [AGORA STOP] === API CALLED ===');
  console.log('🛑 [AGORA STOP] Method:', req.method);
  console.log('🛑 [AGORA STOP] Body:', JSON.stringify(req.body, null, 2));
  console.log('🛑 [AGORA STOP] Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ [AGORA STOP] Invalid method:', req.method);
    logger.warn('Invalid request method', { method: req.method });
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sid, meetingCode, resourceId, recordingUID } = req.body;

    logger.info('📥 Recording stop request received', {
      sid,
      meetingCode,
      resourceId,
      recordingUID,
      clientIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    if (!sid && !meetingCode) {
      console.log('❌ [AGORA STOP] Missing SID and meeting code!');
      logger.warn('Missing SID and meeting code in request', { requestBody: req.body });
      return res.status(400).json({ 
        message: 'SID or Meeting Code is required',
        success: false 
      });
    }
    
    console.log('✅ [AGORA STOP] Parameters received:', { sid: sid?.substring(0, 10) + '...', meetingCode });

    let recordingRef;
    let recordingData;
    
    if (sid) {
      // Find by SID (most reliable)
      logger.debug('🔍 Looking up recording by SID', { sid });
      recordingRef = db.collection('AgoraRecordings').doc(sid);
      const recordingDoc = await recordingRef.get();
      
      if (!recordingDoc.exists) {
        logger.warn('Recording session not found by SID', { sid });
        return res.status(404).json({
          success: false,
          message: 'Recording session not found'
        });
      }
      
      recordingData = recordingDoc.data();
      logger.info('✅ Recording found by SID', {
        sid,
        meetingCode: recordingData.meetingCode,
        status: recordingData.status,
        startTime: recordingData.startTime
      });
    } else {
      // Find by meeting code if SID not provided
      logger.debug('🔍 Looking up recording by meeting code', { meetingCode });
      const query = await db.collection('AgoraRecordings')
        .where('meetingCode', '==', meetingCode)
        .where('status', '==', 'recording')
        .limit(1)
        .get();
    
      if (query.empty) {
        logger.warn('No active recording session found by meeting code', { meetingCode });
        return res.status(404).json({
          success: false,
          message: 'No active recording session found'
        });
      }

      recordingRef = query.docs[0].ref;
      recordingData = query.docs[0].data();
      logger.info('✅ Recording found by meeting code', {
        meetingCode,
        sid: recordingData.sid,
        status: recordingData.status,
        startTime: recordingData.startTime
      });
    }

    // Extract recording info from Firestore data
    const finalResourceId = resourceId || recordingData.resourceId;
    const finalSid = sid || recordingData.sid;
    const finalMeetingCode = meetingCode || recordingData.meetingCode;
    const finalRecordingUID = recordingUID || recordingData.recordingUID;

    logger.debug('📋 Extracted recording parameters', {
      finalResourceId,
      finalSid,
      finalMeetingCode,
      finalRecordingUID,
      fromRequest: { resourceId, sid, meetingCode, recordingUID },
      fromFirestore: { 
        resourceId: recordingData.resourceId,
        sid: recordingData.sid,
        meetingCode: recordingData.meetingCode,
        recordingUID: recordingData.recordingUID
      }
    });

    if (!finalResourceId || !finalSid || !finalRecordingUID) {
      logger.error('Missing required recording parameters', {
        finalResourceId: !!finalResourceId,
        finalSid: !!finalSid,
        finalRecordingUID: !!finalRecordingUID,
        recordingData
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required recording parameters. Cannot stop recording.'
      });
    }

    // Stop Agora Cloud Recording
    console.log('🚀 [AGORA STOP] Calling Agora stop API...');
    console.log('🚀 [AGORA STOP] Resource ID:', finalResourceId);
    console.log('🚀 [AGORA STOP] SID:', finalSid?.substring(0, 10) + '...');
    logger.info('🛑 Calling Agora stop API');
    const stopResponse = await stopAgoraRecording(
      finalResourceId, 
      finalSid, 
      finalMeetingCode, 
      finalRecordingUID
    );

    // Calculate duration
    const startTime = recordingData.startTimestamp || Date.now();
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000); // in seconds

    logger.info('📊 Recording duration calculated', {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: `${duration} seconds`,
      durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`
    });

    // Update recording session with stop information
    console.log('💾 [AGORA STOP] Updating Firestore with stop data...');
    const updateData = {
      status: 'completed',
      endTime: new Date(),
      endTimestamp: endTime,
      duration: duration,
      stopResponse: stopResponse,
      updatedAt: new Date()
    };

    console.log('💾 [AGORA STOP] Update data:', {
      status: updateData.status,
      duration: duration,
      fileCount: stopResponse.serverResponse?.fileList?.length || 0
    });

    logger.info('💾 Updating recording session in Firestore', {
      sid: finalSid,
      status: updateData.status,
      duration: duration,
      fileCount: stopResponse.serverResponse?.fileList?.length || 0
    });

    await recordingRef.update(updateData);
    console.log('✅ [AGORA STOP] Firestore updated successfully');

    const totalDuration = Date.now() - requestStartTime;
    
    logger.performance('Recording stop process completed', totalDuration, {
      meetingCode: finalMeetingCode,
      sid: finalSid,
      recordingDuration: duration,
      fileCount: stopResponse.serverResponse?.fileList?.length || 0
    });

    const response = {
      success: true,
      sid: finalSid,
      resourceId: finalResourceId,
      meetingCode: finalMeetingCode,
      duration: duration,
      endTime: updateData.endTime,
      fileList: stopResponse.serverResponse?.fileList || [],
      processingDuration: `${totalDuration}ms`,
      message: 'Agora Cloud Recording stopped successfully'
    };

    logger.info('✅ Recording stop request completed successfully', response);
    
    console.log('✅ [AGORA STOP] === SUCCESS RESPONSE ===');
    console.log('✅ [AGORA STOP] SID:', finalSid?.substring(0, 10) + '...');
    console.log('✅ [AGORA STOP] Duration:', `${duration}s`);
    console.log('✅ [AGORA STOP] Files:', stopResponse.serverResponse?.fileList?.length || 0);
    console.log('✅ [AGORA STOP] Processing time:', `${totalDuration}ms`);
    
    res.status(200).json(response);

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    
    console.log('❌ [AGORA STOP] === ERROR OCCURRED ===');
    console.log('❌ [AGORA STOP] Error:', error.message);
    console.log('❌ [AGORA STOP] Stack:', error.stack);
    console.log('❌ [AGORA STOP] Processing time:', `${totalDuration}ms`);
    
    logger.recordingError(req.body.meetingCode || req.body.sid || 'unknown', error, {
      requestBody: req.body,
      processingDuration: `${totalDuration}ms`,
      operation: 'stop_recording'
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to stop Agora cloud recording',
      error: error.message,
      processingDuration: `${totalDuration}ms`
    });
  }
} 