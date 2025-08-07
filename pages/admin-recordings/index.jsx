import React, { useState, useEffect } from 'react';
import Head from 'next/head';

// Add keyframes for spinner animation
const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AdminRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    hasPrevPage: false,
    firstRecordingId: null,
    lastRecordingId: null,
    total: 0
  });
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [emailModal, setEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRecordingDetails, setSelectedRecordingDetails] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentStartingAfter, setCurrentStartingAfter] = useState(null);
  const [currentEndingBefore, setCurrentEndingBefore] = useState(null);

  // Email form state
  const [emailForm, setEmailForm] = useState({
    customEmail: '',
    customName: '',
    adminNote: ''
  });

    // Fetch recordings cu paginație Daily.co
  const fetchRecordings = async (startingAfter = null, endingBefore = null) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({ limit: '15' });
      
      if (startingAfter) {
        params.append('starting_after', startingAfter);
      }
      
      if (endingBefore) {
        params.append('ending_before', endingBefore);
      }
      
      const response = await fetch(`/api/daily/list-recordings?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecordings(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
        setCurrentStartingAfter(startingAfter);
        setCurrentEndingBefore(endingBefore);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch recordings');
      }
    } catch (err) {
      setError('Error fetching recordings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const goToNextPage = () => {
    if (pagination.hasNextPage && pagination.lastRecordingId) {
      fetchRecordings(pagination.lastRecordingId, null);
    }
  };

  const goToPrevPage = () => {
    if (pagination.hasPrevPage && pagination.firstRecordingId) {
      fetchRecordings(null, pagination.firstRecordingId);
    }
  };

  const goToFirstPage = () => {
    fetchRecordings(null, null);
  };

  // Send custom email
  const sendCustomEmail = async () => {
    if (!selectedRecording || !emailForm.customEmail) {
      alert('Please select a recording and enter an email address');
      return;
    }

    try {
      setSendingEmail(true);
      const response = await fetch('/api/daily/send-recording-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingId: selectedRecording.id,
          customEmail: emailForm.customEmail,
          customName: emailForm.customName || 'Client',
          roomName: selectedRecording.roomName,
          duration: selectedRecording.duration,
          adminNote: emailForm.adminNote
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Email sent successfully to ${emailForm.customEmail}!\nMessage ID: ${result.data.messageId}`);
        setEmailModal(false);
        setEmailForm({ customEmail: '', customName: '', adminNote: '' });
      } else {
        alert(`❌ Failed to send email: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error sending email: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Get recording details
  const getRecordingDetails = async (recordingId) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/daily/recording-details/${recordingId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedRecordingDetails(data.data);
        setDetailsModal(true);
      } else {
        alert(`❌ Failed to fetch details: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Error fetching details: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Delete recording
  const deleteRecording = async (recordingId) => {
    if (!confirm('Ești sigur că vrei să ștergi această înregistrare? Această acțiune nu poate fi anulată.')) {
      return;
    }

    try {
      const response = await fetch(`/api/daily/recording-details/${recordingId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Înregistrarea a fost ștearsă cu succes!');
        fetchRecordings(); // Refresh the list
      } else {
        alert(`❌ Failed to delete recording: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Error deleting recording: ${err.message}`);
    }
  };

  // Apply search filtering (simple text search on current page)
  const filteredRecordings = recordings.filter(recording => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      recording.roomName?.toLowerCase().includes(searchLower) ||
      recording.documentId?.toLowerCase().includes(searchLower) ||
      recording.id.toLowerCase().includes(searchLower)
    );
  });

  // Stats show current page data
  const currentPageStats = {
    consultations: filteredRecordings.filter(r => r.sessionType === 'consultation').length,
    conferences: filteredRecordings.filter(r => r.sessionType === 'conference').length,
    finished: filteredRecordings.filter(r => r.status === 'finished').length,
    processing: filteredRecordings.filter(r => r.status === 'processing').length,
    total: filteredRecordings.length
  };

  useEffect(() => {
    fetchRecordings();
  }, []); // Doar la mount, filtrarea e locală

  return (
    <>
      <Head>
        <title>Admin Înregistrări - Tarot by AI</title>
        <style>{spinnerKeyframes}</style>
      </Head>
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🎥 Administrare Înregistrări Daily.co</h1>
          <p style={styles.subtitle}>
            Gestionează înregistrările, regenerează linkuri și trimite email-uri personalizate
          </p>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.filtersContainer}>
            <div style={styles.filterRow}>
              <input
                type="text"
                placeholder="🔍 Caută în pagina curentă (room, document ID, recording ID)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            
            <div style={styles.paginationInfo}>
              <span style={styles.paginationText}>
                📄 Pagină cu {pagination.returned} înregistrări din {pagination.total} total
              </span>
            </div>
          </div>
          
          <button onClick={goToFirstPage} style={styles.refreshButton}>
            🔄 Prima pagină
          </button>
        </div>

        {/* Stats pentru pagina curentă */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.total}</span>
            <span style={styles.statLabel}>Pe pagină</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.consultations}</span>
            <span style={styles.statLabel}>Consultații</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.conferences}</span>
            <span style={styles.statLabel}>Conferințe</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.finished}</span>
            <span style={styles.statLabel}>Finalizate</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.processing}</span>
            <span style={styles.statLabel}>În procesare</span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Se încarcă înregistrările...</p>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>❌ {error}</p>
            <button onClick={fetchRecordings} style={styles.retryButton}>
              Încearcă din nou
            </button>
          </div>
        ) : (
          <div style={styles.recordingsContainer}>
            {filteredRecordings.length === 0 ? (
              <div style={styles.emptyState}>
                <p>📭 Nu s-au găsit înregistrări {filter !== 'all' ? `pentru ${filter}` : ''}</p>
              </div>
            ) : (
              <div style={styles.recordingsList}>
                {filteredRecordings.map((recording) => (
                  <div key={recording.id} style={styles.recordingCard}>
                    <div style={styles.recordingHeader}>
                      <div style={styles.recordingTitle}>
                        <span style={styles.sessionTypeIcon}>
                          {recording.sessionType === 'consultation' ? '👤' : '👥'}
                        </span>
                        <span style={styles.sessionType}>
                          {recording.sessionType === 'consultation' ? 'Consultație' : 'Conferință'}
                        </span>
                        <span style={styles.recordingDuration}>{recording.durationFormatted}</span>
                      </div>
                      <div style={styles.recordingStatus}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: recording.status === 'finished' ? '#d4edda' : '#fff3cd',
                          color: recording.status === 'finished' ? '#155724' : '#856404'
                        }}>
                          {recording.status === 'finished' ? '✅ Finalizat' : '⏳ În procesare'}
                        </span>
                      </div>
                    </div>
                    
                    <div style={styles.recordingDetails}>
                      <div style={styles.detailRow}>
                        <strong>Room:</strong> {recording.roomName || 'N/A'}
                      </div>
                      <div style={styles.detailRow}>
                        <strong>Document ID:</strong> {recording.documentId || 'N/A'}
                      </div>
                      <div style={styles.detailRow}>
                        <strong>Start Time:</strong> {recording.startedAt || 'N/A'}
                      </div>
                      {recording.mtgSessionId && (
                        <div style={styles.detailRow}>
                          <strong>Session ID:</strong> 
                          <code style={styles.recordingId}>{recording.mtgSessionId}</code>
                        </div>
                      )}
                      <div style={styles.detailRow}>
                        <strong>Recording ID:</strong> 
                        <code style={styles.recordingId}>{recording.id}</code>
                      </div>
                      <div style={styles.detailRowGrid}>
                        {recording.sizeMB && (
                          <span><strong>Mărime:</strong> {recording.sizeMB} MB</span>
                        )}
                        {recording.tracks && (
                          <span><strong>Tracks:</strong> {recording.tracks.count || 0}</span>
                        )}
                        {recording.s3key && (
                          <span><strong>S3 Key:</strong> ✅</span>
                        )}
                      </div>
                    </div>

                    <div style={styles.recordingActions}>
                      <button
                        onClick={() => getRecordingDetails(recording.id)}
                        style={{...styles.actionButton, background: '#17a2b8'}}
                        disabled={loadingDetails}
                      >
                        🔍 Detalii Complete
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecording(recording);
                          setEmailModal(true);
                        }}
                        style={styles.actionButton}
                        disabled={recording.status !== 'finished'}
                      >
                        📧 Trimite Email Custom
                      </button>
                      <button
                        onClick={() => deleteRecording(recording.id)}
                        style={{...styles.actionButton, background: '#dc3545'}}
                        disabled={recording.status !== 'finished'}
                      >
                        🗑️ Șterge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination Controls */}
            <div style={styles.paginationContainer}>
              <button 
                onClick={goToFirstPage}
                style={{...styles.paginationButton, opacity: pagination.hasPrevPage ? 1 : 0.5}}
                disabled={!pagination.hasPrevPage}
              >
                ⏮️ Prima
              </button>
              <button 
                onClick={goToPrevPage}
                style={{...styles.paginationButton, opacity: pagination.hasPrevPage ? 1 : 0.5}}
                disabled={!pagination.hasPrevPage}
              >
                ⬅️ Anterioară
              </button>
              <span style={styles.paginationText}>
                📄 Afișez {pagination.returned} din {pagination.total} înregistrări
              </span>
              <button 
                onClick={goToNextPage}
                style={{...styles.paginationButton, opacity: pagination.hasNextPage ? 1 : 0.5}}
                disabled={!pagination.hasNextPage}
              >
                Următoarea ➡️
              </button>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {detailsModal && selectedRecordingDetails && (
          <div style={styles.modalOverlay}>
            <div style={{...styles.modal, maxWidth: '800px'}}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  🔍 Detalii Complete Înregistrare
                </h3>
                <button 
                  onClick={() => setDetailsModal(false)}
                  style={styles.closeButton}
                >
                  ✕
                </button>
              </div>
              
              <div style={styles.modalContent}>
                <div style={styles.detailsContainer}>
                  
                  {/* Basic Info */}
                  <div style={styles.detailsSection}>
                    <h4>📋 Informații de bază</h4>
                    <div style={styles.detailsGrid}>
                      <div><strong>ID:</strong> {selectedRecordingDetails.id}</div>
                      <div><strong>Status:</strong> <span style={{
                        color: selectedRecordingDetails.status === 'finished' ? '#28a745' : '#ffc107'
                      }}>{selectedRecordingDetails.status}</span></div>
                      <div><strong>Room:</strong> {selectedRecordingDetails.roomName}</div>
                      <div><strong>Tip sesiune:</strong> {selectedRecordingDetails.sessionType}</div>
                      <div><strong>Document ID:</strong> {selectedRecordingDetails.documentId}</div>
                      <div><strong>Domeniu:</strong> {selectedRecordingDetails.domainName}</div>
                    </div>
                  </div>

                  {/* Timing Info */}
                  <div style={styles.detailsSection}>
                    <h4>⏰ Informații timp</h4>
                    <div style={styles.detailsGrid}>
                      <div><strong>Start Timestamp:</strong> {selectedRecordingDetails.startTs}</div>
                      <div><strong>Data start:</strong> {selectedRecordingDetails.startDateFormatted}</div>
                      <div><strong>Creat la:</strong> {selectedRecordingDetails.creationDateFormatted}</div>
                      <div><strong>Durata:</strong> {selectedRecordingDetails.durationFormatted}</div>
                    </div>
                  </div>

                  {/* Session Info */}
                  <div style={styles.detailsSection}>
                    <h4>👥 Informații sesiune</h4>
                    <div style={styles.detailsGrid}>
                      <div><strong>Max participanți:</strong> {selectedRecordingDetails.maxParticipants}</div>
                      <div><strong>Meeting Session ID:</strong> {selectedRecordingDetails.mtgSessionId || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Storage Info */}
                  <div style={styles.detailsSection}>
                    <h4>💾 Informații stocare</h4>
                    <div style={styles.detailsGrid}>
                      <div><strong>Mărime:</strong> {selectedRecordingDetails.sizeMB} MB ({selectedRecordingDetails.sizeBytes} bytes)</div>
                      <div><strong>S3 Key:</strong> {selectedRecordingDetails.s3key || 'N/A'}</div>
                      <div><strong>Compus de:</strong> {selectedRecordingDetails.composedBy || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Tracks Info */}
                  {selectedRecordingDetails.tracks && selectedRecordingDetails.tracks.count > 0 && (
                    <div style={styles.detailsSection}>
                      <h4>🎵 Track-uri media ({selectedRecordingDetails.tracks.count})</h4>
                      <div style={styles.tracksContainer}>
                        {selectedRecordingDetails.tracks.details.map((track, index) => (
                          <div key={index} style={styles.trackItem}>
                            <strong>Track {index + 1}:</strong> {track.type} 
                            {track.kind && ` (${track.kind})`}
                            {track.duration && ` - ${track.duration}s`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Download Links */}
                  {(selectedRecordingDetails.downloadUrl || selectedRecordingDetails.playbackUrl) && (
                    <div style={styles.detailsSection}>
                      <h4>🔗 Link-uri disponibile</h4>
                      {selectedRecordingDetails.downloadUrl && (
                        <div style={styles.linkContainer}>
                          <strong>Download URL:</strong>
                          <a href={selectedRecordingDetails.downloadUrl} target="_blank" rel="noopener noreferrer" style={styles.downloadLink}>
                            📥 Descarcă direct
                          </a>
                        </div>
                      )}
                      {selectedRecordingDetails.playbackUrl && (
                        <div style={styles.linkContainer}>
                          <strong>Playback URL:</strong>
                          <a href={selectedRecordingDetails.playbackUrl} target="_blank" rel="noopener noreferrer" style={styles.downloadLink}>
                            ▶️ Redare direct
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                </div>
                
                <div style={styles.modalActions}>
                  <button 
                    onClick={() => setDetailsModal(false)}
                    style={styles.cancelButton}
                  >
                    Închide
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedRecording(selectedRecordingDetails);
                      setDetailsModal(false);
                      setEmailModal(true);
                    }}
                    style={styles.sendButton}
                    disabled={selectedRecordingDetails.status !== 'finished'}
                  >
                    📧 Trimite Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {emailModal && selectedRecording && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  📧 Trimite Înregistrarea prin Email
                </h3>
                <button 
                  onClick={() => setEmailModal(false)}
                  style={styles.closeButton}
                >
                  ✕
                </button>
              </div>
              
              <div style={styles.modalContent}>
                <div style={styles.recordingInfo}>
                  <h4>Înregistrare selectată:</h4>
                  <p><strong>Tip:</strong> {selectedRecording.sessionType === 'consultation' ? 'Consultație' : 'Conferință'}</p>
                  <p><strong>Durata:</strong> {selectedRecording.durationFormatted}</p>
                  <p><strong>Room:</strong> {selectedRecording.roomName}</p>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email destinatar *</label>
                  <input
                    type="email"
                    value={emailForm.customEmail}
                    onChange={(e) => setEmailForm({...emailForm, customEmail: e.target.value})}
                    placeholder="client@example.com"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nume client</label>
                  <input
                    type="text"
                    value={emailForm.customName}
                    onChange={(e) => setEmailForm({...emailForm, customName: e.target.value})}
                    placeholder="Numele clientului"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notă personală (opțional)</label>
                  <textarea
                    value={emailForm.adminNote}
                    onChange={(e) => setEmailForm({...emailForm, adminNote: e.target.value})}
                    placeholder="Adaugă o notă personală pentru client..."
                    style={styles.textarea}
                    rows={3}
                  />
                </div>

                <div style={styles.modalActions}>
                  <button 
                    onClick={() => setEmailModal(false)}
                    style={styles.cancelButton}
                  >
                    Anulează
                  </button>
                  <button 
                    onClick={sendCustomEmail}
                    style={styles.sendButton}
                    disabled={sendingEmail || !emailForm.customEmail}
                  >
                    {sendingEmail ? '⏳ Se trimite...' : '📧 Trimite Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    color: '#667eea',
    fontSize: '2.5rem',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#666',
    fontSize: '1.1rem'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    gap: '15px',
    flexWrap: 'wrap'
  },
  filtersContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  filterRow: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  dateFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  dateLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 'bold'
  },
  dateInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  clearDateButton: {
    padding: '6px 12px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '200px'
  },
  searchInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    flex: 1,
    minWidth: '300px'
  },
  refreshButton: {
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statNumber: {
    display: 'block',
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#667eea'
  },
  statLabel: {
    color: '#666',
    fontSize: '0.9rem'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '50px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '50px'
  },
  errorText: {
    color: '#dc3545',
    fontSize: '1.1rem',
    marginBottom: '20px'
  },
  retryButton: {
    padding: '10px 20px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  recordingsContainer: {
    marginTop: '20px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px',
    color: '#666'
  },
  recordingsList: {
    display: 'grid',
    gap: '20px'
  },
  recordingCard: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  recordingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  recordingTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  sessionTypeIcon: {
    fontSize: '1.2rem'
  },
  sessionType: {
    fontWeight: 'bold',
    color: '#333'
  },
  recordingDuration: {
    background: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.9rem',
    color: '#666'
  },
  recordingStatus: {},
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  recordingDetails: {
    marginBottom: '15px'
  },
  detailRow: {
    marginBottom: '8px',
    color: '#555'
  },
  detailRowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '8px',
    marginTop: '8px'
  },
  recordingId: {
    background: '#f8f9fa',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    marginLeft: '8px'
  },
  recordingActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  actionButton: {
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 20px 10px',
    borderBottom: '1px solid #eee'
  },
  modalTitle: {
    margin: 0,
    color: '#333'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#999'
  },
  modalContent: {
    padding: '20px'
  },
  recordingInfo: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },
  cancelButton: {
    padding: '10px 20px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  sendButton: {
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  // Details Modal Styles
  detailsContainer: {
    maxHeight: '70vh',
    overflowY: 'auto'
  },
  detailsSection: {
    marginBottom: '20px',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '10px'
  },
  tracksContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  trackItem: {
    padding: '8px',
    background: 'white',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  },
  linkContainer: {
    marginBottom: '10px',
    padding: '10px',
    background: 'white',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  downloadLink: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px'
  },
  // Pagination Styles
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    margin: '30px 0',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #e9ecef'
  },
  paginationButton: {
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  paginationText: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666',
    margin: '0 10px'
  },
  paginationInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    alignItems: 'center'
  }
};

export default AdminRecordings; 