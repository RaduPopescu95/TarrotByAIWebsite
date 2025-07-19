import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 
                       process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                       `${projectId}.appspot.com`;
  
  initializeApp({
    credential: cert({
      projectId: projectId,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: storageBucket
  });
  
  console.log(`🔥 Firebase Admin initialized with bucket: ${storageBucket}`);
}

const adminStorage = getStorage();
const db = getFirestore();

// Disable Next.js body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const requestId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`🔥 [${requestId}] Server-side upload request received`, {
    method: req.method,
    contentLength: req.headers['content-length'],
    contentType: req.headers['content-type']
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Parse the uploaded file
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB max
    });

    const [fields, files] = await form.parse(req);
    
    const videoFile = files.videoFile?.[0];
    const meetingCode = fields.meetingCode?.[0];
    const duration = parseInt(fields.duration?.[0] || '0');
    const userEmail = fields.userEmail?.[0];

    if (!videoFile || !meetingCode) {
      console.error(`❌ [${requestId}] Missing required fields`, {
        hasVideoFile: !!videoFile,
        hasMeetingCode: !!meetingCode
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Video file and meeting code are required' 
      });
    }

    console.log(`📊 [${requestId}] Processing video upload`, {
      meetingCode,
      videoSize: videoFile.size,
      duration,
      userEmail,
      originalName: videoFile.originalFilename,
      tempPath: videoFile.filepath
    });

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(videoFile.originalFilename || '.webm');
    const fileName = `server_recording_${timestamp}${extension}`;
    const storagePath = `recordings/${meetingCode}/${fileName}`;

    // Upload to Firebase Storage using Admin SDK
    console.log(`☁️ [${requestId}] Starting Firebase Storage upload`);
    
    // Get bucket with explicit fallback
    let bucket;
    try {
      // Try default bucket first
      bucket = adminStorage.bucket();
      console.log(`📦 [${requestId}] Using default bucket: ${bucket.name}`);
    } catch (error) {
      // Fallback to explicit bucket name
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 
                         process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                         `${projectId}.appspot.com`;
      
      console.log(`📦 [${requestId}] Default bucket failed, trying explicit: ${bucketName}`);
      bucket = adminStorage.bucket(bucketName);
    }
    
    const file = bucket.file(storagePath);

    // Create upload stream with metadata
    const stream = file.createWriteStream({
      metadata: {
        contentType: videoFile.mimetype || 'video/webm',
        metadata: {
          meetingCode,
          duration: duration.toString(),
          uploadedBy: userEmail || 'unknown',
          uploadMethod: 'server_side',
          originalName: videoFile.originalFilename
        }
      }
    });

    // Track upload progress and handle errors
    let uploadError = null;
    let uploadComplete = false;

    stream.on('error', (error) => {
      console.error(`💥 [${requestId}] Upload stream error`, {
        error: error.message,
        errorCode: error.code
      });
      uploadError = error;
    });

    stream.on('finish', () => {
      console.log(`✅ [${requestId}] Upload stream finished`);
      uploadComplete = true;
    });

    // Pipe the file to Firebase Storage
    const readStream = fs.createReadStream(videoFile.filepath);
    readStream.pipe(stream);

    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    if (uploadError) {
      throw uploadError;
    }

    // Get download URL
    const [downloadURL] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Save metadata to Firestore
    const recordingData = {
      meetingCode,
      fileName,
      downloadURL,
      size: videoFile.size,
      duration,
      uploadTime: timestamp,
      userEmail: userEmail || 'unknown',
      status: 'completed',
      recordingType: 'server_processed',
      uploadMethod: 'server_side'
    };

    console.log(`💾 [${requestId}] Saving metadata to Firestore`);
    
    // Save to multiple collections for compatibility
    await Promise.all([
      db.collection('Recordings').add(recordingData),
      db.collection('SimpleRecordings').add(recordingData)
    ]);

    // Clean up temporary file
    try {
      fs.unlinkSync(videoFile.filepath);
      console.log(`🧹 [${requestId}] Temporary file cleaned up`);
    } catch (cleanupError) {
      console.warn(`⚠️ [${requestId}] Failed to cleanup temp file`, {
        error: cleanupError.message
      });
    }

    console.log(`🎉 [${requestId}] Server-side upload completed successfully`, {
      downloadURL: downloadURL.substring(0, 100) + '...',
      fileSize: videoFile.size,
      duration
    });

    res.status(200).json({
      success: true,
      data: recordingData,
      message: 'Video uploaded and processed successfully'
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Server-side upload failed`, {
      error: error.message,
      errorStack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Server upload failed: ' + error.message
    });
  }
} 