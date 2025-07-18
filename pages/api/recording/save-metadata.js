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

// Helper function to create detailed log
function logWithDetails(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const emoji = {
    'INFO': '🔵',
    'SUCCESS': '✅',
    'WARNING': '⚠️',
    'ERROR': '❌',
    'DEBUG': '🔍'
  }[level] || '📝';
  
  console.log(`${emoji} [${level}] [API/save-metadata] ${timestamp} - ${message}`);
  if (Object.keys(data).length > 0) {
    console.log('📊 Data:', JSON.stringify(data, null, 2));
  }
}

export default async function handler(req, res) {
  const requestStartTime = Date.now();
  const requestId = `req_${requestStartTime}_${Math.random().toString(36).substr(2, 6)}`;
  
  logWithDetails('INFO', 'API request received', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    referer: req.headers.referer
  });

  if (req.method !== 'POST') {
    logWithDetails('ERROR', 'Method not allowed', {
      requestId,
      method: req.method,
      allowedMethods: ['POST']
    });
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { 
      meetingCode, 
      fileName, 
      downloadURL, 
      size, 
      duration, 
      uploadTime,
      userEmail,
      status = 'completed'
    } = req.body;

    logWithDetails('INFO', 'Processing recording metadata request', {
      requestId,
      meetingCode,
      fileName,
      size: formatFileSize(size || 0),
      sizeBytes: size,
      duration: formatDuration(duration || 0),
      durationSeconds: duration,
      userEmail,
      status,
      downloadURLLength: downloadURL ? downloadURL.length : 0,
      uploadTime: uploadTime ? new Date(uploadTime).toISOString() : 'not provided',
      bodySize: JSON.stringify(req.body).length
    });

    // Validation
    const missingFields = [];
    if (!meetingCode) missingFields.push('meetingCode');
    if (!fileName) missingFields.push('fileName');
    if (!downloadURL) missingFields.push('downloadURL');

    if (missingFields.length > 0) {
      logWithDetails('ERROR', 'Validation failed - missing required fields', {
        requestId,
        missingFields,
        receivedFields: Object.keys(req.body),
        bodyLength: JSON.stringify(req.body).length
      });
      return res.status(400).json({ 
        success: false, 
        message: 'meetingCode, fileName, and downloadURL are required',
        missingFields
      });
    }

    // Additional validation
    if (size && (typeof size !== 'number' || size < 0)) {
      logWithDetails('WARNING', 'Invalid file size provided', {
        requestId,
        size,
        sizeType: typeof size
      });
    }

    if (duration && (typeof duration !== 'number' || duration < 0)) {
      logWithDetails('WARNING', 'Invalid duration provided', {
        requestId,
        duration,
        durationType: typeof duration
      });
    }

    logWithDetails('INFO', 'Validation passed, proceeding to save metadata', {
      requestId,
      meetingCode
    });

    // Prepare recording data
    const recordingData = {
      meetingCode,
      fileName,
      downloadURL,
      size: size || 0,
      duration: duration || 0,
      uploadTime: uploadTime || Date.now(),
      userEmail: userEmail || 'unknown',
      status,
      createdAt: Date.now(),
      type: 'browser_recording', // To distinguish from Agora recordings
      format: fileName.split('.').pop() || 'webm',
      sizeFormatted: formatFileSize(size || 0),
      durationFormatted: formatDuration(duration || 0),
      metadata: {
        requestId,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        referer: req.headers.referer,
        processingStartTime: requestStartTime
      }
    };

    logWithDetails('INFO', 'Prepared recording data for Firestore', {
      requestId,
      recordingDataSize: JSON.stringify(recordingData).length,
      format: recordingData.format,
      sizeFormatted: recordingData.sizeFormatted,
      durationFormatted: recordingData.durationFormatted
    });

    // Save to Firestore - SimpleRecordings collection
    logWithDetails('INFO', 'Saving to SimpleRecordings collection', {
      requestId,
      collection: 'SimpleRecordings',
      documentId: meetingCode
    });

    const simpleRecordingsResult = await db.collection('SimpleRecordings').doc(meetingCode).set(recordingData, { merge: true });

    logWithDetails('SUCCESS', 'Saved to SimpleRecordings collection', {
      requestId,
      collection: 'SimpleRecordings',
      documentId: meetingCode,
      writeTime: simpleRecordingsResult.writeTime?.toDate()?.toISOString()
    });

    // Also save to general recordings collection for compatibility
    const compatibilityData = {
      ...recordingData,
      recordingType: 'browser_simple',
      storageLocation: downloadURL
    };

    logWithDetails('INFO', 'Saving to Recordings collection for compatibility', {
      requestId,
      collection: 'Recordings',
      documentId: meetingCode
    });

    const recordingsResult = await db.collection('Recordings').doc(meetingCode).set(compatibilityData, { merge: true });

    logWithDetails('SUCCESS', 'Saved to Recordings collection', {
      requestId,
      collection: 'Recordings',
      documentId: meetingCode,
      writeTime: recordingsResult.writeTime?.toDate()?.toISOString()
    });

    const processingTime = Date.now() - requestStartTime;

    logWithDetails('SUCCESS', 'Recording metadata saved successfully', {
      requestId,
      meetingCode,
      processingTime: `${processingTime}ms`,
      totalCollections: 2,
      finalSize: formatFileSize(recordingData.size),
      finalDuration: recordingData.durationFormatted
    });

    res.status(200).json({ 
      success: true, 
      message: 'Recording metadata saved successfully',
      data: recordingData,
      requestId,
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - requestStartTime;
    
    logWithDetails('ERROR', 'Failed to save recording metadata', {
      requestId,
      error: error.message,
      errorCode: error.code,
      errorStack: error.stack,
      processingTime: `${processingTime}ms`,
      firestoreConfig: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '[SET]' : '[NOT SET]',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? '[SET]' : '[NOT SET]'
      }
    });

    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requestId
    });
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format duration
function formatDuration(seconds) {
  if (seconds === 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
} 