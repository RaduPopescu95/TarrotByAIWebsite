// Agora Stream Recorder - Records video streams directly from Agora without screen share dialog
// Uses Canvas API to combine video streams and record the result

import { createRecordingLogger } from './recordingLogger';

export class AgoraStreamRecorder {
  constructor(options = {}) {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.canvas = null;
    this.canvasContext = null;
    this.animationFrame = null;
    this.startTime = null;
    this.streams = new Map(); // Store participant video streams
    this.videoElements = new Map(); // Store video elements for each stream
    
    this.options = {
      width: 1280,
      height: 720,
      frameRate: 30,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
      audioBitsPerSecond: 128000,  // 128 kbps
      mimeType: 'video/webm;codecs=vp9,opus',
      ...options
    };

    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    
    // Initialize detailed logging
    this.logger = createRecordingLogger('AgoraStreamRecorder');
    this.logger.info('AgoraStreamRecorder initialized', {
      options: this.options,
      timestamp: new Date().toISOString()
    });
    
    this.setupCanvas();
  }

  setupCanvas() {
    try {
      // Create canvas element for recording
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.options.width;
      this.canvas.height = this.options.height;
      this.canvasContext = this.canvas.getContext('2d');
      
      // Set canvas styles for better rendering
      this.canvasContext.fillStyle = '#000000';
      this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.logger.info('✅ Canvas setup completed', {
        width: this.canvas.width,
        height: this.canvas.height,
        contextType: '2d'
      });
    } catch (error) {
      this.logger.error('❌ Canvas setup failed', {
        error: error.message,
        errorStack: error.stack
      });
      throw error;
    }
  }

