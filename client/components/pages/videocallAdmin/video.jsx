import React, { useEffect, useState, useRef } from "react";
import AgoraUIKit, { layout } from "agora-react-uikit";
import "agora-react-uikit/dist/index.css";
import { useRouter } from "next/router";
import Home1Header from "../../home/home-1/header";
import { doc, onSnapshot, updateDoc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../../../firebase";
import { createUILogger } from "../../../../utils/logger";
import RecordingProgressWidget from "../../../../components/RecordingProgressWidget";

// Initialize client-side logger
const logger = createUILogger('ONE_TO_ONE_VIDEO');

// Funcție pentru a obține timpul curent
const getCurrentTime = () => Math.floor(Date.now() / 1000);

const AdminVideoCall = () => {
  const [videocall, setVideocall] = useState(true);
  const [isHost, setHost] = useState(true);
  const [isPinned, setPinned] = useState(true); // Setăm layout-ul implicit la pin pentru mobil
  const [isFullscreen, setFullscreen] = useState(false); // Pentru full screen
  const [username, setUsername] = useState("");
  const [isMobile, setIsMobile] = useState(false); // Detectăm dacă este mobil
  const appID = "e17715cba7c84bfc9dbd1b5231b6f86f";
  const [documentId, setDocumentId] = useState(null);
  const router = useRouter();
  const { meetingCode } = router.query;
  const videoContainerRef = useRef(null); // Referință la containerul video
  const [browserCompatible, setBrowserCompatible] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Agora Cloud Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [recordingStatus, setRecordingStatus] = useState("");
  const [recordingPermission, setRecordingPermission] = useState(true);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isLoadingClientEmail, setIsLoadingClientEmail] = useState(false);
  
  // Agora Cloud Recording tracking
  const [recordingSid, setRecordingSid] = useState(null);
  const [recordingResourceId, setRecordingResourceId] = useState(null);

  const recordingIntervalRef = useRef(null);
  const statusCheckIntervalRef = useRef(null);

  // Log component initialization
  useEffect(() => {
    logger.info('One-to-one video component initialized', {
      meetingCode,
      userAgent: navigator.userAgent,
      isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    });
  }, [meetingCode]);

  // 🔍 Function to fetch client email from RezervariConsultatii
  const fetchClientEmail = async (meetingCode) => {
    try {
      setIsLoadingClientEmail(true);
      logger.info('Fetching client email for meeting', { meetingCode });
      
      // First, try to find by document ID (from meetingCode format: code__documentId)
      if (meetingCode.includes('__')) {
        const documentId = meetingCode.split('__')[1];
        logger.debug('Attempting to find by document ID', { documentId });
        const docRef = doc(db, 'RezervariConsultatii', documentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          logger.info('Client email found via document ID', { 
            email: data.email ? 'present' : 'missing'
          });
          return data.email;
        }
      }
      
      // Fallback: search by meetingCode field
      logger.debug('Searching by meetingCode field');
      const q = query(
        collection(db, 'RezervariConsultatii'),
        where('meetingCode', '==', meetingCode),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        logger.info('Client email found via query', { 
          email: data.email ? 'present' : 'missing'
        });
        return data.email;
      }
      
      logger.warn('No client email found', { meetingCode });
      return null;
      
    } catch (error) {
      logger.error('Error fetching client email', {
        error: error.message,
        meetingCode
      });
      return null;
    } finally {
      setIsLoadingClientEmail(false);
    }
  };

  // Start Agora Cloud Recording
  const startRecording = async () => {
    try {
      console.log('🎬 [CLIENT] === STARTING AGORA CLOUD RECORDING ===');
      console.log('🎬 [CLIENT] Meeting Code:', meetingCode);
      console.log('🎬 [CLIENT] Document ID:', documentId);
      
      setRecordingError("");
      setRecordingStatus("Inițializez înregistrarea...");
      
      logger.recordingStart('one_to_one', {
        meetingCode,
        documentId,
        timestamp: Date.now()
      });

      console.log('🌐 [CLIENT] Calling /api/recording/start...');
      
      const response = await fetch('/api/recording/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingCode,
          recordingType: 'one_to_one',
          documentId
        }),
      });
      
      console.log('📡 [CLIENT] API Response Status:', response.status);

      const data = await response.json();
      
      console.log('📋 [CLIENT] API Response Data:', data);
      
      if (data.success) {
        console.log('✅ [CLIENT] Recording started successfully!');
        console.log('✅ [CLIENT] SID:', data.sid);
        console.log('✅ [CLIENT] Resource ID:', data.resourceId);
        
        setRecordingSid(data.sid);
        setRecordingResourceId(data.resourceId);
        setIsRecording(true);
        setRecordingStartTime(Date.now());
        setRecordingDuration(0);
        setRecordingStatus("Înregistrare activă");
        
        logger.info('Agora Cloud Recording started successfully', {
          sid: data.sid?.substring(0, 10) + '...',
          resourceId: data.resourceId?.substring(0, 10) + '...',
          meetingCode
        });

        // Start duration counter
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);

        // Start status checking
        statusCheckIntervalRef.current = setInterval(async () => {
          await checkRecordingStatus();
        }, 10000); // Check every 10 seconds

        // Update Firestore with recording info
        if (documentId) {
          await updateDoc(doc(db, "RezervariConsultatii", documentId), {
            recording: {
              isRecording: true,
              startTime: Date.now(),
              status: 'recording',
              recordingType: 'agora_cloud',
              sid: data.sid,
              resourceId: data.resourceId
            }
          });
          logger.debug('Firestore updated with recording info', { documentId });
        }
      } else {
        console.log('❌ [CLIENT] Recording start failed:', data.error);
        throw new Error(data.error || 'Failed to start recording');
      }
    } catch (error) {
      console.log('💥 [CLIENT] === RECORDING START ERROR ===');
      console.log('💥 [CLIENT] Error:', error.message);
      console.log('💥 [CLIENT] Stack:', error.stack);
      
      logger.recordingError('start', {
        error: error.message,
        meetingCode,
        timestamp: Date.now()
      });
      setRecordingError(`Eroare la pornirea înregistrării: ${error.message}`);
      setRecordingStatus("");
    }
  };

  // Check recording status
  const checkRecordingStatus = async () => {
    if (!recordingSid) return;

    try {
      const response = await fetch('/api/recording/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sid: recordingSid,
          meetingCode
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        logger.debug('Recording status checked', {
          status: data.status,
          duration: data.duration,
          hasAgoraStatus: !!data.agoraStatus
        });

        if (data.status === 'failed' || data.status === 'completed') {
          // Recording ended unexpectedly
          if (isRecording) {
            logger.warn('Recording ended unexpectedly', {
              status: data.status,
              sid: recordingSid?.substring(0, 10) + '...'
            });
            setIsRecording(false);
            setRecordingStatus(`Înregistrare ${data.status === 'failed' ? 'eșuată' : 'finalizată'}`);
            clearIntervals();
          }
        }
      }
    } catch (error) {
      logger.error('Error checking recording status', {
        error: error.message,
        sid: recordingSid?.substring(0, 10) + '...'
      });
    }
  };

  // Stop Agora Cloud Recording
  const confirmStopRecording = async () => {
    console.log('🛑 [CLIENT] === STOPPING AGORA CLOUD RECORDING ===');
    console.log('🛑 [CLIENT] SID:', recordingSid);
    console.log('🛑 [CLIENT] Email:', recipientEmail?.substring(0, 5) + '...');
    
    if (!recipientEmail.trim()) {
      console.log('❌ [CLIENT] Missing recipient email');
      setEmailError('Introduceți un email pentru primirea linkului');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      console.log('❌ [CLIENT] Invalid email format');
      setEmailError('Format email invalid');
      return;
    }

    try {
      setIsSendingEmail(true);
      setRecordingStatus("Opresc înregistrarea...");
      
      logger.recordingStop('one_to_one', {
        sid: recordingSid?.substring(0, 10) + '...',
        meetingCode,
        duration: recordingDuration,
        recipientEmail: recipientEmail ? 'present' : 'missing'
      });

      console.log('🌐 [CLIENT] Calling /api/recording/stop...');
      
      const response = await fetch('/api/recording/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sid: recordingSid,
          meetingCode,
          recipientEmail: recipientEmail.trim()
        }),
      });

      console.log('📡 [CLIENT] Stop API Response Status:', response.status);
      const data = await response.json();
      console.log('📋 [CLIENT] Stop API Response Data:', data);
      
      if (data.success) {
        console.log('✅ [CLIENT] Recording stopped successfully!');
        console.log('✅ [CLIENT] Duration:', data.duration);
        console.log('✅ [CLIENT] Files:', data.fileList?.length || 0);
        
        setIsRecording(false);
        setRecordingStatus("Înregistrare finalizată! Trimit email...");
        clearIntervals();
        
        logger.info('Agora Cloud Recording stopped successfully', {
          sid: recordingSid?.substring(0, 10) + '...',
          duration: data.duration,
          fileCount: data.fileList?.length || 0
        });

        // Send email notification
        try {
          const emailResponse = await fetch('/api/send-recording-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipientEmail: recipientEmail.trim(),
              meetingCode,
              recordingData: data,
              recordingType: 'one_to_one'
            }),
          });

          const emailResult = await emailResponse.json();
          
          if (emailResult.success) {
            setRecordingStatus("Email trimis cu succes!");
            logger.info('Recording notification email sent', {
              recipientEmail: recipientEmail ? 'present' : 'missing'
            });
          } else {
            throw new Error(emailResult.error || 'Failed to send email');
          }
        } catch (emailError) {
          logger.error('Failed to send recording notification', {
            error: emailError.message,
            recipientEmail: recipientEmail ? 'present' : 'missing'
          });
          setRecordingStatus("Înregistrare salvată, dar email-ul nu a putut fi trimis");
        }

        // Update Firestore
        if (documentId) {
          await updateDoc(doc(db, "RezervariConsultatii", documentId), {
            recording: {
              isRecording: false,
              endTime: Date.now(),
              status: 'completed',
              recordingType: 'agora_cloud',
              sid: recordingSid,
              duration: data.duration,
              fileList: data.fileList
            }
          });
        }

        // Reset UI after delay
        setTimeout(() => {
          setRecordingStatus('');
          setRecipientEmail('');
          setEmailError('');
          setShowEmailDialog(false);
          setRecordingSid(null);
          setRecordingResourceId(null);
        }, 5000);

      } else {
        throw new Error(data.error || 'Failed to stop recording');
      }
    } catch (error) {
      logger.recordingError('stop', {
        error: error.message,
        sid: recordingSid?.substring(0, 10) + '...',
        meetingCode
      });
      setRecordingError(`Eroare la oprirea înregistrării: ${error.message}`);
      setRecordingStatus("");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Clear all intervals
  const clearIntervals = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      clearIntervals();
    };
  }, []);

  // Auto-fetch client email when meetingCode is available
  useEffect(() => {
    if (meetingCode && !recipientEmail) {
      fetchClientEmail(meetingCode).then(email => {
        if (email) {
          setRecipientEmail(email);
          logger.debug('Auto-filled client email', { 
            email: email ? 'present' : 'missing'
          });
        }
      });
    }
  }, [meetingCode, recipientEmail]);

  // Verificarea compatibilității browserului
  useEffect(() => {
    const checkBrowserCompatibility = () => {
      const userAgent = navigator.userAgent;
      
      // Verifică suportul pentru WebRTC
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setBrowserCompatible(false);
        setErrorMessage("Browserul dumneavoastră nu suportă funcționalitatea video call. Vă rugăm să utilizați Chrome, Firefox, Safari sau Edge.");
        return;
      }

      // Verifică dacă este HTTPS în producție
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setBrowserCompatible(false);
        setErrorMessage("Video call-ul necesită conexiune securizată (HTTPS). Vă rugăm să accesați site-ul prin HTTPS.");
      }
    };

    checkBrowserCompatibility();
  }, []);

  // Verificarea permisiunilor pentru cameră/microfon
  useEffect(() => {
    const checkPermissions = async () => {
      if (browserCompatible) {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (error) {
          console.error("Eroare la accesarea camerei/microfonului:", error);
          if (error.name === 'NotAllowedError') {
            setErrorMessage("Vă rugăm să permiteți accesul la cameră și microfon pentru a utiliza video call.");
          } else if (error.name === 'NotFoundError') {
            setErrorMessage("Nu s-a găsit cameră sau microfon. Vă rugăm să verificați dispozitivele.");
          } else {
            setErrorMessage("Eroare la accesarea camerei/microfonului. Vă rugăm să reîncărcați pagina.");
          }
        }
      }
    };

    if (videocall && documentId) {
      checkPermissions();
    }
  }, [videocall, documentId, browserCompatible]);

  // Detectăm dimensiunea ecranului pentru a ajusta design-ul
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Definim "mobil" pentru ecrane mai mici de 768px
      if (window.innerWidth <= 768) {
        setPinned(true); // Implicit pin layout pe mobil
      }
    };
    handleResize(); // Detectăm imediat la prima încărcare
    window.addEventListener("resize", handleResize); // Adăugăm un event listener pentru a detecta redimensionarea
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // video call counter start
  const [isSessionActive, setSessionActive] = useState(false); // Starea de activitate a sesiunii
  const [elapsedTime, setElapsedTime] = useState(0); // Timpul scurs
  const intervalRef = useRef(null); // Referință pentru intervalul de cronometrare

  const [totalTime, setTotalTime] = useState(null);
  const userRole = "admin"; // Identifică rolul utilizatorului (admin sau client)

  useEffect(() => {
    if (documentId) {
      const docRef = doc(db, "RezervariConsultatii", documentId);

      // Setăm prezența utilizatorului
      updateDoc(docRef, { [`presence.${userRole}`]: true });

      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        const data = snapshot.data();
        setTotalTime(data?.categorie?.timp);
        // Verificăm dacă ambele părți sunt prezente
        if (data?.presence?.admin && data?.presence?.client) {
          // Inițializăm cronometrul când ambele părți sunt prezente
          setElapsedTime(0); // Resetare la 0 când începe sesiunea
          setSessionActive(true); // Pornește cronometru

          // Pornim intervalul pentru cronometru
          if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
              setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
            }, 1000);
          }
        } else {
          // Oprim cronometru și ștergem intervalul dacă o parte părăsește sesiunea
          setSessionActive(false);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });

      return () => {
        updateDoc(docRef, { [`presence.${userRole}`]: false });
        unsubscribe();
      };
    }
  }, [documentId, userRole]);

  // video call counter end

  useEffect(() => {
    if (meetingCode) {
      const extractedDocumentId = meetingCode.split("__")[1];
      setDocumentId(extractedDocumentId);
    }
  }, [meetingCode]);

  // TEMPORARILY DISABLED: Function to capture existing Agora video streams from DOM
  // Using only Agora Cloud Recording now
  const captureExistingAgoraStreams = async () => {
    console.log('🚫 [CANVAS RECORDING] Disabled temporarily - using Agora Cloud Recording only');
    return 0;
    /*
    try {
      logger.debug('Attempting to capture existing Agora video streams from DOM...');
      
      // Find all video elements created by AgoraUIKit
      const videoElements = document.querySelectorAll('video');
      let streamsCaptured = 0;
      
      for (const videoElement of videoElements) {
        if (videoElement.srcObject && videoElement.srcObject instanceof MediaStream) {
          const stream = videoElement.srcObject;
          const videoTracks = stream.getVideoTracks();
          
          if (videoTracks.length > 0) {
            // Generate a unique ID for this stream
            const streamId = `agora_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            logger.debug('Found video stream in DOM', {
              streamId,
              videoTracks: videoTracks.length,
              audioTracks: stream.getAudioTracks().length,
              videoElement: {
                width: videoElement.videoWidth,
                height: videoElement.videoHeight,
                readyState: videoElement.readyState,
                videoWidth: videoElement.videoWidth,
                videoHeight: videoElement.videoHeight,
                currentTime: videoElement.currentTime,
                duration: videoElement.duration,
                paused: videoElement.paused,
                muted: videoElement.muted,
                className: videoElement.className,
                id: videoElement.id
              }
            });
            
            // Wait for video to be ready before adding to recorder
            if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
              logger.debug('Video element is ready for recording');
            } else {
              logger.debug('Video element not ready, waiting...', {
                readyState: videoElement.readyState,
                expectedMinimum: 2
              });
              
              // Wait for video to load
              await new Promise((resolve) => {
                if (videoElement.readyState >= 2) {
                  resolve();
                } else {
                  const onLoadedData = () => {
                    logger.debug('Video element loaded data');
                    videoElement.removeEventListener('loadeddata', onLoadedData);
                    resolve();
                  };
                  videoElement.addEventListener('loadeddata', onLoadedData);
                  
                  // Timeout fallback
                  setTimeout(() => {
                    logger.debug('Video load timeout, proceeding anyway');
                    videoElement.removeEventListener('loadeddata', onLoadedData);
                    resolve();
                  }, 2000);
                }
              });
            }
            
            // Add stream to recorder
            // recorder.addVideoStream(streamId, stream, videoElement); // This line is removed as per the new_code
            streamsCaptured++;
            
            logger.debug(`Added stream ${streamId} to recorder (DOM capture)`);
          }
        }
      }
      
      logger.debug(`Captured ${streamsCaptured} video streams from DOM (for Agora Cloud Recording)`);
      return streamsCaptured;
      
    } catch (error) {
      logger.error('Error capturing existing streams for Agora Cloud Recording', { error });
      return 0;
    }
    */
  };

  // Recording functionality (Simple Browser Recording with Firebase Storage)
  // This section is now replaced by Agora Cloud Recording API calls.
  // The startRecording and confirmStopRecording functions handle the recording logic.

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Funcție pentru a intra în fullscreen
  const handleFullscreen = () => {
    const elem = videoContainerRef.current;
    if (!isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setFullscreen(!isFullscreen);
  };

  const isWarning = totalTime && elapsedTime >= (totalTime - 10) * 60;

  const handleEndCall = async () => {
    if (documentId) {
      const docRef = doc(db, "RezervariConsultatii", documentId);

      // Actualizăm stările pentru a reflecta sfârșitul apelului
      setVideocall(false);
      setSessionActive(false);

      // Oprirea cronometrului, dacă este activ
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Cleanup pentru recording dacă este activ
      if (isRecording) {
        logger.info('Call ended, stopping Agora Cloud Recording', { sid: recordingSid?.substring(0, 10) + '...' });
        // The onComplete callback will handle Firebase updates and file upload
        await confirmStopRecording(); // Use the new confirmStopRecording
      }
      
      // Cleanup recorder resources
      // if (recorder) { // recorder is no longer used
      //   recorder.cleanup();
      // }

      // Setăm prezența adminului și a clientului la false în baza de date
      await updateDoc(docRef, {
        "presence.admin": false,
      });
      router.push("admin-consultatii");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Apelăm handleEndCall înainte ca utilizatorul să părăsească pagina
      handleEndCall();
      // Notă: Mesajele de confirmare personalizate pentru "beforeunload" nu sunt suportate de majoritatea browserelor moderne
      event.preventDefault();
      event.returnValue = ""; // Necesită pentru unele browser pentru compatibilitate
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [documentId]);

  return (
    <>
      <div className="main-wrapper home-one">
        {!videocall && <Home1Header />}
        <div style={styles.container}>
          {/* Containerul de video */}
          <div style={styles.videoContainer} ref={videoContainerRef}>
            {!browserCompatible ? (
              <div style={styles.errorContainer}>
                <div style={styles.errorMessage}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#ff4757', marginBottom: '20px' }}></i>
                  <h3>Problemă de compatibilitate</h3>
                  <p>{errorMessage}</p>
                  <div style={styles.solutionBox}>
                    <h4>Soluții recomandate:</h4>
                    <ul style={styles.solutionList}>
                      <li>Actualizați browserul la ultima versiune</li>
                      <li>Permiteți accesul la cameră și microfon</li>
                      <li>Dezactivați extensiile care pot bloca video call-ul</li>
                      <li>Încercați un alt browser (Chrome, Firefox, Safari, Edge)</li>
                      <li>Verificați că site-ul este accesat prin HTTPS</li>
                    </ul>
                  </div>
                  <button style={styles.retryButton} onClick={() => window.location.reload()}>
                    Reîncearcă
                  </button>
                </div>
              </div>
            ) : errorMessage ? (
              <div style={styles.errorContainer}>
                <div style={styles.errorMessage}>
                  <i className="fas fa-video-slash" style={{ fontSize: '48px', color: '#ff6b6b', marginBottom: '20px' }}></i>
                  <h3>Problemă cu cameră/microfonul</h3>
                  <p>{errorMessage}</p>
                  <div style={styles.solutionBox}>
                    <h4>Cum să rezolvați:</h4>
                    <ul style={styles.solutionList}>
                      <li>Apăsați pe iconița de cameră din bara browserului</li>
                      <li>Selectați "Permite" pentru cameră și microfon</li>
                      <li>Reîncărcați pagina după ce ați dat permisiunile</li>
                      <li>Verificați că alte aplicații nu folosesc camera</li>
                    </ul>
                  </div>
                  <button style={styles.retryButton} onClick={() => window.location.reload()}>
                    Reîncearcă
                  </button>
                </div>
              </div>
            ) : videocall ? (
              <>
                {/* Butonul rotund pentru schimbarea layout-ului */}
                {!isMobile && (
                  <button
                    style={styles.roundButton}
                    onClick={() => setPinned(!isPinned)}
                  >
                    {isPinned ? (
                      <i className="fas fa-th-large" /> // Icon pentru grid
                    ) : (
                      <i className="fas fa-thumbtack" /> // Icon pentru pinned
                    )}
                  </button>
                )}

                {/* Butonul pentru fullscreen, afișat doar dacă nu este pe mobil */}
                {!isMobile && (
                  <button
                    style={styles.fullscreenButton}
                    onClick={handleFullscreen}
                  >
                    <i
                      className={`fas ${
                        isFullscreen ? "fa-compress" : "fa-expand"
                      }`}
                    />
                  </button>
                )}

                {/* Recording Controls - Main Control Button with Animations */}
                {/* isRecordingSupported is no longer relevant as we use Agora Cloud Recording */}
                <div style={styles.recordingControls}>

                  <button
                    style={{
                      ...styles.recordButton,
                      backgroundColor: 
                        recordingStatus.includes('Upload:') ? "#3742fa" :
                        recordingStatus.includes('Oprire înregistrare') ? "#e67e22" :
                        recordingStatus.includes('Procesare video') ? "#9b59b6" :
                        recordingStatus.includes('Încărcare video') ? "#3742fa" :
                        recordingStatus.includes('Salvare metadata') ? "#17a2b8" :
                        recordingStatus.includes('Pregătire trimitere email') ? "#fd7e14" :
                        recordingStatus.includes('Trimitere email în curs') ? "#ffc107" :
                        recordingStatus.includes('Email trimis') ? "#28a745" :
                        recordingStatus.includes('Proces finalizat') ? "#20c997" :
                        recordingStatus.includes('complet') ? "#2ecc71" :
                        isRecording ? "#ff4757" : "#e74c3c",
                      animation: 
                        recordingStatus.includes('Upload:') || recordingStatus.includes('Încărcare video') ? "shimmer 2s infinite" :
                        recordingStatus.includes('Oprire înregistrare') ? "pulse 1s ease-in-out 3" :
                        recordingStatus.includes('Procesare video') ? "rotate 2s linear infinite" :
                        recordingStatus.includes('Salvare metadata') ? "bounce 1s ease-in-out infinite" :
                        recordingStatus.includes('Pregătire trimitere email') || recordingStatus.includes('Trimitere email în curs') ? "pulse 1.5s ease-in-out infinite" :
                        recordingStatus.includes('Email trimis') || recordingStatus.includes('Proces finalizat') ? "checkmark 1s ease-in-out" :
                        recordingStatus.includes('complet') ? "bounce 0.6s ease-in-out" :
                        isRecording ? "pulse 2s infinite" : "none",
                    }}
                    onClick={isRecording ? confirmStopRecording : startRecording}
                                         title={
                       recordingStatus.includes('Upload:') || recordingStatus.includes('Încărcare video') ? "Se încarcă înregistrarea..." :
                       recordingStatus.includes('Oprire înregistrare') ? "Se oprește înregistrarea..." :
                       recordingStatus.includes('Procesare video') ? "Se procesează video-ul..." :
                       recordingStatus.includes('Salvare metadata') ? "Se salvează informațiile..." :
                       recordingStatus.includes('Pregătire trimitere email') ? "Se pregătește emailul..." :
                       recordingStatus.includes('Trimitere email în curs') ? "Se trimite emailul..." :
                       recordingStatus.includes('Email trimis') ? "Email trimis cu succes!" :
                       recordingStatus.includes('Proces finalizat') ? "Procesul s-a finalizat!" :
                       recordingStatus.includes('complet') ? "Înregistrare completă!" :
                       isRecording ? "Oprește înregistrarea" : "Începe înregistrarea"
                     }
                     disabled={recordingStatus && !isRecording}
                  >
                                         {recordingStatus.includes('Upload:') || recordingStatus.includes('Încărcare video') ? (
                       <i className="fas fa-cloud-upload-alt" />
                     ) : recordingStatus.includes('Oprire înregistrare') ? (
                       <i className="fas fa-stop-circle" />
                     ) : recordingStatus.includes('Procesare video') ? (
                       <i className="fas fa-cog" />
                     ) : recordingStatus.includes('Salvare metadata') ? (
                       <i className="fas fa-database" />
                     ) : recordingStatus.includes('Pregătire trimitere email') ? (
                       <i className="fas fa-envelope" />
                     ) : recordingStatus.includes('Trimitere email în curs') ? (
                       <i className="fas fa-paper-plane" />
                     ) : recordingStatus.includes('Email trimis') ? (
                       <i className="fas fa-envelope-check" />
                     ) : recordingStatus.includes('Proces finalizat') ? (
                       <i className="fas fa-trophy" />
                     ) : recordingStatus.includes('complet') ? (
                       <i className="fas fa-check-circle" />
                     ) : (
                       <i className={`fas ${isRecording ? "fa-stop-circle" : "fa-circle"}`} />
                     )}
                  </button>
                  
                  {isRecording && (
                    <div style={styles.recordingInfo}>
                      <div style={styles.recordingIndicator}>
                        <div style={styles.recordingDot}></div>
                        <span>REC</span>
                      </div>
                      <div style={styles.recordingTime}>
                        {formatRecordingTime(recordingDuration)}
                      </div>
                    </div>
                  )}

                    {recordingStatus && (
                      <div style={styles.recordingStatus}>
                        <i className="fas fa-info-circle" style={{marginRight: '8px'}}></i>
                        {recordingStatus}
                        
                        {/* Progress Bar for Upload */}
                        {recordingStatus.includes('Upload:') && (
                          <div style={styles.progressBarContainer}>
                            <div 
                              style={{
                                ...styles.progressBar,
                                width: `${recordingStatus.match(/(\d+)%/)?.[1] || 0}%`
                              }}
                            />
                            <div style={styles.progressText}>
                              {recordingStatus.match(/(\d+)%/)?.[1] || 0}%
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                <AgoraUIKit
                  rtcProps={{
                    appId: appID,
                    channel: documentId,
                    token: null,
                    role: "host", // Both admin and client are hosts in one-to-one calls
                    layout: isPinned ? layout.pin : layout.grid,
                    enableScreensharing: true,
                    screenShareUID: 1, // Unique UID for admin screen sharing
                    // enableDualStream: true, // Disabled to prevent conflicts - managed by AgoraUIKit internally
                    videoMode: {
                      max: "cover", // Video-ul mare va acoperi întregul container
                      min: "contain", // Video-ul mic va fi afișat complet în container, fără să fie tăiat
                    },
                  }}
                  rtmProps={{ username: username, displayUsername: true }}
                  settings={{
                    host: true, // Admin is host in one-to-one
                    mode: 0, // RTC mode for one-to-one calls (not live broadcast)
                    role: 1, // Host role in settings
                  }}
                  callbacks={{
                    EndCall: () => {
                      handleEndCall();
                    },
                    'rtc-screen-share-start': () => {
                      console.log('🖥️ [ADMIN] Screen sharing started in one-to-one');
                    },
                    'rtc-screen-share-stop': () => {
                      console.log('🖥️ [ADMIN] Screen sharing stopped in one-to-one');
                    },
                    'user-joined': (user) => {
                      console.log('👥 User joined:', user.uid);
                      // DISABLED: Using Agora Cloud Recording instead of canvas capture
                      if (isRecording) {
                        console.log('🎥 User joined during recording - handled by Agora Cloud Recording');
                        // setTimeout(() => captureExistingAgoraStreams(), 1000); // DISABLED
                      }
                    },
                    'user-left': (user) => {
                      console.log('👥 User left:', user.uid);
                      // Remove user's video element from recorder
                      if (isRecording) {
                        // recorder.removeVideoElement(user.uid); // This line is removed as per the new_code
                        console.log('🎥 Removed video element for user:', user.uid);
                      }
                    },
                    'user-published': (user, mediaType) => {
                      console.log('📡 User published:', user.uid, mediaType);
                      // DISABLED: Using Agora Cloud Recording instead
                      if (isRecording && mediaType === 'video') {
                        console.log('🎥 User published video - handled by Agora Cloud Recording');
                        // setTimeout(() => captureExistingAgoraStreams(), 1000); // DISABLED
                      }
                    },
                    'user-unpublished': (user, mediaType) => {
                      console.log('📡 User unpublished:', user.uid, mediaType);
                      // Remove video element when video is unpublished
                      if (isRecording && mediaType === 'video') {
                        // recorder.removeVideoElement(user.uid); // This line is removed as per the new_code
                        console.log('🎥 Removed video element for unpublished user:', user.uid);
                      }
                    },
                  }}
                  styleProps={{
                    localBtnContainer: {
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "2px solid #ffffff",
                      padding: "10px",
                      margin: "10px",
                    },
                    BtnTemplateStyles: {
                      backgroundColor: "transparent",
                      color: "#777777",
                      borderRadius: "50%",
                      border: "2px solid #f0f0f0",
                      margin: "0 10px",
                      fontSize: "28px",
                      fontWeight: "bold",
                      transition: "all 0.3s ease-in-out",
                      height: "60px",
                      width: "60px",
                    },
                    UIKitContainer: {
                      backgroundColor: "transparent",
                      color: "#f0f0f0",
                      border: "2px solid #f0f0f0",
                      padding: isMobile ? "0px" : "12px",
                      margin: isMobile ? "0 0px" : "0 10px",
                      fontSize: "28px",
                      fontWeight: "bold",
                      transition: "all 0.3s ease-in-out",
                    },

                    gridVideoCells: {
                      padding: isMobile ? "0px" : "12px",
                      margin: isMobile ? "0 10px" : "0 10px",
                      fontSize: "28px",
                      fontWeight: "bold",
                      transition: "all 0.3s ease-in-out",
                    },
                    minViewContainer: isMobile && {
                      position: "absolute",
                      zIndex: 2, // Asigurăm că are prioritate în suprapunere

                      // maxHeight: "20px",
                    },
                    minViewOverlayContainer: isMobile && {
                      maxHeight: "130px",
                      maxWidth: "130px",
                      position: "absolute",
                      top: "20px",
                    },
                    minViewStyles: isMobile && {
                      maxHeight: "130px",
                      maxWidth: "130px",
                    },
                    maxViewContainer: {
                      backgroundColor: "#f0f0f0",
                      color: "#f0f0f0",
                      border: "none",
                      padding: "0",
                      margin: "0",
                      width: "100%",
                      height: "100vh", // Să ocupe întreaga înălțime a ecranului
                      transition: "all 0.3s ease-in-out",
                      position: isMobile ? "fixed" : "relative", // Setăm fixed pentru a forța să fie pe tot ecranul
                      top: 0, // Fixăm în partea de sus
                      left: 0, // Fixăm în partea stângă
                      zIndex: 1, // Asigurăm că are prioritate în suprapunere
                    },
                    maxViewOverlayContainer: isMobile && {
                      position: "fixed",
                      height: "100vh",
                      maxWidth: "80%", // Se asigură că overlay-ul acoperă tot ecranul
                      top: 0,
                      left: 0,
                      zIndex: 1, // Z-index pentru suprapunere corectă
                    },
                    maxViewStyles: isMobile && {
                      height: "100vh", // Forțăm înălțimea la 100% din viewport

                      maxWidth: "100%",
                      top: 0,
                      left: 0,
                    },

                    iconSize: 35,
                    theme: "#777777",
                  }}
                />
              </>
            ) : (
              <div style={styles.nav}>
                <input
                  style={styles.input}
                  placeholder="Nume"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                  }}
                />
                <h3 style={styles.btn} onClick={() => setVideocall(true)}>
                  Intră în apel
                </h3>
              </div>
            )}
            {isSessionActive && (
              <div
                style={{
                  ...(isMobile ? styles.timerMobile : styles.timer),
                  backgroundColor: isWarning
                    ? "rgba(255, 0, 0, 0.7)"
                    : "rgba(0, 0, 0, 0.5)",
                  animation: isWarning ? "pulsate 1s infinite" : "none",
                }}
              >
                {`${Math.floor(elapsedTime / 60)
                  .toString()
                  .padStart(2, "0")}:${(elapsedTime % 60)
                  .toString()
                  .padStart(2, "0")}`}
              </div>
            )}

            {/* Compact Recording Progress Monitor - Bottom Right */}
            {/* <RecordingProgressWidget
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              recordingStatus={recordingStatus}
              recordingError={recordingError}
              showCancelButton={false}
              showStartStopButtons={false}
              onCancel={() => {
                // recorder.cleanup(); // This line is removed as per the new_code
                setIsRecording(false);
                setRecordingStatus('');
                setRecordingError('');
                if (recordingIntervalRef.current) {
                  clearInterval(recordingIntervalRef.current);
                  recordingIntervalRef.current = null;
                }
              }}
            /> */}

            {/* Email Dialog for Recording */}
            {showEmailDialog && (
              <div style={styles.emailDialogOverlay}>
                <div style={styles.emailDialog}>
                  <div style={styles.emailDialogHeader}>
                    <h3 style={styles.emailDialogTitle}>
                      <i className="fas fa-envelope" style={{marginRight: '8px'}}></i>
                      Oprire înregistrare și trimitere email
                    </h3>
                    <button
                      style={styles.emailDialogCloseButton}
                      onClick={() => setShowEmailDialog(false)}
                      disabled={isSendingEmail}
                    >
                      <i className="fas fa-times"></i>
                    </button>
          </div>
                  
                  <div style={styles.emailDialogBody}>
                    <p style={styles.emailDialogDescription}>
                      Înregistrarea va fi oprită și un email cu link-ul de descărcare va fi trimis la adresa specificată.
                    </p>
                    
                    <div style={styles.emailInputContainer}>
                      <label style={styles.emailInputLabel}>
                        Adresa de email pentru înregistrare:
                        {isLoadingClientEmail && (
                          <span style={{marginLeft: '8px', color: '#667eea', fontSize: '14px'}}>
                            <i className="fas fa-spinner fa-spin" style={{marginRight: '4px'}}></i>
                            Se caută emailul clientului...
                          </span>
                        )}
                      </label>
                      <input
                        type="email"
                        style={{
                          ...styles.emailInput,
                          backgroundColor: isLoadingClientEmail ? '#f8f9fa' : 'white'
                        }}
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder={isLoadingClientEmail ? "Se caută emailul..." : "client@example.com"}
                        disabled={isSendingEmail || isLoadingClientEmail}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !isSendingEmail && !isLoadingClientEmail) {
                            confirmStopRecording();
                          }
                        }}
                      />
                      {recipientEmail && !isLoadingClientEmail && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          background: '#e8f5e8',
                          border: '1px solid #28a745',
                          borderRadius: '4px',
                          fontSize: '14px',
                          color: '#155724'
                        }}>
                          <i className="fas fa-check-circle" style={{marginRight: '6px', color: '#28a745'}}></i>
                          Email găsit automat din rezervare. Poți modifica dacă dorești să trimiți la alt email.
                        </div>
                      )}
        </div>
                    
                    {emailError && (
                      <div style={styles.emailError}>
                        <i className="fas fa-exclamation-triangle" style={{marginRight: '8px'}}></i>
                        {emailError}
                      </div>
                    )}
                  </div>
                  
                  <div style={styles.emailDialogFooter}>
                    <button
                      style={styles.emailDialogCancelButton}
                      onClick={() => setShowEmailDialog(false)}
                      disabled={isSendingEmail}
                    >
                      Anulează
                    </button>
                    <button
                      style={styles.emailDialogConfirmButton}
                      onClick={confirmStopRecording}
                      disabled={isSendingEmail || isLoadingClientEmail || !recipientEmail.trim()}
                    >
                      {isSendingEmail ? (
                        <>
                          <i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i>
                          Se procesează...
                        </>
                      ) : isLoadingClientEmail ? (
                        <>
                          <i className="fas fa-search fa-spin" style={{marginRight: '8px'}}></i>
                          Se caută emailul...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-stop" style={{marginRight: '8px'}}></i>
                          Oprește și trimite email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  timer: {
    position: "absolute",
    bottom: "12%",
    left: "5%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "24px",
    zIndex: 1000,
  },
  timerMobile: {
    position: "absolute",
    bottom: "10%",
    left: "20%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "24px",
    zIndex: 1000,
  },
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
  },
  videoContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
  },
  roundButton: {
    position: "absolute",
    bottom: "4%",
    left: "5%",
    backgroundColor: "#007bff",
    color: "#ffffff",
    borderRadius: "50%",
    border: "none",
    width: "70px",
    height: "70px",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  },
  fullscreenButton: {
    position: "absolute",
    bottom: "4%",
    right: "5%",
    backgroundColor: "#28a745",
    color: "#ffffff",
    borderRadius: "50%",
    border: "none",
    width: "70px",
    height: "70px",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  },
  nav: {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    flexDirection: "column",
  },
  btn: {
    backgroundColor: "#007bff",
    cursor: "pointer",
    borderRadius: 5,
    padding: "10px 20px",
    color: "#ffffff",
    fontSize: 18,
  },
  input: { display: "flex", height: 24, alignSelf: "center" },

  // Media queries pentru a face butoanele responsive pe mobil
  "@media (max-width: 768px)": {
    roundButton: {
      width: "60px",
      height: "60px",
      fontSize: "20px",
      bottom: "3%",
      left: "4%",
    },
    fullscreenButton: {
      display: "none", // Ascundem butonul fullscreen pe mobil
    },
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  errorMessage: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    maxWidth: "400px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  },
  solutionBox: {
    marginBottom: "20px",
  },
  solutionList: {
    listStyleType: "disc",
    paddingLeft: "20px",
    textAlign: "left",
  },
  retryButton: {
    backgroundColor: "#007bff",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: "16px",
  },
  recordingControls: {
    position: "absolute",
    top: "20px",
    right: "20px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: "25px",
    padding: "10px 20px",
    zIndex: 1000,
    color: "#ffffff",
  },
  recordButton: {
    backgroundColor: "#e74c3c",
    color: "#ffffff",
    borderRadius: "50%",
    border: "none",
    width: "50px",
    height: "50px",
    fontSize: "18px",
    cursor: "pointer",
    marginRight: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  },
  recordingInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  recordingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "bold",
  },
  recordingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#ff4757",
    animation: "blink 1s infinite",
  },
  recordingTime: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#ffffff",
  },
  errorNotification: {
    position: "absolute",
    top: "10%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "10px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    zIndex: 1000,
  },
  errorCloseButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "24px",
    cursor: "pointer",
    marginLeft: "10px",
  },
  // Email Dialog Styles
  emailDialogOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },
  emailDialog: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    overflow: "hidden",
  },
  emailDialogHeader: {
    backgroundColor: "#667eea",
    color: "#ffffff",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emailDialogTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
  },
  emailDialogCloseButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "18px",
    cursor: "pointer",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
    transition: "opacity 0.2s ease",
  },
  emailDialogBody: {
    padding: "24px",
  },
  emailDialogDescription: {
    margin: "0 0 20px 0",
    fontSize: "14px",
    color: "#666666",
    lineHeight: "1.5",
  },
  emailInputContainer: {
    marginBottom: "16px",
  },
  emailInputLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333333",
    marginBottom: "8px",
  },
  emailInput: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e1e5e9",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
    outline: "none",
  },
  emailError: {
    color: "#e74c3c",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fdf2f2",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #fecaca",
  },
  emailDialogFooter: {
    padding: "16px 24px",
    backgroundColor: "#f8f9fa",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  emailDialogCancelButton: {
    padding: "10px 20px",
    backgroundColor: "#6c757d",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  emailDialogConfirmButton: {
    padding: "10px 20px",
    backgroundColor: "#e74c3c",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    display: "flex",
    alignItems: "center",
  },
  recordingStatus: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #bbdefb',
    textAlign: 'center',
    minWidth: '200px',
  },
  progressBarContainer: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '3px',
    marginTop: '8px',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #3742fa, #5352ed)',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
    position: 'relative',
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#1976d2',
    zIndex: 1,
  },
  recordingUnsupported: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ffeaa7',
    textAlign: 'center',
    marginBottom: '10px',
  },

};

export default AdminVideoCall;

// Add CSS animations for recording button
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: 200px 0; }
    }
    
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% { transform: scale(1); }
      40%, 43% { transform: scale(1.1); }
      70% { transform: scale(1.05); }
    }
    
    @keyframes checkmark {
      0% { transform: scale(1) rotate(0deg); opacity: 1; }
      50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
      100% { transform: scale(1) rotate(360deg); opacity: 1; }
    }
    
         @keyframes blink {
       0%, 50% { opacity: 1; }
       51%, 100% { opacity: 0.3; }
     }
     
     @keyframes rotate {
       from { transform: rotate(0deg); }
       to { transform: rotate(360deg); }
     }
     
     /* Enhanced shimmer effect for upload button */
     button[style*="shimmer"] {
       background: linear-gradient(90deg, #3742fa 25%, #5352ed 37%, #3742fa 63%) !important;
       background-size: 400% 100% !important;
     }
  `;
  document.head.appendChild(style);
}
