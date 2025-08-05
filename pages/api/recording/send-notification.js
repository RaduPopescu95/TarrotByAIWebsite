// Simple Recording Notification API
// Sends email notifications for both Agora Cloud and Browser recordings

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  console.log('📧 [NOTIFICATION API] === API CALLED ===');
  console.log('📧 [NOTIFICATION API] Method:', req.method);
  console.log('📧 [NOTIFICATION API] Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ [NOTIFICATION API] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      meetingCode, 
      recipientEmail, 
      downloadURL, 
      duration, 
      recordingMethod = 'Browser Recording' 
    } = req.body;

    console.log('📧 [NOTIFICATION API] Processing notification:', {
      meetingCode,
      recipientEmail: recipientEmail ? recipientEmail.substring(0, 20) + '...' : 'missing',
      hasDownloadURL: !!downloadURL,
      duration,
      recordingMethod
    });

    // Validate required fields
    if (!meetingCode || !recipientEmail) {
      console.log('❌ [NOTIFICATION API] Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'meetingCode and recipientEmail are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.log('❌ [NOTIFICATION API] Invalid email format');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Send email notification
    const emailResult = await sendRecordingEmail({
      meetingCode,
      recipientEmail,
      downloadURL,
      duration,
      recordingMethod
    });

    if (emailResult.success) {
      console.log('✅ [NOTIFICATION API] Email sent successfully');
      res.status(200).json({ 
        success: true, 
        message: 'Recording notification sent successfully'
      });
    } else {
      console.error('❌ [NOTIFICATION API] Email sending failed:', emailResult.error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send notification email',
        error: emailResult.error
      });
    }

  } catch (error) {
    console.error('❌ [NOTIFICATION API] Processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function sendRecordingEmail({ meetingCode, recipientEmail, downloadURL, duration, recordingMethod }) {
  try {
    console.log('📧 [EMAIL] Setting up nodemailer...');

    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration missing (EMAIL_USER or EMAIL_PASS)');
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Format duration
    const durationText = duration ? 
      `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')} minute` : 
      'N/A';

    // Email content
    const subject = '🎬 Înregistrarea consultației este gata!';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎬 Înregistrarea este gata!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Consultația dumneavoastră a fost înregistrată cu succes</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #28a745; margin-top: 0; display: flex; align-items: center;">
              📋 Detalii înregistrare
            </h3>
            <div style="display: grid; gap: 10px;">
              <p style="margin: 5px 0;"><strong>Cod Meeting:</strong> ${meetingCode}</p>
              <p style="margin: 5px 0;"><strong>Durata:</strong> ${durationText}</p>
              <p style="margin: 5px 0;"><strong>Metodă:</strong> ${recordingMethod}</p>
              <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('ro-RO')}</p>
            </div>
          </div>

                     <div style="background-color: #e3f2fd; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #2196f3;">
             <h3 style="color: #1976d2; margin-top: 0; font-size: 18px;">
               <i style="margin-right: 8px;">🔗</i>Accesați înregistrarea
             </h3>
             <p style="margin: 15px 0; color: #1565c0; font-size: 15px; line-height: 1.6;">
               Pentru a descărca înregistrarea, accesați pagina securizată de mai jos unde vă veți introduce adresa de email:
             </p>
             <div style="text-align: center; margin: 25px 0;">
               <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://tarotbyai.webdynamicx.com'}/inregistrari-acces?email=${encodeURIComponent(recipientEmail)}" 
                  style="display: inline-block; background: linear-gradient(135deg, #2196f3, #1976d2); color: white; padding: 18px 35px; 
                         text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
                 🔐 Accesează Înregistrările
               </a>
             </div>
             <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin-top: 20px; border: 1px solid #ffeaa7;">
               <div style="display: flex; align-items: center; margin-bottom: 8px;">
                 <span style="font-size: 16px; margin-right: 8px;">🔒</span>
                 <strong style="color: #856404; font-size: 14px;">Sistem securizat de descărcare</strong>
               </div>
               <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #856404; font-size: 13px; line-height: 1.5;">
                 <li>Fiecare înregistrare poate fi descărcată <strong>o singură dată</strong></li>
                 <li>Veți introduce emailul: <strong>${recipientEmail}</strong></li>
                 <li>Sistemul va afișa toate înregistrările disponibile pentru acest email</li>
                 <li>Descărcarea se face direct și securizat din browser</li>
               </ul>
             </div>
           </div>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 25px;">
            <p style="margin: 0; font-size: 14px; color: #6c757d; text-align: center;">
              Dacă aveți întrebări, nu ezitați să ne contactați.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; font-size: 14px; color: #6c757d;">
            © ${new Date().getFullYear()} Cristina Zurba - Consultații Tarot
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Cristina Zurba" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent
    };

    console.log('📧 [EMAIL] Sending email to:', recipientEmail);
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ [EMAIL] Email sent successfully:', result.messageId);
    return { 
      success: true, 
      messageId: result.messageId,
      recipientEmail: recipientEmail
    };

  } catch (error) {
    console.error('❌ [EMAIL] Email sending error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
} 