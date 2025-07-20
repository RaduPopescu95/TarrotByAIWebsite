const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const { getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const storage = getStorage();

// Email transporter - will be configured when needed
let emailTransporter = null;

// Function to get or create email transporter
function getEmailTransporter() {
  if (!emailTransporter) {
    const emailConfig = functions.config().email;
    
    if (!emailConfig || !emailConfig.user || !emailConfig.password) {
      console.warn('⚠️ Email configuration not set. Use: firebase functions:config:set email.user="your-email" email.password="your-password"');
      // Return a mock transporter for development/testing
      return {
        sendMail: async (options) => {
          console.log('📧 [MOCK EMAIL] Would send email to:', options.to);
          console.log('📧 [MOCK EMAIL] Subject:', options.subject);
          return { messageId: 'mock-message-id' };
        }
      };
    }
    
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password
      }
    });
    
    console.log('📧 Email transporter configured successfully');
  }
  
  return emailTransporter;
}

/**
 * Firebase Function pentru TOATE înregistrările (small & large)
 * Avantaje:
 * - Nu depinde de browser (rulează pe server)
 * - Nu are limite Vercel  
 * - Poate procesa fișiere de orice mărime (up to 500MB+)
 * - Trimite notificări automate pentru TOATE înregistrările
 * - Logging detaliat și error handling
 * - Approach unificat - nu mai avem logică complexă pe client
 */
exports.uploadLargeRecording = functions
  .region('europe-west1') // Alegeți regiunea apropiată
  .runWith({
    timeoutSeconds: 540, // 9 minute timeout (suficient pentru fișiere mari)
    memory: '2GB'        // Memorie suficientă pentru procesarea tuturor fișierelor
  })
  .https.onCall(async (data, context) => {
    
    const requestId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    console.log(`🔥 [${requestId}] Firebase Function - ALL Recordings Upload Started`, {
      meetingCode: data.meetingCode,
      fileSizeMB: data.fileSizeMB,
      duration: data.duration,
      userId: context.auth?.uid || 'anonymous',
      processingType: data.fileSizeMB > 50 ? 'LARGE_FILE' : 'SMALL_FILE'
    });

    try {
      // Validare parametri
      if (!data.meetingCode || !data.recordingData) {
        throw new functions.https.HttpsError(
          'invalid-argument', 
          'Meeting code and recording data are required'
        );
      }

      // Verifică autentificarea pentru fișiere foarte mari
      if (!context.auth && data.fileSizeMB > 100) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'Authentication required for very large file uploads (>100MB)'
        );
      }

      const {
        meetingCode,
        recordingData,  // Base64 encoded recording data sau URL temporară
        duration,
        fileSizeMB,
        recordingType = 'firebase_function',
        userEmail,
        fileName
      } = data;

      console.log(`📊 [${requestId}] Processing recording`, {
        meetingCode,
        fileSizeMB,
        duration,
        recordingType
      });

      // Procesează fișierul în funcție de tipul de date primit
      let videoBuffer;
      
      if (recordingData.startsWith('data:')) {
        // Base64 encoded data
        console.log(`🔄 [${requestId}] Processing Base64 data`);
        const base64Data = recordingData.split(',')[1];
        videoBuffer = Buffer.from(base64Data, 'base64');
      } else if (recordingData.startsWith('http')) {
        // URL temporară (de ex. blob URL convertit)
        console.log(`🔄 [${requestId}] Processing from URL`);
        const fetch = require('node-fetch');
        const response = await fetch(recordingData);
        videoBuffer = await response.buffer();
      } else {
        throw new functions.https.HttpsError(
          'invalid-argument', 
          'Invalid recording data format'
        );
      }

      console.log(`✅ [${requestId}] Buffer created, size: ${videoBuffer.length} bytes`);

      // Generează numele fișierului
      const timestamp = Date.now();
      const finalFileName = fileName || `firebase_recording_${timestamp}.webm`;
      const storagePath = `recordings/${meetingCode}/${finalFileName}`;

      // Upload la Firebase Storage
      console.log(`☁️ [${requestId}] Starting Firebase Storage upload`);
      
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);

      // Upload cu metadata
      await file.save(videoBuffer, {
        metadata: {
          contentType: 'video/webm',
          metadata: {
            meetingCode: meetingCode,
            duration: duration.toString(),
            uploadedBy: userEmail || context.auth?.email || 'unknown',
            uploadedAt: new Date().toISOString(),
            recordingType: recordingType,
            fileSize: videoBuffer.length.toString(),
            processedBy: 'firebase_function'
          }
        }
      });

      // Obține URL-ul public
      const [downloadURL] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491' // URL permanent pentru download
      });

      console.log(`🎊 [${requestId}] Firebase Storage upload completed`);

      // Salvează metadata în Firestore
      const recordingMetadata = {
        meetingCode: meetingCode,
        fileName: finalFileName,
        downloadURL: downloadURL,
        size: videoBuffer.length,
        duration: duration,
        uploadTime: Date.now(),
        userEmail: userEmail || context.auth?.email || 'unknown',
        recordingType: recordingType,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: 'firebase_function',
        status: 'completed'
      };

      await db.collection('recordings').add(recordingMetadata);
      console.log(`📝 [${requestId}] Metadata saved to Firestore`);

      // Trimite notificare prin email (rulează în background)
      if (userEmail) {
        sendRecordingNotification(meetingCode, downloadURL, userEmail, finalFileName)
          .catch(err => console.error(`📧 [${requestId}] Email notification failed:`, err));
      }

      // Returnează rezultatul
      const result = {
        success: true,
        data: {
          meetingCode: meetingCode,
          fileName: finalFileName,
          downloadURL: downloadURL,
          size: videoBuffer.length,
          duration: duration,
          uploadTime: Date.now(),
          recordingType: recordingType,
          processedBy: 'firebase_function'
        },
        message: 'Recording processed successfully by Firebase Function'
      };

      console.log(`🎉 [${requestId}] Upload completed successfully`);
      return result;

    } catch (error) {
      console.error(`💥 [${requestId}] Firebase Function upload failed:`, {
        error: error.message,
        code: error.code,
        stack: error.stack
      });

      // Return structured error
      throw new functions.https.HttpsError(
        'internal',
        `Upload failed: ${error.message}`,
        { requestId, originalError: error.code }
      );
    }
  });

