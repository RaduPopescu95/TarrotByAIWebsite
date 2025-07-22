// Agora Stream Recorder - SIMPLIFIED CLIENT-SIDE ONLY
// Records video streams directly from Agora and uploads to Firebase Storage from client

import { createRecordingLogger } from './recordingLogger';

export class AgoraStreamRecorder {
  constructor(options = {}) {
    console.log('🚀 [AGORA RECORDER v4.0 FORCE RELOAD] === CONSTRUCTOR CALLED ===', options);
    console.error('🚀 [AGORA RECORDER v4.0 FORCE RELOAD] ERROR LOG TO ENSURE VISIBILITY');
    alert('AGORA RECORDER v4.0 LOADED'); // Force visible confirmation
    window.AGORA_RECORDER_VERSION = 'v4.0'; // Global marker
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.canvas = null;
    this.canvasContext = null;
    this.animationFrame = null;
    this.startTime = null;
    this.videoElements = new Map(); // Store video elements for recording
    this.isUploading = false; // Track upload state
    
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
    
    // Store recipient email for proper metadata saving
    this.recipientEmail = null;
    
    // Initialize detailed logging
    this.logger = createRecordingLogger('AgoraStreamRecorder');
    this.logger.info('🎥 AgoraStreamRecorder SIMPLIFIED - Client-Side Only', {
      options: this.options,
      timestamp: new Date().toISOString()
    });
    
    this.setupCanvas();
    this.setupBrowserWarnings();
  }

