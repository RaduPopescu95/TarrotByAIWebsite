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
  
  console.log(`${emoji} [${level}] [DAILY-WEBHOOK] ${timestamp} - ${message}`);
  if (Object.keys(data).length > 0) {
    console.log('📊 Data:', JSON.stringify(data, null, 2));
  }
}

export default async function handler(req, res) {
  // Handle verification requests from Daily.co (GET)
  if (req.method === 'GET') {
    logWithDetails('INFO', 'Webhook verification request from Daily.co');
    return res.status(200).json({ 
      message: 'Daily.co webhook endpoint is active',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    logWithDetails('WARNING', 'Invalid HTTP method', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    logWithDetails('INFO', 'Received Daily.co webhook', {
      type: webhookData.type,
      event: webhookData.event,
      room: webhookData.room?.name,
      hasRecording: !!webhookData.recording
    });

    // Verify webhook signature (optional but recommended)
    // const signature = req.headers['x-daily-signature'];
    // if (!verifyWebhookSignature(signature, req.body)) {
    //   logWithDetails('ERROR', 'Invalid webhook signature');
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    // Handle different webhook events
    switch (webhookData.type) {
      case 'recording.ready-to-download':
        await handleRecordingReadyToDownload(webhookData);
        break;
      case 'recording.finished':
        await handleRecordingFinished(webhookData);
        break;
      case 'recording.error':
        await handleRecordingError(webhookData);
        break;
      case 'room.exp':
        await handleRoomExpired(webhookData);
        break;
      default:
        logWithDetails('INFO', 'Unhandled webhook event type', { 
          type: webhookData.type,
          event: webhookData.event 
        });
        break;
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    logWithDetails('ERROR', 'Webhook processing failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      details: error.message
    });
  }
}

// Handler for recording.ready-to-download events  
async function handleRecordingReadyToDownload(webhookData) {
  try {
    logWithDetails('INFO', 'Processing recording.ready-to-download event', {
      roomName: webhookData.room?.name,
      recordingId: webhookData.recording?.id,
      downloadUrl: webhookData.recording?.download_url
    });

    const roomName = webhookData.room?.name;
    const recording = webhookData.recording;
    
    if (!roomName || !recording) {
      logWithDetails('ERROR', 'Missing required data in recording.ready-to-download webhook', {
        hasRoom: !!webhookData.room,
        hasRecording: !!webhookData.recording
      });
      return;
    }

    // Extract documentId from room name (format: consultation-{documentId} or conference-{documentId})
    const documentId = roomName.replace(/^(consultation-|conference-)/, '');
    
    if (!documentId || documentId === roomName) {
      logWithDetails('ERROR', 'Could not extract documentId from room name', { 
        roomName,
        extractedDocumentId: documentId,
        isValidExtraction: documentId !== roomName && documentId.length > 0
      });
      return;
    }

    logWithDetails('INFO', 'Extracted documentId from room name', { 
      roomName, 
      documentId,
      recordingId: recording.id,
      documentIdLength: documentId.length
    });

    // Generate temporary download link (12 hours validity) using Daily.co API
    const recordingId = recording.id;
    
    if (!recordingId) {
      logWithDetails('ERROR', 'No recording ID found in webhook data', {
        availableFields: Object.keys(recording)
      });
      return;
    }

    logWithDetails('INFO', 'Generating temporary download link for recording', {
      recordingId: recordingId
    });

    // Generate temporary download link (12 hours validity)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const linkResponse = await fetch(`${baseUrl}/api/daily/get-recording-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordingId: recordingId
      }),
    });

    let downloadLink = null;
    let linkExpires = null;

    if (linkResponse.ok) {
      const linkData = await linkResponse.json();
      downloadLink = linkData.downloadLink;
      linkExpires = linkData.expires;
      
      logWithDetails('SUCCESS', 'Generated temporary download link', {
        recordingId,
        downloadLink: downloadLink ? 'GENERATED' : 'FAILED',
        expiresAt: linkData.expiresAt
      });
    } else {
      const linkError = await linkResponse.text();
      logWithDetails('ERROR', 'Failed to generate download link', {
        recordingId,
        error: linkError
      });
      // Continue anyway - we'll update Firebase and try to send email without link
    }

    // Update Firebase with recording ready status
    const reservationRef = db.collection('RezervariConsultatii').doc(documentId);
    await reservationRef.update({
      'recording.status': 'ready',
      'recording.dailyRecordingId': recordingId,
      'recording.downloadUrl': downloadLink || 'LINK_GENERATION_FAILED',
      'recording.linkExpires': linkExpires ? new Date(linkExpires * 1000) : null,
      'recording.duration': recording.duration || null,
      'recording.readyAt': new Date(),
      'recording.webhookProcessed': true
    });

    logWithDetails('SUCCESS', 'Updated Firebase with recording ready status', {
      documentId,
      recordingId: recordingId,
      downloadLink: downloadLink ? 'PRESENT' : 'MISSING',
      linkExpires: linkExpires ? new Date(linkExpires * 1000).toISOString() : 'NO_EXPIRY'
    });

    // Send email to client with recording download link (only if we have a valid link)
    if (downloadLink) {
      const emailResponse = await fetch(`${baseUrl}/api/daily/send-recording-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: documentId,
          recordingUrl: downloadLink,
          roomName: roomName,
          duration: recording.duration,
          linkExpires: linkExpires
        }),
      });

      const emailResult = await emailResponse.json();
      
      if (emailResult.success) {
        logWithDetails('SUCCESS', 'Recording email sent successfully', {
          documentId,
          messageId: emailResult.messageId,
          recipientEmail: emailResult.recipientEmail
        });
      } else {
        logWithDetails('ERROR', 'Failed to send recording email', {
          documentId,
          error: emailResult.error
        });
      }
    } else {
      logWithDetails('ERROR', 'Cannot send email - no valid download link generated', {
        documentId,
        recordingId: recordingId
      });
    }

  } catch (error) {
    logWithDetails('ERROR', 'Error processing recording.ready-to-download webhook', {
      error: error.message,
      stack: error.stack,
      webhookData: JSON.stringify(webhookData, null, 2)
    });
  }
}

async function handleRecordingFinished(webhookData) {
  try {
    logWithDetails('INFO', 'Processing recording.finished event', {
      room: webhookData.room?.name,
      recording: webhookData.recording?.id,
      duration: webhookData.recording?.duration
    });

    const roomName = webhookData.room?.name;
    const recording = webhookData.recording;

    if (!roomName || !recording) {
      logWithDetails('WARNING', 'Missing room name or recording data');
      return;
    }

    // Extract documentId from room name (format: consultation-{documentId})
    const documentId = roomName.replace('consultation-', '');
    
    if (!documentId || documentId === roomName) {
      logWithDetails('WARNING', 'Could not extract documentId from room name', { roomName });
      return;
    }

    logWithDetails('INFO', 'Extracted documentId from room name', { 
      roomName, 
      documentId 
    });

    // Get download URL for the recording
    const downloadUrl = recording.download_url || recording.playback_url;
    
    if (!downloadUrl) {
      logWithDetails('WARNING', 'No download URL found in recording data', {
        recordingId: recording.id,
        recording: recording
      });
      return;
    }

    // Update Firebase with recording info
    const reservationRef = db.collection('RezervariConsultatii').doc(documentId);
    
    await reservationRef.update({
      'recording.status': 'ready',
      'recording.dailyRecordingId': recording.id,
      'recording.downloadUrl': downloadUrl,
      'recording.duration': recording.duration,
      'recording.readyAt': new Date(),
      'recording.webhookProcessed': true
    });

    logWithDetails('SUCCESS', 'Updated Firebase with recording info', {
      documentId,
      recordingId: recording.id,
      duration: recording.duration
    });

    // Send email to client with recording
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/daily/send-recording-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: documentId,
        recordingUrl: downloadUrl,
        roomName: roomName,
        duration: recording.duration
      }),
    });

    const emailResult = await emailResponse.json();

    if (emailResult.success) {
      logWithDetails('SUCCESS', 'Recording email sent via API', {
        documentId,
        messageId: emailResult.messageId
      });
    } else {
      logWithDetails('ERROR', 'Failed to send recording email via API', {
        documentId,
        error: emailResult.error
      });
    }

  } catch (error) {
    logWithDetails('ERROR', 'Error processing recording.finished event', {
      error: error.message,
      stack: error.stack,
      room: webhookData.room?.name
    });
  }
}

async function handleRecordingError(webhookData) {
  try {
    logWithDetails('WARNING', 'Processing recording.error event', {
      room: webhookData.room?.name,
      error: webhookData.error
    });

    const roomName = webhookData.room?.name;
    
    if (!roomName) {
      logWithDetails('WARNING', 'Missing room name in recording error');
      return;
    }

    // Extract documentId from room name
    const documentId = roomName.replace('consultation-', '');
    
    if (!documentId || documentId === roomName) {
      logWithDetails('WARNING', 'Could not extract documentId from room name', { roomName });
      return;
    }

    // Update Firebase with error status
    const reservationRef = db.collection('RezervariConsultatii').doc(documentId);
    
    await reservationRef.update({
      'recording.status': 'error',
      'recording.error': webhookData.error?.message || 'Recording failed',
      'recording.errorAt': new Date(),
      'recording.webhookProcessed': true
    });

    logWithDetails('SUCCESS', 'Updated Firebase with recording error', {
      documentId,
      error: webhookData.error?.message
    });

  } catch (error) {
    logWithDetails('ERROR', 'Error processing recording.error event', {
      error: error.message,
      stack: error.stack,
      room: webhookData.room?.name
    });
  }
}

async function handleRoomExpired(webhookData) {
  try {
    logWithDetails('INFO', 'Processing room.exp event', {
      room: webhookData.room?.name
    });

    const roomName = webhookData.room?.name;
    
    if (!roomName) {
      logWithDetails('WARNING', 'Missing room name in room expired event');
      return;
    }

    // Extract documentId from room name
    const documentId = roomName.replace('consultation-', '');
    
    if (!documentId || documentId === roomName) {
      logWithDetails('WARNING', 'Could not extract documentId from room name', { roomName });
      return;
    }

    // Update Firebase with room status
    const reservationRef = db.collection('RezervariConsultatii').doc(documentId);
    
    await reservationRef.update({
      'roomStatus': 'expired',
      'roomExpiredAt': new Date()
    });

    logWithDetails('SUCCESS', 'Updated Firebase with room expired status', {
      documentId
    });

  } catch (error) {
    logWithDetails('ERROR', 'Error processing room.exp event', {
      error: error.message,
      stack: error.stack,
      room: webhookData.room?.name
    });
  }
}

// Optional: Verify webhook signature for security
// function verifyWebhookSignature(signature, body) {
//   // Implement signature verification if Daily.co provides webhook signing
//   // This would involve checking the signature against a secret key
//   return true; // For now, accept all webhooks
// } 