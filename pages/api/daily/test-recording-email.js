// Test endpoint for manually sending recording emails
// Usage: POST /api/daily/test-recording-email
// Body: { documentId: "your-document-id", testMode: true, email: "test@example.com" }

import nodemailer from 'nodemailer';

// Email configuration for testing
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId, testMode = true, email } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    console.log('🧪 [TEST-EMAIL] Testing recording email for documentId:', documentId);

    // For test mode, use provided email or a default test email
    const testEmail = email || 'test@example.com';
    const testClientName = 'Ion Popescu (TEST)';
    const testRecordingUrl = 'https://example-recording-url.com/test-recording.mp4';
    const testRoomName = `consultation-${documentId}`;
    const testDuration = 1800; // 30 minutes

    console.log('🧪 [TEST-EMAIL] Sending test email to:', testEmail);

    // Create test email directly
    const emailResult = await sendTestRecordingEmail({
      clientEmail: testEmail,
      clientName: testClientName,
      recordingUrl: testRecordingUrl,
      roomName: testRoomName,
      duration: testDuration,
      documentId
    });

    if (emailResult.success) {
      console.log('✅ [TEST-EMAIL] Test email sent successfully:', emailResult.messageId);
      
      res.status(200).json({
        success: true,
        message: 'Test recording email sent successfully',
        messageId: emailResult.messageId,
        testData: {
          documentId,
          clientEmail: testEmail,
          clientName: testClientName,
          recordingUrl: testRecordingUrl,
          roomName: testRoomName,
          duration: testDuration
        }
      });
    } else {
      console.error('❌ [TEST-EMAIL] Test email failed:', emailResult.error);
      
      res.status(500).json({
        success: false,
        error: 'Test email failed',
        details: emailResult.error
      });
    }

  } catch (error) {
    console.error('💥 [TEST-EMAIL] Unexpected error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function sendTestRecordingEmail({ clientEmail, clientName, recordingUrl, roomName, duration, documentId }) {
  try {
    console.log('🧪 [TEST-EMAIL] Creating test email content');

    // Format duration
    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    };

    const formattedDuration = duration ? formatDuration(duration) : 'Necunoscut';
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
            <h1 style="color: #667eea; margin: 0; font-size: 28px;">🎥 Înregistrarea Consultației (TEST)</h1>
            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <!-- Welcome Message -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px;">Salut ${clientName}! 👋</h2>
            <p style="margin: 0; opacity: 0.9;">Aceasta este o înregistrare de test pentru consultația ta</p>
          </div>

          <!-- Test Notice -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #856404; margin-top: 0; font-size: 14px;">🧪 EMAIL DE TEST</h4>
            <p style="color: #856404; margin: 0; line-height: 1.6; font-size: 14px;">
              Acesta este un email de test pentru verificarea sistemului de trimitere înregistrări Daily.co. 
              Link-ul de descărcare nu este real.
            </p>
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
                <td style="padding: 8px 0; color: #333;">Consultație Test Video</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 600;">Cod înregistrare:</td>
                <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 12px;">${roomName || documentId}</td>
              </tr>
            </table>
          </div>

          <!-- Download Button (disabled for test) -->
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: #6c757d; color: white; padding: 15px 30px; border-radius: 25px; font-weight: 600; font-size: 16px;">
              📥 Link Test Descărcare (Inactiv)
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 10px;">
              URL Real: ${recordingUrl}
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
              Email de test - sistemul funcționează corect! 🎉
            </p>
            <p style="color: #667eea; margin: 0; font-weight: 600;">
              Echipa Tarot by AI ✨
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Tarot by AI - Test Înregistrări" <${process.env.EMAIL_USER}>`,
      to: clientEmail,
      subject: `🧪 TEST - Înregistrarea consultației - ${documentId}`,
      html: emailContent
    };

    console.log('🧪 [TEST-EMAIL] Sending test email via SMTP to:', clientEmail);

    const smtpStartTime = Date.now();
    const result = await transporter.sendMail(mailOptions);
    const smtpTime = Date.now() - smtpStartTime;

    console.log('✅ [TEST-EMAIL] Test email sent successfully:', {
      messageId: result.messageId,
      recipientEmail: clientEmail,
      smtpTime: `${smtpTime}ms`
    });

    return { 
      success: true, 
      messageId: result.messageId,
      recipientEmail: clientEmail
    };

  } catch (error) {
    console.error('❌ [TEST-EMAIL] Failed to send test email:', {
      error: error.message,
      errorCode: error.code,
      smtpResponse: error.response,
      clientEmail: clientEmail
    });
    return { success: false, error: error.message };
  }
} 