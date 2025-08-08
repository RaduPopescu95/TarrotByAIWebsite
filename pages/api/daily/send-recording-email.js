import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

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

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
  
  console.log(`${emoji} [${level}] [API/daily-recording-email] ${timestamp} - ${message}`);
  if (Object.keys(data).length > 0) {
    console.log('📊 Data:', JSON.stringify(data, null, 2));
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    logWithDetails('WARNING', 'Invalid HTTP method', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId, recordingUrl, roomName, duration, linkExpires } = req.body;

    logWithDetails('INFO', 'Received request to send recording email', {
      documentId,
      roomName,
      duration,
      hasRecordingUrl: !!recordingUrl
    });

    // Validate required fields
    if (!documentId || !recordingUrl) {
      logWithDetails('ERROR', 'Missing required fields', { documentId, hasRecordingUrl: !!recordingUrl });
      return res.status(400).json({ error: 'documentId and recordingUrl are required' });
    }

    // Get reservation details from Firebase
    const reservationRef = db.collection('RezervariConsultatii').doc(documentId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      logWithDetails('ERROR', 'Reservation not found', { documentId });
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservationData = reservationDoc.data();
    
    logWithDetails('DEBUG', 'Retrieved reservation data', {
      documentId,
      hasEmail: !!reservationData.email,
      email: reservationData.email ? `${reservationData.email.substring(0, 3)}...@${reservationData.email.split('@')[1]}` : 'NO_EMAIL',
      nume: reservationData.nume || 'NO_NAME',
      prenume: reservationData.prenume || 'NO_PRENUME',
      hasReservationData: !!reservationData
    });
    
    const clientEmail = reservationData.email;
    const clientName = `${reservationData.nume} ${reservationData.prenume || ''}`.trim();

    if (!clientEmail) {
      logWithDetails('ERROR', 'Client email not found in reservation', { 
        documentId,
        availableFields: Object.keys(reservationData),
        reservationData: JSON.stringify(reservationData, null, 2)
      });
      return res.status(400).json({ error: 'Client email not found' });
    }

    logWithDetails('INFO', 'Found reservation details', {
      documentId,
      clientName,
      clientEmail: clientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email
      categorie: reservationData.categorie?.nume
    });

    // Send the recording email
    const emailResult = await sendDailyRecordingEmail({
      clientEmail,
      clientName,
      recordingUrl,
      roomName,
      duration,
      documentId,
      reservationData,
      linkExpires
    });

    if (emailResult.success) {
      logWithDetails('SUCCESS', 'Recording email sent successfully', {
        documentId,
        messageId: emailResult.messageId,
        clientEmail: clientEmail.replace(/(.{3}).*(@.*)/, '$1***$2')
      });

      // Update the reservation with email sent status
      await reservationRef.update({
        'recording.emailSent': true,
        'recording.emailSentAt': new Date(),
        'recording.downloadUrl': recordingUrl
      });

      res.status(200).json({
        success: true,
        message: 'Recording email sent successfully',
        messageId: emailResult.messageId
      });
    } else {
      logWithDetails('ERROR', 'Failed to send recording email', {
        documentId,
        error: emailResult.error
      });

      res.status(500).json({
        success: false,
        error: 'Failed to send recording email',
        details: emailResult.error
      });
    }

  } catch (error) {
    logWithDetails('ERROR', 'Unexpected error in handler', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function sendDailyRecordingEmail({ clientEmail, clientName, recordingUrl, roomName, duration, documentId, reservationData, linkExpires }) {
  try {
    logWithDetails('INFO', 'Creating email content for Daily recording', {
      clientName,
      roomName,
      duration,
      documentId
    });

    // Format duration
    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    };

    const formattedDuration = duration ? formatDuration(duration) : 'Necunoscut';
    
    // Calculate expiry information
    const expiryDate = linkExpires ? new Date(linkExpires * 1000) : null;
    const formattedExpiryDate = expiryDate ? expiryDate.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : null;
    const meetingDate = new Date().toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #667eea; margin: 0; font-size: 28px;">🎥 Înregistrarea Consultației</h1>
            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <!-- Welcome Message -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px;">Salut ${clientName}! 👋</h2>
            <p style="margin: 0; opacity: 0.9;">Înregistrarea consultației tale este gata pentru descărcare</p>
          </div>

          <!-- Recording Details -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">📋 Detalii înregistrare:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Data consultației:</td>
                <td style="padding: 8px 0; color: #333;">${meetingDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Durata:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDuration}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Tip consultație:</td>
                <td style="padding: 8px 0; color: #333;">${reservationData.categorie?.nume || 'Consultație video'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Cod înregistrare:</td>
                <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 12px;">${roomName || documentId}</td>
              </tr>
            </table>
          </div>

          <!-- Download Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${recordingUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;"
               target="_blank">
              📥 Descarcă Înregistrarea
            </a>
          </div>

          <!-- Instructions -->
          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1976d2; margin-top: 0; font-size: 16px;">📖 Instrucțiuni de descărcare</h3>
            <ul style="color: #333; margin: 10px 0; padding-left: 20px; line-height: 1.6;">
              <li>Apasă pe butonul de mai sus pentru a descărca înregistrarea</li>
              <li>Fișierul va fi descărcat în format video (MP4)</li>
              <li>Poți viziona înregistrarea pe orice dispozitiv</li>
              <li>Recomandăm să salvezi o copie pe dispozitivul tău</li>
            </ul>
          </div>

          <!-- Security Notice & Expiry Warning -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #856404; margin-top: 0; font-size: 14px;">🔒 Confidențialitate și Securitate</h4>
            <ul style="color: #856404; margin: 0 0 15px 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
              <li>Înregistrarea este stocată securizat și criptat</li>
              <li>Link-ul de descărcare este personal și confidențial</li>
              <li>Nu împărți acest link cu alte persoane</li>
              <li>Poți descărca fișierul de câte ori dorești în perioada validă</li>
            </ul>
            ${expiryDate ? `
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin-top: 15px;">
              <p style="color: #721c24; margin: 0; line-height: 1.6; font-size: 14px; font-weight: 600;">
                ⏰ <strong>ATENȚIE - LINK TEMPORAR!</strong><br/>
                Link-ul expiră pe <strong>${formattedExpiryDate}</strong> (în 12 ore).<br/>
                După această dată nu vei mai putea descărca înregistrarea.
              </p>
            </div>
            ` : `
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin-top: 15px;">
              <p style="color: #721c24; margin: 0; line-height: 1.6; font-size: 14px; font-weight: 600;">
                ⏰ <strong>ATENȚIE - LINK TEMPORAR!</strong><br/>
                Link-ul de descărcare expiră în <strong>12 ore</strong> de la primirea acestui email.<br/>
                Asigură-te că descarci înregistrarea cât mai curând!
              </p>
            </div>
            `}
          </div>

          <!-- Support -->
          <div style="background-color: #f0f8ff; border-left: 4px solid #4169e1; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #4169e1; margin-top: 0; font-size: 14px;">🆘 Ai nevoie de ajutor?</h4>
            <p style="color: #333; margin: 0; line-height: 1.6; font-size: 14px;">
              Dacă întâmpini probleme cu descărcarea sau ai întrebări despre consultație, 
              nu ezita să ne contactezi la <strong>webdynamicx@gmail.com</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
              Mulțumim că ai ales serviciile noastre! 🙏
            </p>
            <p style="color: #667eea; margin: 0; font-weight: 600;">
              Echipa Tarot by AI ✨
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Înregistrări Ședință - Cristina Zurba" <${process.env.EMAIL_USER}>`,
      to: clientEmail,
      subject: `🎥 Înregistrarea consultației tale este gata - ${reservationData.categorie?.nume || 'Video Call'}`,
      html: emailContent
    };

    logWithDetails('INFO', 'Sending Daily recording email via SMTP', {
      to: clientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
      from: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'not_configured',
      subject: mailOptions.subject
    });

    const smtpStartTime = Date.now();
    const result = await transporter.sendMail(mailOptions);
    const smtpTime = Date.now() - smtpStartTime;

    logWithDetails('SUCCESS', 'Daily recording email sent successfully', {
      messageId: result.messageId,
      recipientEmail: clientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
      smtpTime: `${smtpTime}ms`,
      emailSize: emailContent.length
    });

    return { 
      success: true, 
      messageId: result.messageId,
      recipientEmail: clientEmail
    };

  } catch (error) {
    logWithDetails('ERROR', 'Failed to send Daily recording email', {
      error: error.message,
      errorCode: error.code,
      smtpResponse: error.response,
      smtpCommand: error.command,
      clientEmail: clientEmail ? clientEmail.replace(/(.{3}).*(@.*)/, '$1***$2') : 'unknown'
    });
    return { success: false, error: error.message };
  }
} 