  // Add video stream from Agora participant
  addVideoStream(userId, stream) {
    try {
      this.logger.info('➕ Adding video stream', {
        userId,
        streamId: stream.id,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      // Create video element for this stream
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.muted = true; // Muted to avoid echo in recording
      videoElement.playsInline = true;
      
      // Store video element and stream
      this.videoElements.set(userId, videoElement);
      this.streams.set(userId, stream);
      
      this.logger.success(`✅ Video stream added for user ${userId}`);
      
    } catch (error) {
      this.logger.error('❌ Failed to add video stream', {
        userId,
        error: error.message,
        errorStack: error.stack
      });
    }
  }

  // Remove video stream when participant leaves
  removeVideoStream(userId) {
    try {
      this.logger.info('➖ Removing video stream', { userId });
      
      const videoElement = this.videoElements.get(userId);
      if (videoElement) {
        videoElement.srcObject = null;
        this.videoElements.delete(userId);
      }
      
      this.streams.delete(userId);
      
      this.logger.success(`✅ Video stream removed for user ${userId}`);
      
    } catch (error) {
      this.logger.error('❌ Failed to remove video stream', {
        userId,
        error: error.message
      });
    }
  }

  // Start recording the canvas
  async startRecording() {
    try {
      this.logger.info('🎬 Starting Agora stream recording...');
      
      // Check if we have any video streams
      if (this.streams.size === 0) {
        this.logger.warning('⚠️ No video streams available for recording');
        throw new Error('No video streams available for recording');
      }

      // Get canvas stream
      const canvasStream = this.canvas.captureStream(this.options.frameRate);
      
      this.logger.info('📺 Canvas stream captured', {
        streamId: canvasStream.id,
        tracks: canvasStream.getTracks().length,
        frameRate: this.options.frameRate
      });

      // Add audio tracks from Agora streams
      for (const [userId, stream] of this.streams) {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach(track => {
          if (!track.muted && track.enabled) {
            canvasStream.addTrack(track.clone());
            this.logger.info('🎵 Added audio track', {
              userId,
              trackId: track.id,
              trackLabel: track.label
            });
          }
        });
      }

      // Setup MediaRecorder for canvas stream
      const mediaRecorderOptions = {
        videoBitsPerSecond: this.options.videoBitsPerSecond,
        audioBitsPerSecond: this.options.audioBitsPerSecond
      };

      let mimeType = this.options.mimeType;
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        this.logger.warning('⚠️ Preferred MIME type not supported, falling back');
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Use default
        }
      }

      if (mimeType) {
        mediaRecorderOptions.mimeType = mimeType;
      }

      this.logger.info('⚙️ Configuring MediaRecorder for canvas', {
        options: mediaRecorderOptions,
        finalMimeType: mimeType || 'default'
      });

      this.mediaRecorder = new MediaRecorder(canvasStream, mediaRecorderOptions);
      this.recordedChunks = [];
      this.startTime = Date.now();

      // Setup MediaRecorder event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.logger.debug('📊 Recording chunk received', {
            chunkNumber: this.recordedChunks.length,
            chunkSize: event.data.size,
            totalSize: this.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0)
          });
        }
      };

      this.mediaRecorder.onstop = () => {
        this.logger.info('🛑 MediaRecorder stopped, processing recording');
        this.onRecordingStopped();
      };

      this.mediaRecorder.onerror = (event) => {
        this.logger.error('❌ MediaRecorder error', {
          error: event.error,
          state: this.mediaRecorder.state
        });
        this.onError(event.error);
      };

      this.mediaRecorder.onstart = () => {
        this.logger.success('▶️ MediaRecorder started for canvas recording');
      };

      // Start the drawing loop
      this.startDrawingLoop();
      
      // Start recording
      this.mediaRecorder.start(1000);
      
      this.logger.success('🎉 Agora stream recording started successfully', {
        streamsCount: this.streams.size,
        canvasSize: `${this.canvas.width}x${this.canvas.height}`,
        frameRate: this.options.frameRate
      });

      return { 
        success: true, 
        message: 'Recording started successfully - capturing video streams',
        streamsCount: this.streams.size
      };

    } catch (error) {
      this.logger.error('💥 Failed to start Agora stream recording', {
        error: error.message,
        errorStack: error.stack,
        streamsAvailable: this.streams.size
      });
      
      this.onError(error);
      return { 
        success: false, 
        message: 'Nu s-a putut începe înregistrarea: ' + error.message 
      };
    }
  }

  // Drawing loop to render video streams on canvas
  startDrawingLoop() {
    const drawFrame = () => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        return; // Stop drawing if not recording
      }

      // Clear canvas
      this.canvasContext.fillStyle = '#000000';
      this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw video streams
      const participants = Array.from(this.videoElements.entries());
      const participantCount = participants.length;

      if (participantCount === 0) {
        // No participants - draw placeholder
        this.drawPlaceholder();
      } else if (participantCount === 1) {
        // Single participant - full screen
        this.drawSingleParticipant(participants[0]);
      } else if (participantCount === 2) {
        // Two participants - side by side
        this.drawTwoParticipants(participants);
      } else {
        // Multiple participants - grid layout
        this.drawGridLayout(participants);
      }

      // Continue drawing loop
      this.animationFrame = requestAnimationFrame(drawFrame);
    };

    drawFrame();
    this.logger.info('🎨 Canvas drawing loop started');
  }

  drawPlaceholder() {
    this.canvasContext.fillStyle = '#333333';
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.canvasContext.fillStyle = '#ffffff';
    this.canvasContext.font = '48px Arial';
    this.canvasContext.textAlign = 'center';
    this.canvasContext.fillText(
      'Waiting for participants...',
      this.canvas.width / 2,
      this.canvas.height / 2
    );
  }

  drawSingleParticipant([userId, videoElement]) {
    if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
      this.canvasContext.drawImage(
        videoElement,
        0, 0,
        this.canvas.width,
        this.canvas.height
      );
    }
  }

  drawTwoParticipants(participants) {
    const halfWidth = this.canvas.width / 2;
    
    participants.forEach(([userId, videoElement], index) => {
      if (videoElement.readyState >= 2) {
        const x = index * halfWidth;
        this.canvasContext.drawImage(
          videoElement,
          x, 0,
          halfWidth,
          this.canvas.height
        );
      }
    });
  }

  drawGridLayout(participants) {
    const cols = Math.ceil(Math.sqrt(participants.length));
    const rows = Math.ceil(participants.length / cols);
    const cellWidth = this.canvas.width / cols;
    const cellHeight = this.canvas.height / rows;
    
    participants.forEach(([userId, videoElement], index) => {
      if (videoElement.readyState >= 2) {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        this.canvasContext.drawImage(
          videoElement,
          x, y,
          cellWidth,
          cellHeight
        );
      }
    });
  }

  stopRecording() {
    this.logger.info('⏹️ Stopping Agora stream recording');

    // Stop drawing loop
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    this.logger.success('✅ Agora stream recording stopped');
  }

  async onRecordingStopped() {
    try {
      this.logger.info('🔄 Processing Agora stream recording');

      if (this.recordedChunks.length === 0) {
        throw new Error('No recorded data available');
      }

      // Create video blob
      const mimeType = this.mediaRecorder.mimeType || 'video/webm';
      const videoBlob = new Blob(this.recordedChunks, { type: mimeType });
      
      const duration = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
      
      this.logger.success('✅ Agora stream recording processed', {
        blobSize: videoBlob.size,
        duration: duration,
        mimeType: mimeType,
        chunksCount: this.recordedChunks.length
      });
      
      this.onProgress('Preparing upload...');
      
      // Upload to Firebase Storage using the same method as SimpleVideoRecorder
      await this.uploadToFirebase(videoBlob, duration);
      
    } catch (error) {
      this.logger.error('💥 Failed to process Agora stream recording', {
        error: error.message,
        errorStack: error.stack
      });
      this.onError(error);
    }
  }

  // Use the same upload logic as SimpleVideoRecorder
  async uploadToFirebase(videoBlob, duration) {
    const uploadStartTime = Date.now();
    
    try {
      this.logger.info('🔥 Starting Firebase upload for Agora recording');

      // Dynamic import to avoid SSR issues
      const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { getAuth } = await import('firebase/auth');
      
      const storage = getStorage();
      const auth = getAuth();
      
      // Generate filename
      const timestamp = Date.now();
      const meetingCode = this.getMeetingCode();
      const extension = this.getFileExtension();
      const fileName = `agora_recording_${timestamp}.${extension}`;
      
      // Create storage reference
      const storagePath = `recordings/${meetingCode}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      this.logger.info('📤 Starting Firebase upload', {
        storagePath,
        fileName,
        meetingCode,
        fileSize: videoBlob.size
      });
      
      this.onProgress('Uploading recording...');
      
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, videoBlob);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            this.onProgress(`Uploading: ${progress.toFixed(0)}%`);
          },
          (error) => {
            this.logger.error('💥 Firebase upload failed', {
              error: error.message,
              errorCode: error.code
            });
            this.onError(error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              const recordingData = {
                meetingCode,
                fileName,
                downloadURL,
                size: videoBlob.size,
                duration,
                uploadTime: timestamp,
                userEmail: auth.currentUser?.email || 'unknown',
                status: 'completed',
                recordingType: 'agora_streams'
              };
              
              this.logger.success('🎊 Agora recording upload completed', recordingData);

              // Save metadata and send notification
              await this.saveRecordingMetadata(recordingData);
              await this.sendRecordingNotification(meetingCode, downloadURL);

              this.onComplete(recordingData);
              resolve(recordingData);
              
            } catch (error) {
              this.logger.error('💥 Post-upload processing failed', {
                error: error.message
              });
              this.onError(error);
              reject(error);
            }
          }
        );
      });
      
    } catch (error) {
      this.logger.error('💥 Firebase upload initialization failed', {
        error: error.message
      });
      this.onError(error);
      throw error;
    }
  }

  getMeetingCode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('meetingCode') || 
           urlParams.get('conferenceId') ||
           window.location.pathname.split('/').pop() ||
           `meeting_${Date.now()}`;
  }

  getFileExtension() {
    const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('webm')) return 'webm';
    return 'webm';
  }

  async saveRecordingMetadata(data) {
    try {
      const response = await fetch('/api/recording/save-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.success('✅ Agora recording metadata saved', result);
      return result;
      
    } catch (error) {
      this.logger.error('💥 Error saving Agora recording metadata', {
        error: error.message
      });
      throw error;
    }
  }

  async sendRecordingNotification(meetingCode, downloadURL) {
    try {
      const response = await fetch('/api/recording/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingCode, downloadURL })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.success('✅ Agora recording notification sent', result);
      return result;
      
    } catch (error) {
      this.logger.error('💥 Error sending Agora recording notification', {
        error: error.message
      });
      // Don't throw - notification failure shouldn't break recording
    }
  }

  // Clean up resources
  cleanup() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Clean up video elements
    this.videoElements.forEach(video => {
      video.srcObject = null;
    });
    
    this.videoElements.clear();
    this.streams.clear();
    
    this.logger.info('🧹 AgoraStreamRecorder cleanup completed');
  }

  // Static method to check if this recording method is supported
  static isSupported() {
    return !!(document.createElement('canvas').getContext &&
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