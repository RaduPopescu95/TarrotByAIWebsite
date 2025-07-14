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
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const AGORA_REST_API_KEY = process.env.AGORA_REST_API_KEY;
const AGORA_REST_API_SECRET = process.env.AGORA_REST_API_SECRET;

// AWS S3 Configuration for storing recordings
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_REGION = process.env.AWS_S3_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { channelId, meetingCode, userRole } = req.body;

    if (!channelId || !meetingCode) {
      return res.status(400).json({ message: 'Channel ID and Meeting Code are required' });
    }

    // Generate Agora Token for recording
    const token = await generateAgoraToken(channelId);

    // Step 1: Acquire Resource ID
    const resourceId = await acquireResourceId(channelId);

    // Step 2: Start Recording
    const recordingResponse = await startRecording(resourceId, channelId, token, meetingCode);

    if (recordingResponse.success) {
      // Save recording info to Firebase
      await saveRecordingInfo(channelId, meetingCode, {
        resourceId: resourceId,
        sid: recordingResponse.sid,
        startTime: Date.now(),
        status: 'recording',
        initiatedBy: userRole,
        storageLocation: `s3://${AWS_S3_BUCKET}/recordings/${meetingCode}/`,
      });

      res.status(200).json({
        success: true,
        resourceId: resourceId,
        sid: recordingResponse.sid,
        message: 'Recording started successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: recordingResponse.message || 'Failed to start recording'
      });
    }
  } catch (error) {
    console.error('Recording start error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function generateAgoraToken(channelId) {
  // For now, return null (no token mode)
  // In production, implement proper token generation
  return null;
}

async function acquireResourceId(channelId) {
  const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/acquire`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${AGORA_REST_API_KEY}:${AGORA_REST_API_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      cname: channelId,
      uid: "1001", // Recording service UID
      clientRequest: {
        resourceExpiredHour: 24,
        scene: 0 // Live broadcast scenario
      }
    })
  });

  const data = await response.json();
  
  if (response.ok && data.resourceId) {
    return data.resourceId;
  } else {
    throw new Error(`Failed to acquire resource ID: ${data.message || 'Unknown error'}`);
  }
}

async function startRecording(resourceId, channelId, token, meetingCode) {
  const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`;
  
  const recordingConfig = {
    cname: channelId,
    uid: "1001", // Recording service UID
    clientRequest: {
      token: token,
      recordingConfig: {
        maxIdleTime: 30,
        streamTypes: 2, // Audio and video
        audioProfile: 1,
        channelType: 1, // Live broadcast
        videoStreamType: 0, // High stream
        transcodingConfig: {
          height: 720,
          width: 1280,
          bitrate: 2000,
          fps: 15,
          mixedVideoLayout: 1, // Floating layout
          backgroundColor: "#000000",
          defaultUserBackgroundImage: "https://your-domain.com/default-bg.jpg"
        }
      },
      recordingFileConfig: {
        avFileType: ["hls", "mp4"] // Both HLS and MP4 formats
      },
      storageConfig: {
        vendor: 1, // AWS S3
        region: AWS_S3_REGION,
        bucket: AWS_S3_BUCKET,
        accessKey: AWS_ACCESS_KEY_ID,
        secretKey: AWS_SECRET_ACCESS_KEY,
        fileNamePrefix: [`recordings/${meetingCode}/`]
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${AGORA_REST_API_KEY}:${AGORA_REST_API_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify(recordingConfig)
  });

  const data = await response.json();
  
  if (response.ok && data.sid) {
    return {
      success: true,
      sid: data.sid,
      message: 'Recording started successfully'
    };
  } else {
    return {
      success: false,
      message: data.message || 'Failed to start recording'
    };
  }
}

async function saveRecordingInfo(channelId, meetingCode, recordingInfo) {
  try {
    const recordingRef = db.collection('Recordings').doc(meetingCode);
    await recordingRef.set({
      channelId: channelId,
      meetingCode: meetingCode,
      ...recordingInfo,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error saving recording info:', error);
    throw error;
  }
} 