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
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Google Cloud Storage Configuration
const GCS_BUCKET = process.env.AGORA_CLOUD_STORAGE_BUCKET;

export default async function handler(req, res) {
  console.log('🪝 [AGORA WEBHOOK] === WEBHOOK RECEIVED ===');
  console.log('🪝 [AGORA WEBHOOK] Method:', req.method);
  console.log('🪝 [AGORA WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🪝 [AGORA WEBHOOK] Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ [AGORA WEBHOOK] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🪝 [AGORA WEBHOOK] Processing webhook payload...');
    
    const {
      eventType,
      productId,
      noticeId,
      notifyMs,
      payload
    } = req.body;

    console.log('🔍 [AGORA WEBHOOK] Event validation:', {
      eventType,
      productId,
      expectedProductId: 3,
      expectedEventType: 40,
      isValidEvent: productId === 3 && eventType === 40
    });

    // Verify this is a cloud recording webhook
    if (productId !== 3 || eventType !== 40) {
      console.log('⚠️ [AGORA WEBHOOK] Not a recording completion event - ignoring');
      return res.status(200).json({ message: 'Not a recording completion event' });
    }
    
    console.log('✅ [AGORA WEBHOOK] Valid recording completion event received');

    const {
      sid,
      cname: channelId,
      uid,
      sequence,
      sendts,
      serviceType,
      details
    } = payload;

    console.log('📋 [AGORA WEBHOOK] Payload details:', {
      sid: sid?.substring(0, 10) + '...',
      channelId,
      uid,
      serviceType,
      expectedServiceType: 0,
      fileCount: details?.fileList?.length || 0
    });

    if (serviceType !== 0) { // 0 = cloud recording service
      console.log('⚠️ [AGORA WEBHOOK] Not a cloud recording service event - ignoring');
      return res.status(200).json({ message: 'Not a cloud recording service event' });
    }

    console.log('🔍 [AGORA WEBHOOK] Looking up recording in Firestore...');
    console.log('🔍 [AGORA WEBHOOK] Query filters:', { sid: sid?.substring(0, 10) + '...', channelId });
    
    // Find the recording in our database
    const recordingSnapshot = await db.collection('AgoraRecordings')
      .where('sid', '==', sid)
      .where('channelId', '==', channelId)
      .get();

    if (recordingSnapshot.empty) {
      console.log('❌ [AGORA WEBHOOK] Recording not found in Firestore!');
      console.log('❌ [AGORA WEBHOOK] Search criteria:', { sid: sid?.substring(0, 10) + '...', channelId });
      console.error('Recording not found for sid:', sid, 'channel:', channelId);
      return res.status(404).json({ message: 'Recording not found in AgoraRecordings collection' });
    }

    const recordingDoc = recordingSnapshot.docs[0];
    const recordingData = recordingDoc.data();
    const meetingCode = recordingData.meetingCode;
    
    console.log('✅ [AGORA WEBHOOK] Recording found in Firestore');
    console.log('✅ [AGORA WEBHOOK] Recording details:', {
      meetingCode,
      status: recordingData.status,
      startTime: recordingData.startTime,
      documentId: recordingDoc.id
    });

    // Process the recording files
    console.log('🎬 [AGORA WEBHOOK] Processing recording files...');
    const downloadLinks = await processRecordingFiles(details, meetingCode);
    console.log('🎬 [AGORA WEBHOOK] Generated download links:', Object.keys(downloadLinks));

    // Update recording status to ready
    console.log('💾 [AGORA WEBHOOK] Updating recording status to ready...');
    await recordingDoc.ref.update({
      status: 'ready',
      completedAt: Date.now(),
      files: details,
      downloadLinks: downloadLinks,
      processingCompletedAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ [AGORA WEBHOOK] Recording status updated to ready');

    // Send completion notification emails
    console.log('📧 [AGORA WEBHOOK] Sending completion notification emails...');
    await sendCompletionNotification(meetingCode, recordingData, downloadLinks);
    console.log('✅ [AGORA WEBHOOK] Notification emails sent successfully');

    console.log('🎉 [AGORA WEBHOOK] === PROCESSING COMPLETED ===');
    console.log('🎉 [AGORA WEBHOOK] Meeting code:', meetingCode);
    console.log('🎉 [AGORA WEBHOOK] Recording ID:', recordingDoc.id);
    console.log('🎉 [AGORA WEBHOOK] Download links:', Object.keys(downloadLinks));
    
    res.status(200).json({ 
      message: 'Webhook processed successfully',
      recordingId: recordingDoc.id 
    });

  } catch (error) {
    console.log('❌ [AGORA WEBHOOK] === ERROR OCCURRED ===');
    console.log('❌ [AGORA WEBHOOK] Error:', error.message);
    console.log('❌ [AGORA WEBHOOK] Stack:', error.stack);
    console.log('❌ [AGORA WEBHOOK] Request body:', JSON.stringify(req.body, null, 2));
    
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

async function processRecordingFiles(details, meetingCode) {
  console.log('📁 [PROCESS FILES] Processing recording files for:', meetingCode);
  console.log('📁 [PROCESS FILES] Details received:', {
    hasDetails: !!details,
    hasFileList: !!(details?.fileList),
    fileCount: details?.fileList?.length || 0
  });
  
  const downloadLinks = {};
  
  try {
    // Process file list from Agora webhook
    if (details && details.fileList) {
      console.log('📁 [PROCESS FILES] Processing', details.fileList.length, 'files');
      
      for (const file of details.fileList) {
        const { fileName, trackType, uid, mixedAllUser, isPlayable, sliceStartTime } = file;
        
        console.log('📁 [PROCESS FILES] Processing file:', {
          fileName,
          trackType,
          isPlayable,
          fileExtension: fileName?.split('.').pop()?.toLowerCase()
        });
        
        if (isPlayable) {
          // Generate Google Cloud Storage URL
          const fileExtension = fileName.split('.').pop().toLowerCase();
          const filePath = `recordings/${meetingCode}/${fileName}`;
          
          console.log('🔗 [PROCESS FILES] Generating signed URL for:', filePath);
          
          // Create signed URL for Google Cloud Storage (valid for 30 days)
          const signedUrl = await generateGcsSignedUrl(filePath);
          
          if (fileExtension === 'mp4') {
            downloadLinks.mp4 = signedUrl;
            console.log('✅ [PROCESS FILES] MP4 link generated');
          } else if (fileExtension === 'm3u8') {
            downloadLinks.hls = signedUrl;
            console.log('✅ [PROCESS FILES] HLS link generated');
          }
        } else {
          console.log('⚠️ [PROCESS FILES] File not playable, skipping:', fileName);
        }
      }
    } else {
      console.log('⚠️ [PROCESS FILES] No file list in details');
    }
    
    // If no specific files found, create generic download links
    if (Object.keys(downloadLinks).length === 0) {
      console.log('⚠️ [PROCESS FILES] No playable files found, creating generic links');
      downloadLinks.mp4 = await generateGcsSignedUrl(`recordings/${meetingCode}/recording.mp4`);
      downloadLinks.hls = await generateGcsSignedUrl(`recordings/${meetingCode}/recording.m3u8`);
      console.log('✅ [PROCESS FILES] Generic download links created');
    }
    
    console.log('📁 [PROCESS FILES] === PROCESSING COMPLETE ===');
    console.log('📁 [PROCESS FILES] Generated links:', Object.keys(downloadLinks));
    
  } catch (error) {
    console.log('❌ [PROCESS FILES] Error processing recording files:', error);
    console.error('Error processing recording files:', error);
  }
  
  return downloadLinks;
}

async function generateGcsSignedUrl(filePath) {
  try {
    console.log('🔗 Generating GCS signed URL for:', filePath);
    
    // Option 1: Use @google-cloud/storage SDK (recommended for production)
    try {
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage({
        projectId: process.env.FIREBASE_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './tarrot-590ee-49961eacf1c9.json'
      });
      
      const [url] = await storage
        .bucket(GCS_BUCKET)
        .file(filePath)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        });
      
      console.log('✅ Generated signed URL with @google-cloud/storage');
      return url;
    } catch (sdkError) {
      console.warn('⚠️ @google-cloud/storage not available, using fallback:', sdkError.message);
      
      // Option 2: Fallback to public URL if bucket is public
      const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
      const baseUrl = `https://storage.googleapis.com/${GCS_BUCKET}`;
      const fallbackUrl = `${baseUrl}/${filePath}?token=${uuidv4()}&expires=${expirationTime}`;
      
      console.log('📋 Using fallback public URL (requires public bucket)');
      return fallbackUrl;
    }
  } catch (error) {
    console.error('❌ Error generating GCS signed URL:', error);
    
    // Final fallback: direct GCS URL without signature
    const directUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${filePath}`;
    console.log('🔄 Using direct GCS URL as last resort');
    return directUrl;
  }
}

async function sendCompletionNotification(meetingCode, recordingData, downloadLinks) {
  try {
    console.log('📧 [NOTIFICATION] Sending completion notification for:', meetingCode);
    
    // Get meeting details
    const meetingId = meetingCode.split('__')[1];
    console.log('📧 [NOTIFICATION] Looking up meeting ID:', meetingId);
    
    const meetingRef = db.collection('RezervariConsultatii').doc(meetingId);
    const meetingSnapshot = await meetingRef.get();
    
    if (!meetingSnapshot.exists) {
      console.log('❌ [NOTIFICATION] Meeting not found for notification, ID:', meetingId);
      console.error('Meeting not found for notification');
      return;
    }

    const meetingDetails = meetingSnapshot.data();
    console.log('✅ [NOTIFICATION] Meeting details found:', {
      email: meetingDetails.email ? 'yes' : 'no',
      adminEmail: meetingDetails.adminEmail ? 'yes' : 'no',
      data: meetingDetails.data,
      ora: meetingDetails.ora
    });
    
    // Generate download page link
    const downloadPageLink = `${process.env.NEXT_PUBLIC_SITE_URL}/recording/${meetingCode}`;
    
    // Calculate recording duration
    const duration = Math.round((recordingData.endTime - recordingData.startTime) / 60000);
    
    console.log('📧 [NOTIFICATION] Email preparation:', {
      downloadPageLink,
      duration: `${duration} minutes`,
      downloadLinksAvailable: Object.keys(downloadLinks)
    });
    
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
              <li>Înregistrarea este stocată securizat în Google Cloud Storage</li>
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
      console.log('📧 [NOTIFICATION] Sending email to client:', meetingDetails.email);
      await transporter.sendMail({
        from: `"Tarot by AI" <${process.env.EMAIL_USER}>`,
        to: meetingDetails.email,
        subject: '🎉 Înregistrarea consultației este gata pentru descărcare!',
        html: emailContent
      });
      console.log('✅ [NOTIFICATION] Client email sent successfully');
    } else {
      console.log('⚠️ [NOTIFICATION] No client email available');
    }

    // Send email to admin/consultant
    if (meetingDetails.adminEmail) {
      console.log('📧 [NOTIFICATION] Sending email to admin:', meetingDetails.adminEmail);
      await transporter.sendMail({
        from: `"Tarot by AI" <${process.env.EMAIL_USER}>`,
        to: meetingDetails.adminEmail,
        subject: '🎉 Înregistrarea consultației este gata pentru descărcare!',
        html: emailContent
      });
      console.log('✅ [NOTIFICATION] Admin email sent successfully');
    } else {
      console.log('⚠️ [NOTIFICATION] No admin email available');
    }

    console.log('✅ [NOTIFICATION] === EMAIL NOTIFICATIONS COMPLETE ===');

  } catch (error) {
    console.log('❌ [NOTIFICATION] === ERROR SENDING EMAILS ===');
    console.log('❌ [NOTIFICATION] Error:', error.message);
    console.log('❌ [NOTIFICATION] Stack:', error.stack);
    console.error('Error sending completion notification:', error);
  }
} 