/**
 * Trimite notificare email cu link-ul înregistrării
 */
async function sendRecordingNotification(meetingCode, downloadURL, userEmail, fileName) {
  try {
    const transporter = getEmailTransporter();
    
    const emailContent = {
      from: functions.config().email?.user || 'noreply@cristinazurba.com',
      to: userEmail,
      subject: `✅ Înregistrarea ta este gata - Meeting ${meetingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">🎥 Înregistrarea este disponibilă!</h2>
          
          <p>Bună!</p>
          
          <p>Înregistrarea de la meeting-ul <strong>${meetingCode}</strong> a fost procesată cu succes și este acum disponibilă pentru download.</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">📋 Detalii înregistrare:</h3>
            <p style="margin: 5px 0;"><strong>Fișier:</strong> ${fileName}</p>
            <p style="margin: 5px 0;"><strong>Meeting Code:</strong> ${meetingCode}</p>
            <p style="margin: 5px 0;"><strong>Procesat:</strong> ${new Date().toLocaleString('ro-RO')}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.cristinazurba.com/inregistrari-acces?email=${encodeURIComponent(userEmail)}" 
               style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              📥 Vezi Înregistrările Tale
            </a>
          </div>
          
          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <p style="margin: 0; color: #92400E; font-size: 14px;">
              <strong>📍 Cum accesezi:</strong> Click pe butonul de mai sus pentru a vedea toate înregistrările tale. Vei găsi înregistrarea de la meeting-ul <strong>${meetingCode}</strong> în lista ta personală.
            </p>
          </div>
          
          <p style="color: #6B7280; font-size: 14px;">
            <strong>Notă:</strong> Pe pagina de înregistrări vei găsi toate sesiunile tale (consultații și conferințe) organizate cronologic. Înregistrările sunt disponibile pentru download permanent.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #6B7280; font-size: 12px;">
            Această înregistrare a fost procesată automat de sistemul nostru. Pentru suport tehnic, contactează-ne prin site.
          </p>
        </div>
      `
    };

    await transporter.sendMail(emailContent);
    console.log(`📧 Email notification sent successfully to ${userEmail}`);
    
  } catch (error) {
    console.error('📧 Failed to send email notification:', error);
    // Nu aruncă eroarea - email-ul este opțional
  }
}

/**
 * Funcție helper pentru cleanup înregistrări vechi
 */
exports.cleanupOldRecordings = functions
  .region('europe-west1')
  .pubsub.schedule('0 2 * * *') // Rulează zilnic la 2:00 AM
  .onRun(async (context) => {
    
    console.log('🧹 Starting cleanup of old recordings');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Găsește înregistrări mai vechi de 30 de zile
      const oldRecordings = await db.collection('recordings')
        .where('createdAt', '<', thirtyDaysAgo)
        .get();
      
      console.log(`Found ${oldRecordings.size} old recordings to clean up`);
      
      const bucket = storage.bucket();
      
      for (const doc of oldRecordings.docs) {
        const data = doc.data();
        
        try {
          // Șterge fișierul din Storage
          const filePath = `recordings/${data.meetingCode}/${data.fileName}`;
          await bucket.file(filePath).delete();
          
          // Șterge metadata din Firestore
          await doc.ref.delete();
          
          console.log(`🗑️ Cleaned up recording: ${data.fileName}`);
          
        } catch (error) {
          console.error(`Failed to clean up ${data.fileName}:`, error);
        }
      }
      
      console.log('🎉 Cleanup completed successfully');
      
    } catch (error) {
      console.error('💥 Cleanup failed:', error);
    }
  }); 