  static isSupported() {
    if (typeof window === 'undefined') return false;
    
    try {
      return !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getDisplayMedia &&
        window.MediaRecorder &&
        HTMLCanvasElement.prototype.captureStream
      );
    } catch (error) {
      console.warn('🎥 Recording support check failed:', error);
      return false;
    }
  }

  static getSupportedMimeTypes() {
    if (typeof window === 'undefined') return [];
    
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus', 
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp9,vorbis', // Fallback audio codec
      'video/webm;codecs=vp8,vorbis', // Fallback audio codec
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4;codecs=h264,aac', // MP4 with AAC audio
      'video/mp4'
    ];
    
    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }

  static getAudioSupportedMimeTypes() {
    if (typeof window === 'undefined') return [];
    
    const audioTypes = [
      'audio/webm;codecs=opus',
      'audio/webm;codecs=vorbis',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg;codecs=vorbis',
      'audio/mp4;codecs=aac',
      'audio/mpeg'
    ];
    return audioTypes.filter(type => MediaRecorder.isTypeSupported(type));
  }

  // 🎵 SELECT BEST MIME TYPE based on audio availability
  selectBestMimeType(hasAudio) {
    const supportedTypes = AgoraStreamRecorder.getSupportedMimeTypes();
    
    this.logger.info('🎯 Selecting best MIME type:', {
      hasAudio,
      availableTypes: supportedTypes,
      preferredType: this.options.mimeType
    });

    // Try preferred type first
    if (MediaRecorder.isTypeSupported(this.options.mimeType)) {
      this.logger.success(`✅ Using preferred MIME type: ${this.options.mimeType}`);
      return this.options.mimeType;
    }

    // Fallback priority list based on audio availability
    const fallbackTypes = hasAudio ? [
      'video/webm;codecs=vp9,opus',  // Best quality with OPUS audio
      'video/webm;codecs=vp8,opus',  // Good quality with OPUS audio  
      'video/webm;codecs=vp9,vorbis', // Fallback audio codec
      'video/webm;codecs=vp8,vorbis', // Fallback audio codec
      'video/mp4;codecs=h264,aac',   // MP4 with AAC audio
      'video/webm',                  // Basic WebM
      'video/mp4'                    // Basic MP4
    ] : [
      'video/webm;codecs=vp9',       // Video only - high quality
      'video/webm;codecs=vp8',       // Video only - good quality
      'video/webm',                  // Basic WebM
      'video/mp4'                    // Basic MP4
    ];

    for (const type of fallbackTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        this.logger.warning(`⚠️ Fallback to MIME type: ${type} (hasAudio: ${hasAudio})`);
        return type;
      }
    }

    this.logger.error('❌ No supported MIME type found, using browser default');
    return ''; // Let browser choose
  }

  setupCanvas() {
    if (typeof window === 'undefined') return;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.canvasContext = this.canvas.getContext('2d');
    
    // Set canvas style for better rendering
    this.canvasContext.fillStyle = '#000000';
    this.canvasContext.font = '24px Arial';
    this.canvasContext.textAlign = 'center';
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.logger.info('🎨 Canvas setup completed', {
      dimensions: `${this.canvas.width}x${this.canvas.height}`,
      frameRate: this.options.frameRate
    });
  }

  setupBrowserWarnings() {
    if (typeof window === 'undefined') return;
    
    // Check for potential issues
    const warnings = [];
    
    if (!MediaRecorder.isTypeSupported(this.options.mimeType)) {
      warnings.push('Preferred MIME type not supported');
    }
    
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
      warnings.push('Safari has limited recording capabilities');
    }
    
    if (warnings.length > 0) {
      this.logger.warning('⚠️ Browser compatibility warnings:', warnings);
    }
  }

  // REMOVED: Old stream-based methods replaced with direct video element handling
  // addVideoStream() and removeVideoStream() are no longer needed
  // We now use addVideoElement() and removeVideoElement() for better control

  removeVideoElement(uid) {
    try {
      this.logger.info(`➖ Removing video element for UID: ${uid}`);
      
      // Remove video element from our tracking
      if (this.videoElements.has(uid)) {
        this.videoElements.delete(uid);
        this.logger.success(`✅ Video element removed for UID: ${uid}`);
      } else {
        this.logger.warning(`⚠️ Video element not found for UID: ${uid}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to remove video element for UID: ${uid}`, error);
    }
  }

  async startRecording() {
    alert('🎬 [v4.2] METHOD STARTED!'); // FIRST THING
    
    try {
      console.log('🎬 [AUDIO DEBUG v4.2] === START RECORDING CALLED ===');
      console.error('🎬 [AUDIO DEBUG v4.2] === START RECORDING CALLED === (ERROR LOG)');
      
      // Check browser support FIRST
      if (!AgoraStreamRecorder.isSupported()) {
        alert('❌ Browser not supported!');
        throw new Error('Browser-ul nu suportă înregistrarea video');
      }
      
      alert('✅ Browser check passed!');
      
      this.logger.info('🎬 [NEW AUDIO SYSTEM v2.0] Starting Agora stream recording (client-side only)');
      console.log('🎬 [NEW AUDIO SYSTEM v2.0] Starting Agora stream recording (client-side only)');
      this.onProgress('🎬 Pregătire înregistrare...');

      alert('📹 About to capture video elements...');
      
      // Capture existing Agora video elements
      this.onProgress('🔍 Căutare elemente video...');
      const capturedStreams = await this.captureExistingAgoraStreams();
      
      alert(`📹 Captured ${capturedStreams} video streams!`);
      
      this.logger.info(`📊 Captured ${capturedStreams} video streams from Agora`);
      
      if (capturedStreams === 0) {
        this.logger.warning('⚠️ No video streams captured - recording canvas only');
        // Continue anyway - we'll record the canvas which shows "waiting for participants"
      }

      alert('🎨 About to setup canvas...');
      
      // Setup canvas stream (VIDEO ONLY)
      this.onProgress('🎨 Configurare canvas...');
      const canvasStream = this.canvas.captureStream(this.options.frameRate);
      
      alert('🎤 About to capture audio...');
      
      // 🎤 NEW: Capture AUDIO from Agora video elements
      this.onProgress('🎤 Capturare audio...');
      const audioStream = await this.captureAudioFromAgoraStreams();
      
      alert(`🎤 Audio captured! Tracks: ${audioStream.getAudioTracks().length}`);
      
      // 🔗 NEW: Combine video (canvas) + audio streams
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(), // Video from canvas
        ...audioStream.getAudioTracks()   // Audio from Agora streams
      ]);
      
      this.logger.info('🎬 Combined stream created', {
        videoTracks: combinedStream.getVideoTracks().length,
        audioTracks: combinedStream.getAudioTracks().length,
        hasVideo: combinedStream.getVideoTracks().length > 0,
        hasAudio: combinedStream.getAudioTracks().length > 0,
        audioTrackDetails: combinedStream.getAudioTracks().map(track => ({
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        }))
      });

      // Setup MediaRecorder for COMBINED stream (video + audio)
      const mediaRecorderOptions = {
        videoBitsPerSecond: this.options.videoBitsPerSecond,
        audioBitsPerSecond: this.options.audioBitsPerSecond
      };

      // 🎵 ENHANCED MIME TYPE SELECTION with audio codec fallbacks
      let mimeType = this.selectBestMimeType(combinedStream.getAudioTracks().length > 0);

      if (mimeType) {
        mediaRecorderOptions.mimeType = mimeType;
      }

      this.logger.info('⚙️ Configuring MediaRecorder for combined stream', {
        options: mediaRecorderOptions,
        finalMimeType: mimeType || 'browser-default',
        streamTracks: {
          video: combinedStream.getVideoTracks().length,
          audio: combinedStream.getAudioTracks().length
        },
        audioTrackInfo: combinedStream.getAudioTracks().map(track => ({
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label
        })),
        supportedMimeTypes: AgoraStreamRecorder.getSupportedMimeTypes(),
        supportedAudioTypes: AgoraStreamRecorder.getAudioSupportedMimeTypes()
      });

      // 🎥 Use COMBINED stream instead of canvas-only stream
      this.mediaRecorder = new MediaRecorder(combinedStream, mediaRecorderOptions);
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
        this.logger.info('🔍 Final recording info:', {
          chunksCount: this.recordedChunks.length,
          totalSize: this.recordedChunks.reduce((size, chunk) => size + chunk.size, 0),
          mimeType: this.mediaRecorder.mimeType,
          state: this.mediaRecorder.state
        });
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
        this.logger.success('▶️ MediaRecorder started with video + audio');
        this.onProgress('🔴 Înregistrare în curs (video + audio)...');
      };

      // Start the drawing loop
      this.startDrawingLoop();

      // Start recording
      this.mediaRecorder.start(1000); // Capture data every second

      this.logger.success('✅ Agora stream recording started successfully with audio');
      
      return {
        success: true,
        message: 'Recording started successfully with audio',
        startTime: this.startTime,
        hasAudio: combinedStream.getAudioTracks().length > 0,
        hasVideo: combinedStream.getVideoTracks().length > 0
      };

    } catch (error) {
      this.logger.error('💥 Failed to start Agora stream recording', {
        error: error.message,
        errorStack: error.stack
      });
      this.onError(error);
      throw error;
    }
  }

  async captureExistingAgoraStreams() {
    let capturedCount = 0;
    
    try {
      console.log('🔍 [VIDEO CAPTURE v2.0] Waiting for AgoraUIKit videos to load...');
      this.logger.info('🔍 [VIDEO CAPTURE v2.0] Waiting for AgoraUIKit videos to load...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run audio diagnostics first
      this.debugAudioCapture();
      
      // Multiple attempts to find videos as they load asynchronously
      for (let attempt = 1; attempt <= 3; attempt++) {
        this.logger.info(`🎥 Video capture attempt ${attempt}/3`);
        
        const allVideos = document.querySelectorAll('video');
        this.logger.info(`📹 Found ${allVideos.length} video elements on attempt ${attempt}`);
        
        for (let i = 0; i < allVideos.length; i++) {
          const videoElement = allVideos[i];
          
          this.logger.info(`🔍 Examining video element ${i}:`, {
            id: videoElement.id,
            className: videoElement.className,
            width: videoElement.videoWidth,
            height: videoElement.videoHeight,
            readyState: videoElement.readyState,
            hasSource: !!videoElement.srcObject,
            paused: videoElement.paused,
            muted: videoElement.muted,
            // 🎤 NEW: Audio information
            hasAudioTracks: videoElement.srcObject ? videoElement.srcObject.getAudioTracks().length : 0,
            audioTrackEnabled: videoElement.srcObject ? 
              videoElement.srcObject.getAudioTracks().map(t => t.enabled) : []
          });
          
          // Check if video has actual video content (not just audio)
          if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            const uid = videoElement.id || `agora_video_${capturedCount}_${Date.now()}`;
            
            // Don't use cloned stream - use the actual video element directly for drawing
            this.addVideoElement(uid, videoElement);
            capturedCount++;
            
            this.logger.success(`✅ Added video element for recording: ${uid}`, {
              videoWidth: videoElement.videoWidth,
              videoHeight: videoElement.videoHeight,
              readyState: videoElement.readyState,
              // 🎤 NEW: Audio track info
              audioTracks: videoElement.srcObject ? videoElement.srcObject.getAudioTracks().length : 0
            });
          } else if (videoElement.srcObject && videoElement.srcObject instanceof MediaStream) {
            const stream = videoElement.srcObject;
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks(); // 🎤 NEW: Check audio too
            
            if (videoTracks.length > 0 || audioTracks.length > 0) { // 🎤 NEW: Accept if has audio even without video
              const videoTrack = videoTracks[0];
              this.logger.info(`📊 Stream track details:`, {
                videoTrackId: videoTrack?.id,
                videoTrackState: videoTrack?.readyState,
                videoTrackEnabled: videoTrack?.enabled,
                videoTrackKind: videoTrack?.kind,
                videoTrackSettings: videoTrack?.getSettings(),
                // 🎤 NEW: Audio track details
                audioTracksCount: audioTracks.length,
                audioTrackDetails: audioTracks.map(track => ({
                  id: track.id,
                  enabled: track.enabled,
                  kind: track.kind,
                  readyState: track.readyState
                }))
              });
              
              // Add even if dimensions are not yet available - they might load
              const uid = videoElement.id || `agora_pending_${capturedCount}_${Date.now()}`;
              this.addVideoElement(uid, videoElement);
              capturedCount++;
              
              this.logger.info(`📝 Added pending video element: ${uid} (video: ${videoTracks.length}, audio: ${audioTracks.length})`);
            }
          }
        }
        
        if (capturedCount > 0) {
          this.logger.success(`🎯 Found ${capturedCount} video elements on attempt ${attempt}`);
          break;
        }
        
        // Wait before next attempt
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Final audio capture summary
      this.logger.info('🎵 Final audio capture attempt summary:', {
        videoElementsCaptured: capturedCount,
        totalVideoElements: document.querySelectorAll('video').length
      });
      
    } catch (error) {
      this.logger.error('❌ Error in captureExistingAgoraStreams:', error);
    }
    
    return capturedCount;
  }

  async captureAudioFromAgoraStreams() {
    let allAudioTracks = [];
    
    console.log('🎤 [AUDIO CAPTURE v3.1] Searching for audio tracks in <video> & <audio> elements...');
    this.logger.info('🎤 [AUDIO CAPTURE v3.1] Searching for audio tracks in <video> & <audio> elements...');

    const examineElement = (element, label) => {
      if (element.srcObject && element.srcObject instanceof MediaStream) {
        const stream = element.srcObject;
        const streamAudioTracks = stream.getAudioTracks();

        this.logger.info(`🔍 Element ${label}:`, {
          tag: element.tagName.toLowerCase(),
          hasStream: !!stream,
          audioTracks: streamAudioTracks.length,
          mutedProp: element.muted,
          volume: element.volume,
          trackDetails: streamAudioTracks.map(track => ({
            id: track.id,
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted
          }))
        });

        streamAudioTracks.forEach(track => {
          if (track.kind === 'audio' && track.readyState === 'live') {
            if (!track.enabled) {
              track.enabled = true;
              this.logger.warning(`🔧 Force-enabled audio track ${track.id}`);
            }
            allAudioTracks.push(track);
            this.logger.success(`✅ Added audio track: ${track.id}`);
          }
        });
      }
    };

    // 1. Examine stored video elements map
    for (const [uid, videoElement] of this.videoElements.entries()) {
      examineElement(videoElement, `stored video ${uid}`);
    }

    // 2. Examine ALL video elements on page
    document.querySelectorAll('video').forEach((v, idx) => examineElement(v, `page video ${idx}`));

    // 3. Examine ALL audio elements on page (new)
    document.querySelectorAll('audio').forEach((a, idx) => examineElement(a, `page audio ${idx}`));

    // If still none, try capture system audio via getDisplayMedia
    if (allAudioTracks.length === 0) {
      this.logger.warning('⚠️ [AUDIO CAPTURE v3.1] No audio after DOM scan – try getDisplayMedia({audio:true})');
      try {
        const sysStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false });
        sysStream.getAudioTracks().forEach(t => allAudioTracks.push(t));
        if (sysStream.getAudioTracks().length) {
          this.logger.success(`✅ Captured ${sysStream.getAudioTracks().length} system audio track(s)`);
        }
      } catch (e) {
        this.logger.error('❌ getDisplayMedia audio failed:', e);
      }
    }

    // FINAL silent fallback
    if (allAudioTracks.length === 0) {
      this.logger.warning('⚠️ [AUDIO CAPTURE v3.1] Still no audio – creating silent track');
      const silent = await this.createSilentAudioTrack();
      if (silent) allAudioTracks.push(silent);
    }

    // ✅ MIX tracks via AudioContext to ensure single clean track (resolves browsers that reject multi-track)
    const mixedStream = await this.mixAudioTracks(allAudioTracks);

    this.logger.info('🎵 [AUDIO CAPTURE v3.1] Final audio capture summary:', {
      totalOriginalTracks: allAudioTracks.length,
      mixedTracks: mixedStream.getAudioTracks().length,
      trackIds: mixedStream.getAudioTracks().map(t => t.id)
    });
    
    return mixedStream; // Return stream with 1 mixed audio track
  }

  // 🧫 Mix multiple audio tracks into single track using AudioContext
  async mixAudioTracks(tracks) {
    try {
      if (!tracks.length) {
        return new MediaStream();
      }
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();
      tracks.forEach(track => {
        const src = audioContext.createMediaStreamSource(new MediaStream([track]));
        src.connect(destination);
      });
      return destination.stream;
    } catch (err) {
      this.logger.error('💥 Failed to mix audio tracks:', err);
      return new MediaStream(tracks); // fallback return original
    }
  }

  // 🎯 FALLBACK: Search all video elements on page for audio
  async fallbackAudioCapture() {
    const foundAudioTracks = [];
    const allVideos = document.querySelectorAll('video');
    
    console.log(`🔍 [FALLBACK v2.0] Searching ${allVideos.length} video elements on page...`);
    this.logger.info(`🔍 [FALLBACK v2.0] Searching ${allVideos.length} video elements on page...`);
    
    allVideos.forEach((video, index) => {
      if (video.srcObject && video.srcObject instanceof MediaStream) {
        const audioTracks = video.srcObject.getAudioTracks();
        
        this.logger.info(`🎥 [FALLBACK] Video ${index}:`, {
          id: video.id || 'no-id',
          className: video.className,
          audioTracks: audioTracks.length,
          muted: video.muted
        });
        
        audioTracks.forEach(track => {
          if (track.kind === 'audio' && track.readyState === 'live') {
            // Force enable if disabled
            if (!track.enabled) {
              track.enabled = true;
              this.logger.warning(`🔧 [FALLBACK] Force-enabled audio track ${track.id}`);
            }
            foundAudioTracks.push(track);
            this.logger.success(`✅ [FALLBACK] Found audio track: ${track.id}`);
          }
        });
      }
    });
    
    return foundAudioTracks;
  }

  // 🎯 CREATE SILENT AUDIO TRACK as absolute fallback
  async createSilentAudioTrack() {
    try {
      this.logger.info('🔇 Creating silent audio track...');
      
      // Create AudioContext for silent audio generation
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Create silent audio (gain = 0)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      oscillator.connect(gainNode);
      
      // Create MediaStream from AudioContext
      const destination = audioContext.createMediaStreamDestination();
      gainNode.connect(destination);
      
      oscillator.start();
      
      const silentAudioTrack = destination.stream.getAudioTracks()[0];
      
      if (silentAudioTrack) {
        this.logger.success('✅ Created silent audio track successfully');
        return silentAudioTrack;
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to create silent audio track:', error);
    }
    
    return null;
  }

  // 🎵 VERIFY AUDIO CONTENT in recorded blob
  async verifyAudioInBlob(videoBlob, mimeType) {
    try {
      this.logger.info('🔍 Verifying audio content in recorded blob...');
      
      // Create a temporary video element to test the blob
      const tempVideo = document.createElement('video');
      tempVideo.muted = false; // Important: unmute to detect audio
      tempVideo.style.display = 'none';
      document.body.appendChild(tempVideo);
      
      return new Promise((resolve) => {
        const blobUrl = URL.createObjectURL(videoBlob);
        tempVideo.src = blobUrl;
        
        const cleanup = () => {
          URL.revokeObjectURL(blobUrl);
          if (tempVideo.parentNode) {
            tempVideo.parentNode.removeChild(tempVideo);
          }
        };
        
        tempVideo.addEventListener('loadedmetadata', () => {
          this.logger.info('🎬 Blob metadata loaded:', {
            duration: tempVideo.duration,
            videoWidth: tempVideo.videoWidth,
            videoHeight: tempVideo.videoHeight,
            mimeType: mimeType,
            blobSize: videoBlob.size,
            hasVideoTrack: tempVideo.videoWidth > 0,
            // Note: Audio tracks detection is limited in recorded blobs
            // The actual audio presence will be verified during playback
          });
          
          // Try to detect if audio might be present
          const audioIndicators = {
            mimeTypeHasAudio: mimeType.includes('opus') || mimeType.includes('vorbis') || mimeType.includes('aac'),
            blobSizeIndicatesAudio: videoBlob.size > (tempVideo.duration * 50000), // Rough estimate
            durationReasonable: tempVideo.duration > 0
          };
          
          this.logger.info('🎵 Audio presence indicators:', audioIndicators);
          
          if (!audioIndicators.mimeTypeHasAudio) {
            this.logger.warning('⚠️ MIME type suggests no audio codec: ' + mimeType);
          }
          
          if (!audioIndicators.blobSizeIndicatesAudio) {
            this.logger.warning('⚠️ Blob size may indicate missing audio (video-only)');
          }
          
          cleanup();
          resolve();
        });
        
        tempVideo.addEventListener('error', (e) => {
          this.logger.error('❌ Error loading blob for verification:', e);
          cleanup();
          resolve(); // Don't fail the whole process
        });
        
        // Timeout fallback
        setTimeout(() => {
          this.logger.warning('⏰ Blob verification timeout');
          cleanup();
          resolve();
        }, 5000);
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to verify audio in blob:', error);
      // Don't fail the whole process
    }
  }


  addVideoElement(uid, videoElement) {
    try {
      this.logger.info(`➕ Adding video element for UID: ${uid}`);
      
      // Store the video element directly for canvas drawing
      this.videoElements.set(uid, videoElement);
      
      this.logger.success(`✅ Video element added for UID: ${uid}`);
    } catch (error) {
      this.logger.error(`❌ Failed to add video element for UID: ${uid}`, error);
    }
  }

  // Debug audio capture
  debugAudioCapture() {
    console.log('🔧 [AUDIO DEBUG v2.0] Starting audio capture diagnosis...');
    this.logger.info('🔧 [AUDIO DEBUG v2.0] Starting audio capture diagnosis...');
    
    // Check all video elements on page
    const allVideos = document.querySelectorAll('video');
    
    allVideos.forEach((video, index) => {
      this.logger.info(`🎥 [AUDIO DEBUG] Video element ${index}:`, {
        id: video.id,
        className: video.className,
        hasStream: !!video.srcObject,
        streamType: video.srcObject ? video.srcObject.constructor.name : 'none',
        videoTracks: video.srcObject ? video.srcObject.getVideoTracks().length : 0,
        audioTracks: video.srcObject ? video.srcObject.getAudioTracks().length : 0,
        muted: video.muted,
        volume: video.volume,
        audioTrackDetails: video.srcObject ? 
          video.srcObject.getAudioTracks().map(track => ({
            id: track.id,
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted
          })) : []
      });
    });
    
    // Check browser audio capabilities
    this.logger.info('🎤 [AUDIO DEBUG] Browser audio capabilities:', {
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
      getDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia,
      audioContext: !!window.AudioContext || !!window.webkitAudioContext,
      webRTC: !!window.RTCPeerConnection
    });
  }

  async recheckForVideos() {
    this.logger.info('🔄 Rechecking for new video/audio elements...');
    
    const beforeCount = this.videoElements.size;
    const capturedStreams = await this.captureExistingAgoraStreams();
    const afterCount = this.videoElements.size;
    
    if (afterCount > beforeCount) {
      this.logger.success(`🎯 Found ${afterCount - beforeCount} new video elements during recheck`);
      
      // Also debug audio for new elements
      this.debugAudioCapture();
    }
    
    return capturedStreams;
  }

  drawWaitingMessage() {
    this.canvasContext.fillStyle = '#ffffff';
    this.canvasContext.font = '24px Arial';
    this.canvasContext.textAlign = 'center';
    this.canvasContext.fillText(
      'Video nu poate fi desenat', 
      this.canvas.width / 2, 
      this.canvas.height / 2
    );
  }

  startDrawingLoop() {
    const draw = () => {
      try {
        // Clear canvas
        this.canvasContext.fillStyle = '#000000';
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const videoElements = Array.from(this.videoElements.values());
        let validVideoCount = 0;
        
        // Count videos that actually have content
        const readyVideos = videoElements.filter(video => {
          const isReady = video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2;
          if (isReady) validVideoCount++;
          return isReady;
        });
        
        if (readyVideos.length === 0) {
          // Try to capture new videos if none are ready yet
          if (this.startTime && (Date.now() - this.startTime) > 3000) {
            // After 3 seconds, try to find new videos
            this.recheckForVideos();
          }
          
          // Show waiting message with more info
          this.canvasContext.fillStyle = '#ffffff';
          this.canvasContext.font = '28px Arial';
          this.canvasContext.textAlign = 'center';
          this.canvasContext.fillText(
            'Înregistrare în curs...', 
            this.canvas.width / 2, 
            this.canvas.height / 2 - 40
          );
          this.canvasContext.font = '18px Arial';
          this.canvasContext.fillText(
            `Video elemente găsite: ${videoElements.length}`, 
            this.canvas.width / 2, 
            this.canvas.height / 2 - 10
          );
          this.canvasContext.fillText(
            `Video elemente gata: ${validVideoCount}`, 
            this.canvas.width / 2, 
            this.canvas.height / 2 + 20
          );
          this.canvasContext.fillText(
            'Așteptare participanți cu video...', 
            this.canvas.width / 2, 
            this.canvas.height / 2 + 50
          );
        } else if (readyVideos.length === 1) {
          // Single video - full screen
          const video = readyVideos[0];
          try {
            this.canvasContext.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
          } catch (drawError) {
            this.logger.warning('Draw error for single video:', drawError);
            // Fallback to waiting message
            this.drawWaitingMessage();
          }
        } else {
          // Multiple videos - grid layout
          const cols = Math.ceil(Math.sqrt(readyVideos.length));
          const rows = Math.ceil(readyVideos.length / cols);
          const cellWidth = this.canvas.width / cols;
          const cellHeight = this.canvas.height / rows;
          
          readyVideos.forEach((video, index) => {
            try {
              const col = index % cols;
              const row = Math.floor(index / cols);
              const x = col * cellWidth;
              const y = row * cellHeight;
              
              this.canvasContext.drawImage(video, x, y, cellWidth, cellHeight);
            } catch (drawError) {
              this.logger.warning(`Draw error for video ${index}:`, drawError);
            }
          });
        }
        
        // Recording indicator
        const now = Date.now();
        if (this.startTime && Math.floor((now - this.startTime) / 1000) % 2 === 0) {
          this.canvasContext.fillStyle = '#ff0000';
          this.canvasContext.beginPath();
          this.canvasContext.arc(50, 50, 15, 0, 2 * Math.PI);
          this.canvasContext.fill();
          
          this.canvasContext.fillStyle = '#ffffff';
          this.canvasContext.font = '16px Arial';
          this.canvasContext.textAlign = 'left';
          this.canvasContext.fillText('REC', 80, 58);
        }
        
      } catch (error) {
        this.logger.error('❌ Drawing loop error:', error);
      }
      
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.animationFrame = requestAnimationFrame(draw);
      }
    };
    
    this.animationFrame = requestAnimationFrame(draw);
  }

  async stopRecording() {
    try {
      this.logger.info('🛑 Stopping Agora stream recording');
      this.onProgress('🛑 Oprire înregistrare...');

      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }

      // Stop drawing loop
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      return {
        success: true,
        message: 'Recording stopped successfully'
      };

    } catch (error) {
      this.logger.error('💥 Failed to stop recording', error);
      this.onError(error);
      throw error;
    }
  }

  async onRecordingStopped() {
    try {
      // Step 1: Show stop message
      this.onProgress('🛑 Oprire înregistrare...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 2: Processing
      this.onProgress('⚙️ Procesare video înregistrat...');
      
      this.logger.info('🔄 Processing Agora stream recording', {
        chunksReceived: this.recordedChunks.length,
        totalDataSize: this.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0),
        recordingDuration: this.startTime ? Date.now() - this.startTime : 0,
        mediaRecorderState: this.mediaRecorder?.state,
        videoElementsCount: this.videoElements.size
      });

      if (this.recordedChunks.length === 0) {
        this.logger.error('❌ No recording chunks available', {
          mediaRecorderState: this.mediaRecorder?.state,
          videoElementsActive: this.videoElements.size,
          canvasSize: `${this.canvas.width}x${this.canvas.height}`,
          startTime: this.startTime,
          recordingDuration: this.startTime ? Date.now() - this.startTime : 0
        });
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

      // 🎵 VERIFY AUDIO CONTENT in blob
      await this.verifyAudioInBlob(videoBlob, mimeType);
      
      // Step 3: Show processing complete, prepare upload
      await new Promise(resolve => setTimeout(resolve, 600));
      this.onProgress('📤 Încărcare video în Firebase Storage...');
      
      // Upload to Firebase Storage - CLIENT-SIDE ONLY!
      await this.uploadToFirebaseClientSide(videoBlob, duration);
      
    } catch (error) {
      this.logger.error('💥 Failed to process Agora stream recording', {
        error: error.message,
        errorStack: error.stack
      });
      this.onError(error);
    }
  }

  // SIMPLIFIED: Client-side Firebase Storage upload ONLY
  async uploadToFirebaseClientSide(videoBlob, duration) {
    const uploadStartTime = Date.now();
    const fileSizeMB = videoBlob.size / (1024 * 1024);
    
    try {
      this.isUploading = true;
      
      this.logger.info('🔥 Starting CLIENT-SIDE Firebase Storage upload', {
        fileSizeMB: fileSizeMB.toFixed(2),
        approach: 'client_only_simplified'
      });

      this.onProgress('🔥 Conectare la Firebase Storage...');

      // Dynamic imports for Firebase
      const { initializeApp, getApps } = await import('firebase/app');
      const { getStorage, ref: storageRef, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { getAuth } = await import('firebase/auth');
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');

      // Initialize Firebase if needed
      let app;
      const existingApps = getApps();
      if (existingApps.length > 0) {
        app = existingApps[0];
      } else {
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        };
        app = initializeApp(firebaseConfig);
      }

      const storage = getStorage(app);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      
      // 🔐 AUTO-AUTHENTICATE FOR STORAGE OPERATIONS
      // Check if user is already authenticated, if not, sign in with admin credentials
      if (!auth.currentUser) {
        this.logger.info('🔐 No auth user found, signing in for storage access...');
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          // Use admin credentials for storage operations - CORRECT EMAIL/PASSWORD
          await signInWithEmailAndPassword(auth, 'cristinazurbac@gmail.com', 'CristinaZurba1994!');
          this.logger.info('✅ Authenticated for storage operations');
        } catch (authError) {
          this.logger.error('💥 Failed to authenticate for storage:', authError.message);
          this.logger.error('Auth error details:', authError);
          // Try alternative authentication
          try {
            this.logger.info('🔄 Trying alternative auth approach...');
            // Sign in anonymously as fallback
            const { signInAnonymously } = await import('firebase/auth');
            await signInAnonymously(auth);
            this.logger.info('✅ Anonymous authentication successful');
          } catch (anonymousError) {
            this.logger.error('💥 Anonymous auth also failed:', anonymousError.message);
            // Continue without auth - metadata will show 'unknown'
          }
        }
      }
      
      const timestamp = Date.now();
      const fileName = `client_recording_${timestamp}.webm`;
      const meetingCode = this.getMeetingCode();
      const storagePath = `recordings/${meetingCode}/${fileName}`;
      
      this.logger.info('📤 Starting Firebase Storage upload', {
        storagePath,
        fileName,
        meetingCode,
        fileSizeMB: fileSizeMB.toFixed(2)
      });

      const fileRef = storageRef(storage, storagePath);
      const uploadTask = uploadBytesResumable(fileRef, videoBlob, {
        contentType: 'video/webm',
        customMetadata: {
          meetingCode,
          duration: duration.toString(),
          uploadedBy: 'cristina_admin', // Static admin identifier
          adminEmail: auth.currentUser?.email || 'cristinazurbac@gmail.com',
          recordingType: 'admin_conference_video',
          originalName: fileName,
          fileSize: videoBlob.size.toString(),
          uploadTime: timestamp.toString()
        }
      });

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const progressText = `📤 Upload: ${Math.round(progress)}% (${(snapshot.bytesTransferred / (1024 * 1024)).toFixed(1)}MB / ${fileSizeMB.toFixed(1)}MB)`;
            this.onProgress(progressText);
            
            this.logger.info('📊 Upload progress', {
              progress: Math.round(progress),
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes
            });
          },
          (error) => {
            this.logger.error('💥 Upload failed', error);
            this.onProgress('❌ Upload eșuat!');
            reject(error);
          },
          async () => {
            try {
              this.onProgress('✅ Upload complet! Salvare metadata...');
              
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const uploadTime = Date.now() - uploadStartTime;
              
              this.logger.success('🎊 Firebase Storage upload completed', {
                uploadTime: `${uploadTime}ms`,
                fileSize: videoBlob.size,
                downloadURL
              });

              const recordingData = {
                meetingCode,
                fileName,
                downloadURL,
                size: videoBlob.size,
                duration,
                recipientEmail: this.recipientEmail || 'conference_participants', // Email pentru notificări
                adminEmail: auth.currentUser?.email || 'cristinazurbac@gmail.com',
                uploadedBy: 'cristina_admin',
                status: 'completed',
                recordingType: 'admin_conference_video',
                createdAt: timestamp,
                uploadTime: timestamp,
                startTimestamp: timestamp,
                processedBy: 'client_firebase',
                downloadedBy: [], // 🔒 Track who downloaded this recording
                downloadAttempts: [] // 🔍 Track all download attempts with timestamps
              };

              // Save metadata to Firestore for search functionality
              await this.saveRecordingMetadata(recordingData, firestore);

              // Recording and upload completed successfully
              this.onProgress('✅ Înregistrare încărcată cu succes!');
              
              this.onComplete(recordingData);
              resolve(recordingData);
            } catch (error) {
              this.logger.error('💥 Metadata save failed', error);
              reject(error);
            }
          }
        );
      });
      
    } catch (error) {
      this.logger.error('💥 Client-side upload failed', error);
      this.onProgress('❌ Upload eșuat!');
      throw error;
    } finally {
      this.isUploading = false;
    }
  }

  async saveRecordingMetadata(recordingData, firestore) {
    try {
      // Import Firestore functions
      const { doc, setDoc } = await import('firebase/firestore');
      
      // 🎯 SAVE ONLY TO SimpleRecordings - single source of truth
      const simpleRecordingRef = doc(firestore, 'SimpleRecordings', recordingData.meetingCode);
      await setDoc(simpleRecordingRef, recordingData, { merge: true });
      
      this.logger.success('📝 Recording metadata saved to SimpleRecordings', {
        meetingCode: recordingData.meetingCode,
        collection: 'SimpleRecordings'
      });
    } catch (error) {
      this.logger.error('❌ Failed to save recording metadata', error);
      throw error;
    }
  }

  // Set the recipient email for proper metadata saving
  setRecipientEmail(email) {
    this.recipientEmail = email;
    this.logger.info('📧 Recipient email set for recording metadata', {
      recipientEmail: email,
      timestamp: new Date().toISOString()
    });
  }

  getMeetingCode() {
    // Extract meeting code from URL or context
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const meetingCode = urlParams.get('meetingCode') || 
                         urlParams.get('meetingId') ||
                         urlParams.get('channelId');
      
      if (meetingCode) {
        return meetingCode;
      }
      
      // Try to extract from pathname
      const pathParts = window.location.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart !== '') {
        return lastPart;
      }
    }
    
    return `meeting_${Date.now()}`;
  }

  cleanup() {
    try {
      this.logger.info('🧹 Cleaning up AgoraStreamRecorder resources');
      
      // Stop recording if active
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      
      // Stop drawing loop
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      
      // Clean up all video elements
      this.videoElements.forEach((element, uid) => {
        this.removeVideoElement(uid);
      });
      
      // Clean up canvas
      if (this.canvas) {
        this.canvasContext = null;
        this.canvas = null;
      }
      
      this.logger.success('✅ AgoraStreamRecorder cleanup completed');
    } catch (error) {
      this.logger.error('❌ Cleanup error:', error);
    }
  }
} 