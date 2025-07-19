import React, { useState, useEffect } from 'react';

const UploadProgressMonitor = ({ 
  isUploading, 
  progress, 
  onCancel, 
  showWarning = true 
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showCloseWarning, setShowCloseWarning] = useState(false);

  useEffect(() => {
    let interval;
    if (isUploading) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setTimeElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isUploading]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isUploading && showWarning) {
        const message = 'Înregistrarea se procesează pe server. Procesul va continua chiar dacă închideți browser-ul.';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploading, showWarning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isUploading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 10000,
      minWidth: '300px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#4CAF50',
          marginRight: '10px',
          animation: 'pulse 2s infinite'
        }}></div>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          📤 Procesare pe server
        </h3>
      </div>

      {/* Progress Info */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '10px'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>
            ⏱️ Timp scurs: <strong>{formatTime(timeElapsed)}</strong>
          </div>
          <div style={{ fontSize: '14px' }}>
            🔄 Status: <strong>În procesare...</strong>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #4CAF50, #2196F3)',
            animation: 'slideProgress 2s ease-in-out infinite'
          }}></div>
        </div>
      </div>

      {/* Safety Message */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '6px',
        padding: '10px',
        fontSize: '13px',
        lineHeight: '1.4',
        marginBottom: '15px'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '5px' }}>
          🛡️ Siguranță garantată:
        </div>
        <div>
          • Procesarea continuă pe server<br/>
          • Poți închide browser-ul în siguranță<br/>
          • Vei primi email când e gata
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setShowCloseWarning(!showCloseWarning)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          {showCloseWarning ? '🔇 Dezactivează avertismente' : '🔊 Activează avertismente'}
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            color: '#333',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default UploadProgressMonitor; 