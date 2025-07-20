import React, { useState, useEffect } from 'react';

const RecordingProgressMonitor = ({ 
  isRecording = false, 
  recordingDuration = 0, 
  recordingStatus = '', 
  recordingError = '',
  onCancel = () => {},
  showCancelButton = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    setIsVisible(isRecording || recordingStatus || recordingError);
    
    // Pulse animation for recording indicator
    if (isRecording) {
      const interval = setInterval(() => {
        setPulseAnimation(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording, recordingStatus, recordingError]);

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

  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={{
              ...styles.recordingIndicator,
              animation: isRecording ? 'pulse 2s infinite' : 'none'
            }}>
              {getStatusIcon()}
            </div>
            <h3 style={styles.title}>
              {isRecording ? 'Înregistrare în Curs' : 
               recordingError ? 'Eroare Înregistrare' :
               recordingStatus.includes('complet') ? 'Înregistrare Completă' :
               'Procesare Înregistrare'}
            </h3>
          </div>
          
          {showCancelButton && isRecording && (
            <button 
              style={styles.cancelButton}
              onClick={onCancel}
              title="Anulează înregistrarea"
            >
              ✕
            </button>
          )}
        </div>

        {/* Recording Timer */}
        {isRecording && (
          <div style={styles.timerSection}>
            <div style={styles.timer}>
              {formatTime(recordingDuration)}
            </div>
            <div style={styles.timerLabel}>
              durata înregistrării
            </div>
          </div>
        )}

        {/* Status Message */}
        {recordingStatus && (
          <div style={styles.statusSection}>
            <div style={{
              ...styles.statusMessage,
              color: recordingError ? '#ff4757' : 
                     recordingStatus.includes('complet') ? '#2ed573' : '#5352ed'
            }}>
              {recordingStatus}
            </div>
          </div>
        )}

        {/* Progress Bar for Upload */}
        {progressPercentage !== null && (
          <div style={styles.progressSection}>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${progressPercentage}%`
                }}
              />
            </div>
            <div style={styles.progressText}>
              {progressPercentage}% completat
            </div>
          </div>
        )}

        {/* Error Display */}
        {recordingError && (
          <div style={styles.errorSection}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorMessage}>
              {recordingError}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={styles.instructions}>
          {isRecording ? (
            <div style={styles.instructionText}>
              <strong>🛡️ Înregistrarea este în curs...</strong><br/>
              • Poți continua să folosești platforma normal<br/>
              • Nu închide browser-ul până nu se termină upload-ul<br/>
              • Procesarea se face local pe dispozitivul tău
            </div>
          ) : recordingStatus.includes('Upload:') ? (
            <div style={styles.instructionText}>
              <strong>📤 Upload în curs...</strong><br/>
              • Fișierul se încarcă în Firebase Storage<br/>
              • NU închide browser-ul acum<br/>
              • Progresul este salvat în timp real
            </div>
          ) : recordingStatus.includes('complet') ? (
            <div style={styles.instructionText}>
              <strong>🎉 Succes!</strong><br/>
              • Înregistrarea a fost salvată în siguranță<br/>
              • Metadata a fost salvată în baza de date<br/>
              • Poți închide această fereastră acum
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        {(recordingStatus.includes('complet') || recordingError) && (
          <div style={styles.actionButtons}>
            <button 
              style={styles.closeButton}
              onClick={() => setIsVisible(false)}
            >
              {recordingError ? 'Închide' : 'Perfect! 👍'}
            </button>
          </div>
        )}
      </div>

      {/* Global Styles for Animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(8px)',
    animation: 'slideIn 0.3s ease-out'
  },
  
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    animation: 'slideIn 0.3s ease-out',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f1f2f6'
  },
  
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  recordingIndicator: {
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2f3542'
  },
  
  cancelButton: {
    background: '#ff4757',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  
  timerSection: {
    textAlign: 'center',
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '2px solid #e9ecef'
  },
  
  timer: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ff4757',
    fontFamily: 'monospace',
    letterSpacing: '2px'
  },
  
  timerLabel: {
    fontSize: '14px',
    color: '#57606f',
    marginTop: '8px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  
  statusSection: {
    marginBottom: '20px'
  },
  
  statusMessage: {
    fontSize: '16px',
    fontWeight: '500',
    textAlign: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  },
  
  progressSection: {
    marginBottom: '20px'
  },
  
  progressBar: {
    width: '100%',
    height: '12px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #5352ed, #3742fa)',
    borderRadius: '6px',
    transition: 'width 0.3s ease',
    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
    backgroundSize: '20px 20px',
    animation: 'shimmer 2s linear infinite'
  },
  
  progressText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#57606f',
    fontWeight: '500'
  },
  
  errorSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
    border: '1px solid #fed7d7',
    marginBottom: '20px'
  },
  
  errorIcon: {
    fontSize: '24px',
    flexShrink: 0
  },
  
  errorMessage: {
    color: '#c53030',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  
  instructions: {
    marginBottom: '24px'
  },
  
  instructionText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#57606f',
    backgroundColor: '#f8f9ff',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e6e8ff'
  },
  
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  },
  
  closeButton: {
    backgroundColor: '#2ed573',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px'
  }
};

export default RecordingProgressMonitor; 