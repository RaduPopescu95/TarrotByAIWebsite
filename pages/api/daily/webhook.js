import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logRecordingError } from '../../../lib/recordingErrors';

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

function detectSessionType(roomName) {
  if (!roomName) return { sessionType: 'unknown', documentId: null };
  if (roomName.startsWith('consultation-')) {
    return { sessionType: 'consultation', documentId: roomName.replace('consultation-', '') };
  }
  if (roomName.startsWith('conference-')) {
    return { sessionType: 'conference', documentId: roomName.replace('conference-', '') };
  }
  return { sessionType: 'unknown', documentId: null };
}

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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cristinazurba.com' || 'http://localhost:3000';
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

    // Determine session type from roomName
    const isConference = roomName?.startsWith('conference-');

    if (!isConference) {
      // ===== CONSULTATION FLOW =====
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

      logWithDetails('SUCCESS', 'Updated Firebase with recording ready status (consultation)', {
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
          logWithDetails('SUCCESS', 'Recording email sent successfully (consultation)', {
            documentId,
            messageId: emailResult.messageId,
            recipientEmail: emailResult.recipientEmail
          });
        } else {
          logWithDetails('ERROR', 'Failed to send recording email (consultation)', {
            documentId,
            error: emailResult.error
          });
          await logRecordingError(db, {
            source: 'webhook',
            recordingId,
            documentId,
            roomName,
            sessionType: 'consultation',
            errorMessage: `Webhook -> send-recording-email failed: ${emailResult.error || 'unknown'}`,
            errorContext: {
              step: 'consultation-email-send',
              emailApiStatus: emailResponse.status,
            },
          });
        }
      } else {
        logWithDetails('ERROR', 'Cannot send email - no valid download link generated (consultation)', {
          documentId,
          recordingId: recordingId
        });
        await logRecordingError(db, {
          source: 'webhook',
          recordingId,
          documentId,
          roomName,
          sessionType: 'consultation',
          errorMessage: 'Cannot send consultation recording email - no valid download link generated',
          errorContext: { step: 'consultation-no-download-link' },
        });
      }
    } else {
      // ===== CONFERENCE FLOW =====
      // Update conference doc with recording meta
      const conferenceRef = db.collection('ConferinteGrup').doc(documentId);
      await conferenceRef.update({
        'recording.status': 'ready',
        'recording.dailyRecordingId': recordingId,
        'recording.downloadUrl': downloadLink || 'LINK_GENERATION_FAILED',
        'recording.linkExpires': linkExpires ? new Date(linkExpires * 1000) : null,
        'recording.duration': recording.duration || null,
        'recording.readyAt': new Date(),
        'recording.webhookProcessed': true
      });

      logWithDetails('SUCCESS', 'Updated Firebase with recording ready status (conference)', {
        documentId,
        recordingId: recordingId
      });

      // Send email to all participants in ConferinteGrup.participanti
      const confDoc = await conferenceRef.get();
      const confData = confDoc.exists ? confDoc.data() : null;
      const participants = Array.isArray(confData?.participanti) ? confData.participanti : [];

      if (!participants.length) {
        logWithDetails('WARNING', 'No participants found in conference document', { documentId });
      }

      if (downloadLink && participants.length) {
        for (const p of participants) {
          const email = p?.email;
          if (!email) continue;
          try {
            // Reuse existing endpoint that generates a fresh access link per email
            const resp = await fetch(`${baseUrl}/api/daily/send-recording-custom`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recordingId: recordingId,
                customEmail: email,
                customName: p?.nume || 'Participant',
                roomName: roomName,
                duration: recording.duration
              })
            });
            const result = await resp.json();
            if (resp.ok && result.success) {
              logWithDetails('SUCCESS', 'Conference recording email sent', {
                documentId,
                participantEmail: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
                messageId: result.messageId
              });
            } else {
              logWithDetails('ERROR', 'Failed to send conference recording email', {
                documentId,
                participantEmail: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
                error: result.error || 'unknown'
              });
              await logRecordingError(db, {
                source: 'webhook',
                recordingId,
                documentId,
                roomName,
                sessionType: 'conference',
                errorMessage: `Webhook -> conference participant email failed: ${result.error || 'unknown'}`,
                errorContext: {
                  step: 'conference-email-send',
                  participantEmailMasked: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
                  apiStatus: resp.status,
                },
              });
            }
          } catch (e) {
            logWithDetails('ERROR', 'Exception sending conference recording email', {
              documentId,
              participantEmail: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
              error: e.message
            });
            await logRecordingError(db, {
              source: 'webhook',
              recordingId,
              documentId,
              roomName,
              sessionType: 'conference',
              errorMessage: `Webhook conference email exception: ${e.message}`,
              errorContext: {
                step: 'conference-email-exception',
                participantEmailMasked: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
              },
            });
          }
        }
      } else if (!downloadLink) {
        logWithDetails('ERROR', 'Cannot send conference emails - no valid download link generated', {
          documentId,
          recordingId: recordingId
        });
        await logRecordingError(db, {
          source: 'webhook',
          recordingId,
          documentId,
          roomName,
          sessionType: 'conference',
          errorMessage: 'Cannot send conference emails - no valid download link generated',
          errorContext: { step: 'conference-no-download-link' },
        });
      }
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
  const roomName = webhookData.room?.name;
  const recording = webhookData.recording || {};
  const recordingId = recording.id || null;
  const { sessionType, documentId } = detectSessionType(roomName);
  const errorMessage = webhookData.error?.message || webhookData.error?.msg || 'Recording failed';
  const errorCode = webhookData.error?.code || webhookData.error?.type || null;

  try {
    logWithDetails('WARNING', 'Processing recording.error event', {
      room: roomName,
      recordingId,
      error: webhookData.error,
    });

    // Always persist the error in the centralized collection (even if we cannot
    // determine roomName/sessionType - that is exactly the case we want to see).
    await logRecordingError(db, {
      source: 'webhook',
      recordingId,
      documentId,
      roomName,
      sessionType,
      errorMessage,
      errorCode,
      errorContext: {
        step: 'recording.error-event',
        rawError: webhookData.error || null,
        recordingStatus: recording.status || null,
        webhookType: webhookData.type || null,
      },
    });

    if (!roomName) {
      logWithDetails('WARNING', 'Missing room name in recording error');
      return;
    }

    if (!documentId) {
      logWithDetails('WARNING', 'Could not extract documentId from room name', { roomName });
      return;
    }

    // Update the appropriate collection (consultation OR conference)
    const collection = sessionType === 'conference' ? 'ConferinteGrup' : 'RezervariConsultatii';
    const docRef = db.collection(collection).doc(documentId);

    await docRef.update({
      'recording.status': 'error',
      'recording.error': errorMessage,
      'recording.errorAt': new Date(),
      'recording.webhookProcessed': true,
    });

    logWithDetails('SUCCESS', 'Updated Firebase with recording error', {
      collection,
      documentId,
      error: errorMessage,
    });
  } catch (error) {
    logWithDetails('ERROR', 'Error processing recording.error event', {
      error: error.message,
      stack: error.stack,
      room: roomName,
    });
    // Best-effort secondary log so the failure of THIS handler is also visible
    await logRecordingError(db, {
      source: 'webhook',
      recordingId,
      documentId,
      roomName,
      sessionType,
      errorMessage: `recording.error handler crashed: ${error.message}`,
      errorContext: { step: 'recording.error-handler-crash', stack: error.stack },
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