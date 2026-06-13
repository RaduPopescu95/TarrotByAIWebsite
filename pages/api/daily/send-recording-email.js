import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import { logRecordingError } from '../../../lib/recordingErrors';

function detectSessionType(roomName) {
  if (!roomName) return { sessionType: 'unknown', documentIdFromRoom: null };
  if (roomName.startsWith('consultation-')) {
    return { sessionType: 'consultation', documentIdFromRoom: roomName.replace('consultation-', '') };
  }
  if (roomName.startsWith('conference-')) {
    return { sessionType: 'conference', documentIdFromRoom: roomName.replace('conference-', '') };
  }
  return { sessionType: 'unknown', documentIdFromRoom: null };
}

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

function logWithDetails(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const prefix = `[${level}] [send-recording-email] ${timestamp}`;
  console.log(`${prefix} - ${message}`);
  if (Object.keys(data).length > 0) {
    console.log(`${prefix} DATA:`, JSON.stringify(data, null, 2));
  }
}

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export default async function handler(req, res) {
  const startTime = Date.now();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  logWithDetails('INFO', 'Handler invoked', {
    bodyKeys: req.body ? Object.keys(req.body) : [],
    bodyRaw: {
      documentId: req.body?.documentId || null,
      roomName: req.body?.roomName || null,
      duration: req.body?.duration || null,
      hasRecordingUrl: Boolean(req.body?.recordingUrl),
      recordingUrlPrefix: req.body?.recordingUrl ? req.body.recordingUrl.substring(0, 60) : null,
      linkExpires: req.body?.linkExpires || null,
    },
  });

  // 1. Check env vars
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    logWithDetails('ERROR', 'SMTP credentials missing in environment', {
      hasEMAIL_USER: Boolean(emailUser),
      hasEMAIL_PASS: Boolean(emailPass),
      EMAIL_USER_length: emailUser ? emailUser.length : 0,
      EMAIL_PASS_length: emailPass ? emailPass.length : 0,
    });
    const { sessionType, documentIdFromRoom } = detectSessionType(req.body?.roomName);
    await logRecordingError(db, {
      source: 'send-recording-email',
      documentId: req.body?.documentId || documentIdFromRoom,
      roomName: req.body?.roomName || null,
      sessionType,
      errorMessage: 'SMTP credentials missing (EMAIL_USER or EMAIL_PASS)',
      errorContext: {
        step: 'env-check',
        hasEMAIL_USER: Boolean(emailUser),
        hasEMAIL_PASS: Boolean(emailPass),
      },
    });
    return res.status(500).json({
      success: false,
      error: 'Email service not configured (missing EMAIL_USER or EMAIL_PASS)',
    });
  }

  logWithDetails('DEBUG', 'SMTP env vars present', {
    EMAIL_USER: emailUser.replace(/(.{3}).*(@.*)/, '$1***$2'),
    EMAIL_PASS_length: emailPass.length,
  });

  // 2. Parse and validate body
  const { documentId, recordingUrl, roomName, duration, linkExpires } = req.body || {};

  if (!documentId || !recordingUrl) {
    logWithDetails('ERROR', 'Missing required fields in body', {
      hasDocumentId: Boolean(documentId),
      hasRecordingUrl: Boolean(recordingUrl),
    });
    return res.status(400).json({ error: 'documentId and recordingUrl are required' });
  }

  // 3. Fetch reservation from Firestore
  let reservationData;
  try {
    logWithDetails('DEBUG', 'Fetching reservation from Firestore', { documentId });
    const reservationRef = db.collection('RezervariConsultatii').doc(documentId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      logWithDetails('ERROR', 'Reservation document does NOT exist in Firestore', { documentId });
      return res.status(404).json({ error: 'Reservation not found' });
    }

    reservationData = reservationDoc.data();
    logWithDetails('DEBUG', 'Reservation fetched successfully', {
      documentId,
      fields: Object.keys(reservationData),
      hasEmail: Boolean(reservationData.email),
      email: reservationData.email
        ? `${reservationData.email.substring(0, 3)}...@${reservationData.email.split('@')[1] || '?'}`
        : 'MISSING',
      nume: reservationData.nume || 'MISSING',
      prenume: reservationData.prenume || 'MISSING',
      categorie: reservationData.categorie?.nume || 'MISSING',
    });
  } catch (firestoreError) {
    logWithDetails('ERROR', 'Firestore read FAILED', {
      documentId,
      errorMessage: firestoreError.message,
      errorCode: firestoreError.code,
      errorStack: firestoreError.stack,
    });
    await logRecordingError(db, {
      source: 'send-recording-email',
      documentId,
      roomName: roomName || null,
      sessionType: detectSessionType(roomName).sessionType,
      errorMessage: `Firestore read failed: ${firestoreError.message}`,
      errorCode: firestoreError.code || null,
      errorContext: { step: 'firestore-read' },
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to read reservation from database',
      details: firestoreError.message,
    });
  }

  // 4. Validate client email
  const clientEmail = reservationData.email;
  const clientName = `${reservationData.nume || ''} ${reservationData.prenume || ''}`.trim() || 'Client';

  if (!clientEmail) {
    logWithDetails('ERROR', 'Client email NOT found in reservation data', {
      documentId,
      availableFields: Object.keys(reservationData),
    });
    return res.status(400).json({ error: 'Client email not found in reservation' });
  }

  // 5. Create transporter and verify SMTP connection
  const transporter = createTransporter();
  if (!transporter) {
    logWithDetails('ERROR', 'Transporter creation failed (env vars disappeared mid-request?)');
    return res.status(500).json({ success: false, error: 'Email transporter unavailable' });
  }

  try {
    logWithDetails('DEBUG', 'Verifying SMTP connection...');
    await transporter.verify();
    logWithDetails('DEBUG', 'SMTP connection verified OK');
  } catch (verifyError) {
    logWithDetails('ERROR', 'SMTP verify() FAILED - cannot connect to Gmail', {
      errorMessage: verifyError.message,
      errorCode: verifyError.code,
      errorCommand: verifyError.command,
      errorResponse: verifyError.response,
      errorResponseCode: verifyError.responseCode,
      errorStack: verifyError.stack,
    });
    await logRecordingError(db, {
      source: 'send-recording-email',
      documentId,
      roomName: roomName || null,
      sessionType: detectSessionType(roomName).sessionType,
      errorMessage: `SMTP verify() failed: ${verifyError.message}`,
      errorCode: verifyError.code || null,
      errorContext: {
        step: 'smtp-verify',
        responseCode: verifyError.responseCode || null,
        response: verifyError.response || null,
        command: verifyError.command || null,
      },
    });
    return res.status(500).json({
      success: false,
      error: 'SMTP connection failed',
      details: verifyError.message,
    });
  }

  // 6. Send the email
  try {
    const emailResult = await sendDailyRecordingEmail(transporter, {
      clientEmail,
      clientName,
      recordingUrl,
      roomName,
      duration,
      documentId,
      reservationData,
      linkExpires,
    });

    if (emailResult.success) {
      logWithDetails('SUCCESS', 'Email sent, updating Firestore', {
        documentId,
        messageId: emailResult.messageId,
        durationMs: Date.now() - startTime,
      });

      try {
        const reservationRef = db.collection('RezervariConsultatii').doc(documentId);
        await reservationRef.update({
          'recording.emailSent': true,
          'recording.emailSentAt': new Date(),
          'recording.downloadUrl': recordingUrl,
        });
      } catch (updateError) {
        logWithDetails('WARNING', 'Email sent but Firestore update failed (non-fatal)', {
          documentId,
          errorMessage: updateError.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Recording email sent successfully',
        messageId: emailResult.messageId,
      });
    }

    logWithDetails('ERROR', 'sendDailyRecordingEmail returned failure', {
      documentId,
      error: emailResult.error,
      durationMs: Date.now() - startTime,
    });

    await logRecordingError(db, {
      source: 'send-recording-email',
      documentId,
      roomName: roomName || null,
      sessionType: detectSessionType(roomName).sessionType,
      errorMessage: `sendMail failed: ${emailResult.error || 'unknown'}`,
      errorCode: emailResult.errorCode || null,
      errorContext: {
        step: 'send-mail',
        responseCode: emailResult.responseCode || null,
        smtpResponse: emailResult.smtpResponse || null,
        rejected: emailResult.rejected || null,
      },
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send recording email',
      details: emailResult.error,
    });
  } catch (sendError) {
    logWithDetails('ERROR', 'Unexpected exception during email send', {
      documentId,
      errorType: typeof sendError,
      errorMessage: sendError?.message || String(sendError),
      errorCode: sendError?.code,
      errorStack: sendError?.stack,
      durationMs: Date.now() - startTime,
    });

    await logRecordingError(db, {
      source: 'send-recording-email',
      documentId,
      roomName: roomName || null,
      sessionType: detectSessionType(roomName).sessionType,
      errorMessage: `Unexpected exception during email send: ${sendError?.message || String(sendError)}`,
      errorCode: sendError?.code || null,
      errorContext: { step: 'send-mail-exception' },
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: sendError?.message || 'Unknown error',
    });
  }
}

