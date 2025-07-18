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
const transporter = nodemailer.createTransporter({
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
    const { meetingCode, downloadURL } = req.body;

    logWithDetails('INFO', 'Processing notification request', {
      requestId,
      meetingCode,
      downloadURLLength: downloadURL ? downloadURL.length : 0,
      downloadURLDomain: downloadURL ? new URL(downloadURL).hostname : 'invalid',
      bodySize: JSON.stringify(req.body).length
    });

    if (!meetingCode || !downloadURL) {
      logWithDetails('ERROR', 'Validation failed - missing required fields', {
        requestId,
        hasMeetingCode: !!meetingCode,
        hasDownloadURL: !!downloadURL,
        receivedFields: Object.keys(req.body)
      });
      return res.status(400).json({ 
        success: false, 
        message: 'meetingCode and downloadURL are required' 
      });
    }

    // Validate URL format
    try {
      new URL(downloadURL);
    } catch (urlError) {
      logWithDetails('ERROR', 'Invalid download URL format', {
        requestId,
        downloadURL: downloadURL.substring(0, 100) + '...', // Log only first 100 chars
        urlError: urlError.message
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid download URL format' 
      });
    }

    logWithDetails('INFO', 'Validation passed, starting notification process', {
      requestId,
      meetingCode
    });

    // Get meeting details from Firestore
    logWithDetails('INFO', 'Fetching meeting details from Firestore', {
      requestId,
      meetingCode
    });

    const meetingDetails = await getMeetingDetails(meetingCode, requestId);
    
    if (!meetingDetails) {
      logWithDetails('WARNING', 'Meeting details not found, proceeding with generic notification', {
        requestId,
        meetingCode
      });
    } else {
      logWithDetails('SUCCESS', 'Meeting details found', {
        requestId,
        meetingCode,
        hasClientEmail: !!(meetingDetails.clientEmail || meetingDetails.email || meetingDetails.participantEmail),
        hasDate: !!meetingDetails.data,
        hasTime: !!meetingDetails.ora,
        hasName: !!meetingDetails.nume
      });
    }

    // Send email notification
    logWithDetails('INFO', 'Starting email notification process', {
      requestId,
      meetingCode
    });

    const emailResult = await sendRecordingEmail(meetingCode, downloadURL, meetingDetails, requestId);

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

    // Try different collections to find meeting details
    const collections = ['Consultations', 'ConferinteGrup', 'Meetings'];
    
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