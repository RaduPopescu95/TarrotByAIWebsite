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

// Agora Cloud Recording Configuration
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_REST_API_KEY = process.env.AGORA_REST_API_KEY;
const AGORA_REST_API_SECRET = process.env.AGORA_REST_API_SECRET;

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { channelId, meetingCode, userRole } = req.body;

    if (!channelId || !meetingCode) {
      return res.status(400).json({ message: 'Channel ID and Meeting Code are required' });
    }

    // Get recording info from Firebase
    const recordingInfo = await getRecordingInfo(meetingCode);
    
    if (!recordingInfo) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Stop recording
    const stopResponse = await stopRecording(recordingInfo.resourceId, recordingInfo.sid);

    if (stopResponse.success) {
      // Update recording status in Firebase
      await updateRecordingStatus(meetingCode, {
        status: 'stopped',
        endTime: Date.now(),
        stoppedBy: userRole,
        serverResponse: stopResponse.serverResponse
      });

      // Send notification emails (async)
      setTimeout(() => {
        sendRecordingNotification(meetingCode, recordingInfo);
      }, 5000); // Send after 5 seconds

      res.status(200).json({
        success: true,
        message: 'Recording stopped successfully',
        serverResponse: stopResponse.serverResponse
      });
    } else {
      res.status(500).json({
        success: false,
        message: stopResponse.message || 'Failed to stop recording'
      });
    }
  } catch (error) {
    console.error('Recording stop error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getRecordingInfo(meetingCode) {
  try {
    const recordingRef = db.collection('Recordings').doc(meetingCode);
    const snapshot = await recordingRef.get();
    
    if (snapshot.exists) {
      return snapshot.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting recording info:', error);
    throw error;
  }
}

async function stopRecording(resourceId, sid) {
  const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${AGORA_REST_API_KEY}:${AGORA_REST_API_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      cname: null,
      uid: "1001",
      clientRequest: {}
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    return {
      success: true,
      serverResponse: data.serverResponse,
      message: 'Recording stopped successfully'
    };
  } else {
    return {
      success: false,
      message: data.message || 'Failed to stop recording'
    };
  }
}

async function updateRecordingStatus(meetingCode, updateData) {
  try {
    const recordingRef = db.collection('Recordings').doc(meetingCode);
    await recordingRef.update({
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating recording status:', error);
    throw error;
  }
}

async function sendRecordingNotification(meetingCode, recordingInfo) {
  try {
    // Get meeting details
    const meetingRef = db.collection('RezervariConsultatii').doc(meetingCode.split('__')[1]);
    const meetingSnapshot = await meetingRef.get();
    
    if (!meetingSnapshot.exists) {
      console.error('Meeting not found for recording notification');
      return;
    }

    const meetingData = meetingSnapshot.data();
    
    // Generate download link (will be processed later)
    const downloadLink = `${process.env.NEXT_PUBLIC_SITE_URL}/recording/${meetingCode}`;
    
    // Prepare email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          🎥 Înregistrarea consultației este pregătită
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Detalii consultație:</h3>
          <p><strong>Data:</strong> ${new Date(meetingData.data).toLocaleDateString('ro-RO')}</p>
          <p><strong>Ora:</strong> ${meetingData.ora}</p>
          <p><strong>Durata înregistrării:</strong> ${Math.round((recordingInfo.endTime - recordingInfo.startTime) / 60000)} minute</p>
        </div>

        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">📥 Descărcare înregistrare</h3>
          <p>Înregistrarea va fi disponibilă pentru descărcare în aproximativ 10-15 minute.</p>
          <p>Veți primi un email cu link-ul de descărcare când procesarea va fi completă.</p>
          <a href="${downloadLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">
            Verifică starea înregistrării
          </a>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">🔒 Confidențialitate</h4>
          <p style="color: #856404; margin: 0;">Înregistrarea este stocată securizat și este accesibilă doar participanților la consultație. Link-ul de descărcare va fi valid 30 de zile.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
          <p>Dacă aveți întrebări, nu ezitați să ne contactați.</p>
          <p>Echipa Tarot by AI</p>
        </div>
      </div>
    `;

    // Send email to client
    if (meetingData.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: meetingData.email,
        subject: '🎥 Înregistrarea consultației este pregătită',
        html: emailContent
      });
    }

    // Send email to admin/consultant
    if (meetingData.adminEmail) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: meetingData.adminEmail,
        subject: '🎥 Înregistrarea consultației este pregătită',
        html: emailContent
      });
    }

  } catch (error) {
    console.error('Error sending recording notification:', error);
  }
} 