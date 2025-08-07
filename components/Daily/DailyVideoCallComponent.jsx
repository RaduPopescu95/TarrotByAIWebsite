import React, { useEffect, useState } from 'react';
import {
  useCallObject,
  useParticipantIds,
  useDailyEvent,
} from '@daily-co/daily-react';

const DailyVideoCallComponent = ({ documentId, userRole, onCallEnd }) => {
  console.log('🎥 [DAILY] DailyVideoCallComponent initialized', { documentId, userRole });
  
  const callObject = useCallObject();
  const participantIds = useParticipantIds();
  
  const [isSessionActive, setSessionActive] = useState(false);

  console.log('🎥 [DAILY] Hooks state:', {
    callObject: !!callObject,
    participantCount: participantIds.length,
    participantIds
  });

  // Daily.co event handlers
  useDailyEvent('joined-meeting', () => {
    console.log('🎥 [DAILY] Joined meeting successfully');
    setSessionActive(true);
  });

  useDailyEvent('left-meeting', () => {
    console.log('🎥 [DAILY] Left meeting');
    setSessionActive(false);
  });

  useDailyEvent('participant-joined', (event) => {
    console.log('🎥 [DAILY] Participant joined:', event.participant);
  });

  useDailyEvent('participant-left', (event) => {
    console.log('🎥 [DAILY] Participant left:', event.participant);
  });

  useDailyEvent('error', (event) => {
    console.error('🎥 [DAILY] Error occurred:', event);
  });

  const handleEndCall = () => {
    console.log('🎥 [DAILY] handleEndCall called by user action');
    
    if (callObject) {
      callObject.leave();
    }
    
    if (onCallEnd) {
      console.log('🎥 [DAILY] Calling onCallEnd callback');
      onCallEnd();
    }
  };

  return (
    <div style={styles.container}>
      {/* Video grid */}
      <div style={styles.videoGrid}>
        {participantIds.length > 0 ? (
          <div style={styles.participantInfo}>
            <h3>Participanți conectați: {participantIds.length}</h3>
            <p>Daily.co video call activ</p>
          </div>
        ) : (
          <div style={styles.waitingMessage}>
            <h3>Așteptăm participanți să se conecteze...</h3>
            <p>Participanți conectați: {participantIds.length}</p>
          </div>
        )}
      </div>

      {/* Simple controls */}
      <div style={styles.controls}>
        <button
          style={styles.endCallButton}
          onClick={handleEndCall}
        >
          Termină apelul
        </button>
      </div>

      {/* Waiting overlay */}
      {participantIds.length <= 1 && (
        <div style={styles.waitingOverlay}>
          <div style={styles.waitingContent}>
            <h4>
              {userRole === 'admin' 
                ? 'Așteptăm ca clientul să se conecteze...' 
                : 'Așteptăm ca adminul să se conecteze...'
              }
            </h4>
            <p>Interfața video este pregătită. Apelul va începe automat când ambele părți se vor conecta.</p>
            <p><small>Participanți conectați: {participantIds.length}</small></p>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
  },
  videoGrid: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  participantInfo: {
    color: '#fff',
    textAlign: 'center',
  },
  waitingMessage: {
    color: '#fff',
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '15px',
  },
  endCallButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  waitingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  waitingContent: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
    maxWidth: '400px',
    margin: '20px',
  },
};

export default DailyVideoCallComponent; 