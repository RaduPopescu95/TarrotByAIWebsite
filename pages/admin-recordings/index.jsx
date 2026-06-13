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
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [resendingDefault, setResendingDefault] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage] = useState(100);
  const [selectedRecordingDetails, setSelectedRecordingDetails] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [recordingErrors, setRecordingErrors] = useState([]);
  const [errorsLoading, setErrorsLoading] = useState(false);
  const [errorsExpanded, setErrorsExpanded] = useState(true);
  const [expandedErrorCards, setExpandedErrorCards] = useState({});
  const [errorDetailsModal, setErrorDetailsModal] = useState(false);
  const [errorDetailsPayload, setErrorDetailsPayload] = useState(null);
  const [accessLinkByRecording, setAccessLinkByRecording] = useState({});
  const [accessLinkLoading, setAccessLinkLoading] = useState(null);
  const [copyHint, setCopyHint] = useState('');
  const [videoPlayer, setVideoPlayer] = useState({ open: false, link: null, title: '', recordingId: null });
  const [preparingPlayer, setPreparingPlayer] = useState(null);

  // Email form state
  const [emailForm, setEmailForm] = useState({
    customEmail: '',
    customName: '',
    adminNote: ''
  });

  const fetchRecordings = async (startingAfter = null, endingBefore = null) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({ limit: perPage.toString() });
      
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

  const fetchRecordingErrors = async () => {
    try {
      setErrorsLoading(true);
      const resp = await fetch('/api/daily/list-recording-errors?limit=100&resolved=false');
      const data = await resp.json();
      if (data.success) {
        setRecordingErrors(data.errors || []);
      } else {
        console.error('Failed to load recording errors:', data.error);
      }
    } catch (e) {
      console.error('Error loading recording errors:', e.message);
    } finally {
      setErrorsLoading(false);
    }
  };

  const markErrorResolved = async (errorId) => {
    try {
      const resp = await fetch('/api/daily/list-recording-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: errorId, resolved: true }),
      });
      const data = await resp.json();
      if (data.success) {
        setRecordingErrors((prev) => prev.filter((e) => e.id !== errorId));
      } else {
        alert(`Nu am putut marca eroarea ca rezolvata: ${data.error || 'unknown'}`);
      }
    } catch (e) {
      alert(`Eroare: ${e.message}`);
    }
  };

  const generateAccessLink = async (recordingId) => {
    try {
      setAccessLinkLoading(recordingId);
      const resp = await fetch('/api/daily/get-recording-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId }),
      });
      const data = await resp.json();
      if (data.success && data.downloadLink) {
        setAccessLinkByRecording((prev) => ({
          ...prev,
          [recordingId]: {
            link: data.downloadLink,
            expires: data.expires,
            expiresAt: data.expiresAt,
            generatedAt: new Date().toISOString(),
          },
        }));
      } else {
        alert(`Nu am putut genera link-ul: ${data.error || 'unknown'}`);
      }
    } catch (e) {
      alert(`Eroare: ${e.message}`);
    } finally {
      setAccessLinkLoading(null);
    }
  };

  const playRecordingOnline = async (recording) => {
    const recordingId = recording.id;
    const title = `${recording.roomName || recordingId} (${recording.durationFormatted || ''})`;
    const cached = accessLinkByRecording[recordingId];
    if (cached?.link) {
      setVideoPlayer({ open: true, link: cached.link, title, recordingId });
      return;
    }
    try {
      setPreparingPlayer(recordingId);
      const resp = await fetch('/api/daily/get-recording-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId }),
      });
      const data = await resp.json();
      if (data.success && data.downloadLink) {
        setAccessLinkByRecording((prev) => ({
          ...prev,
          [recordingId]: {
            link: data.downloadLink,
            expires: data.expires,
            expiresAt: data.expiresAt,
            generatedAt: new Date().toISOString(),
          },
        }));
        setVideoPlayer({ open: true, link: data.downloadLink, title, recordingId });
      } else {
        alert(`Nu am putut genera link-ul pentru playback: ${data.error || 'unknown'}`);
      }
    } catch (e) {
      alert(`Eroare: ${e.message}`);
    } finally {
      setPreparingPlayer(null);
    }
  };

  const copyToClipboard = async (text, hint = 'Copiat') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint(hint);
      setTimeout(() => setCopyHint(''), 1500);
    } catch (e) {
      alert(`Nu am putut copia: ${e.message}`);
    }
  };

  const errorsByRecordingId = recordingErrors.reduce((acc, err) => {
    if (err.recordingId) {
      if (!acc[err.recordingId]) acc[err.recordingId] = [];
      acc[err.recordingId].push(err);
    }
    return acc;
  }, {});

  const errorsByDocumentId = recordingErrors.reduce((acc, err) => {
    if (err.documentId) {
      if (!acc[err.documentId]) acc[err.documentId] = [];
      acc[err.documentId].push(err);
    }
    return acc;
  }, {});

  const getErrorsForRecording = (recording) => {
    const byId = errorsByRecordingId[recording.id] || [];
    const byDoc = recording.documentId ? errorsByDocumentId[recording.documentId] || [] : [];
    const seen = new Set();
    const merged = [];
    [...byId, ...byDoc].forEach((e) => {
      if (seen.has(e.id)) return;
      seen.add(e.id);
      merged.push(e);
    });
    return merged.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
  };

  const formatErrorTimestamp = (iso) => {
    if (!iso) return '?';
    try {
      return new Date(iso).toLocaleString('ro-RO');
    } catch {
      return iso;
    }
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

  // Resend email to default recipients based on session type
  const resendDefaultEmails = async (recordingId) => {
    try {
      setResendingDefault(true);
      setResendingId(recordingId);
      setToast({ visible: true, type: 'info', message: 'Se trimite emailul...', persistent: false });

      const response = await fetch('/api/daily/resend-recording-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setToast({
          visible: true,
          type: 'success',
          message: `Email trimis ${result.sessionType === 'conference' ? `catre ${result.recipients} participanti` : 'catre client'}.`,
          persistent: false,
        });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
        // Refresh errors so any prior failed attempts get reflected
        fetchRecordingErrors();
      } else {
        const errPayload = {
          recordingId,
          httpStatus: response.status,
          error: result.error || 'necunoscuta',
          details: result.details || null,
          timestamp: new Date().toISOString(),
        };
        setToast({
          visible: true,
          type: 'error',
          message: `Eroare trimitere: ${result.error || 'necunoscuta'}`,
          persistent: true,
          details: errPayload,
        });
        // Pull fresh errors so the new one shows up in the section + badges
        fetchRecordingErrors();
      }
    } catch (err) {
      const errPayload = {
        recordingId,
        error: err.message,
        timestamp: new Date().toISOString(),
        clientSide: true,
      };
      setToast({
        visible: true,
        type: 'error',
        message: `Eroare: ${err.message}`,
        persistent: true,
        details: errPayload,
      });
    } finally {
      setResendingDefault(false);
      setResendingId(null);
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

  // Apply filters on the full fetched set (all recordings on this page)
  const filteredRecordings = recordings.filter(recording => {
    // Session type filter
    if (filter !== 'all' && recording.sessionType !== filter) return false;
    // Status filter
    if (statusFilter !== 'all' && recording.status !== statusFilter) return false;
    // Search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matches =
        recording.roomName?.toLowerCase().includes(searchLower) ||
        recording.documentId?.toLowerCase().includes(searchLower) ||
        recording.id.toLowerCase().includes(searchLower) ||
        recording.startedAt?.toLowerCase().includes(searchLower);
      if (!matches) return false;
    }
    return true;
  });

  const currentPageStats = {
    consultations: filteredRecordings.filter(r => r.sessionType === 'consultation').length,
    conferences: filteredRecordings.filter(r => r.sessionType === 'conference').length,
    finished: filteredRecordings.filter(r => r.status === 'finished').length,
    processing: filteredRecordings.filter(r => r.status === 'processing').length,
    total: filteredRecordings.length
  };

  useEffect(() => {
    fetchRecordings();
  }, [perPage]);

  useEffect(() => {
    fetchRecordingErrors();
  }, []);

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

        {/* Errors Section */}
        {(recordingErrors.length > 0 || errorsLoading) && (
          <div style={styles.errorsSection}>
            <div
              style={styles.errorsHeader}
              onClick={() => setErrorsExpanded(!errorsExpanded)}
            >
              <span style={styles.errorsHeaderTitle}>
                Erori recente ({recordingErrors.length})
              </span>
              <span style={styles.errorsHeaderToggle}>
                {errorsExpanded ? '▲ Ascunde' : '▼ Arata'}
              </span>
            </div>
            {errorsExpanded && (
              <div style={styles.errorsList}>
                {errorsLoading && <p style={{ color: '#666' }}>Se incarca erorile...</p>}
                {!errorsLoading && recordingErrors.length === 0 && (
                  <p style={{ color: '#666' }}>Nicio eroare nerezolvata.</p>
                )}
                {recordingErrors.map((err) => (
                  <div key={err.id} style={styles.errorItem}>
                    <div style={styles.errorItemHeader}>
                      <span style={styles.errorSourceBadge}>{err.source}</span>
                      <span style={styles.errorTimestamp}>{formatErrorTimestamp(err.createdAt)}</span>
                      <button
                        onClick={() => markErrorResolved(err.id)}
                        style={styles.errorResolveButton}
                      >
                        Marcheaza rezolvat
                      </button>
                    </div>
                    <div style={styles.errorMessage}>{err.errorMessage}</div>
                    <div style={styles.errorMeta}>
                      {err.recordingId && (
                        <span
                          style={styles.errorMetaLink}
                          onClick={() => setSearchTerm(err.recordingId)}
                          title="Filtreaza tabelul dupa acest recording"
                        >
                          Recording: {err.recordingId}
                        </span>
                      )}
                      {err.documentId && (
                        <span
                          style={styles.errorMetaLink}
                          onClick={() => setSearchTerm(err.documentId)}
                          title="Filtreaza tabelul dupa acest document"
                        >
                          Doc: {err.documentId}
                        </span>
                      )}
                      {err.roomName && (
                        <span
                          style={styles.errorMetaLink}
                          onClick={() => setSearchTerm(err.roomName)}
                          title="Filtreaza tabelul dupa aceasta camera"
                        >
                          Room: {err.roomName}
                        </span>
                      )}
                      {err.errorCode && <span style={styles.errorMetaPlain}>Cod: {err.errorCode}</span>}
                      {err.errorContext?.responseCode && (
                        <span style={styles.errorMetaPlain}>SMTP: {err.errorContext.responseCode}</span>
                      )}
                      {err.errorContext?.httpStatus && (
                        <span style={styles.errorMetaPlain}>HTTP: {err.errorContext.httpStatus}</span>
                      )}
                      {err.errorContext?.step && (
                        <span style={styles.errorMetaPlain}>Pas: {err.errorContext.step}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.filtersContainer}>
            <div style={styles.filterRow}>
              <input
                type="text"
                placeholder="Cauta (room, document ID, recording ID, data)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">Toate tipurile</option>
                <option value="consultation">Consultatii</option>
                <option value="conference">Conferinte</option>
                <option value="unknown">Necunoscut</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">Toate statusurile</option>
                <option value="finished">Finalizate</option>
                <option value="processing">In procesare</option>
              </select>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                style={styles.filterSelect}
              >
                <option value={25}>25 / pagina</option>
                <option value={50}>50 / pagina</option>
                <option value={100}>100 / pagina</option>
              </select>
            </div>
            
            <div style={styles.paginationInfo}>
              <span style={styles.paginationText}>
                Afisez {filteredRecordings.length} din {recordings.length} incarcate ({pagination.total} total Daily.co)
              </span>
            </div>
          </div>
          
          <button onClick={goToFirstPage} style={styles.refreshButton}>
            Reincarca
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{pagination.total}</span>
            <span style={styles.statLabel}>Total Daily.co</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.total}</span>
            <span style={styles.statLabel}>Dupa filtre</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.consultations}</span>
            <span style={styles.statLabel}>Consultatii</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.conferences}</span>
            <span style={styles.statLabel}>Conferinte</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.finished}</span>
            <span style={styles.statLabel}>Finalizate</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{currentPageStats.processing}</span>
            <span style={styles.statLabel}>In procesare</span>
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
                {filteredRecordings.map((recording) => {
                  const recordingErrs = getErrorsForRecording(recording);
                  const cardErrorsExpanded = Boolean(expandedErrorCards[recording.id]);
                  return (
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
                        {recordingErrs.length > 0 && (
                          <span
                            style={styles.errorBadge}
                            onClick={() => setExpandedErrorCards((prev) => ({
                              ...prev,
                              [recording.id]: !prev[recording.id],
                            }))}
                            title={recordingErrs[0]?.errorMessage}
                          >
                            {recordingErrs.length} {recordingErrs.length === 1 ? 'eroare' : 'erori'} {cardErrorsExpanded ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </div>

                    {recordingErrs.length > 0 && cardErrorsExpanded && (
                      <div style={styles.errorsPanel}>
                        {recordingErrs.slice(0, 5).map((err) => (
                          <div key={err.id} style={styles.errorPanelItem}>
                            <div style={styles.errorPanelHeader}>
                              <span style={styles.errorSourceBadge}>{err.source}</span>
                              <span style={styles.errorTimestamp}>{formatErrorTimestamp(err.createdAt)}</span>
                            </div>
                            <div style={styles.errorMessage}>{err.errorMessage}</div>
                            {(err.errorCode || err.errorContext?.responseCode || err.errorContext?.httpStatus) && (
                              <div style={styles.errorMetaSmall}>
                                {err.errorCode && <span>Cod: {err.errorCode}</span>}
                                {err.errorContext?.responseCode && <span>SMTP: {err.errorContext.responseCode}</span>}
                                {err.errorContext?.httpStatus && <span>HTTP: {err.errorContext.httpStatus}</span>}
                                {err.errorContext?.step && <span>Pas: {err.errorContext.step}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                        {recordingErrs.length > 5 && (
                          <div style={{ fontSize: '12px', color: '#721c24' }}>
                            +{recordingErrs.length - 5} alte erori (vezi sectiunea de sus)
                          </div>
                        )}
                      </div>
                    )}
                    
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
                        onClick={() => playRecordingOnline(recording)}
                        style={{...styles.actionButton, background: '#6f42c1', opacity: preparingPlayer === recording.id ? 0.7 : 1}}
                        disabled={recording.status !== 'finished' || preparingPlayer === recording.id}
                      >
                        {preparingPlayer === recording.id ? '⏳ Se pregateste...' : '▶️ Vizualizeaza online'}
                      </button>
                      <button
                        onClick={() => resendDefaultEmails(recording.id)}
                        style={{...styles.actionButton, background: '#28a745', opacity: resendingDefault && resendingId === recording.id ? 0.7 : 1}}
                        disabled={recording.status !== 'finished' || (resendingDefault && resendingId === recording.id)}
                      >
                        {resendingDefault && resendingId === recording.id ? '⏳ Se trimite...' : '📧 Trimite automat'}
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
                  );
                })}
              </div>
            )}
            
            {/* Pagination Controls */}
            <div style={styles.paginationContainer}>
              <button 
                onClick={goToFirstPage}
                style={{...styles.paginationButton, opacity: pagination.hasPrevPage ? 1 : 0.5}}
                disabled={!pagination.hasPrevPage}
              >
                Prima
              </button>
              <button 
                onClick={goToPrevPage}
                style={{...styles.paginationButton, opacity: pagination.hasPrevPage ? 1 : 0.5}}
                disabled={!pagination.hasPrevPage}
              >
                Anterioara
              </button>
              <span style={styles.paginationText}>
                {filteredRecordings.length} afisate / {recordings.length} incarcate / {pagination.total} total
              </span>
              <button 
                onClick={goToNextPage}
                style={{...styles.paginationButton, opacity: pagination.hasNextPage ? 1 : 0.5}}
                disabled={!pagination.hasNextPage}
              >
                Urmatoarea
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

                  {/* Quick Links */}
                  <div style={styles.detailsSection}>
                    <h4>Linkuri rapide</h4>
                    <div style={styles.quickLinksGrid}>
                      <button
                        onClick={() => generateAccessLink(selectedRecordingDetails.id)}
                        style={styles.quickLinkButton}
                        disabled={accessLinkLoading === selectedRecordingDetails.id}
                      >
                        {accessLinkLoading === selectedRecordingDetails.id
                          ? 'Se genereaza...'
                          : 'Genereaza link descarcare 12h'}
                      </button>
                      <a
                        href={`https://dashboard.daily.co/recordings/${selectedRecordingDetails.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.quickLinkAnchor}
                      >
                        Deschide in Daily Dashboard
                      </a>
                      {selectedRecordingDetails.mtgSessionId && (
                        <a
                          href={`https://dashboard.daily.co/sessions/${selectedRecordingDetails.mtgSessionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.quickLinkAnchor}
                        >
                          Sesiune in Daily Dashboard
                        </a>
                      )}
                      <button
                        onClick={() => copyToClipboard(selectedRecordingDetails.id, 'Recording ID copiat')}
                        style={styles.quickLinkSecondary}
                      >
                        Copiaza Recording ID
                      </button>
                      {selectedRecordingDetails.roomName && (
                        <button
                          onClick={() => copyToClipboard(selectedRecordingDetails.roomName, 'Room name copiat')}
                          style={styles.quickLinkSecondary}
                        >
                          Copiaza Room Name
                        </button>
                      )}
                      {selectedRecordingDetails.s3key && (
                        <button
                          onClick={() => copyToClipboard(selectedRecordingDetails.s3key, 'S3 Key copiat')}
                          style={styles.quickLinkSecondary}
                        >
                          Copiaza S3 Key
                        </button>
                      )}
                    </div>

                    {accessLinkByRecording[selectedRecordingDetails.id] && (
                      <div style={styles.accessLinkBox}>
                        <div style={{ fontSize: 13, color: '#155724', marginBottom: 8 }}>
                          Link generat la {formatErrorTimestamp(accessLinkByRecording[selectedRecordingDetails.id].generatedAt)}
                          {accessLinkByRecording[selectedRecordingDetails.id].expiresAt && (
                            <> (expira {formatErrorTimestamp(accessLinkByRecording[selectedRecordingDetails.id].expiresAt)})</>
                          )}
                        </div>
                        <div style={styles.accessLinkRow}>
                          <code style={styles.accessLinkCode}>
                            {accessLinkByRecording[selectedRecordingDetails.id].link}
                          </code>
                          <button
                            onClick={() => copyToClipboard(
                              accessLinkByRecording[selectedRecordingDetails.id].link,
                              'Link copiat'
                            )}
                            style={styles.quickLinkSecondary}
                          >
                            Copiaza
                          </button>
                          <a
                            href={accessLinkByRecording[selectedRecordingDetails.id].link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.quickLinkAnchor}
                          >
                            Deschide
                          </a>
                          <button
                            onClick={() => setVideoPlayer({
                              open: true,
                              link: accessLinkByRecording[selectedRecordingDetails.id].link,
                              title: `${selectedRecordingDetails.roomName || selectedRecordingDetails.id} (${selectedRecordingDetails.durationFormatted || ''})`,
                              recordingId: selectedRecordingDetails.id,
                            })}
                            style={{ ...styles.quickLinkButton, background: '#6f42c1' }}
                          >
                            Vizualizeaza online
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedRecordingDetails.tracks?.details?.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <h5 style={{ margin: '8px 0' }}>Track-uri (descarcare individuala):</h5>
                        <div style={styles.tracksContainer}>
                          {selectedRecordingDetails.tracks.details.map((track, idx) => (
                            <div key={idx} style={styles.trackItem}>
                              <div style={{ marginBottom: 4 }}>
                                <strong>Track {idx + 1}:</strong> {track.type}
                                {track.kind && ` (${track.kind})`}
                                {track.duration ? ` - ${track.duration}s` : ''}
                              </div>
                              {track.downloadUrl ? (
                                <a
                                  href={track.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={styles.quickLinkAnchor}
                                >
                                  Descarca track
                                </a>
                              ) : (
                                <span style={{ fontSize: 12, color: '#666' }}>Fara link direct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Errors associated with this recording */}
                  <div style={{
                    ...styles.detailsSection,
                    background: (selectedRecordingDetails.errors && selectedRecordingDetails.errors.length > 0) ? '#fff5f5' : '#f8f9fa',
                    border: (selectedRecordingDetails.errors && selectedRecordingDetails.errors.length > 0) ? '1px solid #f5c6cb' : '1px solid #e9ecef',
                  }}>
                    <h4>Erori asociate {(selectedRecordingDetails.errors && selectedRecordingDetails.errors.length > 0) ? `(${selectedRecordingDetails.errors.length})` : ''}</h4>
                    {(!selectedRecordingDetails.errors || selectedRecordingDetails.errors.length === 0) ? (
                      <p style={{ color: '#155724', margin: 0 }}>Niciuna - tot OK.</p>
                    ) : (
                      <div style={styles.errorsList}>
                        {selectedRecordingDetails.errors.map((err) => (
                          <div key={err.id} style={styles.errorItem}>
                            <div style={styles.errorItemHeader}>
                              <span style={styles.errorSourceBadge}>{err.source}</span>
                              <span style={styles.errorTimestamp}>{formatErrorTimestamp(err.createdAt)}</span>
                              {!err.resolved && (
                                <button
                                  onClick={() => markErrorResolved(err.id)}
                                  style={styles.errorResolveButton}
                                >
                                  Marcheaza rezolvat
                                </button>
                              )}
                            </div>
                            <div style={styles.errorMessage}>{err.errorMessage}</div>
                            {(err.errorCode || err.errorContext?.responseCode || err.errorContext?.httpStatus || err.errorContext?.step) && (
                              <div style={styles.errorMetaSmall}>
                                {err.errorCode && <span>Cod: {err.errorCode}</span>}
                                {err.errorContext?.responseCode && <span>SMTP: {err.errorContext.responseCode}</span>}
                                {err.errorContext?.httpStatus && <span>HTTP: {err.errorContext.httpStatus}</span>}
                                {err.errorContext?.step && <span>Pas: {err.errorContext.step}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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

                  {selectedRecordingDetails.firestore && (
                    <div style={styles.detailsSection}>
                      <h4>🗄️ Informatii suplimentare</h4>
                      {selectedRecordingDetails.firestore.type === 'consultation' ? (
                        <div style={styles.detailsGrid}>
                          <div><strong>Nume client:</strong> {selectedRecordingDetails.firestore.data.nume || 'N/A'}</div>
                          <div><strong>Prenume:</strong> {selectedRecordingDetails.firestore.data.prenume || 'N/A'}</div>
                          <div><strong>Email:</strong> {selectedRecordingDetails.firestore.data.email || 'N/A'}</div>
                          <div><strong>Telefon:</strong> {selectedRecordingDetails.firestore.data.telefon || 'N/A'}</div>
                          <div><strong>Categorie:</strong> {selectedRecordingDetails.firestore.data.categorie?.nume || 'N/A'}</div>
                          <div><strong>Tip consultatie:</strong> {selectedRecordingDetails.firestore.data.tipConsultatie || 'N/A'}</div>
                          <div><strong>Slot:</strong> {selectedRecordingDetails.firestore.data.selectedSlot ? `${selectedRecordingDetails.firestore.data.selectedSlot.day} ${selectedRecordingDetails.firestore.data.selectedSlot.slot}` : 'N/A'}</div>
                          <div><strong>Cost:</strong> {selectedRecordingDetails.firestore.data.costConsultatie || 'N/A'}</div>
                        </div>
                      ) : (
                        <>
                          <div style={styles.detailsGrid}>
                            <div><strong>Titlu conferință:</strong> {selectedRecordingDetails.firestore.data.titlu || 'N/A'}</div>
                            <div><strong>Data început:</strong> {selectedRecordingDetails.firestore.data.dataInceput || 'N/A'}</div>
                            <div><strong>Ora început:</strong> {selectedRecordingDetails.firestore.data.oraInceput || 'N/A'}</div>
                            <div><strong>Participanți:</strong> {selectedRecordingDetails.firestore.data.participanti?.length || 0}</div>
                          </div>
                          {Array.isArray(selectedRecordingDetails.firestore.data.participanti) && selectedRecordingDetails.firestore.data.participanti.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                              <h5 style={{ margin: '8px 0' }}>👥 Lista participanți</h5>
                              <div style={styles.tracksContainer}>
                                {selectedRecordingDetails.firestore.data.participanti.map((p, idx) => (
                                  <div key={idx} style={styles.trackItem}>
                                    <div><strong>Nume:</strong> {p?.nume || 'N/A'}</div>
                                    <div><strong>Email:</strong> {p?.email || 'N/A'}</div>
                                    {p?.isGuestUser !== undefined && (
                                      <div><strong>Guest:</strong> {p.isGuestUser ? 'Da' : 'Nu'}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

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
                    onClick={() => resendDefaultEmails(selectedRecordingDetails.id)}
                    style={{...styles.sendButton, background: '#28a745', opacity: resendingDefault ? 0.7 : 1}}
                    disabled={selectedRecordingDetails.status !== 'finished' || resendingDefault}
                  >
                    {resendingDefault ? '⏳ Se trimite...' : '📧 Trimite automat'}
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedRecording(selectedRecordingDetails);
                      // Prefill email for consultation if available
                      if (selectedRecordingDetails.firestore?.type === 'consultation') {
                        setEmailForm((prev) => ({
                          ...prev,
                          customEmail: selectedRecordingDetails.firestore.data.email || prev.customEmail,
                          customName: selectedRecordingDetails.firestore.data.nume || prev.customName
                        }));
                      }
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
      {toast.visible && (
        <div style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          background: toast.type === 'success' ? '#28a745' : toast.type === 'error' ? '#dc3545' : '#17a2b8',
          color: 'white',
          padding: '14px 18px',
          borderRadius: 8,
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          maxWidth: 480,
          zIndex: 1100,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</div>
            {toast.persistent && (
              <button
                onClick={() => setToast({ visible: false, message: '', type: 'info' })}
                style={styles.toastCloseButton}
                aria-label="Inchide"
              >
                ✕
              </button>
            )}
          </div>
          {toast.persistent && toast.details && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setErrorDetailsPayload(toast.details);
                  setErrorDetailsModal(true);
                }}
                style={styles.toastActionButton}
              >
                Vezi detalii
              </button>
              <button
                onClick={() => fetchRecordingErrors()}
                style={styles.toastActionButton}
              >
                Reincarca erorile
              </button>
            </div>
          )}
        </div>
      )}

      {errorDetailsModal && errorDetailsPayload && (
        <div style={styles.modalOverlay} onClick={() => setErrorDetailsModal(false)}>
          <div style={{ ...styles.modal, maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Detalii eroare</h3>
              <button onClick={() => setErrorDetailsModal(false)} style={styles.closeButton}>✕</button>
            </div>
            <div style={styles.modalContent}>
              <pre style={styles.errorDetailsPre}>
                {JSON.stringify(errorDetailsPayload, null, 2)}
              </pre>
              <div style={styles.modalActions}>
                <button onClick={() => setErrorDetailsModal(false)} style={styles.cancelButton}>
                  Inchide
                </button>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(errorDetailsPayload, null, 2), 'JSON copiat')}
                  style={styles.sendButton}
                >
                  Copiaza JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {copyHint && (
        <div style={styles.copyHint}>{copyHint}</div>
      )}

      {videoPlayer.open && videoPlayer.link && (
        <div
          style={styles.modalOverlay}
          onClick={() => setVideoPlayer({ open: false, link: null, title: '', recordingId: null })}
        >
          <div
            style={styles.videoPlayerModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.videoPlayerHeader}>
              <h3 style={styles.modalTitle}>▶️ {videoPlayer.title}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => copyToClipboard(videoPlayer.link, 'Link copiat')}
                  style={styles.quickLinkSecondary}
                >
                  Copiaza link
                </button>
                <a
                  href={videoPlayer.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.quickLinkAnchor}
                >
                  Deschide in tab nou
                </a>
                <button
                  onClick={() => setVideoPlayer({ open: false, link: null, title: '', recordingId: null })}
                  style={styles.closeButton}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={styles.videoPlayerBody}>
              <video
                src={videoPlayer.link}
                controls
                autoPlay
                preload="metadata"
                style={styles.videoElement}
              >
                Browser-ul tau nu suporta playback video direct. Foloseste &quot;Deschide in tab nou&quot;.
              </video>
              <p style={styles.videoPlayerHint}>
                Daca videoul nu porneste imediat, asteapta cateva secunde (Daily face buffering pentru piste pre-signed). Daca tot nu functioneaza, apasa &quot;Deschide in tab nou&quot; - browser-ul va stream-ui MP4-ul direct.
              </p>
            </div>
          </div>
        </div>
      )}
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
  filterSelect: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '160px'
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
  },
  errorsSection: {
    background: '#fff5f5',
    border: '1px solid #f5c6cb',
    borderRadius: '12px',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  errorsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    background: '#f8d7da',
    color: '#721c24',
    fontWeight: 'bold',
  },
  errorsHeaderTitle: {
    fontSize: '16px',
  },
  errorsHeaderToggle: {
    fontSize: '12px',
    fontWeight: 'normal',
  },
  errorsList: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  errorItem: {
    background: 'white',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  errorItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    flexWrap: 'wrap',
  },
  errorSourceBadge: {
    background: '#dc3545',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  errorTimestamp: {
    fontSize: '12px',
    color: '#666',
  },
  errorResolveButton: {
    marginLeft: 'auto',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  errorMessage: {
    color: '#721c24',
    fontSize: '14px',
    fontWeight: '500',
    wordBreak: 'break-word',
    marginBottom: '6px',
  },
  errorMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    fontSize: '12px',
  },
  errorMetaLink: {
    background: '#f8d7da',
    color: '#721c24',
    padding: '2px 6px',
    borderRadius: '4px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  errorMetaPlain: {
    background: '#e9ecef',
    color: '#495057',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  errorMetaSmall: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    fontSize: '11px',
    color: '#6c757d',
  },
  errorBadge: {
    display: 'inline-block',
    marginLeft: '8px',
    background: '#dc3545',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    userSelect: 'none',
  },
  errorsPanel: {
    background: '#fff5f5',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  errorPanelItem: {
    background: 'white',
    border: '1px solid #f1aeb5',
    borderRadius: '4px',
    padding: '8px 10px',
  },
  errorPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  errorDetailsPre: {
    background: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '12px',
    overflowX: 'auto',
    maxHeight: '300px',
  },
  toastCloseButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  toastActionButton: {
    background: 'rgba(255,255,255,0.25)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  copyHint: {
    position: 'fixed',
    top: 20,
    right: 20,
    background: '#28a745',
    color: 'white',
    padding: '8px 14px',
    borderRadius: 6,
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    fontSize: '13px',
    zIndex: 1200,
  },
  quickLinksGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  quickLinkButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  quickLinkAnchor: {
    background: '#28a745',
    color: 'white',
    textDecoration: 'none',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  quickLinkSecondary: {
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  accessLinkBox: {
    marginTop: '12px',
    background: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '6px',
    padding: '10px 12px',
  },
  accessLinkRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  accessLinkCode: {
    flex: 1,
    minWidth: '200px',
    background: 'white',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '12px',
    wordBreak: 'break-all',
  },
  videoPlayerModal: {
    background: 'white',
    borderRadius: '12px',
    width: '95%',
    maxWidth: '1100px',
    maxHeight: '95vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  videoPlayerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #eee',
    gap: 12,
    flexWrap: 'wrap',
  },
  videoPlayerBody: {
    padding: '14px 18px',
    overflowY: 'auto',
  },
  videoElement: {
    width: '100%',
    maxHeight: '70vh',
    background: 'black',
    borderRadius: '8px',
    display: 'block',
  },
  videoPlayerHint: {
    marginTop: '10px',
    color: '#666',
    fontSize: '13px',
    lineHeight: 1.5,
  },
};

export default AdminRecordings; 