import React, { useEffect, useState, useRef } from "react";
import AgoraUIKit, { layout } from "agora-react-uikit";
import "agora-react-uikit/dist/index.css";
import { useRouter } from "next/router";
import Home1Header from "../../home/home-1/header";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import RealtimeChat from "../../../../components/Chat/RealtimeChat";
import ChatFAB from "../../../../components/Chat/ChatFAB";
import { setUserOfflineInChat, monitorConsultationForChatCleanup } from "../../../../utils/chatUtils";
import { SimpleVideoRecorder } from "../../../../utils/mediaRecorder";
import { createRecordingLogger } from "../../../../utils/recordingLogger";
import RecordingDebugPanel from "../../../../components/RecordingDebugPanel";

// Funcție pentru a obține timpul curent
const getCurrentTime = () => Math.floor(Date.now() / 1000);

const VideoCall = () => {
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
  const [adminPresent, setAdminPresent] = useState(false);
  const [browserCompatible, setBrowserCompatible] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Simple Recording states (updated for new system with detailed logging)
  const [recorder] = useState(() => {
    const componentLogger = createRecordingLogger('VideoCall-OneToOne');
    
    return new SimpleVideoRecorder({
      onProgress: (message) => {
        componentLogger.progress('📊 Recording progress update in consultation', { 
          status: message,
          meetingCode: meetingCode || 'unknown',
          component: 'videocall/video.jsx'
        });
        setRecordingStatus(message);
      },
      onComplete: (data) => {
        componentLogger.success('🎉 Recording completed successfully in consultation', {
          meetingCode: data.meetingCode,
          fileName: data.fileName,
          fileSize: data.size,
          duration: data.duration,
          downloadURL: data.downloadURL ? '[PROVIDED]' : '[MISSING]',
          component: 'videocall/video.jsx'
        });
        setRecordingStatus('Înregistrare completă! Email trimis.');
        setIsRecording(false);
        setRecordingDuration(0);
        // Update Firestore with recording completion
        if (documentId) {
          componentLogger.info('💾 Updating Firestore with recording completion', {
            documentId,
            collection: 'RezervariConsultatii'
          });
          updateDoc(doc(db, "RezervariConsultatii", documentId), {
            recording: {
              isRecording: false,
              endTime: Date.now(),
              status: 'completed',
              downloadURL: data.downloadURL,
              fileName: data.fileName
            }
          }).catch(error => {
            componentLogger.error('❌ Failed to update Firestore after recording completion', {
              error: error.message,
              documentId
            });
          });
        }
      },
      onError: (error) => {
        componentLogger.error('💥 Recording failed in consultation component', {
          error: error.message,
          errorName: error.name,
          meetingCode: meetingCode || 'unknown',
          component: 'videocall/video.jsx'
        });
        setRecordingError(error.message || 'Eroare la înregistrare');
        setIsRecording(false);
      }
    });
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [recordingError, setRecordingError] = useState('');
  const [recordingPermission, setRecordingPermission] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const recordingIntervalRef = useRef(null);
  
  // Chat states
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const chatCleanupMonitorRef = useRef(null);

  // Check browser recording support with logging
  const isRecordingSupported = SimpleVideoRecorder.isSupported();
  
  // Component initialization logging
  useEffect(() => {
    const componentLogger = createRecordingLogger('VideoCall-OneToOne-Init');
    componentLogger.info('🎬 VideoCall component initialized', {
      meetingCode: meetingCode || 'unknown',
      isRecordingSupported,
      supportedMimeTypes: SimpleVideoRecorder.getSupportedMimeTypes(),
      userAgent: navigator.userAgent,
      component: 'videocall/video.jsx'
    });
  }, [meetingCode]);

  // Verificarea compatibilității browserului
  useEffect(() => {
    const checkBrowserCompatibility = () => {
      const userAgent = navigator.userAgent;
      const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
      const isFirefox = /Firefox/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
      const isEdge = /Edg/.test(userAgent);
      const isOpera = /OPR/.test(userAgent);

      // Verifică suportul pentru WebRTC
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setBrowserCompatible(false);
        setErrorMessage("Browserul dumneavoastră nu suportă funcționalitatea video call. Vă rugăm să utilizați Chrome, Firefox, Safari sau Edge.");
        return;
      }

      // Verifică versiunea browserului
      if (isChrome) {
        const chromeVersion = parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || 0);
        if (chromeVersion < 74) {
          setBrowserCompatible(false);
          setErrorMessage("Vă rugăm să actualizați Chrome la ultima versiune pentru a utiliza video call.");
        }
      } else if (isFirefox) {
        const firefoxVersion = parseInt(userAgent.match(/Firefox\/(\d+)/)?.[1] || 0);
        if (firefoxVersion < 67) {
          setBrowserCompatible(false);
          setErrorMessage("Vă rugăm să actualizați Firefox la ultima versiune pentru a utiliza video call.");
        }
      } else if (isSafari) {
        const safariVersion = parseInt(userAgent.match(/Version\/(\d+)/)?.[1] || 0);
        if (safariVersion < 12) {
          setBrowserCompatible(false);
          setErrorMessage("Vă rugăm să actualizați Safari la ultima versiune pentru a utiliza video call.");
        }
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
  const userRole = "client"; // Identifică rolul utilizatorului (admin sau client)
  const [totalTime, setTotalTime] = useState(null);
  const [reservationData, setReservationData] = useState(null); // Stare pentru datele rezervării

  useEffect(() => {
    if (documentId) {
      const docRef = doc(db, "RezervariConsultatii", documentId);

      // Setăm prezența utilizatorului
      updateDoc(docRef, { [`presence.${userRole}`]: true });

      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        const data = snapshot.data();
        setTotalTime(data?.categorie?.timp);
        
        // Set participant data for chat
        if (data) {
          setParticipantData({
            nume: data.nume,
            prenume: data.prenume || '',
            email: data.email,
            telefon: data.telefon,
            isGuestUser: userRole === 'client' && !data.emailUtilizator
          });
        }
        
        if (data?.presence?.admin) {
          setAdminPresent(true);
        }
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

      // Start monitoring chat for cleanup
      chatCleanupMonitorRef.current = monitorConsultationForChatCleanup(
        documentId,
        (chatId) => {
          console.log(`💬 [CHAT] Chat marcat pentru cleanup: ${chatId}`);
        }
      );

      return () => {
        updateDoc(docRef, { [`presence.${userRole}`]: false });
        unsubscribe();
        
        // Stop chat cleanup monitoring
        if (chatCleanupMonitorRef.current) {
          chatCleanupMonitorRef.current();
        }
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

  // Simple Recording functionality (Browser-based)
  const startRecording = async () => {
    const componentLogger = createRecordingLogger('VideoCall-OneToOne-Start');
    
    try {
      componentLogger.info('🎬 Starting recording process in consultation', {
        meetingCode: meetingCode || 'unknown',
        documentId,
        hasPermission: recordingPermission,
        userAgent: navigator.userAgent,
        component: 'videocall/video.jsx'
      });

      setRecordingError('');
      setRecordingStatus('Pregătire înregistrare...');
      
      // Check if both parties consented to recording
      if (!recordingPermission) {
        componentLogger.warning('⚠️ Recording permission not granted, showing modal', {
          meetingCode: meetingCode || 'unknown'
        });
        setShowRecordingModal(true);
        return;
      }
      
      // Check browser support before starting
      if (!SimpleVideoRecorder.isSupported()) {
        componentLogger.error('❌ Browser does not support recording', {
          userAgent: navigator.userAgent,
          supportedMimeTypes: SimpleVideoRecorder.getSupportedMimeTypes()
        });
        throw new Error('Browser nu suportă înregistrarea video');
      }
      
      componentLogger.info('✅ Browser support confirmed, proceeding with recording', {
        supportedMimeTypes: SimpleVideoRecorder.getSupportedMimeTypes()
      });
      
      const result = await recorder.startRecording();
      
      if (result.success) {
        componentLogger.success('▶️ Recording started successfully in consultation', {
          mimeType: result.mimeType,
          meetingCode: meetingCode || 'unknown'
        });

        setIsRecording(true);
        setRecordingStatus('Înregistrare activă');
        startRecordingTimer();
        
        // Update recording status in Firebase
        if (documentId) {
          componentLogger.info('💾 Updating Firestore with recording start', {
            documentId,
            collection: 'RezervariConsultatii',
            format: result.mimeType
          });

          const docRef = doc(db, "RezervariConsultatii", documentId);
          await updateDoc(docRef, {
            recording: {
              isRecording: true,
              startTime: Date.now(),
              status: 'recording',
              type: 'browser_simple',
              format: result.mimeType
            }
          });

          componentLogger.success('✅ Firestore updated with recording start', {
            documentId
          });
        }
      } else {
        componentLogger.error('❌ Failed to start recording in consultation', {
          message: result.message,
          meetingCode: meetingCode || 'unknown'
        });
        setRecordingError(result.message);
        setRecordingStatus('');
      }
    } catch (error) {
      componentLogger.error('💥 Critical error starting recording in consultation', {
        error: error.message,
        errorStack: error.stack,
        meetingCode: meetingCode || 'unknown',
        userAgent: navigator.userAgent
      });
      setRecordingError('Eroare la pornirea înregistrării');
      setRecordingStatus('');
    }
  };

  const stopRecording = () => {
    const componentLogger = createRecordingLogger('VideoCall-OneToOne-Stop');
    
    try {
      componentLogger.info('⏹️ Stopping recording in consultation', {
        meetingCode: meetingCode || 'unknown',
        documentId,
        recordingDuration,
        component: 'videocall/video.jsx'
      });

      setRecordingStatus('Oprire înregistrare...');
      recorder.stopRecording();
      
      // Timer se va opri automat în useEffect când isRecording devine false
      if (recordingIntervalRef.current) {
        componentLogger.debug('⏰ Clearing recording timer', {
          timerId: recordingIntervalRef.current
        });
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      componentLogger.success('✅ Recording stop initiated successfully', {
        meetingCode: meetingCode || 'unknown'
      });
    } catch (error) {
      componentLogger.error('💥 Error stopping recording in consultation', {
        error: error.message,
        errorStack: error.stack,
        meetingCode: meetingCode || 'unknown'
      });
      setRecordingError('Eroare la oprirea înregistrării');
    }
  };

  const startRecordingTimer = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordingPermission = (granted) => {
    setRecordingPermission(granted);
    setShowRecordingModal(false);
    if (granted) {
      startRecording();
    }
  };

  // Cleanup pe unmount pentru recording
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (recorder && isRecording) {
        recorder.stopRecording();
      }
    };
  }, []);

  // Oprește timer-ul când recording se oprește
  useEffect(() => {
    if (!isRecording && recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, [isRecording]);

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

      // Set user offline in chat before ending call
      const chatId = `consultation_${documentId}`;
      const userId = currentUser?.uid || `guest_${Date.now()}`;
      await setUserOfflineInChat(chatId, userId);

      // Setăm prezența adminului și a clientului la false în baza de date
      await updateDoc(docRef, {
        "presence.client": false,
      });
    }
  };

  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      // Set user offline in chat
      if (documentId) {
        const chatId = `consultation_${documentId}`;
        const userId = currentUser?.uid || `guest_${Date.now()}`;
        await setUserOfflineInChat(chatId, userId);
      }
      
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
        {videocall && !isSessionActive && <Home1Header />}
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

                {/* Simple Recording Controls */}
                {isSessionActive && isRecordingSupported && (
                  <div style={styles.recordingControls}>
                    <button
                      style={{
                        ...styles.recordButton,
                        backgroundColor: isRecording ? "#ff4757" : "#e74c3c",
                        animation: isRecording ? "pulse 2s infinite" : "none",
                      }}
                      onClick={isRecording ? stopRecording : startRecording}
                      title={isRecording ? "Oprește înregistrarea" : "Începe înregistrarea"}
                    >
                      <i className={`fas ${isRecording ? "fa-stop" : "fa-video"}`} />
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
                        {recordingStatus}
                      </div>
                    )}
                    
                    {recordingError && (
                      <div style={styles.recordingError}>
                        ❌ {recordingError}
                      </div>
                    )}
                  </div>
                )}

                {/* Recording not supported warning */}
                {isSessionActive && !isRecordingSupported && (
                  <div style={styles.recordingUnsupported}>
                    ⚠️ Browserul nu suportă înregistrarea video
                  </div>
                )}

                <AgoraUIKit
                  rtcProps={{
                    appId: appID,
                    channel: documentId,
                    token: null,
                    role: isHost ? "host" : "audience",
                    layout: isPinned ? layout.pin : layout.grid,
                    enableScreensharing: true,
                    videoMode: {
                      max: "cover", // Video-ul mare va acoperi întregul container
                      min: "contain", // Video-ul mic va fi afișat complet în container, fără să fie tăiat
                    },
                  }}
                  rtmProps={{ username: username, displayUsername: true }}
                  callbacks={{
                    EndCall: () => {
                      handleEndCall();
                      // router.push("/consultatii");
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
                
                {/* Afișăm mesaj de așteptare dacă sesiunea nu e activă */}
                {!isSessionActive && (
                  <div style={styles.waitingOverlay}>
                    <div style={styles.waitingMessage}>
                      <h4>Așteptăm ca adminul să se conecteze...</h4>
                      <p>Interfața video este pregătită. Apelul va începe automat când adminul se va conecta.</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={styles.nav}>
                <h4>Apelul a fost incheiat</h4>
                <h3 style={styles.btn} onClick={() => router.reload()}>
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
                {" "}
                {`${Math.floor(elapsedTime / 60)
                  .toString()
                  .padStart(2, "0")}:${(elapsedTime % 60)
                  .toString()
                  .padStart(2, "0")}`}
              </div>
            )}
          </div>
        </div>

        {/* Chat Components */}
        {documentId && (
          <>
            <ChatFAB
              meetingId={documentId}
              meetingType="consultation"
              onToggleChat={() => setIsChatVisible(!isChatVisible)}
              isChatVisible={isChatVisible}
            />

            <RealtimeChat
              meetingId={documentId}
              meetingType="consultation"
              participantData={participantData}
              isVisible={isChatVisible}
              onToggle={() => setIsChatVisible(!isChatVisible)}
              onClose={() => setIsChatVisible(false)}
            />
          </>
        )}
      </div>

      {/* Recording Permission Modal */}
      {showRecordingModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>Consimțământ pentru înregistrare</h3>
              <i className="fas fa-video" style={styles.modalIcon}></i>
            </div>
            <div style={styles.modalContent}>
              <p>
                Această consultație va fi înregistrată pentru scopuri de documentare și pentru a putea fi revizuită ulterior.
              </p>
              <p>
                <strong>Înregistrarea va conține:</strong>
              </p>
              <ul style={styles.modalList}>
                <li>Video și audio din întreaga conversație</li>
                <li>Ecranul partajat (dacă este cazul)</li>
                <li>Toate interacțiunile din timpul consultației</li>
              </ul>
              <p>
                <strong>Confidențialitate:</strong> Înregistrarea va fi stocată securizat și va fi accesibilă doar participanților la consultație.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.modalButtonDecline}
                onClick={() => handleRecordingPermission(false)}
              >
                Nu permit înregistrarea
              </button>
              <button
                style={styles.modalButtonAccept}
                onClick={() => handleRecordingPermission(true)}
              >
                Sunt de acord cu înregistrarea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Error Notification */}
      {recordingError && (
        <div style={styles.errorNotification}>
          <i className="fas fa-exclamation-triangle"></i>
          <span>{recordingError}</span>
          <button
            style={styles.errorCloseButton}
            onClick={() => setRecordingError("")}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Recording Debug Panel - Only show in development or when recording is supported */}
      <RecordingDebugPanel 
        show={isRecordingSupported && (process.env.NODE_ENV === 'development' || typeof window !== 'undefined' && window.location.search.includes('debug=true'))} 
        maxLogs={30} 
      />
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
  waitingOverlay: {
    position: "fixed",
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
  waitingMessage: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    maxWidth: "400px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  },
  errorContainer: {
    position: "fixed",
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
  },
  retryButton: {
    backgroundColor: "#007bff",
    color: "#ffffff",
    border: "none",
    borderRadius: 5,
    padding: "10px 20px",
    cursor: "pointer",
  },
  recordingControls: {
    position: "absolute",
    bottom: "4%",
    left: "50%",
    transform: "translateX(-50%)",
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
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    fontSize: "20px",
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
  recordingStatus: {
    backgroundColor: "rgba(52, 152, 219, 0.9)",
    color: "#ffffff",
    padding: "8px 12px",
    borderRadius: "15px",
    fontSize: "12px",
    textAlign: "center",
    maxWidth: "200px",
    marginTop: "5px",
  },
  recordingError: {
    backgroundColor: "rgba(231, 76, 60, 0.9)",
    color: "#ffffff",
    padding: "8px 12px",
    borderRadius: "15px",
    fontSize: "12px",
    textAlign: "center",
    maxWidth: "200px",
    marginTop: "5px",
  },
  recordingUnsupported: {
    position: "absolute",
    top: "20px",
    right: "20px",
    backgroundColor: "rgba(230, 126, 34, 0.9)",
    color: "#ffffff",
    padding: "10px 15px",
    borderRadius: "15px",
    fontSize: "12px",
    zIndex: 1000,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modal: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "2px solid #f0f0f0",
    paddingBottom: "15px",
  },
  modalIcon: {
    fontSize: "28px",
    marginRight: "15px",
    color: "#e74c3c",
  },
  modalContent: {
    marginBottom: "25px",
    lineHeight: "1.6",
  },
  modalList: {
    listStyleType: "disc",
    paddingLeft: "20px",
    margin: "15px 0",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },
  modalButtonDecline: {
    backgroundColor: "#6c757d",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    cursor: "pointer",
    fontSize: "16px",
    flex: 1,
  },
  modalButtonAccept: {
    backgroundColor: "#28a745",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    cursor: "pointer",
    fontSize: "16px",
    flex: 1,
  },
  errorNotification: {
    position: "fixed",
    top: "20px",
    right: "20px",
    backgroundColor: "#ff4757",
    color: "#ffffff",
    padding: "15px 20px",
    borderRadius: "8px",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    maxWidth: "400px",
  },
  errorCloseButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "18px",
    cursor: "pointer",
    marginLeft: "10px",
  },
};

export default VideoCall;
