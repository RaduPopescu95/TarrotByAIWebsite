// Simple video recorder that uses browser MediaRecorder API + Firebase Storage
// Much simpler than Agora Cloud Recording!

import { createRecordingLogger } from './recordingLogger';

export class SimpleVideoRecorder {
  constructor(options = {}) {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.startTime = null;
    this.chunkCount = 0;
    this.totalDataReceived = 0;
    this.options = {
      videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
      audioBitsPerSecond: 128000,  // 128 kbps for audio
      mimeType: 'video/webm;codecs=vp9,opus',
      ...options
    };
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    
    // Initialize detailed logging
    this.logger = createRecordingLogger('SimpleVideoRecorder');
    this.logger.info('SimpleVideoRecorder initialized', {
      options: this.options,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    // Log browser capabilities immediately
    this.logger.logBrowserCapabilities();
  }

  async startRecording() {
    try {
      this.logger.info('🎬 Starting recording process...');
      
      // Request screen + audio capture
      this.logger.info('📺 Requesting display media access', {
        requestedConstraints: {
          video: {
            mediaSource: 'screen',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        }
      });

      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Log actual stream properties
      const videoTrack = this.stream.getVideoTracks()[0];
      const audioTrack = this.stream.getAudioTracks()[0];
      const videoSettings = videoTrack ? videoTrack.getSettings() : null;
      const audioSettings = audioTrack ? audioTrack.getSettings() : null;

      this.logger.success('✅ Display media access granted', {
        videoTrack: videoTrack ? {
          label: videoTrack.label,
          kind: videoTrack.kind,
          enabled: videoTrack.enabled,
          readyState: videoTrack.readyState,
          settings: videoSettings
        } : null,
        audioTrack: audioTrack ? {
          label: audioTrack.label,
          kind: audioTrack.kind,
          enabled: audioTrack.enabled,
          readyState: audioTrack.readyState,
          settings: audioSettings
        } : null
      });

      // Check if browser supports the preferred format
      let mimeType = this.options.mimeType;
      this.logger.info('🔍 Checking MIME type support', {
        preferredType: this.options.mimeType,
        supported: MediaRecorder.isTypeSupported(this.options.mimeType)
      });

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        this.logger.warning('⚠️ Preferred MIME type not supported, falling back');
        
        // Fallback to basic webm
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          this.logger.warning('⚠️ Basic webm not supported, using default');
          // Last resort
          mimeType = '';
        }
      }

      // Configure MediaRecorder
      const mediaRecorderOptions = {
        videoBitsPerSecond: this.options.videoBitsPerSecond,
        audioBitsPerSecond: this.options.audioBitsPerSecond
      };

      if (mimeType) {
        mediaRecorderOptions.mimeType = mimeType;
      }

      this.logger.info('⚙️ Configuring MediaRecorder', {
        options: mediaRecorderOptions,
        finalMimeType: mimeType || 'default'
      });

      this.mediaRecorder = new MediaRecorder(this.stream, mediaRecorderOptions);
      this.recordedChunks = [];
      this.chunkCount = 0;
      this.totalDataReceived = 0;
      this.startTime = Date.now();

      // Event handlers with detailed logging
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.chunkCount++;
          this.totalDataReceived += event.data.size;
          
          this.logger.debug('📊 Recording chunk received', {
            chunkNumber: this.chunkCount,
            chunkSize: event.data.size,
            chunkSizeFormatted: this.logger.formatFileSize(event.data.size),
            totalDataReceived: this.totalDataReceived,
            totalDataFormatted: this.logger.formatFileSize(this.totalDataReceived),
            totalChunks: this.recordedChunks.length,
            elapsedTime: Math.floor((Date.now() - this.startTime) / 1000)
          });
        }
      };

      this.mediaRecorder.onstop = () => {
        this.logger.info('🛑 MediaRecorder stopped, beginning post-processing');
        this.onRecordingStopped();
      };

      this.mediaRecorder.onerror = (event) => {
        this.logger.error('❌ MediaRecorder error occurred', {
          error: event.error,
          errorName: event.error?.name,
          errorMessage: event.error?.message,
          mediaRecorderState: this.mediaRecorder.state
        });
        this.onError(event.error);
      };

      this.mediaRecorder.onstart = () => {
        this.logger.success('▶️ MediaRecorder started successfully', {
          state: this.mediaRecorder.state,
          mimeType: this.mediaRecorder.mimeType,
          videoBitsPerSecond: this.mediaRecorder.videoBitsPerSecond,
          audioBitsPerSecond: this.mediaRecorder.audioBitsPerSecond
        });
      };

      this.mediaRecorder.onpause = () => {
        this.logger.info('⏸️ MediaRecorder paused');
      };

      this.mediaRecorder.onresume = () => {
        this.logger.info('▶️ MediaRecorder resumed');
      };

      // Handle user stopping screen share
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.logger.warning('📺 Screen share ended by user (browser/system)', {
          reason: 'User stopped screen sharing',
          recordingState: this.mediaRecorder.state,
          elapsedTime: Math.floor((Date.now() - this.startTime) / 1000)
        });
        this.stopRecording();
      });

      // Start recording (save chunks every second)
      this.logger.info('🚀 Starting MediaRecorder with 1-second intervals');
      this.mediaRecorder.start(1000);
      
      const result = { 
        success: true, 
        message: 'Recording started successfully',
        mimeType: this.mediaRecorder.mimeType || mimeType || 'video/webm'
      };

      this.logger.success('🎉 Recording initialization completed', result);
      return result;

    } catch (error) {
      this.logger.error('💥 Recording start failed', {
        error: error.message,
        errorName: error.name,
        errorStack: error.stack,
        userAgent: navigator.userAgent
      });
      
      this.onError(error);
      
      let message = 'Nu s-a putut începe înregistrarea';
      if (error.name === 'NotAllowedError') {
        message = 'Permisiunea pentru partajarea ecranului a fost refuzată';
        this.logger.warning('🚫 User denied screen share permission');
      } else if (error.name === 'NotSupportedError') {
        message = 'Browserul nu suportă înregistrarea video';
        this.logger.error('🚫 Browser does not support video recording');
      } else if (error.name === 'NotReadableError') {
        message = 'Nu se poate accesa ecranul pentru înregistrare';
        this.logger.error('🚫 Cannot access screen for recording');
      }
      
      return { success: false, message };
    }
  }

  stopRecording() {
    this.logger.info('⏹️ Stop recording requested', {
      currentState: this.mediaRecorder?.state,
      hasStream: !!this.stream,
      elapsedTime: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
      totalChunks: this.recordedChunks.length,
      totalDataSize: this.totalDataReceived,
      totalDataFormatted: this.logger.formatFileSize(this.totalDataReceived)
    });

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.logger.info('🛑 Stopping MediaRecorder...');
      this.mediaRecorder.stop();
    } else {
      this.logger.warning('⚠️ MediaRecorder not in recording state', {
        currentState: this.mediaRecorder?.state || 'null'
      });
    }
    
    // Stop all tracks
    if (this.stream) {
      const tracks = this.stream.getTracks();
      this.logger.info('🔇 Stopping media tracks', {
        totalTracks: tracks.length,
        trackTypes: tracks.map(track => ({ kind: track.kind, label: track.label, readyState: track.readyState }))
      });

      tracks.forEach(track => {
        track.stop();
        this.logger.debug(`🔇 Stopped ${track.kind} track`, {
          label: track.label,
          readyState: track.readyState
        });
      });

      this.logger.success('✅ All media tracks stopped');
    } else {
      this.logger.warning('⚠️ No stream to stop');
    }
  }

  async onRecordingStopped() {
    const processingStartTime = Date.now();
    
    try {
      this.logger.info('🔄 Processing stopped recording', {
        chunksReceived: this.recordedChunks.length,
        totalDataReceived: this.totalDataReceived,
        totalDataFormatted: this.logger.formatFileSize(this.totalDataReceived),
        recordingDuration: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0
      });

      if (this.recordedChunks.length === 0) {
        this.logger.error('❌ No recording data available');
        throw new Error('No recorded data available');
      }

      // Create the video blob
      const mimeType = this.mediaRecorder.mimeType || 'video/webm';
      this.logger.info('🧩 Creating video blob from chunks', {
        mimeType,
        chunkCount: this.recordedChunks.length,
        chunkSizes: this.recordedChunks.map((chunk, index) => ({
          index,
          size: chunk.size,
          type: chunk.type
        }))
      });

      const videoBlob = new Blob(this.recordedChunks, { type: mimeType });
      
      this.logger.success('✅ Video blob created successfully', {
        blobSize: videoBlob.size,
        blobSizeFormatted: this.logger.formatFileSize(videoBlob.size),
        blobType: videoBlob.type,
        compressionRatio: this.totalDataReceived > 0 ? (videoBlob.size / this.totalDataReceived).toFixed(3) : 'N/A'
      });
      
      // Calculate duration
      const duration = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
      
      this.logger.info('📊 Recording session summary', {
        duration: `${duration} seconds`,
        finalFileSize: this.logger.formatFileSize(videoBlob.size),
        averageBitrate: duration > 0 ? Math.round((videoBlob.size * 8) / duration) + ' bps' : 'N/A',
        chunksPerSecond: duration > 0 ? (this.recordedChunks.length / duration).toFixed(2) : 'N/A'
      });
      
      this.onProgress('Preparing upload...');
      
      // Upload to Firebase Storage
      await this.uploadToFirebase(videoBlob, duration, processingStartTime);
      
    } catch (error) {
      this.logger.error('💥 Recording processing failed', {
        error: error.message,
        errorStack: error.stack,
        processingTime: Date.now() - processingStartTime,
        recordedChunks: this.recordedChunks.length,
        totalDataReceived: this.totalDataReceived
      });
      this.onError(error);
    }
  }

  async uploadToFirebase(videoBlob, duration, processingStartTime) {
    const uploadStartTime = Date.now();
    
    try {
      this.logger.info('🔥 Initializing Firebase upload', {
        blobSize: videoBlob.size,
        blobSizeFormatted: this.logger.formatFileSize(videoBlob.size),
        duration,
        processingTime: uploadStartTime - processingStartTime
      });

      // Dynamic import to avoid SSR issues
      const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { getAuth } = await import('firebase/auth');
      
      const storage = getStorage();
      const auth = getAuth();
      
      this.logger.info('✅ Firebase modules loaded', {
        hasStorage: !!storage,
        hasAuth: !!auth,
        currentUser: auth.currentUser?.email || 'not authenticated'
      });
      
      // Generate filename
      const timestamp = Date.now();
      const meetingCode = this.getMeetingCode();
      const extension = this.getFileExtension();
      const fileName = `recording_${timestamp}.${extension}`;
      
      // Create storage reference
      const storagePath = `recordings/${meetingCode}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      this.logger.info('📤 Starting Firebase upload', {
        storagePath,
        fileName,
        meetingCode,
        fileExtension: extension,
        estimatedUploadTime: `${Math.round(videoBlob.size / (1024 * 1024 / 10))} seconds (est.)`
      });
      
      this.onProgress('Uploading recording...');
      
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, videoBlob);
      
      return new Promise((resolve, reject) => {
        let lastProgressTime = Date.now();
        let lastBytesTransferred = 0;
        
        uploadTask.on('state_changed',
          (snapshot) => {
            // Progress tracking with detailed analytics
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const currentTime = Date.now();
            const timeDiff = currentTime - lastProgressTime;
            const bytesDiff = snapshot.bytesTransferred - lastBytesTransferred;
            const speed = timeDiff > 0 ? (bytesDiff / timeDiff) * 1000 : 0; // bytes per second
            const eta = speed > 0 ? (snapshot.totalBytes - snapshot.bytesTransferred) / speed : 0;
            
            this.logger.progress('📊 Upload progress update', {
              progress: `${progress.toFixed(1)}%`,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              bytesTransferredFormatted: this.logger.formatFileSize(snapshot.bytesTransferred),
              totalBytesFormatted: this.logger.formatFileSize(snapshot.totalBytes),
              uploadSpeed: speed > 0 ? this.logger.formatFileSize(speed) + '/s' : 'calculating...',
              estimatedTimeRemaining: eta > 0 ? `${Math.round(eta)} seconds` : 'calculating...',
              state: snapshot.state
            });
            
            this.onProgress(`Uploading: ${progress.toFixed(0)}%`);
            
            lastProgressTime = currentTime;
            lastBytesTransferred = snapshot.bytesTransferred;
          },
          (error) => {
            this.logger.error('💥 Firebase upload failed', {
              error: error.message,
              errorCode: error.code,
              errorStack: error.stack,
              uploadTime: Date.now() - uploadStartTime,
              serverResponse: error.serverResponse
            });
            this.onError(error);
            reject(error);
          },
          async () => {
            try {
              const uploadEndTime = Date.now();
              const uploadDuration = uploadEndTime - uploadStartTime;
              
              // Upload completed
              this.logger.success('🎉 Firebase upload completed', {
                uploadDuration: `${uploadDuration}ms`,
                uploadDurationFormatted: `${(uploadDuration / 1000).toFixed(1)} seconds`,
                averageSpeed: this.logger.formatFileSize(videoBlob.size / (uploadDuration / 1000)) + '/s',
                totalProcessingTime: uploadEndTime - processingStartTime
              });

              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              this.logger.info('🔗 Download URL obtained', {
                downloadURL,
                urlLength: downloadURL.length
              });
              
              const recordingData = {
                meetingCode,
                fileName,
                downloadURL,
                size: videoBlob.size,
                duration,
                uploadTime: timestamp,
                userEmail: auth.currentUser?.email || 'unknown',
                status: 'completed'
              };
              
              // Save metadata
              this.onProgress('Saving recording info...');
              this.logger.info('💾 Saving recording metadata...');
              await this.saveRecordingMetadata(recordingData);
              
              // Send notification
              this.onProgress('Sending notification...');
              this.logger.info('📧 Sending notification email...');
              await this.sendRecordingNotification(meetingCode, downloadURL);
              
              const totalTime = Date.now() - processingStartTime;
              
              this.logger.success('🎊 Complete recording process finished', {
                totalProcessingTime: `${totalTime}ms`,
                totalProcessingTimeFormatted: `${(totalTime / 1000).toFixed(1)} seconds`,
                recordingData
              });

              // Log final session statistics
              this.logger.logSessionStats({
                duration,
                fileSize: videoBlob.size,
                format: extension,
                chunks: this.recordedChunks.length,
                uploadTime: uploadDuration,
                processingTime: totalTime
              });

              this.onComplete(recordingData);
              resolve(recordingData);
              
            } catch (error) {
              this.logger.error('💥 Post-upload processing failed', {
                error: error.message,
                errorStack: error.stack,
                phase: 'metadata_save_or_notification',
                uploadTime: Date.now() - uploadStartTime
              });
              this.onError(error);
              reject(error);
            }
          }
        );
      });
      
    } catch (error) {
      this.logger.error('💥 Firebase upload initialization failed', {
        error: error.message,
        errorStack: error.stack,
        initializationTime: Date.now() - uploadStartTime
      });
      this.onError(error);
      throw error;
    }
  }

  getMeetingCode() {
    // Try to extract meeting code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const meetingCode = urlParams.get('meetingCode') || 
                       urlParams.get('conferenceId') ||
                       window.location.pathname.split('/').pop();
    
    return meetingCode || `meeting_${Date.now()}`;
  }

  getFileExtension() {
    const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('webm')) return 'webm';
    return 'webm'; // default
  }

  async saveRecordingMetadata(data) {
    try {
      this.logger.info('💾 Sending metadata to API', {
        meetingCode: data.meetingCode,
        fileName: data.fileName,
        fileSize: data.size,
        fileSizeFormatted: this.logger.formatFileSize(data.size),
        duration: data.duration,
        userEmail: data.userEmail
      });

      const response = await fetch('/api/recording/save-metadata', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      this.logger.info('📡 Metadata API response received', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('❌ Metadata API request failed', {
          status: response.status,
          statusText: response.statusText,
          errorResponse: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.success('✅ Recording metadata saved successfully', {
        result,
        documentId: result.id || 'unknown'
      });
      return result;
      
    } catch (error) {
      this.logger.error('💥 Error saving recording metadata', {
        error: error.message,
        errorStack: error.stack,
        dataSize: JSON.stringify(data).length,
        meetingCode: data.meetingCode
      });
      throw error;
    }
  }

  async sendRecordingNotification(meetingCode, downloadURL) {
    try {
      this.logger.info('📧 Sending recording notification', {
        meetingCode,
        downloadURLLength: downloadURL.length,
        downloadURLDomain: new URL(downloadURL).hostname
      });

      const notificationData = { meetingCode, downloadURL };

      const response = await fetch('/api/recording/send-notification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      this.logger.info('📡 Notification API response received', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('❌ Notification API request failed', {
          status: response.status,
          statusText: response.statusText,
          errorResponse: errorText,
          meetingCode
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.success('✅ Notification sent successfully', {
        result,
        recipientCount: result.recipients || 'unknown',
        emailsSent: result.emailsSent || 'unknown'
      });
      return result;
      
    } catch (error) {
      this.logger.error('💥 Error sending notification', {
        error: error.message,
        errorStack: error.stack,
        meetingCode,
        downloadURLPresent: !!downloadURL
      });
      // Don't throw here - notification failure shouldn't break the recording
      this.logger.warning('⚠️ Continuing despite notification failure');
    }
  }

  // Utility method to check browser support
  static isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getDisplayMedia && 
              window.MediaRecorder &&
              MediaRecorder.isTypeSupported('video/webm'));
  }

  // Get supported mime types
  static getSupportedMimeTypes() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    
    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }
} 