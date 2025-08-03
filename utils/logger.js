// 📊 Comprehensive Logging System for Agora Cloud Recording
// Supports both client-side and server-side logging with different levels

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1, 
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  TRACE: '\x1b[90m', // Gray
  RESET: '\x1b[0m'
};

class Logger {
  constructor(context = 'APP', level = 'INFO') {
    this.context = context;
    this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    this.isServer = typeof window === 'undefined';
    this.sessionId = this.generateSessionId();
    
    // Initialize storage for client-side logs
    if (!this.isServer && typeof window !== 'undefined') {
      this.initializeClientStorage();
    }
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  initializeClientStorage() {
    try {
      if (!localStorage.getItem('agora_recording_logs')) {
        localStorage.setItem('agora_recording_logs', JSON.stringify([]));
      }
    } catch (error) {
      console.warn('localStorage not available for logging');
    }
  }

  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const formattedData = data && Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '';
    
    return {
      timestamp,
      level,
      context: this.context,
      sessionId: this.sessionId,
      message,
      data,
      environment: this.isServer ? 'server' : 'client',
      url: this.isServer ? 'server' : (typeof window !== 'undefined' ? window.location.href : 'unknown'),
      userAgent: this.isServer ? 'server' : (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown')
    };
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= this.level;
  }

  storeClientLog(logEntry) {
    if (this.isServer) return;
    
    try {
      const logs = JSON.parse(localStorage.getItem('agora_recording_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 1000 logs to prevent storage overflow
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('agora_recording_logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to store client log:', error);
    }
  }

  writeLog(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, message, data);
    
    // Store in client storage
    this.storeClientLog(logEntry);
    
    // Console output with colors (server-side) or styled (client-side)
    const color = LOG_COLORS[level] || '';
    const reset = LOG_COLORS.RESET;
    const prefix = `[${logEntry.timestamp}] [${this.context}] [${level}]`;
    
    if (this.isServer) {
      console.log(`${color}${prefix}${reset} ${message}`, data && Object.keys(data).length > 0 ? data : '');
    } else {
      const styles = {
        ERROR: 'color: #ff4444; font-weight: bold;',
        WARN: 'color: #ffaa00; font-weight: bold;',
        INFO: 'color: #4444ff; font-weight: bold;', 
        DEBUG: 'color: #aa44ff;',
        TRACE: 'color: #888888;'
      };
      
      console.log(`%c${prefix}`, styles[level] || '', message, data);
    }

    // Send critical logs to server (client-side only)
    if (!this.isServer && (level === 'ERROR' || level === 'WARN')) {
      this.sendLogToServer(logEntry);
    }
  }

  async sendLogToServer(logEntry) {
    try {
      await fetch('/api/recording/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: logEntry })
      });
    } catch (error) {
      console.warn('Failed to send log to server:', error);
    }
  }

  error(message, data = {}) {
    this.writeLog('ERROR', message, { ...data, error: true });
  }

  warn(message, data = {}) {
    this.writeLog('WARN', message, data);
  }

  info(message, data = {}) {
    this.writeLog('INFO', message, data);
  }

  debug(message, data = {}) {
    this.writeLog('DEBUG', message, data);
  }

  trace(message, data = {}) {
    this.writeLog('TRACE', message, data);
  }

  // 🎯 Special methods for Agora Recording events
  recordingStart(meetingCode, data = {}) {
    this.info(`🎬 RECORDING STARTED`, {
      event: 'recording_start',
      meetingCode,
      ...data
    });
  }

  recordingStop(meetingCode, data = {}) {
    this.info(`🛑 RECORDING STOPPED`, {
      event: 'recording_stop',
      meetingCode,
      ...data
    });
  }

  recordingError(meetingCode, error, data = {}) {
    this.error(`❌ RECORDING ERROR`, {
      event: 'recording_error',
      meetingCode,
      error: error.message || error,
      stack: error.stack || 'No stack trace',
      ...data
    });
  }

  agoraApiCall(method, url, requestData = {}, responseData = {}) {
    this.debug(`🌐 AGORA API CALL`, {
      event: 'agora_api',
      method,
      url,
      requestData,
      responseData,
      timestamp: Date.now()
    });
  }

  userAction(action, data = {}) {
    this.info(`👤 USER ACTION`, {
      event: 'user_action',
      action,
      ...data
    });
  }

  performance(operation, duration, data = {}) {
    this.debug(`⚡ PERFORMANCE`, {
      event: 'performance',
      operation,
      duration: `${duration}ms`,
      ...data
    });
  }

  // 📊 Get client logs for debugging
  getClientLogs() {
    if (this.isServer) return [];
    
    try {
      return JSON.parse(localStorage.getItem('agora_recording_logs') || '[]');
    } catch (error) {
      this.warn('Failed to get client logs:', error);
      return [];
    }
  }

  // 🧹 Clear client logs
  clearClientLogs() {
    if (this.isServer) return;
    
    try {
      localStorage.setItem('agora_recording_logs', JSON.stringify([]));
      this.info('Client logs cleared');
    } catch (error) {
      this.warn('Failed to clear client logs:', error);
    }
  }

  // 📤 Export logs for support
  exportLogs() {
    const logs = this.getClientLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `agora-recording-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.info('Logs exported successfully');
  }
}

// 🏭 Factory function to create loggers
export function createLogger(context, level = 'INFO') {
  return new Logger(context, level);
}

// 🌍 Global logger instance
export const logger = new Logger('GLOBAL', process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO');

// 📋 Helper functions for specific components
export const createRecordingLogger = (component) => createLogger(`RECORDING:${component}`);
export const createApiLogger = (endpoint) => createLogger(`API:${endpoint}`);
export const createUILogger = (component) => createLogger(`UI:${component}`);

export default logger; 