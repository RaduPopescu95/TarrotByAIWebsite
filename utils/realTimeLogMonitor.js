/**
 * Real-time log monitor utility for debugging during live testing
 * This allows you to see all logs in real-time in the browser console
 */

class RealTimeLogMonitor {
  constructor(options = {}) {
    this.isActive = false;
    this.intervalId = null;
    this.lastFetchTime = Date.now() - (5 * 60 * 1000); // Start from 5 minutes ago
    this.pollInterval = options.pollInterval || 2000; // Poll every 2 seconds
    this.logTypes = options.logTypes || ['client', 'recording', 'api'];
    this.logLevels = options.logLevels || ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    
    this.colors = {
      ERROR: '#ff4757',
      WARN: '#ffa726',
      INFO: '#2196f3',
      DEBUG: '#9c27b0',
      TRACE: '#607d8b'
    };

    this.icons = {
      ERROR: '🚨',
      WARN: '⚠️',
      INFO: 'ℹ️',
      DEBUG: '🔍',
      TRACE: '📝'
    };
  }

  start() {
    if (this.isActive) {
      console.log('🚀 Real-time log monitor is already running');
      return;
    }

    this.isActive = true;
    console.log('🚀 Starting real-time log monitor...');
    console.log('📊 Monitoring types:', this.logTypes);
    console.log('📊 Monitoring levels:', this.logLevels);
    
    // Start polling for logs
    this.intervalId = setInterval(() => {
      this.fetchAndDisplayLogs();
    }, this.pollInterval);

    // Fetch initial logs
    this.fetchAndDisplayLogs();
  }

  stop() {
    if (!this.isActive) {
      console.log('⏹️ Real-time log monitor is not running');
      return;
    }

    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('⏹️ Real-time log monitor stopped');
  }

  async fetchAndDisplayLogs() {
    try {
      const params = new URLSearchParams({
        since: this.lastFetchTime.toString()
      });

      const response = await fetch(`/api/recording/live-logs?${params}`);
      const data = await response.json();

      if (data.success && data.logs.length > 0) {
        // Update last fetch time to server time to avoid clock sync issues
        this.lastFetchTime = data.serverTime;

        // Display new logs
        this.displayLogs(data.logs);
      }
    } catch (error) {
      console.error('❌ Failed to fetch real-time logs:', error);
    }
  }

  displayLogs(logs) {
    // Group logs by timestamp (within 1 second) to show related operations together
    const groups = this.groupLogsByTime(logs);

    groups.forEach(group => {
      if (group.length === 1) {
        this.displaySingleLog(group[0]);
      } else {
        this.displayLogGroup(group);
      }
    });
  }

  groupLogsByTime(logs) {
    const groups = [];
    let currentGroup = [];

    logs.forEach(log => {
      if (currentGroup.length === 0) {
        currentGroup.push(log);
      } else {
        const timeDiff = Math.abs(log.timestamp - currentGroup[0].timestamp);
        if (timeDiff <= 1000) { // Within 1 second
          currentGroup.push(log);
        } else {
          if (currentGroup.length > 0) {
            groups.push(currentGroup);
          }
          currentGroup = [log];
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  displaySingleLog(log) {
    const icon = this.icons[log.level] || '📝';
    const color = this.colors[log.level] || '#333';
    const time = new Date(log.timestamp).toLocaleTimeString();
    
    console.log(
      `%c${icon} [${time}] [${log.collection}] ${log.level}: ${log.message}`,
      `color: ${color}; font-weight: bold;`
    );

    if (log.context && Object.keys(log.context).length > 0) {
      console.log('   Context:', log.context);
    }
  }

  displayLogGroup(group) {
    const time = new Date(group[0].timestamp).toLocaleTimeString();
    const contexts = group.map(log => log.context?.operation || log.context?.action || log.level).join(' → ');
    
    console.group(`%c🔗 [${time}] Related Operations: ${contexts}`, 'color: #4caf50; font-weight: bold;');
    
    group.forEach(log => {
      const icon = this.icons[log.level] || '📝';
      const color = this.colors[log.level] || '#333';
      
      console.log(
        `%c  ${icon} [${log.collection}] ${log.level}: ${log.message}`,
        `color: ${color};`
      );

      if (log.context && Object.keys(log.context).length > 0) {
        console.log('     Context:', log.context);
      }
    });
    
    console.groupEnd();
  }

  // Utility methods for quick access
  showRecordingLogs() {
    this.logTypes = ['recording'];
    console.log('🎥 Showing only recording logs');
  }

  showApiLogs() {
    this.logTypes = ['api'];
    console.log('🔗 Showing only API logs');
  }

  showClientLogs() {
    this.logTypes = ['client'];
    console.log('💻 Showing only client logs');
  }

  showAllLogs() {
    this.logTypes = ['client', 'recording', 'api'];
    console.log('📊 Showing all log types');
  }

  showErrorsOnly() {
    this.logLevels = ['ERROR'];
    console.log('🚨 Showing only errors');
  }

  showAllLevels() {
    this.logLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    console.log('📊 Showing all log levels');
  }
}

// Create global instance for easy access in console
if (typeof window !== 'undefined') {
  window.LogMonitor = new RealTimeLogMonitor();
  
  // Add convenience functions to window for easy console access
  window.startLogs = () => window.LogMonitor.start();
  window.stopLogs = () => window.LogMonitor.stop();
  window.showRecordingLogs = () => {
    window.LogMonitor.showRecordingLogs();
    if (!window.LogMonitor.isActive) window.LogMonitor.start();
  };
  window.showApiLogs = () => {
    window.LogMonitor.showApiLogs();
    if (!window.LogMonitor.isActive) window.LogMonitor.start();
  };
  window.showClientLogs = () => {
    window.LogMonitor.showClientLogs();
    if (!window.LogMonitor.isActive) window.LogMonitor.start();
  };
  window.showAllLogs = () => {
    window.LogMonitor.showAllLogs();
    if (!window.LogMonitor.isActive) window.LogMonitor.start();
  };
  window.showErrorsOnly = () => {
    window.LogMonitor.showErrorsOnly();
    if (!window.LogMonitor.isActive) window.LogMonitor.start();
  };

  console.log(`
🎉 Real-time Log Monitor Available!

Quick commands:
  startLogs()          - Start monitoring all logs
  stopLogs()           - Stop monitoring
  showRecordingLogs()  - Show only recording logs  
  showApiLogs()        - Show only API logs
  showClientLogs()     - Show only client logs
  showAllLogs()        - Show all log types
  showErrorsOnly()     - Show only errors

Example usage:
  startLogs()          // Start monitoring
  showRecordingLogs()  // Focus on recording logs
  stopLogs()           // Stop when done
  `);
}

export default RealTimeLogMonitor; 