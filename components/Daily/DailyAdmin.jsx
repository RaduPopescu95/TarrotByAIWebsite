import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Home1Header from '../../client/components/home/home-1/header';

const DailyAdmin = () => {
  const router = useRouter();
  const { meetingCode } = router.query;
  
  // Detect session type based on current path
  const isConferenceAdmin = router.asPath.includes('admin-conferinta-grup-video');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentId, setDocumentId] = useState(null);

  useEffect(() => {
    if (meetingCode) {
      const extractedDocumentId = meetingCode.split("__")[1];
      setDocumentId(extractedDocumentId);
    }
  }, [meetingCode]);

  useEffect(() => {
    const initializeDailyRoom = async () => {
      if (!documentId) return;

      try {
        setLoading(true);
        
        // Call API to create/get Daily room and token
        const response = await fetch('/api/daily/create-room', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentId: documentId,
            isOwner: true, // Admin is owner
            userRole: 'admin',
            sessionType: isConferenceAdmin ? 'conference' : 'consultation'
          }),
        });

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        console.log('🎥 [DAILY-ADMIN] Received room data:', {
          roomUrl: data.roomUrl,
          token: data.token ? 'TOKEN_PROVIDED' : 'NO_TOKEN',
          roomName: data.roomName
        });

        // Redirect directly to Daily.co Prebuilt interface
        // Admin gets basic URL with token
        const dailyUrl = data.token 
          ? `${data.roomUrl}?t=${data.token}`
          : data.roomUrl;
        
        console.log('🎥 [DAILY-ADMIN] Redirecting to:', dailyUrl);
        window.location.href = dailyUrl;
        
      } catch (error) {
        console.error('Error initializing Daily room:', error);
        setError('Failed to initialize video call');
      } finally {
        setLoading(false);
      }
    };

    initializeDailyRoom();
  }, [documentId]);

  if (loading) {
    return (
      <div className="main-wrapper home-one">
        <Home1Header />
        <div style={styles.loadingContainer}>
          <div style={styles.loadingContent}>
            <div style={styles.spinner}></div>
            <h3>Se pregătește camera video (Admin)...</h3>
            <p>Vă rugăm să așteptați</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-wrapper home-one">
        <Home1Header />
        <div style={styles.errorContainer}>
          <div style={styles.errorContent}>
            <i className="fas fa-exclamation-triangle" style={styles.errorIcon}></i>
            <h3>Eroare la inițializarea apelului</h3>
            <p>{error}</p>
            <button 
              style={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Încearcă din nou
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This component will redirect to Daily.co Prebuilt
  // So we don't need to render anything special
  return (
    <div className="main-wrapper home-one">
      <Home1Header />
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <h3>Redirecționare către Daily.co (Admin)...</h3>
          <p>Vă rugăm să așteptați</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8f9fa',
  },
  loadingContent: {
    textAlign: 'center',
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8f9fa',
  },
  errorContent: {
    textAlign: 'center',
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
  },
  errorIcon: {
    fontSize: '48px',
    color: '#dc3545',
    marginBottom: '20px',
  },
  retryButton: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
  },
};

export default DailyAdmin; 