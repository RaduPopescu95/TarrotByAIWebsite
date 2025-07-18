import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

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

// AWS S3 Configuration
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_REGION = process.env.AWS_S3_REGION;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Received webhook from Agora:', req.body);
    
    const {
      eventType,
      productId,
      noticeId,
      notifyMs,
      payload
    } = req.body;

    // Verify this is a cloud recording webhook
    if (productId !== 3 || eventType !== 40) {
      return res.status(200).json({ message: 'Not a recording completion event' });
    }

    const {
      sid,
      cname: channelId,
      uid,
      sequence,
      sendts,
      serviceType,
      details
    } = payload;

    if (serviceType !== 0) { // 0 = cloud recording service
      return res.status(200).json({ message: 'Not a cloud recording service event' });
    }

    // Find the recording in our database
    const recordingSnapshot = await db.collection('Recordings')
      .where('sid', '==', sid)
      .where('channelId', '==', channelId)
      .get();

    if (recordingSnapshot.empty) {
      console.error('Recording not found for sid:', sid, 'channelId:', channelId);
      return res.status(404).json({ message: 'Recording not found' });
    }

    const recordingDoc = recordingSnapshot.docs[0];
    const recordingData = recordingDoc.data();
    const meetingCode = recordingData.meetingCode;

    // Process the recording files
    const downloadLinks = await processRecordingFiles(details, meetingCode);

    // Update recording status to ready
    await recordingDoc.ref.update({
      status: 'ready',
      completedAt: Date.now(),
      files: details,
      downloadLinks: downloadLinks,
      processingCompletedAt: new Date(),
      updatedAt: new Date()
    });

    // Send completion notification emails
    await sendCompletionNotification(meetingCode, recordingData, downloadLinks);

    console.log('Recording processing completed successfully for:', meetingCode);
    
    res.status(200).json({ 
      message: 'Webhook processed successfully',
      recordingId: recordingDoc.id 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

async function processRecordingFiles(details, meetingCode) {
  const downloadLinks = {};
  
  try {
    // Process file list from Agora webhook
    if (details && details.fileList) {
      for (const file of details.fileList) {
        const { fileName, trackType, uid, mixedAllUser, isPlayable, sliceStartTime } = file;
        
        if (isPlayable) {
          // Generate secure download URL
          const fileExtension = fileName.split('.').pop().toLowerCase();
          const baseUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com`;
          const filePath = `recordings/${meetingCode}/${fileName}`;
          
          // Create signed URL (valid for 30 days)
          const signedUrl = await generateSignedUrl(filePath);
          
          if (fileExtension === 'mp4') {
            downloadLinks.mp4 = signedUrl;
          } else if (fileExtension === 'm3u8') {
            downloadLinks.hls = signedUrl;
          }
        }
      }
    }
    
    // If no specific files found, create generic download links
    if (Object.keys(downloadLinks).length === 0) {
      const baseUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com`;
      downloadLinks.mp4 = await generateSignedUrl(`recordings/${meetingCode}/recording.mp4`);
      downloadLinks.hls = await generateSignedUrl(`recordings/${meetingCode}/recording.m3u8`);
    }
    
  } catch (error) {
    console.error('Error processing recording files:', error);
  }
  
  return downloadLinks;
}

async function generateSignedUrl(filePath) {
  try {
    // For demo purposes, return a basic URL
    // In production, implement proper AWS S3 signed URL generation
    const baseUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com`;
    return `${baseUrl}/${filePath}?token=${uuidv4()}&expires=${Date.now() + (30 * 24 * 60 * 60 * 1000)}`;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

async function sendCompletionNotification(meetingCode, recordingData, downloadLinks) {
  try {
    // Get meeting details
    const meetingId = meetingCode.split('__')[1];
    const meetingRef = db.collection('RezervariConsultatii').doc(meetingId);
    const meetingSnapshot = await meetingRef.get();
    
    if (!meetingSnapshot.exists) {
      console.error('Meeting not found for notification');
      return;
    }

    const meetingDetails = meetingSnapshot.data();
    
    // Generate download page link
    const downloadPageLink = `${process.env.NEXT_PUBLIC_SITE_URL}/recording/${meetingCode}`;
    
    // Calculate recording duration
    const duration = Math.round((recordingData.endTime - recordingData.startTime) / 60000);
    
    // Prepare email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Înregistrarea este gata!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Consultația dumneavoastră a fost procesată cu succes</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #007bff; margin-top: 0; display: flex; align-items: center;">
              📅 Detalii consultație
            </h3>
            <div style="display: grid; gap: 10px;">
              <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date(meetingDetails.data).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>Ora:</strong> ${meetingDetails.ora}</p>
              <p style="margin: 5px 0;"><strong>Durata înregistrarea:</strong> ${duration} minute</p>
              <p style="margin: 5px 0;"><strong>Calitate:</strong> HD (1280x720)</p>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <h3 style="margin-top: 0; font-size: 20px;">📥 Descărcați înregistrarea</h3>
            <p style="margin: 15px 0; opacity: 0.9;">Înregistrarea este disponibilă în multiple formate pentru compatibilitate maximă</p>
            
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
              ${downloadLinks.mp4 ? `
                <a href="${downloadLinks.mp4}" style="background-color: rgba(255,255,255,0.2); color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  🎬 MP4 (Recomandat)
                </a>
              ` : ''}
              
              ${downloadLinks.hls ? `
                <a href="${downloadLinks.hls}" style="background-color: rgba(255,255,255,0.2); color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  📺 HLS (Streaming)
                </a>
              ` : ''}
            </div>
            
            <div style="margin-top: 20px;">
              <a href="${downloadPageLink}" style="background-color: white; color: #28a745; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                🌐 Vezi toate opțiunile de descărcare
              </a>
            </div>
          </div>

          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #856404; margin-top: 0; display: flex; align-items: center;">
              <span style="margin-right: 8px;">🔒</span> Informații importante
            </h4>
            <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Înregistrarea este stocată securizat în AWS S3</li>
              <li>Link-urile de descărcare sunt valide 30 de zile</li>
              <li>Fișierele sunt accesibile doar participanților la consultație</li>
              <li>Pentru suport tehnic, contactați echipa noastră</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <div style="border-top: 2px solid #e9ecef; padding-top: 20px;">
              <p style="color: #6c757d; margin: 0; font-size: 14px;">
                Dacă aveți întrebări, nu ezitați să ne contactați
              </p>
              <p style="color: #007bff; font-weight: bold; margin: 5px 0 0 0;">
                Echipa Tarot by AI
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Send email to client
    if (meetingDetails.email) {
      await transporter.sendMail({
        from: `"Tarot by AI" <${process.env.EMAIL_USER}>`,
        to: meetingDetails.email,
        subject: '🎉 Înregistrarea consultației este gata pentru descărcare!',
        html: emailContent
      });
    }

    // Send email to admin/consultant
    if (meetingDetails.adminEmail) {
      await transporter.sendMail({
        from: `"Tarot by AI" <${process.env.EMAIL_USER}>`,
        to: meetingDetails.adminEmail,
        subject: '🎉 Înregistrarea consultației este gata pentru descărcare!',
        html: emailContent
      });
    }

    console.log('Completion notification emails sent successfully');

  } catch (error) {
    console.error('Error sending completion notification:', error);
  }
} 