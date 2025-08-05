import React, { useEffect, useState, useRef } from "react";
import AgoraUIKit, { layout } from "agora-react-uikit";
import "agora-react-uikit/dist/index.css";
import { useRouter } from "next/router";
import Home1Header from "../../home/home-1/header";
import { doc, onSnapshot, updateDoc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../../../firebase";
import { createUILogger } from "../../../../utils/logger";

import { SimpleAgoraRecorder } from '../../../../utils/simpleAgoraRecorder';

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
  


  const [recordingPermission, setRecordingPermission] = useState(true);
  const [showRecordingModal, setShowRecordingModal] = useState(false);

  const [recipientEmail, setRecipientEmail] = useState("");

  const [isLoadingClientEmail, setIsLoadingClientEmail] = useState(false);
  





  // Simple Recording states
  const [simpleRecorder, setSimpleRecorder] = useState(null);
  const [isSimpleRecording, setIsSimpleRecording] = useState(false);
  const [simpleRecordingStatus, setSimpleRecordingStatus] = useState('');
  const [simpleRecordingDuration, setSimpleRecordingDuration] = useState(0);
  const [recordingMethod] = useState('simple'); // Only screen recording method
  const [showSimpleEmailDialog, setShowSimpleEmailDialog] = useState(false);
  const [simpleRecipientEmail, setSimpleRecipientEmail] = useState('');
  const [isSimpleProcessing, setIsSimpleProcessing] = useState(false);
  const [simpleUploadProgress, setSimpleUploadProgress] = useState('');

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

      // Cleanup pentru Simple Recording dacă este activ
      if (isSimpleRecording && simpleRecorder) {
        logger.info('Call ended, stopping Simple Recording');
        try {
          await simpleRecorder.stopRecording();
        } catch (error) {
          logger.error('Error stopping Simple Recording during cleanup', { error: error.message });
        }
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

    // Cleanup Simple Recording on component unmount
    useEffect(() => {
      return () => {
        if (simpleRecorder) {
          console.log('🧹 [SIMPLE] Component unmounting - cleaning up recorder');
          simpleRecorder.cleanup();
        }
      };
    }, [simpleRecorder]);

  // Simple Recording functions
  const startSimpleRecording = async () => {
    try {
      console.log('🎬 [SIMPLE] Starting simple browser recording...');
      setSimpleRecordingStatus('Inițializare...');
      
      if (!SimpleAgoraRecorder.isSupported()) {
        throw new Error('Browser-ul nu suportă înregistrarea video');
      }

      const recorder = new SimpleAgoraRecorder({
        meetingCode,
        documentId,
        recipientEmail,
        onStatusChange: (status) => {
          console.log('📊 [SIMPLE] Status:', status);
          setSimpleRecordingStatus(status);
        },
        onProgress: (progress) => {
          console.log('📈 [SIMPLE] Progress:', progress);
        },
        onComplete: (result) => {
          console.log('✅ [SIMPLE] Recording completed:', result);
          setIsSimpleRecording(false);
          setIsSimpleProcessing(false);
          setSimpleUploadProgress('');
          setSimpleRecordingStatus('✅ Înregistrare finalizată și email trimis!');
          
          // Show success message
          setTimeout(() => {
            setSimpleRecordingStatus('');
          }, 8000);
        },
        onError: (error) => {
          console.error('❌ [SIMPLE] Error:', error);
          setIsSimpleRecording(false);
          setIsSimpleProcessing(false);
          setSimpleUploadProgress('');
          setSimpleRecordingStatus(`❌ Eroare: ${error}`);
          
          // Cleanup recorder
          if (simpleRecorder) {
            simpleRecorder.cleanup();
          }
          
          // Clear error after 10 seconds
          setTimeout(() => {
            setSimpleRecordingStatus('');
          }, 10000);
        }
      });

      setSimpleRecorder(recorder);
      
      const result = await recorder.startRecording();
      
      if (result.success) {
        setIsSimpleRecording(true);
        console.log('✅ [SIMPLE] Recording started successfully');
        
        // Start duration counter
        const startTime = Date.now();
        const durationInterval = setInterval(() => {
          if (recorder.isRecording) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setSimpleRecordingDuration(elapsed);
          } else {
            clearInterval(durationInterval);
          }
        }, 1000);
      } else {
        throw new Error(result.error || 'Nu s-a putut începe înregistrarea');
      }

    } catch (error) {
      console.error('❌ [SIMPLE] Start recording error:', error);
      setSimpleRecordingStatus(`❌ Eroare: ${error.message}`);
      
      setTimeout(() => {
        setSimpleRecordingStatus('');
      }, 5000);
    }
  };

  const stopSimpleRecording = () => {
    console.log('🛑 [SIMPLE] User clicked stop - showing email dialog...');
    
    // Pre-fill email if available from reservation
    if (recipientEmail && !simpleRecipientEmail) {
      setSimpleRecipientEmail(recipientEmail);
    }
    
    setShowSimpleEmailDialog(true);
  };

  const confirmStopSimpleRecording = async () => {
    try {
      console.log('✅ [SIMPLE] User confirmed stop with email:', simpleRecipientEmail);
      setIsSimpleProcessing(true);
      setShowSimpleEmailDialog(false);
      
      if (simpleRecorder) {
        // Update recorder with email before stopping
        simpleRecorder.recipientEmail = simpleRecipientEmail;
        
        // Add progress callback
        simpleRecorder.onProgress = (progress) => {
          setSimpleUploadProgress(progress);
        };
        
        // Stop recording - this will trigger upload and email
        simpleRecorder.stopRecording();
        setSimpleRecordingDuration(0);
      }
      
    } catch (error) {
      console.error('❌ [SIMPLE] Error stopping recording:', error);
      setSimpleRecordingStatus(`❌ Eroare: ${error.message}`);
      setIsSimpleProcessing(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
                    },
                    'user-left': (user) => {
                      console.log('👥 User left:', user.uid);
                    },
                    'user-published': (user, mediaType) => {
                      console.log('📡 User published:', user.uid, mediaType);
                    },
                    'user-unpublished': (user, mediaType) => {
                      console.log('📡 User unpublished:', user.uid, mediaType);
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

                        {/* Compact Screen Recording Button - Top Right */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '8px'
            }}>

                                           {/* Compact Screen Recording Button */}
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                   {/* Compact Recording Button */}
                   {!isSimpleRecording ? (
                     <button
                       onClick={startSimpleRecording}
                       disabled={!SimpleAgoraRecorder.isSupported()}
                       style={{
                         width: '50px',
                         height: '50px',
                         borderRadius: '50%',
                         border: '3px solid rgba(255,255,255,0.8)',
                         backgroundColor: SimpleAgoraRecorder.isSupported() ? '#6c757d' : '#495057',
                         color: 'white',
                         fontSize: '16px',
                         cursor: SimpleAgoraRecorder.isSupported() ? 'pointer' : 'not-allowed',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                         transition: 'all 0.2s ease',
                         opacity: SimpleAgoraRecorder.isSupported() ? 1 : 0.6
                       }}
                       title={SimpleAgoraRecorder.isSupported() ? 'Start Screen Recording' : 'Screen Recording not supported'}
                     >
                       <i className="fas fa-desktop"></i>
                     </button>
                   ) : (
                     <button
                       onClick={stopSimpleRecording}
                       disabled={isSimpleProcessing}
                       style={{
                         width: '50px',
                         height: '50px',
                         borderRadius: '50%',
                         border: '3px solid rgba(255,255,255,0.9)',
                         backgroundColor: isSimpleProcessing ? '#6c757d' : '#dc3545',
                         color: 'white',
                         fontSize: '16px',
                         cursor: isSimpleProcessing ? 'not-allowed' : 'pointer',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         boxShadow: isSimpleProcessing ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(220,53,69,0.4)',
                         animation: isSimpleProcessing ? 'none' : 'pulse 1.5s infinite'
                       }}
                       title={isSimpleProcessing ? 'Processing...' : `Recording: ${formatDuration(simpleRecordingDuration)} - Click to stop & send email`}
                     >
                       <i className={isSimpleProcessing ? "fas fa-spinner fa-spin" : "fas fa-envelope"}></i>
                     </button>
                   )}
                   
                   {/* Status - Only during recording */}
                   {isSimpleRecording && (
                     <div style={{
                       background: 'rgba(0, 0, 0, 0.8)',
                       padding: '4px 8px',
                       borderRadius: '12px',
                       color: 'white',
                       fontSize: '11px',
                       textAlign: 'center'
                     }}>
                       {formatDuration(simpleRecordingDuration)}
                     </div>
                   )}
                   
                   {/* Processing Info - Only when stopping */}
                   {isSimpleProcessing && (
                     <div style={{
                       background: 'rgba(40, 167, 69, 0.9)',
                       padding: '6px 10px',
                       borderRadius: '12px',
                       color: 'white',
                       fontSize: '11px',
                       textAlign: 'center',
                       maxWidth: '200px'
                     }}>
                       {simpleRecordingStatus || 'Procesare în curs...'}
                     </div>
                   )}
                   
                   {/* Upload Progress */}
                   {simpleUploadProgress && (
                     <div style={{
                       background: 'rgba(255, 235, 59, 0.9)',
                       padding: '6px 10px',
                       borderRadius: '12px',
                       color: '#333',
                       fontSize: '10px',
                       textAlign: 'center',
                       maxWidth: '180px',
                       fontWeight: 'bold'
                     }}>
                       {simpleUploadProgress}
                     </div>
                   )}
                   
                   {/* Success/Error Messages */}
                   {simpleRecordingStatus && !isSimpleRecording && !isSimpleProcessing && (
                     <div style={{
                       background: simpleRecordingStatus.includes('❌') ? 'rgba(220, 53, 69, 0.9)' : 'rgba(40, 167, 69, 0.9)',
                       padding: '6px 10px',
                       borderRadius: '12px',
                       color: 'white',
                       fontSize: '11px',
                       textAlign: 'center',
                       maxWidth: '200px'
                     }}>
                       {simpleRecordingStatus}
                     </div>
                   )}
                 </div>
            </div>





            {/* Simple Recording Email Dialog */}
            {showSimpleEmailDialog && (
              <div style={styles.emailDialogOverlay}>
                <div style={styles.emailDialog}>
                  <div style={styles.emailDialogHeader}>
                    <h3 style={styles.emailDialogTitle}>
                      <i className="fas fa-envelope" style={{marginRight: '8px'}}></i>
                      🖥️ Oprire Screen Recording și trimitere email
                    </h3>
                    <button
                      style={styles.emailDialogCloseButton}
                      onClick={() => setShowSimpleEmailDialog(false)}
                      disabled={isSimpleProcessing}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div style={styles.emailDialogBody}>
                    <p style={styles.emailDialogDescription}>
                      <strong>Screen Recording</strong> va fi oprită și procesată. 
                      Un email cu link-ul de descărcare va fi trimis la adresa specificată.
                    </p>
                    
                    <div style={{
                      background: '#e3f2fd',
                      padding: '12px',
                      borderRadius: '6px',
                      margin: '15px 0',
                      border: '1px solid #bbdefb'
                    }}>
                      <div style={{ fontSize: '14px', color: '#1976d2', marginBottom: '8px' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                        <strong>Despre Screen Recording:</strong>
                      </div>
                      <ul style={{ margin: '0', paddingLeft: '20px', color: '#1565c0', fontSize: '13px' }}>
                        <li>Se înregistrează exact ce ați selectat pe ecran</li>
                        <li>Calitate maximă 1080p, 30 FPS</li>
                        <li>Include audio din microfon (dacă ați permis)</li>
                        <li>Fișier format .webm (compatibil cu toate browserele)</li>
                      </ul>
                    </div>
                    
                    <div style={styles.emailInputContainer}>
                      <label style={styles.emailInputLabel}>
                        Email pentru primirea link-ului de descărcare:
                      </label>
                      <input
                        type="email"
                        style={styles.emailInput}
                        value={simpleRecipientEmail}
                        onChange={(e) => setSimpleRecipientEmail(e.target.value)}
                        placeholder="exemplu@email.com"
                        disabled={isSimpleProcessing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isSimpleProcessing && simpleRecipientEmail.trim()) {
                            confirmStopSimpleRecording();
                          }
                        }}
                      />
                      {simpleRecipientEmail && recipientEmail && simpleRecipientEmail === recipientEmail && (
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
                          Email găsit automat din rezervare.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={styles.emailDialogFooter}>
                    <button
                      style={styles.emailDialogCancelButton}
                      onClick={() => setShowSimpleEmailDialog(false)}
                      disabled={isSimpleProcessing}
                    >
                      Anulează
                    </button>
                    <button
                      style={styles.emailDialogConfirmButton}
                      onClick={confirmStopSimpleRecording}
                      disabled={isSimpleProcessing || !simpleRecipientEmail.trim()}
                    >
                      {isSimpleProcessing ? (
                        <>
                          <i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i>
                          Se procesează...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-desktop" style={{marginRight: '8px'}}></i>
                          Stop Recording & Send Email
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
