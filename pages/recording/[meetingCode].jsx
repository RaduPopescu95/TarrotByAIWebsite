import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Home1Header from '../../client/components/home/home-1/header';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const RecordingPage = () => {
  const router = useRouter();
  const { meetingCode } = router.query;
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (meetingCode) {
      const recordingRef = doc(db, 'Recordings', meetingCode);
      const unsubscribe = onSnapshot(recordingRef, (snapshot) => {
        if (snapshot.exists()) {
          setRecording(snapshot.data());
        } else {
          setError('Înregistrarea nu a fost găsită');
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching recording:', error);
        setError('Eroare la încărcarea înregistrării');
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [meetingCode]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'recording':
        return {
          icon: '🔴',
          text: 'În curs de înregistrare',
          color: '#e74c3c',
          description: 'Consultația se înregistrează în timp real'
        };
      case 'stopped':
        return {
          icon: '⏸️',
          text: 'Înregistrarea oprită',
          color: '#f39c12',
          description: 'Înregistrarea s-a oprit, se procesează...'
        };
      case 'processing':
        return {
          icon: '⚙️',
          text: 'Se procesează',
          color: '#3498db',
          description: 'Fișierul video se procesează pentru descărcare'
        };
      case 'ready':
        return {
          icon: '✅',
          text: 'Pregătit pentru descărcare',
          color: '#27ae60',
          description: 'Înregistrarea este disponibilă pentru descărcare'
        };
      case 'expired':
        return {
          icon: '❌',
          text: 'Expirat',
          color: '#e74c3c',
          description: 'Link-ul de descărcare a expirat'
        };
      default:
        return {
          icon: '⏳',
          text: 'Status necunoscut',
          color: '#95a5a6',
          description: 'Verificarea statusului...'
        };
    }
  };

  const handleDownload = async (format) => {
    if (!recording || !recording.downloadLinks) {
      alert('Link-ul de descărcare nu este disponibil încă');
      return;
    }

    try {
      setDownloadProgress(0);
      const downloadLink = recording.downloadLinks[format];
      
      if (!downloadLink) {
        alert(`Formatul ${format} nu este disponibil`);
        return;
      }

      // Simulate download progress
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Start download
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = `consultatie-${meetingCode}.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setDownloadProgress(0);
      }, 3000);

    } catch (error) {
      console.error('Download error:', error);
      alert('Eroare la descărcare. Vă rugăm încercați din nou.');
      setDownloadProgress(0);
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = Math.round((endTime - startTime) / 60000);
    return `${duration} minute`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="main-wrapper">
        <Home1Header />
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <h3>Se încarcă informațiile înregistrării...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-wrapper">
        <Home1Header />
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <i className="fas fa-exclamation-triangle" style={styles.errorIcon}></i>
            <h3>Eroare</h3>
            <p>{error}</p>
            <button style={styles.backButton} onClick={() => router.push('/')}>
              Înapoi la pagina principală
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(recording?.status);

  return (
    <div className="main-wrapper">
      <Home1Header />
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <h1>🎥 Înregistrare Consultație</h1>
            <div style={styles.statusBadge}>
              <span style={styles.statusIcon}>{statusInfo.icon}</span>
              <span style={styles.statusText}>{statusInfo.text}</span>
            </div>
          </div>

          <div style={styles.infoSection}>
            <h2>Detalii înregistrare</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <strong>📅 Data început:</strong>
                <span>{formatDate(recording?.startTime)}</span>
              </div>
              <div style={styles.infoItem}>
                <strong>⏱️ Durata:</strong>
                <span>{formatDuration(recording?.startTime, recording?.endTime)}</span>
              </div>
              <div style={styles.infoItem}>
                <strong>💾 Stocare:</strong>
                <span>AWS S3 (Securizat)</span>
              </div>
              <div style={styles.infoItem}>
                <strong>📊 Status:</strong>
                <span style={{ color: statusInfo.color }}>{statusInfo.description}</span>
              </div>
            </div>
          </div>

          {recording?.status === 'ready' && (
            <div style={styles.downloadSection}>
              <h2>📥 Descărcare</h2>
              <div style={styles.downloadGrid}>
                <div style={styles.downloadCard}>
                  <div style={styles.downloadIcon}>🎬</div>
                  <h3>Format MP4</h3>
                  <p>Calitate înaltă, compatibil cu toate dispozitivele</p>
                  <button
                    style={styles.downloadButton}
                    onClick={() => handleDownload('mp4')}
                    disabled={downloadProgress > 0}
                  >
                    {downloadProgress > 0 ? `Descărcare ${downloadProgress}%` : 'Descarcă MP4'}
                  </button>
                </div>
                
                <div style={styles.downloadCard}>
                  <div style={styles.downloadIcon}>📺</div>
                  <h3>Format HLS</h3>
                  <p>Optimizat pentru streaming online</p>
                  <button
                    style={styles.downloadButton}
                    onClick={() => handleDownload('hls')}
                    disabled={downloadProgress > 0}
                  >
                    {downloadProgress > 0 ? `Descărcare ${downloadProgress}%` : 'Descarcă HLS'}
                  </button>
                </div>
              </div>

              {downloadProgress > 0 && (
                <div style={styles.progressContainer}>
                  <div style={styles.progressBar}>
                    <div 
                      style={{
                        ...styles.progressFill,
                        width: `${downloadProgress}%`
                      }}
                    ></div>
                  </div>
                  <span style={styles.progressText}>{downloadProgress}% complet</span>
                </div>
              )}
            </div>
          )}

          {recording?.status === 'processing' && (
            <div style={styles.processingSection}>
              <div style={styles.processingIcon}>⚙️</div>
              <h3>Se procesează înregistrarea</h3>
              <p>Înregistrarea se procesează în momentul acesta. Acest proces poate dura 10-15 minute.</p>
              <p>Veți primi un email când înregistrarea va fi gata de descărcat.</p>
              <div style={styles.processingSpinner}></div>
            </div>
          )}

          <div style={styles.infoBox}>
            <h3>🔒 Informații importante</h3>
            <ul style={styles.infoList}>
              <li>Înregistrarea este stocată securizat în cloud</li>
              <li>Link-ul de descărcare este valid 30 de zile</li>
              <li>Fișierul este accesibil doar participanților la consultație</li>
              <li>Pentru probleme tehnice, contactați echipa de suport</li>
            </ul>
          </div>

          <div style={styles.footer}>
            <button style={styles.backButton} onClick={() => router.push('/')}>
              ← Înapoi la pagina principală
            </button>
            <button
              style={styles.refreshButton}
              onClick={() => window.location.reload()}
            >
              🔄 Reîmprospătează
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '20px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: '#e9ecef',
    marginTop: '10px',
  },
  statusIcon: {
    fontSize: '16px',
  },
  statusText: {
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: '30px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #007bff',
  },
  downloadSection: {
    marginBottom: '30px',
  },
  downloadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  downloadCard: {
    textAlign: 'center',
    padding: '25px',
    border: '2px solid #e9ecef',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  downloadIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  downloadButton: {
    backgroundColor: '#28a745',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '15px',
  },
  progressContainer: {
    marginTop: '20px',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '14px',
    color: '#6c757d',
  },
  processingSection: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#e3f2fd',
    borderRadius: '12px',
    marginBottom: '30px',
  },
  processingIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  processingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e9ecef',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '20px auto',
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  infoList: {
    paddingLeft: '20px',
    lineHeight: '1.8',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    marginTop: '30px',
  },
  backButton: {
    backgroundColor: '#6c757d',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  refreshButton: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #e9ecef',
    borderTop: '5px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px',
  },
  errorIcon: {
    fontSize: '64px',
    color: '#e74c3c',
    marginBottom: '20px',
  },
};

export default RecordingPage; 