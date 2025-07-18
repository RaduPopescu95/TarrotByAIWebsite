import React, { useState, useEffect } from 'react';

const RecordingDebugPanel = ({ show = false, maxLogs = 20 }) => {
  const [logs, setLogs] = useState([]);
  const [isMinimized, setIsMinimized] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!show) return;

    // Poll localStorage for new logs every 500ms
    const interval = setInterval(() => {
      try {
        const storedLogs = JSON.parse(localStorage.getItem('recording_logs') || '[]');
        const recentLogs = storedLogs.slice(-maxLogs);
        setLogs(recentLogs);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [show, maxLogs]);

  if (!show) return null;

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    return log.level === filter;
  });

  const getLevelColor = (level) => {
    const colors = {
      'INFO': '#3498db',
      'SUCCESS': '#27ae60',
      'WARNING': '#f39c12',
      'ERROR': '#e74c3c',
      'DEBUG': '#9b59b6',
      'PROGRESS': '#2ecc71'
    };
    return colors[level] || '#34495e';
  };

  const getLevelEmoji = (level) => {
    const emojis = {
      'INFO': '🔵',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'DEBUG': '🔍',
      'PROGRESS': '📊'
    };
    return emojis[level] || '📝';
  };

  const exportLogs = () => {
    try {
      const allLogs = JSON.parse(localStorage.getItem('recording_logs') || '[]');
      const blob = new Blob([JSON.stringify(allLogs, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording_logs_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const clearLogs = () => {
    localStorage.removeItem('recording_logs');
    setLogs([]);
  };

  const styles = {
    panel: {
      position: 'fixed',
      bottom: isMinimized ? '-300px' : '20px',
      right: '20px',
      width: '400px',
      height: '350px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: '#ffffff',
      borderRadius: '10px',
      border: '2px solid #3498db',
      fontFamily: 'Monaco, "Courier New", monospace',
      fontSize: '12px',
      zIndex: 9999,
      transition: 'bottom 0.3s ease',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    },
    header: {
      backgroundColor: '#3498db',
      color: '#ffffff',
      padding: '10px',
      borderRadius: '8px 8px 0 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer'
    },
    title: {
      fontWeight: 'bold',
      fontSize: '14px'
    },
    controls: {
      display: 'flex',
      gap: '5px'
    },
    controlBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      color: '#ffffff',
      padding: '5px 8px',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '11px'
    },
    filters: {
      padding: '10px',
      borderBottom: '1px solid #34495e',
      display: 'flex',
      gap: '5px',
      flexWrap: 'wrap'
    },
    filterBtn: {
      background: 'rgba(52, 152, 219, 0.3)',
      border: '1px solid #3498db',
      color: '#ffffff',
      padding: '3px 8px',
      borderRadius: '15px',
      cursor: 'pointer',
      fontSize: '10px'
    },
    activeFilter: {
      background: '#3498db',
      color: '#ffffff'
    },
    logsContainer: {
      height: '200px',
      overflowY: 'auto',
      padding: '10px',
      scrollbarWidth: 'thin',
      scrollbarColor: '#3498db rgba(0, 0, 0, 0.3)'
    },
    logEntry: {
      marginBottom: '8px',
      padding: '5px',
      borderRadius: '3px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderLeft: '3px solid'
    },
    logHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '3px'
    },
    logLevel: {
      fontWeight: 'bold',
      fontSize: '11px'
    },
    logTime: {
      color: '#bdc3c7',
      fontSize: '10px'
    },
    logMessage: {
      marginBottom: '3px',
      fontSize: '11px'
    },
    logData: {
      color: '#95a5a6',
      fontSize: '10px',
      fontStyle: 'italic',
      maxHeight: '60px',
      overflow: 'hidden'
    },
    noLogs: {
      textAlign: 'center',
      color: '#7f8c8d',
      fontStyle: 'italic',
      marginTop: '50px'
    },
    minimizeBtn: {
      position: 'absolute',
      top: isMinimized ? '-35px' : '10px',
      right: '10px',
      background: '#3498db',
      border: 'none',
      color: '#ffffff',
      padding: '8px 12px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '12px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
    }
  };

  return (
    <>
      <button
        style={styles.minimizeBtn}
        onClick={() => setIsMinimized(!isMinimized)}
        title={isMinimized ? 'Show Recording Logs' : 'Hide Recording Logs'}
      >
        {isMinimized ? '📊 Show Logs' : '📊 Hide'}
      </button>
      
      <div style={styles.panel}>
        <div style={styles.header} onClick={() => setIsMinimized(!isMinimized)}>
          <div style={styles.title}>
            🎥 Recording Debug Panel ({filteredLogs.length} logs)
          </div>
          <div style={styles.controls}>
            <button
              style={styles.controlBtn}
              onClick={(e) => {
                e.stopPropagation();
                exportLogs();
              }}
              title="Export logs to JSON file"
            >
              📥 Export
            </button>
            <button
              style={styles.controlBtn}
              onClick={(e) => {
                e.stopPropagation();
                clearLogs();
              }}
              title="Clear all logs"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        <div style={styles.filters}>
          {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'DEBUG', 'PROGRESS'].map(level => (
            <button
              key={level}
              style={{
                ...styles.filterBtn,
                ...(filter === level ? styles.activeFilter : {})
              }}
              onClick={() => setFilter(level)}
            >
              {level}
            </button>
          ))}
        </div>

        <div style={styles.logsContainer}>
          {filteredLogs.length === 0 ? (
            <div style={styles.noLogs}>
              No logs found for filter: {filter}
            </div>
          ) : (
            filteredLogs.slice().reverse().map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                style={{
                  ...styles.logEntry,
                  borderLeftColor: getLevelColor(log.level)
                }}
              >
                <div style={styles.logHeader}>
                  <span style={{ ...styles.logLevel, color: getLevelColor(log.level) }}>
                    {getLevelEmoji(log.level)} [{log.level}]
                  </span>
                  <span style={styles.logTime}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={styles.logMessage}>
                  <strong>{log.context}:</strong> {log.message}
                </div>
                {log.data && Object.keys(log.data).length > 0 && (
                  <div style={styles.logData}>
                    {JSON.stringify(log.data, null, 1).slice(0, 200)}
                    {JSON.stringify(log.data).length > 200 ? '...' : ''}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default RecordingDebugPanel; 