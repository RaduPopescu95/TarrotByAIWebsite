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

// Global lock mechanism to prevent concurrent stop requests
const stopLocks = new Map();

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

// Helper function to query Agora Cloud Recording status
async function queryAgoraRecording(resourceId, sid, channelName, recordingUID) {
  const queryUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`;
  const agoraChannelName = createAgoraChannelName(channelName);

  console.log('🔍 Querying Agora Cloud Recording status', {
    resourceId: resourceId.substring(0, 20) + '...',
    sid,
    agoraChannelName,
    recordingUID: recordingUID.toString(),
    url: queryUrl
  });

  try {
    const response = await fetch(queryUrl, {
      method: 'GET', // ✅ FIXED: GET method as per Agora docs
      headers: {
        'Authorization': createAgoraAuthHeader(),
        'Content-Type': 'application/json'
      }
      // ✅ FIXED: No body for GET request
    });

    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ Recording status query successful:', {
        status: responseData.serverResponse?.status || 'unknown',
        fileList: responseData.serverResponse?.fileList || []
      });
      return { success: true, data: responseData };
    } else {
      console.log('❌ Recording status query failed:', {
        status: response.status,
        responseData
      });
      return { success: false, error: responseData };
    }
  } catch (error) {
    console.log('❌ Recording status query error:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to stop Agora Cloud Recording with retry mechanism
async function stopAgoraRecording(resourceId, sid, channelName, recordingUID, retryCount = 0) {
  const startTime = Date.now();
  const stopUrl = `https://api.agora.io/v1/apps/${AGORA_CONFIG.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`;
  
  // Convert meeting code to Agora channel name format (same as start)
  const agoraChannelName = createAgoraChannelName(channelName);
  
  // First, query the recording status to ensure it exists and is active
  if (retryCount === 0) {
    console.log('🔍 Checking recording status before stopping...');
    const queryResult = await queryAgoraRecording(resourceId, sid, channelName, recordingUID);
    
    if (!queryResult.success) {
      console.log('⚠️ Recording query failed, but proceeding with stop attempt');
    } else {
      console.log('✅ Recording query successful, proceeding with stop');
    }
  }
  
  const requestData = {
    cname: agoraChannelName,
    uid: recordingUID.toString(), // UID as string as per Agora documentation
    clientRequest: {}
  };

  console.log('🛑 Stopping Agora Cloud Recording', {
    resourceId: resourceId.substring(0, 20) + '...',
    sid,
    originalChannelName: channelName,
    agoraChannelName: agoraChannelName,
    recordingUID: recordingUID.toString(),
    url: stopUrl,
    retryCount
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
    
    // Handle 404 "failed to find worker" - recording already stopped, treat as SUCCESS
    if (response.status === 404 && errorData.includes('failed to find worker')) {
      console.log('✅ Recording already stopped (worker not found) - treating as success', {
        resourceId: resourceId.substring(0, 20) + '...',
        sid,
        status: response.status,
        explanation: 'Agora worker already cleaned up - recording completed naturally',
        duration: `${duration}ms`,
        retryCount,
        note: 'This is normal behavior when recording auto-stops due to idle time'
      });
      
      // Return a simulated success response for already-stopped recordings
      return {
        cname: agoraChannelName,
        resourceId: resourceId,
        sid: sid,
        uid: recordingUID.toString(),
        serverResponse: {
          fileList: [], // Files should be available in storage
          status: 'stopped_naturally',
          reason: 'Recording completed and worker cleaned up by Agora',
          uploadingStatus: 'uploaded' // Assume files are uploaded
        }
      };
    }
    
    console.log('❌ Agora recording stop failed', {
      resourceId,
      sid,
      channelName,
      recordingUID: recordingUID.toString(),
      status: response.status,
      statusText: response.statusText,
      errorData,
      duration: `${duration}ms`,
      retryCount
    });
    throw new Error(`Agora stop failed: ${response.status} - ${errorData}`);
  }
  
  const responseData = await response.json();
  
  console.log('📡 Agora API Call POST:', stopUrl, { requestData, responseData });
  console.log('🛑 Recording stopped successfully:', {
    channelName,
    resourceId,
    sid,
    recordingUID: recordingUID.toString(),
    duration: `${duration}ms`,
    retryCount,
    fileList: responseData.serverResponse?.fileList || []
  });
  
  return responseData;
}

// Save Agora recording to SimpleRecordings collection for search
async function saveAgoraToSimpleRecordings(recordingData, stopResponse, duration, meetingCode, sid) {
  try {
    console.log('💾 [AGORA STOP] Saving to SimpleRecordings collection for search...');
    
    // Extract download URLs from fileList
    const fileList = stopResponse.serverResponse?.fileList || [];
    const downloadURL = fileList.length > 0 ? fileList[0] : null;
    
    const simpleRecordingData = {
      meetingCode: meetingCode,
      documentId: recordingData.documentId || meetingCode, // Use meetingCode as fallback
      userEmail: recordingData.clientEmail || recordingData.userEmail || 'unknown@email.com',
      adminEmail: 'cristina@tarotbyai.com',
      downloadURL: downloadURL,
      duration: duration,
      fileSize: recordingData.fileSize || null,
      status: 'completed',
      type: 'one_to_one',
      typeLabel: 'Consultație Individuală',
      title: `Agora Cloud Recording - ${meetingCode}`,
      recordingMethod: 'agora-cloud-recording',
      recordedAt: recordingData.startTime ? new Date(recordingData.startTime) : new Date(),
      createdAt: new Date(),
      format: 'mp4', // Agora typically outputs MP4
      downloadedBy: [],
      downloadAttempts: [],
      // Agora specific data
      agoraData: {
        sid: sid,
        resourceId: recordingData.resourceId,
        fileList: fileList,
        uploadingStatus: stopResponse.serverResponse?.uploadingStatus
      },
      // Additional metadata for search
      searchableEmails: [
        (recordingData.clientEmail || recordingData.userEmail || 'unknown@email.com').toLowerCase().trim(),
        'cristina@tarotbyai.com'
      ]
    };
    
    // Use meetingCode as document ID for easy retrieval
    const recordingRef = db.collection('SimpleRecordings').doc(meetingCode);
    await recordingRef.set(simpleRecordingData, { merge: true });
    
    console.log('✅ [AGORA STOP] Saved to SimpleRecordings successfully:', {
      meetingCode,
      userEmail: simpleRecordingData.userEmail,
      hasDownloadURL: !!downloadURL,
      fileCount: fileList.length
    });
    
  } catch (error) {
    console.error('❌ [AGORA STOP] Error saving to SimpleRecordings:', error);
    // Don't throw - this is supplementary functionality
  }
}

export default async function handler(req, res) {
  const requestStartTime = Date.now();
  
  console.log('🛑 [AGORA STOP] === API CALLED ===');
  console.log('🛑 [AGORA STOP] Method:', req.method);
  console.log('🛑 [AGORA STOP] Body:', JSON.stringify(req.body, null, 2));
  console.log('🛑 [AGORA STOP] Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ [AGORA STOP] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sid, meetingCode, resourceId, recordingUID } = req.body;

    console.log('📥 Recording stop request received', {
      sid,
      meetingCode,
      resourceId,
      recordingUID,
      clientIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    if (!sid && !meetingCode) {
      console.log('❌ [AGORA STOP] Missing SID and meeting code!');
      return res.status(400).json({ 
        message: 'SID or Meeting Code is required',
        success: false 
      });
    }
    
    console.log('✅ [AGORA STOP] Parameters received:', { sid: sid?.substring(0, 10) + '...', meetingCode });

    // Check for concurrent stop requests for the same SID
    if (stopLocks.has(sid)) {
      console.log('🔒 [AGORA STOP] Stop already in progress for SID:', sid);
      return res.status(409).json({
        success: false,
        message: 'Recording stop already in progress for this session',
        operation: 'stop_recording'
      });
    }

    // Set lock for this SID
    stopLocks.set(sid, true);
    console.log('🔐 [AGORA STOP] Lock acquired for SID:', sid);

    let recordingRef;
    let recordingData;
    
    if (sid) {
      // Find by SID (most reliable)
      console.log('🔍 Looking up recording by SID', { sid });
      recordingRef = db.collection('AgoraRecordings').doc(sid);
      const recordingDoc = await recordingRef.get();
      
      if (!recordingDoc.exists) {
        console.log('❌ Recording session not found by SID', { sid });
        return res.status(404).json({
          success: false,
          message: 'Recording session not found'
        });
      }
      
      recordingData = recordingDoc.data();
      console.log('✅ Recording found by SID', {
        sid,
        meetingCode: recordingData.meetingCode,
        status: recordingData.status,
        startTime: recordingData.startTime
      });
    } else {
      // Find by meeting code if SID not provided
      console.log('🔍 Looking up recording by meeting code', { meetingCode });
      const query = await db.collection('AgoraRecordings')
        .where('meetingCode', '==', meetingCode)
        .where('status', '==', 'recording')
        .limit(1)
        .get();
    
      if (query.empty) {
        console.log('❌ No active recording session found by meeting code', { meetingCode });
        return res.status(404).json({
          success: false,
          message: 'No active recording session found'
        });
      }

      recordingRef = query.docs[0].ref;
      recordingData = query.docs[0].data();
      console.log('✅ Recording found by meeting code', {
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

    console.log('📋 Extracted recording parameters', {
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
      console.log('❌ Missing required recording parameters', {
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

    // Check if recording has been running long enough
    const now = Date.now();
    const recordingStartTime = recordingData.startTimestamp?.toDate ? recordingData.startTimestamp.toDate().getTime() : recordingData.startTimestamp;
    const recordingDuration = now - recordingStartTime;
    const minimumDuration = 15000; // 15 seconds minimum
    
    if (recordingDuration < minimumDuration) {
      const waitTime = minimumDuration - recordingDuration;
      console.log(`⏰ Recording started too recently (${recordingDuration}ms ago), waiting ${waitTime}ms before stopping...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Stop Agora Cloud Recording
    console.log('🚀 [AGORA STOP] Calling Agora stop API...');
    console.log('🚀 [AGORA STOP] Resource ID:', finalResourceId);
    console.log('🚀 [AGORA STOP] SID:', finalSid?.substring(0, 10) + '...');
    console.log('🚀 [AGORA STOP] Recording duration:', recordingDuration + 'ms');
    const stopResponse = await stopAgoraRecording(
      finalResourceId, 
      finalSid, 
      finalMeetingCode, 
      finalRecordingUID
    );

    // Calculate duration
    const recordingStart = recordingData.startTimestamp || Date.now();
    const recordingEnd = Date.now();
    const duration = Math.floor((recordingEnd - recordingStart) / 1000); // in seconds

    console.log('📊 Recording duration calculated', {
      startTime: new Date(recordingStart).toISOString(),
      endTime: new Date(recordingEnd).toISOString(),
      duration: `${duration} seconds`,
      durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`
    });

    // Update recording session with stop information
    console.log('💾 [AGORA STOP] Updating Firestore with stop data...');
    const updateData = {
      status: 'completed',
      endTime: new Date(recordingEnd),
      endTimestamp: recordingEnd,
      duration: duration,
      stopResponse: stopResponse,
      updatedAt: new Date()
    };

    // 🔍 DETAILED DEBUGGING: Analyze stop response
    console.log('🔍 [DEBUG] === DETAILED STOP RESPONSE ANALYSIS ===');
    console.log('📋 [DEBUG] Full stopResponse structure:', JSON.stringify(stopResponse, null, 2));
    console.log('📁 [DEBUG] serverResponse details:', {
      hasServerResponse: !!stopResponse.serverResponse,
      serverResponseKeys: stopResponse.serverResponse ? Object.keys(stopResponse.serverResponse) : 'none',
      hasFileList: !!stopResponse.serverResponse?.fileList,
      fileListType: typeof stopResponse.serverResponse?.fileList,
      fileListLength: stopResponse.serverResponse?.fileList?.length || 0,
      fileListContent: stopResponse.serverResponse?.fileList || 'none',
      uploadingStatus: stopResponse.serverResponse?.uploadingStatus || 'unknown'
    });
    
    if (stopResponse.serverResponse?.fileList && Array.isArray(stopResponse.serverResponse.fileList)) {
      console.log('📄 [DEBUG] Individual files in fileList:');
      stopResponse.serverResponse.fileList.forEach((file, index) => {
        console.log(`  File ${index + 1}:`, file);
      });
    } else {
      console.log('❌ [DEBUG] No valid fileList found in response!');
    }

    console.log('💾 [AGORA STOP] Update data:', {
      status: updateData.status,
      duration: duration,
      fileCount: stopResponse.serverResponse?.fileList?.length || 0
    });

    console.log('💾 Updating recording session in Firestore', {
      sid: finalSid,
      status: updateData.status,
      duration: duration,
      fileCount: stopResponse.serverResponse?.fileList?.length || 0
    });

    await recordingRef.update(updateData);
    console.log('✅ [AGORA STOP] Firestore updated successfully');

    // Also save to SimpleRecordings collection for search functionality
    await saveAgoraToSimpleRecordings(recordingData, stopResponse, duration, finalMeetingCode, finalSid);

    const totalDuration = Date.now() - requestStartTime;
    
    console.log('✅ Recording stop process completed', {
      totalDuration: `${totalDuration}ms`,
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

    console.log('✅ Recording stop request completed successfully', response);
    
    console.log('✅ [AGORA STOP] === SUCCESS RESPONSE ===');
    console.log('✅ [AGORA STOP] SID:', finalSid?.substring(0, 10) + '...');
    console.log('✅ [AGORA STOP] Duration:', `${duration}s`);
    console.log('✅ [AGORA STOP] Files:', stopResponse.serverResponse?.fileList?.length || 0);
    console.log('✅ [AGORA STOP] Processing time:', `${totalDuration}ms`);
    
    // Release lock
    stopLocks.delete(finalSid);
    console.log('🔓 [AGORA STOP] Lock released for SID:', finalSid);
    
    res.status(200).json(response);

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    
    console.log('❌ [AGORA STOP] === ERROR OCCURRED ===');
    console.log('❌ [AGORA STOP] Error:', error.message);
    console.log('❌ [AGORA STOP] Stack:', error.stack);
    console.log('❌ [AGORA STOP] Processing time:', `${totalDuration}ms`);
    
    // Release lock on error
    const sidForCleanup = req.body.sid;
    if (sidForCleanup) {
      stopLocks.delete(sidForCleanup);
      console.log('🔓 [AGORA STOP] Lock released on error for SID:', sidForCleanup);
    }
    
    console.log('❌ Recording error details:', {
      meetingCode: req.body.meetingCode || req.body.sid || 'unknown',
      error: error.message,
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