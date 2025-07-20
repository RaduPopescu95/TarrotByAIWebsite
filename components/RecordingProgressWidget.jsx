import React, { useState, useEffect } from 'react';

const RecordingProgressWidget = ({ 
  isRecording = false, 
  recordingDuration = 0, 
  recordingStatus = '', 
  recordingError = '',
  onCancel = () => {},
  onStart = () => {},
  onStop = () => {},
  showCancelButton = false,
  showStartStopButtons = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    // Pulse animation for recording indicator
    if (isRecording) {
      const interval = setInterval(() => {
        setPulseAnimation(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    if (recordingError) return '❌';
    if (recordingStatus.includes('Upload:')) return '📤';
    if (recordingStatus.includes('complet')) return '✅';
    if (recordingStatus.includes('oprire') || recordingStatus.includes('Oprire')) return '🛑';
    if (recordingStatus.includes('proces') || recordingStatus.includes('Procesare')) return '⚙️';
    if (isRecording) return '🔴';
    return '📹';
  };

  const getProgressPercentage = () => {
    if (recordingStatus.includes('Upload:')) {
      const match = recordingStatus.match(/(\d+)%/);
      return match ? parseInt(match[1]) : 0;
    }
    return null;
  };

  const progressPercentage = getProgressPercentage();

  // Don't show widget if no recording activity
  if (!isRecording && !recordingStatus && !recordingError) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* Compact Widget */}
      <div 
        style={{
          ...styles.widget,
          ...(isExpanded ? styles.widgetExpanded : {})
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Main Status Line */}
        <div style={styles.mainLine}>
          <div style={{
            ...styles.statusIcon,
            animation: isRecording && pulseAnimation ? 'pulse 1s ease-in-out' : 'none'
          }}>
            {getStatusIcon()}
          </div>
          
          {isRecording && (
            <div style={styles.timer}>
              {formatTime(recordingDuration)}
            </div>
          )}
          
          {progressPercentage !== null && (
            <div style={styles.percentage}>
              {progressPercentage}%
            </div>
          )}
          
          <div style={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>

        {/* Progress Bar */}
        {progressPercentage !== null && (
          <div style={styles.progressBarContainer}>
            <div 
              style={{
                ...styles.progressBar,
                width: `${progressPercentage}%`
              }}
            />
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div style={styles.expandedContent}>
            {/* Status Message */}
            {recordingStatus && (
              <div style={styles.statusText}>
                {recordingStatus}
              </div>
            )}
            
            {/* Error Message */}
            {recordingError && (
              <div style={styles.errorText}>
                {recordingError}
              </div>
            )}
            
            {/* Instructions */}
            <div style={styles.instructions}>
              {isRecording ? (
                <span>📹 Înregistrare activă</span>
              ) : recordingStatus.includes('Upload:') ? (
                <span>📤 NU închide browser-ul!</span>
              ) : recordingStatus.includes('complet') ? (
                <span>✅ Upload complet</span>
              ) : null}
            </div>
            
            {/* Start/Stop Recording Buttons */}
            {showStartStopButtons && (
              <div style={styles.buttonContainer}>
                {!isRecording ? (
                  <button 
                    style={styles.startButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart();
                    }}
                  >
                    <i className="fas fa-circle" style={{marginRight: '6px'}}></i>
                    Începe
                  </button>
                ) : (
                  <button 
                    style={styles.stopButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStop();
                    }}
                  >
                    <i className="fas fa-stop" style={{marginRight: '6px'}}></i>
                    Oprește
                  </button>
                )}
              </div>
            )}
            
            {/* Cancel Button */}
            {showCancelButton && isRecording && (
              <button 
                style={styles.cancelButton}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Anulezi înregistrarea?')) {
                    onCancel();
                  }
                }}
              >
                Anulează
              </button>
            )}
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 200px; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    fontFamily: 'Arial, sans-serif'
  },
  
  widget: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: '12px',
    padding: '12px',
    minWidth: '180px',
    maxWidth: '280px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
  },
  
  widgetExpanded: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    minWidth: '280px'
  },
  
  mainLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'space-between'
  },
  
  statusIcon: {
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px'
  },
  
  timer: {
    fontSize: '14px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#ff4757',
    minWidth: '50px'
  },
  
  percentage: {
    fontSize: '12px',
    color: '#3742fa',
    fontWeight: 'bold'
  },
  
  expandIcon: {
    fontSize: '10px',
    color: '#999',
    marginLeft: 'auto'
  },
  
  progressBarContainer: {
    width: '100%',
    height: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
    marginTop: '8px',
    overflow: 'hidden'
  },
  
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #3742fa, #5352ed)',
    borderRadius: '2px',
    transition: 'width 0.3s ease'
  },
  
  expandedContent: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'slideDown 0.3s ease-out'
  },
  
  statusText: {
    fontSize: '12px',
    color: '#ddd',
    marginBottom: '8px',
    lineHeight: '1.4'
  },
  
  errorText: {
    fontSize: '12px',
    color: '#ff4757',
    marginBottom: '8px',
    lineHeight: '1.4'
  },
  
  instructions: {
    fontSize: '11px',
    color: '#999',
    fontStyle: 'italic',
    marginBottom: '8px'
  },
  
  buttonContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px'
  },
  
  startButton: {
    background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  stopButton: {
    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  cancelButton: {
    background: '#ff4757',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%'
  }
};

export default RecordingProgressWidget; 