import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY;

  if (!DAILY_API_KEY) {
    console.error('DAILY_API_KEY not found in environment variables');
    return res.status(500).json({ error: 'Daily.co API key not configured' });
  }

  try {
    const { 
      recordingId, 
      customEmail, 
      customName, 
      roomName, 
      duration,
      adminNote 
    } = req.body;

    // Validate required fields
    if (!recordingId || !customEmail) {
      return res.status(400).json({ 
        error: 'recordingId and customEmail are required' 
      });
    }

    console.log('📧 [SEND-CUSTOM] Starting custom recording email send:', {
      recordingId,
      customEmail: customEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
      customName,
      roomName
    });

    // Step 1: Generate fresh temporary download link (12 hours)
    console.log('🔗 [SEND-CUSTOM] Generating fresh download link...');
    
    const linkResponse = await fetch(
      `https://api.daily.co/v1/recordings/${recordingId}/access-link?valid_for_secs=43200`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!linkResponse.ok) {
      const errorData = await linkResponse.text();
      console.error('❌ [SEND-CUSTOM] Failed to generate download link:', errorData);
      return res.status(linkResponse.status).json({ 
        error: 'Failed to generate download link',
        details: errorData 
      });
    }

    const linkData = await linkResponse.json();
    const downloadUrl = linkData.download_link;
    const linkExpires = linkData.expires;

    console.log('✅ [SEND-CUSTOM] Download link generated:', {
      recordingId,
      hasLink: !!downloadUrl,
      expiresAt: linkExpires ? new Date(linkExpires * 1000).toISOString() : 'unknown'
    });

    // Step 2: Send email with custom template
    const emailResult = await sendCustomRecordingEmail({
      recordingId,
      customEmail,
      customName: customName || 'Client',
      downloadUrl,
      roomName,
      duration,
      linkExpires,
      adminNote
    });

    if (emailResult.success) {
      console.log('✅ [SEND-CUSTOM] Email sent successfully:', {
        recordingId,
        messageId: emailResult.messageId,
        recipient: customEmail.replace(/(.{3}).*(@.*)/, '$1***$2')
      });

      res.status(200).json({
        success: true,
        message: 'Recording email sent successfully to custom address',
        data: {
          recordingId,
          customEmail: customEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
          messageId: emailResult.messageId,
          downloadUrl: 'GENERATED',
          expiresAt: linkExpires ? new Date(linkExpires * 1000).toISOString() : null
        }
      });
    } else {
      console.error('❌ [SEND-CUSTOM] Failed to send email:', emailResult.error);
      res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: emailResult.error
      });
    }

  } catch (error) {
    console.error('💥 [SEND-CUSTOM] Error in custom email send:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// Custom email sending function
async function sendCustomRecordingEmail({ 
  recordingId, 
  customEmail, 
  customName, 
  downloadUrl, 
  roomName, 
  duration, 
  linkExpires, 
  adminNote 
}) {
  try {
    console.log('📧 [SEND-CUSTOM] Creating custom email content');

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Format duration and expiry
    const formatDuration = (seconds) => {
      if (!seconds) return 'Necunoscut';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    };

    const formattedDuration = formatDuration(duration);
    const expiryDate = linkExpires ? new Date(linkExpires * 1000) : null;
    const formattedExpiryDate = expiryDate ? expiryDate.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : null;

    // Determine session type
    let sessionTypeDisplay = 'Înregistrare Video';
    if (roomName?.includes('consultation-')) {
      sessionTypeDisplay = 'Consultație Personală';
    } else if (roomName?.includes('conference-')) {
      sessionTypeDisplay = 'Conferință Grup';
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #667eea; margin: 0; font-size: 28px;">🎥 înregistrare Ședință - Cristina Zurba</h1>
            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <!-- Admin Note -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px;">Salut ${customName}! 👋</h2>
            <p style="margin: 0; opacity: 0.9;">Ți-am trimis înregistrarea video de la ${sessionTypeDisplay}</p>
            ${adminNote ? `
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin-top: 15px;">
              <p style="margin: 0; font-style: italic;">💌 Notă de la Cristina Zurba:</p>
              <p style="margin: 5px 0 0 0; font-weight: 500;">"${adminNote}"</p>
            </div>
            ` : ''}
          </div>

          <!-- Recording Details -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">📋 Detalii înregistrare:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Tip sesiune:</td>
                <td style="padding: 8px 0; color: #333;">${sessionTypeDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Durata:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDuration}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">ID înregistrare:</td>
                <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 12px;">${recordingId}</td>
              </tr>
              ${roomName ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Camera:</td>
                <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 12px;">${roomName}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Download Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              📥 Descarcă Înregistrarea
            </a>
          </div>

          <!-- Expiry Warning -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
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
            <h4 style="color: #856404; margin-top: 0; font-size: 14px;">🔒 Confidențialitate și Securitate</h4>
            <ul style="color: #856404; margin: 0 0 15px 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
              <li>Înregistrarea este stocată securizat și criptat</li>
              <li>Link-ul de descărcare este personal și confidențial</li>
              <li>Nu împărți acest link cu alte persoane</li>
              <li>Poți descărca fișierul de câte ori dorești în perioada validă</li>
            </ul>
    
          </div>

          <!-- Support -->
          <div style="background-color: #f0f8ff; border-left: 4px solid #4169e1; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #4169e1; margin-top: 0; font-size: 14px;">🆘 Ai nevoie de ajutor?</h4>
            <p style="color: #333; margin: 0; line-height: 1.6; font-size: 14px;">
              Dacă întâmpini probleme cu descărcarea sau ai întrebări, 
              nu ezita să ne contactezi la <strong>webdynamicx@gmail.com</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
              📧 Email trimis manual de către administratorul platformei
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
      to: customEmail,
      subject: `🎥 Înregistrarea ta de la ${sessionTypeDisplay} - ${recordingId.substring(0, 8)}...`,
      html: emailContent
    };

    console.log('📧 [SEND-CUSTOM] Sending email via nodemailer...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ [SEND-CUSTOM] Email sent successfully:', {
      messageId: result.messageId,
      response: result.response
    });

    return {
      success: true,
      messageId: result.messageId,
      recipientEmail: customEmail
    };

  } catch (error) {
    console.error('❌ [SEND-CUSTOM] Error sending email:', {
      error: error.message,
      errorCode: error.code,
      smtpResponse: error.response
    });
    return { success: false, error: error.message };
  }
} 