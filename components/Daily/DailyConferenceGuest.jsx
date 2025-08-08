import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Home1Header from '../../client/components/home/home-1/header';
import { useAuth } from '../../context/AuthContext';

const DailyConferenceGuest = () => {
  const router = useRouter();
  const { accessLink } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const { currentUser, userData } = useAuth();

  const clientName = useMemo(() => {
    if (userData?.first_name || userData?.last_name) {
      return `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim();
    }
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    return null;
  }, [currentUser, userData]);

  useEffect(() => {
    if (accessLink) {
      // Extract documentId from accessLink
      // Format: grup_{conferenceId}_guest_{guestId}_{timestamp}_{randomId}
      const parts = accessLink.split('_');
      if (parts.length >= 2) {
        const extractedDocumentId = parts[1]; // conferenceId part
        setDocumentId(extractedDocumentId);
        console.log('🎥 [DAILY-CONFERENCE-GUEST] Extracted documentId:', extractedDocumentId);
      } else {
        setError('Invalid access link format');
        return;
      }
    }
  }, [accessLink]);

  useEffect(() => {
    const initializeDailyRoom = async () => {
      if (!documentId) return;

      try {
        setLoading(true);

        console.log('🎥 [DAILY-CONFERENCE-GUEST] Initializing Daily room for guest...');

        // Call API to create/get Daily room and token for conference guest
        const response = await fetch('/api/daily/create-room', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentId: documentId,
            isOwner: false, // Guest is not owner
            userRole: 'client', // Guest has client permissions
            sessionType: 'conference', // This is a conference session
            clientName: clientName || undefined,
            fullMeetingCode: accessLink
          }),
        });

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        console.log('🎥 [DAILY-CONFERENCE-GUEST] Received room data:', {
          roomUrl: data.roomUrl,
          token: data.token ? 'TOKEN_PROVIDED' : 'NO_TOKEN',
          roomName: data.roomName
        });

        // Redirect directly to Daily.co Prebuilt interface
        const dailyUrl = data.token 
          ? `${data.roomUrl}?t=${data.token}`
          : data.roomUrl;
        
        console.log('🎥 [DAILY-CONFERENCE-GUEST] Redirecting guest to:', dailyUrl);
        window.location.href = dailyUrl;
        
      } catch (error) {
        console.error('Error initializing Daily room for guest:', error);
        setError('Failed to initialize conference access');
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
            <h3>Se verifică accesul la conferința grup...</h3>
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
            <h3>Eroare la accesarea conferinței</h3>
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
  return (
    <div className="main-wrapper home-one">
      <Home1Header />
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <h3>Redirecționare către conferința grup...</h3>
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
    height: '80vh',
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
    borderTop: '4px solid #667eea',
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
    height: '80vh',
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
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px',
  },
};

export default DailyConferenceGuest; 