async function sendDailyRecordingEmail(transporter, { clientEmail, clientName, recordingUrl, roomName, duration, documentId, reservationData, linkExpires }) {
  logWithDetails('INFO', 'Building email content', { clientName, roomName, duration, documentId });

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formattedDuration = duration ? formatDuration(duration) : 'Necunoscut';
  const expiryDate = linkExpires ? new Date(linkExpires * 1000) : null;
  const formattedExpiryDate = expiryDate
    ? expiryDate.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  const meetingDate = new Date().toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #667eea; margin: 0; font-size: 28px;">Inregistrarea Consultatiei</h1>
          <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px;"></div>
        </div>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 10px 0; font-size: 20px;">Salut ${clientName}!</h2>
          <p style="margin: 0; opacity: 0.9;">Inregistrarea consultatiei tale este gata pentru descarcare</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #333; margin-top: 0; font-size: 16px;">Detalii inregistrare:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; font-weight: 600;">Data consultatiei:</td><td style="padding: 8px 0; color: #333;">${meetingDate}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-weight: 600;">Durata:</td><td style="padding: 8px 0; color: #333;">${formattedDuration}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-weight: 600;">Tip consultatie:</td><td style="padding: 8px 0; color: #333;">${reservationData.categorie?.nume || 'Consultatie video'}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-weight: 600;">Cod inregistrare:</td><td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 12px;">${roomName || documentId}</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recordingUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);" target="_blank">
            Descarca Inregistrarea
          </a>
        </div>
        <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #1976d2; margin-top: 0; font-size: 16px;">Instructiuni de descarcare</h3>
          <ul style="color: #333; margin: 10px 0; padding-left: 20px; line-height: 1.6;">
            <li>Apasa pe butonul de mai sus pentru a descarca inregistrarea</li>
            <li>Fisierul va fi descarcat in format video (MP4)</li>
            <li>Poti viziona inregistrarea pe orice dispozitiv</li>
            <li>Recomandam sa salvezi o copie pe dispozitivul tau</li>
          </ul>
        </div>
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
          <h4 style="color: #856404; margin-top: 0; font-size: 14px;">Confidentialitate si Securitate</h4>
          <ul style="color: #856404; margin: 0 0 15px 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
            <li>Inregistrarea este stocata securizat si criptat</li>
            <li>Link-ul de descarcare este personal si confidential</li>
            <li>Nu imparti acest link cu alte persoane</li>
            <li>Poti descarca fisierul de cate ori doresti in perioada valida</li>
          </ul>
          ${expiryDate ? `
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin-top: 15px;">
            <p style="color: #721c24; margin: 0; line-height: 1.6; font-size: 14px; font-weight: 600;">
              ATENTIE - LINK TEMPORAR!<br/>
              Link-ul expira pe <strong>${formattedExpiryDate}</strong> (in 12 ore).<br/>
              Dupa aceasta data nu vei mai putea descarca inregistrarea.
            </p>
          </div>
          ` : `
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin-top: 15px;">
            <p style="color: #721c24; margin: 0; line-height: 1.6; font-size: 14px; font-weight: 600;">
              ATENTIE - LINK TEMPORAR!<br/>
              Link-ul de descarcare expira in <strong>12 ore</strong> de la primirea acestui email.<br/>
              Asigura-te ca descarci inregistrarea cat mai curand!
            </p>
          </div>
          `}
        </div>
        <div style="background-color: #f0f8ff; border-left: 4px solid #4169e1; padding: 20px; margin-bottom: 25px;">
          <h4 style="color: #4169e1; margin-top: 0; font-size: 14px;">Ai nevoie de ajutor?</h4>
          <p style="color: #333; margin: 0; line-height: 1.6; font-size: 14px;">
            Daca intampini probleme cu descarcarea sau ai intrebari despre consultatie,
            nu ezita sa ne contactezi la <strong>webdynamicx@gmail.com</strong>
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Multumim ca ai ales serviciile noastre!</p>
          <p style="color: #667eea; margin: 0; font-weight: 600;">Echipa Tarot by AI</p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Inregistrari Sedinta - Cristina Zurba" <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `Inregistrarea consultatiei tale este gata - ${reservationData.categorie?.nume || 'Video Call'}`,
    html: emailContent,
  };

  logWithDetails('INFO', 'Calling transporter.sendMail()', {
    to: clientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
    from: mailOptions.from,
    subject: mailOptions.subject,
  });

  const smtpStartTime = Date.now();

  try {
    const result = await transporter.sendMail(mailOptions);
    const smtpTime = Date.now() - smtpStartTime;

    logWithDetails('SUCCESS', 'sendMail() resolved OK', {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response,
      smtpTimeMs: smtpTime,
    });

    return { success: true, messageId: result.messageId };
  } catch (smtpError) {
    const smtpTime = Date.now() - smtpStartTime;

    logWithDetails('ERROR', 'sendMail() THREW an exception', {
      errorMessage: smtpError.message,
      errorCode: smtpError.code,
      errorCommand: smtpError.command,
      errorResponse: smtpError.response,
      errorResponseCode: smtpError.responseCode,
      rejected: smtpError.rejected,
      smtpTimeMs: smtpTime,
      errorStack: smtpError.stack,
    });

    return {
      success: false,
      error: smtpError.message,
      errorCode: smtpError.code || null,
      responseCode: smtpError.responseCode || null,
      smtpResponse: smtpError.response || null,
      rejected: smtpError.rejected || null,
    };
  }
}
