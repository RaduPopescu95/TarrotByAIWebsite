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
  
  console.log(`${emoji} [${level}] [API/send-notification] ${timestamp} - ${message}`);
  if (Object.keys(data).length > 0) {
    console.log('📊 Data:', JSON.stringify(data, null, 2));
  }
}

export default async function handler(req, res) {
  const requestStartTime = Date.now();
  const requestId = `notif_${requestStartTime}_${Math.random().toString(36).substr(2, 6)}`;
  
  logWithDetails('INFO', 'Notification API request received', {
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
    const { meetingCode, recipientEmail, duration, downloadURL } = req.body;

    logWithDetails('INFO', 'Processing recording notification request', {
      requestId,
      meetingCode,
      recipientEmail: recipientEmail ? recipientEmail.substring(0, 20) + '...' : 'missing',
      duration: duration || 'unknown',
      hasDownloadURL: !!downloadURL,
      bodySize: JSON.stringify(req.body).length
    });

    if (!meetingCode || !recipientEmail) {
      logWithDetails('ERROR', 'Validation failed - missing required fields', {
        requestId,
        hasMeetingCode: !!meetingCode,
        hasRecipientEmail: !!recipientEmail,
        receivedFields: Object.keys(req.body)
      });
      return res.status(400).json({ 
        success: false, 
        message: 'meetingCode and recipientEmail are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      logWithDetails('ERROR', 'Invalid email format', {
        requestId,
        recipientEmail: recipientEmail.substring(0, 20) + '...'
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    logWithDetails('INFO', 'Validation passed, starting notification process', {
      requestId,
      meetingCode,
      duration
    });

    // Always send email with link to public recordings access page
    logWithDetails('INFO', 'Sending recording access email with public page link', {
        requestId,
        meetingCode,
        recipientEmail: recipientEmail.substring(0, 20) + '...',
      hasDownloadURL: !!downloadURL
      });

      // Try to fetch meeting details for nicer email (not mandatory)
      const meetingDetails = await getMeetingDetails(meetingCode, requestId);
    const emailResult = await sendRecordingAccessEmail(meetingCode, recipientEmail, meetingDetails, requestId);

    const processingTime = Date.now() - requestStartTime;

    if (emailResult.success) {
      logWithDetails('SUCCESS', 'Recording notification sent successfully', {
        requestId,
        meetingCode,
        emailMessageId: emailResult.messageId,
        recipientEmail: emailResult.recipientEmail,
        processingTime: `${processingTime}ms`
      });
      res.status(200).json({ 
        success: true, 
        message: 'Recording notification sent successfully',
        requestId,
        processingTime
      });
    } else {
      logWithDetails('ERROR', 'Failed to send notification email', {
        requestId,
        meetingCode,
        emailError: emailResult.error,
        processingTime: `${processingTime}ms`
      });
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send notification email',
        requestId
      });
    }

  } catch (error) {
    const processingTime = Date.now() - requestStartTime;
    
    logWithDetails('ERROR', 'Failed to process notification request', {
      requestId,
      error: error.message,
      errorStack: error.stack,
      processingTime: `${processingTime}ms`,
      emailConfig: {
        emailUser: process.env.EMAIL_USER ? '[SET]' : '[NOT SET]',
        emailPass: process.env.EMAIL_PASS ? '[SET]' : '[NOT SET]'
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

async function getMeetingDetails(meetingCode, requestId) {
  try {
    logWithDetails('INFO', 'Starting meeting details lookup', {
      requestId,
      meetingCode,
      searchMethod: 'direct_document_lookup'
    });

    // Check if this is a group conference meeting code
    if (meetingCode.startsWith('group_')) {
      const conferenceId = meetingCode.replace('group_', '');
      
      logWithDetails('INFO', 'Processing group conference meeting code', {
        requestId,
        originalMeetingCode: meetingCode,
        extractedConferenceId: conferenceId
      });

      // Look specifically in ConferinteGrup collection
      const conferenceDoc = await db.collection('ConferinteGrup').doc(conferenceId).get();
      
      if (conferenceDoc.exists) {
        const data = conferenceDoc.data();
        logWithDetails('SUCCESS', `Group conference details found`, {
          requestId,
          collection: 'ConferinteGrup',
          documentId: conferenceId,
          hasTitle: !!data.titlu,
          hasDate: !!data.dataInceput,
          hasTime: !!data.oraInceput,
          hasParticipants: !!(data.participanti && data.participanti.length > 0),
          participantCount: data.participanti ? data.participanti.length : 0,
          dataKeys: Object.keys(data)
        });
        return data;
      } else {
        logWithDetails('WARNING', `Group conference not found with ID: ${conferenceId}`, {
          requestId,
          conferenceId,
          originalMeetingCode: meetingCode
        });
      }
    }

    // Try different collections for regular meetings
    const collections = ['Consultations', 'RezervariConsultatii', 'Meetings'];
    
    for (const collectionName of collections) {
      logWithDetails('DEBUG', `Checking collection: ${collectionName}`, {
        requestId,
        collection: collectionName,
        documentId: meetingCode
      });

      const doc = await db.collection(collectionName).doc(meetingCode).get();
      
      if (doc.exists) {
        const data = doc.data();
        logWithDetails('SUCCESS', `Meeting details found in ${collectionName}`, {
          requestId,
          collection: collectionName,
          documentId: meetingCode,
          hasEmail: !!(data.clientEmail || data.email || data.participantEmail),
          hasDate: !!data.data,
          hasTime: !!data.ora,
          hasName: !!data.nume,
          dataKeys: Object.keys(data),
          dataSize: JSON.stringify(data).length
        });
        return data;
      } else {
        logWithDetails('DEBUG', `Document not found in ${collectionName}`, {
          requestId,
          collection: collectionName,
          documentId: meetingCode
        });
      }
    }

    logWithDetails('INFO', 'Direct lookup failed, trying query-based search', {
      requestId,
      meetingCode,
      searchMethod: 'query_based_lookup'
    });

    // Try to find by meeting code in various fields
    const consultationsQuery = await db.collection('Consultations')
      .where('meetingCode', '==', meetingCode)
      .limit(1)
      .get();
    
    if (!consultationsQuery.empty) {
      const data = consultationsQuery.docs[0].data();
      logWithDetails('SUCCESS', 'Meeting details found via query', {
        requestId,
        collection: 'Consultations',
        field: 'meetingCode',
        documentId: consultationsQuery.docs[0].id,
        hasEmail: !!(data.clientEmail || data.email || data.participantEmail),
        hasDate: !!data.data,
        hasTime: !!data.ora,
        hasName: !!data.nume
      });
      return data;
    }

    logWithDetails('WARNING', 'Meeting details not found in any collection', {
      requestId,
      meetingCode,
      searchedCollections: collections,
      searchedQueries: ['Consultations.meetingCode']
    });

    return null;
  } catch (error) {
    logWithDetails('ERROR', 'Error retrieving meeting details', {
      requestId,
      meetingCode,
      error: error.message,
      errorCode: error.code,
      errorStack: error.stack
    });
    return null;
  }
}

async function sendRecordingEmail(meetingCode, downloadURL, meetingDetails, requestId) {
  try {
    logWithDetails('INFO', 'Starting email preparation', {
      requestId,
      meetingCode,
      hasMeetingDetails: !!meetingDetails,
      downloadURLDomain: new URL(downloadURL).hostname
    });

    // Determine recipient email
    let recipientEmail = 'no-reply@cristinazurba.com'; // fallback
    
    if (meetingDetails) {
      const possibleEmails = [
        meetingDetails.clientEmail,
        meetingDetails.email,
        meetingDetails.participantEmail
      ].filter(Boolean);

      if (possibleEmails.length > 0) {
        recipientEmail = possibleEmails[0];
        logWithDetails('INFO', 'Recipient email determined from meeting details', {
          requestId,
          totalPossibleEmails: possibleEmails.length,
          selectedEmail: recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'), // Partially mask email
          emailSources: {
            clientEmail: !!meetingDetails.clientEmail,
            email: !!meetingDetails.email,
            participantEmail: !!meetingDetails.participantEmail
          }
        });
      } else {
        logWithDetails('WARNING', 'No email found in meeting details, using fallback', {
          requestId,
          fallbackEmail: recipientEmail,
          meetingDetailsKeys: Object.keys(meetingDetails)
        });
      }
    } else {
      logWithDetails('WARNING', 'No meeting details available, using fallback email', {
        requestId,
        fallbackEmail: recipientEmail
      });
    }

    // Create email content
    const subject = '🎥 Înregistrarea consultației este gata!';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .download-btn { display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .download-btn:hover { background: #0056b3; }
          .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎥 Înregistrarea este gata!</h1>
            <p>Consultația ta a fost înregistrată cu succes</p>
          </div>
          
          <div class="content">
            <div class="info-box">
              <h3>📋 Detalii înregistrare:</h3>
              <p><strong>Cod meeting:</strong> ${meetingCode}</p>
              ${meetingDetails?.data ? `<p><strong>Data:</strong> ${new Date(meetingDetails.data).toLocaleDateString('ro-RO')}</p>` : ''}
              ${meetingDetails?.ora ? `<p><strong>Ora:</strong> ${meetingDetails.ora}</p>` : ''}
              ${meetingDetails?.nume ? `<p><strong>Client:</strong> ${meetingDetails.nume}</p>` : ''}
              <p><strong>Data procesării:</strong> ${new Date().toLocaleDateString('ro-RO')} la ${new Date().toLocaleTimeString('ro-RO')}</p>
            </div>

            <div style="text-align: center;">
              <a href="${downloadURL}" class="download-btn">
                📥 Descarcă Înregistrarea
              </a>
            </div>

            <div class="info-box">
              <h3>ℹ️ Informații importante:</h3>
              <ul>
                <li>Înregistrarea este disponibilă în format video (.webm)</li>
                <li>Link-ul va fi activ timp de <strong>30 de zile</strong></li>
                <li>Recomandăm să descarci fișierul cât mai curând</li>
                <li>Pentru suport tehnic, contactează-ne la ${process.env.EMAIL_USER}</li>
              </ul>
            </div>

            <p>Mulțumim că folosești serviciile noastre!</p>
            <p><strong>Echipa Cristina Zurba</strong></p>
          </div>

          <div class="footer">
            <p>Acest email a fost trimis automat pentru înregistrarea ${meetingCode}</p>
            <p>© ${new Date().getFullYear()} Cristina Zurba - Toate drepturile rezervate</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Înregistrarea consultației este gata!

Cod meeting: ${meetingCode}
${meetingDetails?.data ? `Data: ${new Date(meetingDetails.data).toLocaleDateString('ro-RO')}` : ''}
${meetingDetails?.ora ? `Ora: ${meetingDetails.ora}` : ''}

Pentru a descărca înregistrarea, accesează: ${downloadURL}

Informații importante:
- Link-ul va fi activ timp de 30 de zile
- Recomandăm să descarci fișierul cât mai curând
- Pentru suport tehnic: ${process.env.EMAIL_USER}

Mulțumim!
Echipa Cristina Zurba
    `;

    const mailOptions = {
      from: `"Cristina Zurba" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      priority: 'normal'
    };

    logWithDetails('INFO', 'Sending email via transporter', {
      requestId,
      recipientEmail: recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email
      subject: mailOptions.subject,
      htmlContentLength: htmlContent.length,
      textContentLength: textContent.length,
      smtpService: 'gmail'
    });

    // Send the email
    const emailStartTime = Date.now();
    const info = await transporter.sendMail(mailOptions);
    const emailDuration = Date.now() - emailStartTime;
    
    logWithDetails('SUCCESS', 'Email sent successfully', {
      requestId,
      recipientEmail: recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email
      messageId: info.messageId,
      emailDuration: `${emailDuration}ms`,
      response: info.response,
      accepted: info.accepted?.length || 0,
      rejected: info.rejected?.length || 0,
      pending: info.pending?.length || 0
    });
    
    return { 
      success: true, 
      messageId: info.messageId,
      recipientEmail: recipientEmail
    };

  } catch (error) {
    logWithDetails('ERROR', 'Failed to send email', {
      requestId,
      error: error.message,
      errorCode: error.code,
      errorStack: error.stack,
      smtpResponse: error.response,
      smtpCommand: error.command,
      recipientEmail: recipientEmail ? recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2') : 'unknown'
    });
    return { success: false, error: error.message };
  }
}

async function sendSimpleRecordingEmail(meetingCode, recipientEmail, duration, requestId) {
  try {
    logWithDetails('INFO', 'Preparing simple recording email', {
      requestId,
      meetingCode,
      recipientEmail: recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
      duration
    });

    const formatDuration = (seconds) => {
      if (!seconds) return 'N/A';
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins} min ${secs} sec`;
    };

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #667eea; margin: 0; font-size: 28px;">🎥 Înregistrare Consultație</h1>
            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px;">Consultația dvs. a fost înregistrată</h2>
            <p style="margin: 0; opacity: 0.9;">Înregistrarea este acum disponibilă pentru descărcare</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">📋 Detalii înregistrare:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Cod Meeting:</td>
                <td style="padding: 8px 0; color: #333;">${meetingCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Durată:</td>
                <td style="padding: 8px 0; color: #333;">${formatDuration(duration)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Data înregistrării:</td>
                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleDateString('ro-RO')}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1976d2; margin-top: 0; font-size: 16px;">📥 Descărcare înregistrare</h3>
            <p style="color: #333; margin: 10px 0; line-height: 1.6;">
              Înregistrarea va fi disponibilă pentru descărcare în aproximativ <strong>10-15 minute</strong> 
              după finalizarea consultației. Procesarea este în curs...
            </p>
            <p style="color: #666; margin: 0; font-size: 14px;">
              Veți primi un email suplimentar cu link-ul direct de descărcare când procesarea va fi completă.
            </p>
          </div>

          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #856404; margin-top: 0; font-size: 14px;">🔒 Confidențialitate și Securitate</h4>
            <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Înregistrarea este stocată securizat și criptat</li>
              <li>Accesul este disponibil doar pentru participanții autorizați</li>
              <li>Link-ul de descărcare va fi valid timp de <strong>30 de zile</strong></li>
              <li>După această perioadă, înregistrarea va fi ștearsă automat</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
              Dacă aveți întrebări, nu ezitați să ne contactați.
            </p>
            <p style="color: #667eea; margin: 0; font-weight: 600;">
              Echipa Tarot by AI ✨
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Tarot by AI - Înregistrări" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: '🎥 Înregistrarea consultației dvs. este pregătită',
      html: emailContent
    };

    logWithDetails('INFO', 'Sending simple recording email via SMTP', {
      requestId,
      to: recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
      from: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'not_configured',
      subject: mailOptions.subject
    });

    const smtpStartTime = Date.now();
    const result = await transporter.sendMail(mailOptions);
    const smtpTime = Date.now() - smtpStartTime;

    logWithDetails('SUCCESS', 'Simple recording email sent successfully', {
      requestId,
      messageId: result.messageId,
      recipientEmail: recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
      smtpTime: `${smtpTime}ms`,
      emailSize: emailContent.length
    });

    return { 
      success: true, 
      messageId: result.messageId,
      recipientEmail: recipientEmail
    };

  } catch (error) {
    logWithDetails('ERROR', 'Failed to send simple recording email', {
      requestId,
      error: error.message,
      errorCode: error.code,
      smtpResponse: error.response,
      smtpCommand: error.command,
      recipientEmail: recipientEmail ? recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2') : 'unknown'
    });
    return { success: false, error: error.message };
  }
}

async function sendRecordingAccessEmail(meetingCode, recipientEmail, meetingDetails, requestId) {
  try {
    logWithDetails('INFO', 'Preparing recording access email', {
      requestId,
      meetingCode,
      recipientEmail: recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
      hasMeetingDetails: !!meetingDetails
    });

    // Create access link to public page with email parameter
    const accessLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/inregistrari-acces?email=${encodeURIComponent(recipientEmail)}`;
    
    // Determine meeting type
    const isGroupConference = meetingCode.startsWith('group_');
    const meetingType = isGroupConference ? 'Conferință de Grup' : 'Consultație Individuală';
    
    // Get meeting title/name
    let meetingTitle = 'Sesiunea dvs.';
    if (meetingDetails) {
      if (isGroupConference) {
        meetingTitle = meetingDetails.titlu || 'Conferința de grup';
      } else {
        meetingTitle = `Consultația cu ${meetingDetails.nume || 'Cristina'}`;
      }
    }

    // Prepare email content
    const emailHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; line-height: 1.6;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 Înregistrarea este gata!</h1>
          <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">Înregistrarea pentru ${meetingTitle} este disponibilă pentru descărcare</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <!-- Meeting Info -->
          <div style="background-color: #f8f9ff; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0; margin-bottom: 15px; display: flex; align-items: center; font-size: 18px;">
              📅 Detalii sesiune
            </h3>
            <div style="display: grid; gap: 8px;">
              <p style="margin: 0; color: #333;"><strong>Tip:</strong> ${meetingType}</p>
              <p style="margin: 0; color: #333;"><strong>Titlu:</strong> ${meetingTitle}</p>
              ${(() => {
                if (isGroupConference && meetingDetails?.dataInceput) {
                  return `<p style="margin: 0; color: #333;"><strong>Data:</strong> ${new Date(meetingDetails.dataInceput).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`;
                } else if (!isGroupConference && meetingDetails?.data) {
                  return `<p style="margin: 0; color: #333;"><strong>Data:</strong> ${new Date(meetingDetails.data).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`;
                }
                return '';
              })()}
              ${(() => {
                if (isGroupConference && meetingDetails?.oraInceput) {
                  return `<p style="margin: 0; color: #333;"><strong>Ora:</strong> ${meetingDetails.oraInceput}</p>`;
                } else if (!isGroupConference && meetingDetails?.ora) {
                  return `<p style="margin: 0; color: #333;"><strong>Ora:</strong> ${meetingDetails.ora}</p>`;
                }
                return '';
              })()}
            </div>
          </div>

          <!-- Access Instructions -->
          <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 22px;">📥 Accesați înregistrarea</h3>
            <p style="margin: 0 0 25px 0; opacity: 0.95; font-size: 16px;">
              Pentru a descărca înregistrarea, accesați pagina de mai jos și introduceți adresa dvs. de email.
            </p>
            
            <a href="${accessLink}" 
               style="display: inline-block; background-color: rgba(255,255,255,0.2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; border: 2px solid rgba(255,255,255,0.3); transition: all 0.3s ease;">
              🔗 Accesează Înregistrările
            </a>
          </div>

          <!-- Email Pre-filled Info -->
          <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="width: 24px; height: 24px; background-color: #2196f3; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                <span style="color: white; font-size: 12px; font-weight: bold;">ℹ</span>
              </div>
              <h4 style="margin: 0; color: #1976d2; font-size: 16px;">Instrucțiuni de acces</h4>
            </div>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1565c0;">
              <li style="margin-bottom: 8px;">Faceți click pe butonul de mai sus pentru a accesa pagina de înregistrări</li>
              <li style="margin-bottom: 8px;">Introduceți adresa de email: <strong>${recipientEmail}</strong></li>
              <li style="margin-bottom: 8px;">Veți vedea toate înregistrările disponibile pentru această adresă</li>
              <li style="margin-bottom: 0;">Faceți click pe "Descarcă" pentru fiecare înregistrare dorită</li>
            </ul>
          </div>

          <!-- Processing Info -->
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="width: 24px; height: 24px; background-color: #ffc107; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                <span style="color: white; font-size: 12px; font-weight: bold;">⏳</span>
              </div>
              <h4 style="margin: 0; color: #856404; font-size: 16px;">Timp de procesare</h4>
            </div>
            <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">
              Dacă înregistrarea încă se procesează, aceasta va fi disponibilă în câteva minute. 
              Reîmprospătați pagina pentru a verifica statusul actualizat.
            </p>
          </div>

           <!-- Disclaimer -->
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
            
              <h4 style="margin: 0; color: #856404; font-size: 16px;">Timp de stocare</h4>
            </div>
            <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">
              Inregistrarea va fi stocata timp de 14 zile. Dupa aceasta perioada va fi ștearsă automat și nu va mai fi accesibila.
            </p>
          </div>

          <!-- Support Section -->
          <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #eee;">
            <h4 style="color: #555; margin-bottom: 10px;">Aveți întrebări?</h4>
            <p style="color: #777; margin: 0; font-size: 14px;">
              Pentru suport tehnic, răspundeți la acest email sau contactați-ne direct.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            © ${new Date().getFullYear()} Cristina Zurba. Toate drepturile rezervate.
          </p>
       
        </div>
      </div>
    `;

    const emailText = `
Înregistrarea este gata!

Înregistrarea pentru ${meetingTitle} este disponibilă pentru descărcare.

Pentru a accesa înregistrarea:
1. Accesați: ${accessLink}
2. Introduceți adresa de email: ${recipientEmail}
3. Veți vedea toate înregistrările disponibile
4. Faceți click pe "Descarcă" pentru fiecare înregistrare

Dacă înregistrarea încă se procesează, aceasta va fi disponibilă în câteva minute.

© ${new Date().getFullYear()} Cristina Zurba
    `;

    const mailOptions = {
      from: `"Cristina Zurba - Înregistrări" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `🎥 Înregistrarea pentru ${meetingTitle} este gata!`,
      text: emailText,
      html: emailHTML,
      priority: 'normal',
      headers: {
        'X-Recording-Type': meetingType,
        'X-Meeting-Code': meetingCode,
        'X-Request-ID': requestId
      }
    };

    logWithDetails('INFO', 'Sending recording access email via SMTP', {
      requestId,
      emailSize: emailHTML.length,
      subjectLength: mailOptions.subject.length,
      recipientEmail: recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2')
    });

    const info = await transporter.sendMail(mailOptions);

    logWithDetails('SUCCESS', 'Recording access email sent successfully', {
      requestId,
      messageId: info.messageId,
      recipientEmail: recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
      smtpResponse: info.response
    });

    return {
      success: true,
      messageId: info.messageId,
      recipientEmail: recipientEmail
    };

  } catch (error) {
    logWithDetails('ERROR', 'Failed to send recording access email', {
      requestId,
      error: error.message,
      errorCode: error.code,
      smtpResponse: error.response,
      smtpCommand: error.command,
      recipientEmail: recipientEmail ? recipientEmail.replace(/(.{3}).*(@.*)/, '$1***$2') : 'unknown'
    });
    return { success: false, error: error.message };
  }
} 