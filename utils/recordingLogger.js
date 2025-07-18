// Centralized logging system for recording functionality
// Provides detailed logs for debugging and monitoring

export class RecordingLogger {
  constructor(context = 'Recording') {
    this.context = context;
    this.sessionId = this.generateSessionId();
    this.logs = [];
    
    this.log('INFO', 'Logger initialized', { 
      sessionId: this.sessionId,
      context: this.context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server'
    });
  }

  generateSessionId() {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      sessionId: this.sessionId,
      level,
      context: this.context,
      message,
      data: this.sanitizeData(data)
    };

    // Add to internal logs array
    this.logs.push(logEntry);

    // Console logging with nice formatting
    const emoji = this.getLevelEmoji(level);
    const timeStr = new Date().toLocaleTimeString();
    
    console.group(`${emoji} [${level}] ${this.context} - ${timeStr}`);
    console.log(`📝 ${message}`);
    
    if (Object.keys(data).length > 0) {
      console.log('📊 Data:', data);
    }
    
    console.log(`🆔 Session: ${this.sessionId}`);
    console.groupEnd();

    // Store in localStorage for debugging (only in browser)
    if (typeof window !== 'undefined') {
      try {
        const existingLogs = JSON.parse(localStorage.getItem('recording_logs') || '[]');
        existingLogs.push(logEntry);
        
        // Keep only last 100 logs to avoid storage overflow
        if (existingLogs.length > 100) {
          existingLogs.splice(0, existingLogs.length - 100);
        }
        
        localStorage.setItem('recording_logs', JSON.stringify(existingLogs));
      } catch (error) {
        console.warn('Failed to store log in localStorage:', error);
      }
    }
  }

  getLevelEmoji(level) {
    const emojis = {
      'INFO': '🔵',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'DEBUG': '🔍',
      'PROGRESS': '📊'
    };
    return emojis[level] || '📝';
  }

  sanitizeData(data) {
    // Remove sensitive information from logs
    const sensitiveKeys = ['privateKey', 'password', 'token', 'secret'];
    const sanitized = { ...data };
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    // Convert large objects to summaries
    if (sanitized.videoBlob && sanitized.videoBlob.size) {
      sanitized.videoBlob = {
        size: sanitized.videoBlob.size,
        type: sanitized.videoBlob.type,
        sizeFormatted: this.formatFileSize(sanitized.videoBlob.size)
      };
    }

    return sanitized;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Convenience methods for different log levels
  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  success(message, data = {}) {
    this.log('SUCCESS', message, data);
  }

  warning(message, data = {}) {
    this.log('WARNING', message, data);
  }

  error(message, data = {}) {
    this.log('ERROR', message, data);
  }

  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  progress(message, data = {}) {
    this.log('PROGRESS', message, data);
  }

  // Log browser capabilities
  logBrowserCapabilities() {
    if (typeof window === 'undefined') return;

    const capabilities = {
      mediaDevices: !!navigator.mediaDevices,
      getDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia,
      mediaRecorder: !!window.MediaRecorder,
      supportedMimeTypes: this.getSupportedMimeTypes(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth
    };

    this.info('Browser capabilities assessed', capabilities);
    return capabilities;
  }

  getSupportedMimeTypes() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    
    return types.filter(type => {
      try {
        return MediaRecorder.isTypeSupported(type);
      } catch {
        return false;
      }
    });
  }

  // Log recording session statistics
  logSessionStats(stats) {
    this.info('Recording session statistics', {
      duration: stats.duration,
      fileSize: stats.fileSize,
      fileSizeFormatted: this.formatFileSize(stats.fileSize),
      format: stats.format,
      chunks: stats.chunks,
      uploadTime: stats.uploadTime,
      processingTime: stats.processingTime
    });
  }

  // Export logs for debugging
  exportLogs() {
    const logsData = {
      sessionId: this.sessionId,
      context: this.context,
      exportedAt: new Date().toISOString(),
      logs: this.logs
    };

    if (typeof window !== 'undefined') {
      // Create downloadable file
      const blob = new Blob([JSON.stringify(logsData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording_logs_${this.sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.success('Logs exported successfully', { 
        filename: `recording_logs_${this.sessionId}.json`,
        totalLogs: this.logs.length
      });
    }

    return logsData;
  }

  // Get logs from localStorage for debugging
  static getAllStoredLogs() {
    if (typeof window === 'undefined') return [];
    
    try {
      return JSON.parse(localStorage.getItem('recording_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored logs
  static clearStoredLogs() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recording_logs');
      console.log('🗑️ All stored recording logs cleared');
    }
  }
}

// Global logging functions for easy use
export const createRecordingLogger = (context) => new RecordingLogger(context);

// Browser console helpers for debugging
if (typeof window !== 'undefined') {
  window.RecordingDebug = {
    getLogs: RecordingLogger.getAllStoredLogs,
    clearLogs: RecordingLogger.clearStoredLogs,
    exportLogs: () => {
      const logs = RecordingLogger.getAllStoredLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_recording_logs_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
} 