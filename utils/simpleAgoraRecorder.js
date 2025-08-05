// Simple Agora Stream Recorder
// Captures video/audio from Agora elements and uploads to Firebase Storage

import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export class SimpleAgoraRecorder {
  constructor(options = {}) {
    this.meetingCode = options.meetingCode;
    this.documentId = options.documentId;
    this.recipientEmail = options.recipientEmail; // Single email for backward compatibility
    this.recipientEmails = options.recipientEmails || []; // Array of emails for conferences
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.combinedStream = null;
    this.isRecording = false;
    this.startTime = null;
    
    // Callbacks
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    
    console.log('🎬 [SIMPLE RECORDER] Initialized for meeting:', this.meetingCode);
  }

  static isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getDisplayMedia && 
              window.MediaRecorder &&
              MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus'));
  }

  async startRecording() {
    try {
      console.log('🎬 [SIMPLE RECORDER] Starting recording...');
      this.onStatusChange('Pornește înregistrarea...');
      
      if (!SimpleAgoraRecorder.isSupported()) {
        throw new Error('Browser-ul nu suportă înregistrarea video');
      }

      // Wait a bit for Agora streams to be fully loaded
      this.onStatusChange('Pregătire elemente video...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // SCREEN SHARING FIRST - Most reliable method
      console.log('🖥️ [SIMPLE RECORDER] Using screen sharing (most reliable method)');
      this.onStatusChange('Alegere ecran pentru înregistrare...');
      
      this.combinedStream = await this.captureScreen();

      // Setup MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2000000, // 2 Mbps for good quality
        audioBitsPerSecond: 128000   // 128 Kbps for audio
      });

      this.recordedChunks = [];

      // Event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          console.log('📦 [SIMPLE RECORDER] Data chunk received:', event.data.size, 'bytes');
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('🛑 [SIMPLE RECORDER] Recording stopped, processing...');
        this.processRecording();
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('❌ [SIMPLE RECORDER] MediaRecorder error:', error);
        this.onError('Eroare la înregistrare: ' + error.message);
      };

      // Start recording
      this.mediaRecorder.start(1000); // Save chunks every second
      this.isRecording = true;
      this.startTime = new Date();
      
      console.log('✅ [SIMPLE RECORDER] Recording started successfully');
      this.onStatusChange('🔴 Înregistrare activă...');
      return { success: true };

    } catch (error) {
      console.error('❌ [SIMPLE RECORDER] Start error:', error);
      this.onError('Nu s-a putut începe înregistrarea: ' + error.message);
      return { success: false, error: error.message };
    }
  }

  async findAgoraCanvas() {
    // Look for Agora's canvas element in the DOM
    const canvasElements = document.querySelectorAll('canvas');
    
    for (const canvas of canvasElements) {
      // Check if canvas has content (width > 0, height > 0)
      if (canvas.width > 100 && canvas.height > 100) {
        console.log('🎨 [SIMPLE RECORDER] Found potential Agora canvas:', {
          width: canvas.width,
          height: canvas.height,
          id: canvas.id,
          className: canvas.className
        });
        return canvas;
      }
    }
    
    // Fallback: look for video elements
    const videoElements = document.querySelectorAll('video');
    if (videoElements.length > 0) {
      console.log('📹 [SIMPLE RECORDER] Found video elements, creating composite canvas...');
      return this.createCompositeCanvas(videoElements);
    }
    
    return null;
  }

  async captureFromCanvas(canvas) {
    console.log('🎨 [SIMPLE RECORDER] Capturing from canvas...');
    
    // Get video stream from canvas
    const videoStream = canvas.captureStream(30); // 30 FPS
    
    // Try to capture audio from Agora video elements
    const audioStream = await this.captureAudioFromPage();
    
    // Combine video and audio
    const combinedStream = new MediaStream();
    
    // Add video tracks
    videoStream.getVideoTracks().forEach(track => {
      combinedStream.addTrack(track);
    });
    
    // Add audio tracks if available
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
    }
    
    console.log('✅ [SIMPLE RECORDER] Combined stream created:', {
      videoTracks: combinedStream.getVideoTracks().length,
      audioTracks: combinedStream.getAudioTracks().length
    });
    
    return combinedStream;
  }

  async captureScreen() {
    console.log('🖥️ [SIMPLE RECORDER] Starting screen capture...');
    
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'screen',
        width: { ideal: 1920 }, // Higher quality
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
        autoGainControl: true
      }
    });
    
    console.log('✅ [SIMPLE RECORDER] Screen capture stream created:', {
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      videoSettings: stream.getVideoTracks()[0]?.getSettings() || 'none',
      audioSettings: stream.getAudioTracks()[0]?.getSettings() || 'none'
    });
    
    // Add event listener for when user stops sharing from browser UI
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      console.log('🛑 [SIMPLE RECORDER] Screen sharing stopped by user from browser UI');
      this.onStatusChange('Înregistrarea s-a oprit (ecran închis)');
      if (this.isRecording) {
        this.stopRecording();
      }
    });
    
    return stream;
  }

  async captureAudioFromPage() {
    try {
      // Try to capture audio from the page
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('🎤 [SIMPLE RECORDER] Audio captured from microphone');
      return audioStream;
    } catch (error) {
      console.log('⚠️ [SIMPLE RECORDER] Could not capture audio:', error.message);
      return null;
    }
  }

  createCompositeCanvas(videoElements) {
    // Create a canvas to composite multiple video elements
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    // Draw video elements onto canvas
    const drawVideos = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const videoCount = videoElements.length;
      const videosPerRow = Math.ceil(Math.sqrt(videoCount));
      const videoWidth = canvas.width / videosPerRow;
      const videoHeight = canvas.height / videosPerRow;
      
      videoElements.forEach((video, index) => {
        if (video.readyState >= 2) { // Video has data
          const x = (index % videosPerRow) * videoWidth;
          const y = Math.floor(index / videosPerRow) * videoHeight;
          ctx.drawImage(video, x, y, videoWidth, videoHeight);
        }
      });
      
      requestAnimationFrame(drawVideos);
    };
    
    drawVideos();
    return canvas;
  }

  stopRecording() {
    console.log('🛑 [SIMPLE RECORDER] Stopping recording...');
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.onStatusChange('Oprire înregistrare...');
      this.mediaRecorder.stop();
    }
    
    // Stop all tracks
    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    this.isRecording = false;
  }

  cleanup() {
    console.log('🧹 [SIMPLE RECORDER] Cleaning up...');
    
    // Remove beforeunload warning
    this.removeBeforeUnloadWarning();
    
    // Stop recording if still active
    if (this.isRecording) {
      this.stopRecording();
    }
    
    // Clear recorded chunks
    this.recordedChunks = [];
    
    // Reset state
    this.mediaRecorder = null;
    this.combinedStream = null;
    this.startTime = null;
  }

  async processRecording() {
    try {
      console.log('⚙️ [SIMPLE RECORDER] Processing recording...');
      this.onStatusChange('Procesare înregistrare...');
      
      // Prevent accidental browser close during upload
      this.addBeforeUnloadWarning();
      
      if (this.recordedChunks.length === 0) {
        throw new Error('Nu s-au găsit date de înregistrare');
      }
      
      // Create video blob
      const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const duration = this.startTime ? Math.round((new Date() - this.startTime) / 1000) : 0;
      
      console.log('📹 [SIMPLE RECORDER] Video blob created:', {
        size: videoBlob.size,
        duration: duration,
        chunks: this.recordedChunks.length
      });
      
      // Upload to Firebase Storage
      this.onStatusChange('Upload în cloud...');
      const downloadURL = await this.uploadToFirebase(videoBlob, duration);
      
      // Update Firestore
      this.onStatusChange('Actualizare bază de date...');
      await this.updateFirestore(downloadURL, duration, videoBlob.size);
      
      // Send email notification
      this.onStatusChange('Trimitere email...');
      await this.sendEmailNotification(downloadURL, duration);
      
      console.log('✅ [SIMPLE RECORDER] Recording processed successfully');
      this.onStatusChange('✅ Înregistrare finalizată!');
      
      // Remove beforeunload warning
      this.removeBeforeUnloadWarning();
      
      this.onComplete({
        success: true,
        downloadURL,
        duration,
        fileSize: videoBlob.size
      });
      
    } catch (error) {
      console.error('❌ [SIMPLE RECORDER] Processing error:', error);
      
      // Remove beforeunload warning on error too
      this.removeBeforeUnloadWarning();
      
      this.onError('Eroare la procesare: ' + error.message);
    }
  }

  addBeforeUnloadWarning() {
    this.beforeUnloadHandler = (event) => {
      const message = 'Înregistrarea se încarcă! Dacă închideți această pagină, înregistrarea se va pierde.';
      event.preventDefault();
      event.returnValue = message; // For older browsers
      return message;
    };
    
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    console.log('⚠️ [SIMPLE RECORDER] Browser close warning activated');
  }

  removeBeforeUnloadWarning() {
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
      console.log('✅ [SIMPLE RECORDER] Browser close warning removed');
    }
  }

  async uploadToFirebase(videoBlob, duration) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `recording-${this.meetingCode}-${timestamp}.webm`;
    const filePath = `recordings/${this.documentId}/${fileName}`;
    
    console.log('☁️ [SIMPLE RECORDER] Uploading to Firebase Storage:', {
      path: filePath,
      size: `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`,
      duration: `${duration}s`
    });
    
    // Show file size and estimated upload time
    const fileSizeMB = (videoBlob.size / 1024 / 1024).toFixed(2);
    this.onStatusChange(`Upload în cloud: ${fileSizeMB} MB...`);
    
    // Add warning about not closing browser
    this.onProgress(`⚠️ NU ÎNCHIDEȚI BROWSER-UL în timpul upload-ului!`);
    
    const storageRef = ref(storage, filePath);
    
    // Add upload progress tracking if possible
    const uploadStartTime = Date.now();
    
    const snapshot = await uploadBytes(storageRef, videoBlob, {
      customMetadata: {
        meetingCode: this.meetingCode,
        documentId: this.documentId,
        duration: duration.toString(),
        recordedAt: new Date().toISOString(),
        fileType: 'video/webm',
        recordingMethod: 'simple-screen-sharing',
        fileSizeMB: fileSizeMB
      }
    });
    
    const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ [SIMPLE RECORDER] Upload successful:', {
      path: filePath,
      size: `${fileSizeMB} MB`,
      uploadTime: `${uploadDuration}s`,
      downloadURL: downloadURL.substring(0, 100) + '...'
    });
    
    this.onStatusChange(`✅ Upload complet în ${uploadDuration}s`);
    
    return downloadURL;
  }

  async updateFirestore(downloadURL, duration, fileSize) {
    if (!this.documentId) {
      console.log('⚠️ [SIMPLE RECORDER] No document ID for Firestore update');
      return;
    }
    
    // Update original reservation document
    const docRef = doc(db, 'RezervariConsultatii', this.documentId);
    const updateData = {
      recording: {
        status: 'completed',
        method: 'simple-browser-recorder',
        downloadURL: downloadURL,
        duration: duration,
        fileSize: fileSize,
        recordedAt: new Date(),
        meetingCode: this.meetingCode
      },
      updatedAt: new Date()
    };
    
    await updateDoc(docRef, updateData);
    
    // Also save to SimpleRecordings collection for search functionality
    await this.saveToSimpleRecordings(downloadURL, duration, fileSize);
    
    console.log('📄 [SIMPLE RECORDER] Firestore updated successfully');
  }

  async saveToSimpleRecordings(downloadURL, duration, fileSize) {
    try {
      console.log('💾 [SIMPLE RECORDER] Saving to SimpleRecordings collection for search...');
      
      // Use first email from array, or single email for userEmail
      const primaryEmail = this.recipientEmails.length > 0 ? 
                          this.recipientEmails[0] : 
                          this.recipientEmail;
      
      const recordingData = {
        meetingCode: this.meetingCode,
        documentId: this.documentId,
        userEmail: primaryEmail.toLowerCase().trim(),
        adminEmail: 'cristina@tarotbyai.com', // Default admin email
        downloadURL: downloadURL,
        duration: duration,
        fileSize: fileSize,
        status: 'completed',
        type: 'one_to_one',
        typeLabel: 'Consultație Individuală',
        title: `Screen Recording - ${this.meetingCode}`,
        recordingMethod: 'simple-screen-sharing',
        recordedAt: new Date(),
        createdAt: new Date(),
        format: 'webm',
        downloadedBy: [], // Track who downloaded this
        downloadAttempts: [], // Track download attempts
        // Additional metadata for search - include all emails
        searchableEmails: [
          ...((this.recipientEmails.length > 0 ? this.recipientEmails : [this.recipientEmail])
            .map(email => email.toLowerCase().trim())),
          'cristina@tarotbyai.com'
        ].filter(Boolean) // Remove any null/undefined emails
      };
      
      // Use meetingCode as document ID for easy retrieval
      const recordingRef = doc(db, 'SimpleRecordings', this.meetingCode);
      await updateDoc(recordingRef, recordingData);
      
      console.log('✅ [SIMPLE RECORDER] Saved to SimpleRecordings successfully');
      
    } catch (error) {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        console.log('📝 [SIMPLE RECORDER] Creating new document in SimpleRecordings...');
        
        const recordingData = {
          meetingCode: this.meetingCode,
          documentId: this.documentId,
          userEmail: primaryEmail.toLowerCase().trim(),
          adminEmail: 'cristina@tarotbyai.com',
          downloadURL: downloadURL,
          duration: duration,
          fileSize: fileSize,
          status: 'completed',
          type: 'one_to_one',
          typeLabel: 'Consultație Individuală',
          title: `Screen Recording - ${this.meetingCode}`,
          recordingMethod: 'simple-screen-sharing',
          recordedAt: new Date(),
          createdAt: new Date(),
          format: 'webm',
          downloadedBy: [],
          downloadAttempts: [],
          searchableEmails: [
            ...((this.recipientEmails.length > 0 ? this.recipientEmails : [this.recipientEmail])
              .map(email => email.toLowerCase().trim())),
            'cristina@tarotbyai.com'
          ].filter(Boolean)
        };
        
        const { setDoc } = await import('firebase/firestore');
        const recordingRef = doc(db, 'SimpleRecordings', this.meetingCode);
        await setDoc(recordingRef, recordingData);
        
        console.log('✅ [SIMPLE RECORDER] Created new document in SimpleRecordings');
      } else {
        console.error('❌ [SIMPLE RECORDER] Error saving to SimpleRecordings:', error);
      }
    }
  }

  async sendEmailNotification(downloadURL, duration) {
    // Determine which emails to use: array of emails or single email
    const emailsToSend = this.recipientEmails.length > 0 ? this.recipientEmails : 
                        this.recipientEmail ? [this.recipientEmail] : [];
    
    if (emailsToSend.length === 0) {
      console.log('⚠️ [SIMPLE RECORDER] No recipient emails for notification');
      return;
    }
    
    console.log(`📧 [SIMPLE RECORDER] Sending notifications to ${emailsToSend.length} emails`);
    
    // Send email to each recipient
    const emailPromises = emailsToSend.map(async (email, index) => {
      try {
        console.log(`📧 [SIMPLE RECORDER] Sending email ${index + 1}/${emailsToSend.length} to: ${email}`);
        
        const response = await fetch('/api/recording/send-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingCode: this.meetingCode,
            recipientEmail: email.trim(),
            downloadURL: downloadURL,
            duration: duration,
            recordingMethod: 'Screen Recording'
          }),
        });
        
        if (response.ok) {
          console.log(`✅ [SIMPLE RECORDER] Email sent successfully to ${email}`);
          return { email, success: true };
        } else {
          console.error(`❌ [SIMPLE RECORDER] Email failed for ${email}:`, response.status);
          return { email, success: false, error: `HTTP ${response.status}` };
        }
      } catch (error) {
        console.error(`❌ [SIMPLE RECORDER] Email error for ${email}:`, error);
        return { email, success: false, error: error.message };
      }
    });
    
    // Wait for all emails to complete
    const results = await Promise.all(emailPromises);
    
    // Log summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📧 [SIMPLE RECORDER] Email summary: ${successful} sent, ${failed} failed`);
    
    if (failed > 0) {
      console.error('❌ [SIMPLE RECORDER] Failed emails:', results.filter(r => !r.success));
    }
  }

  getStatus() {
    return {
      isRecording: this.isRecording,
      startTime: this.startTime,
      duration: this.startTime ? Math.round((new Date() - this.startTime) / 1000) : 0,
      chunksRecorded: this.recordedChunks.length
    };
  }
} 