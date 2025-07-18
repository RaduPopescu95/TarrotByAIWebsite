import React, { useEffect, useState, useRef } from "react";
import AgoraUIKit, { layout } from "agora-react-uikit";
import "agora-react-uikit/dist/index.css";
import { useRouter } from "next/router";
import Home1Header from "../../home/home-1/header";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { AgoraStreamRecorder } from "../../../../utils/agoraStreamRecorder";

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
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [recordingStatus, setRecordingStatus] = useState("");
  const [recordingPermission, setRecordingPermission] = useState(true); // Admin has default permission
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const recordingIntervalRef = useRef(null);

  // Initialize AgoraStreamRecorder for admin (no screen share dialog!)
  const [recorder] = useState(() => {
    return new AgoraStreamRecorder({
      onProgress: (message) => {
        console.log('🎥 [ADMIN RECORDING] Progress:', message);
        setRecordingStatus(message);
      },
      onComplete: (data) => {
        console.log('🎉 [ADMIN RECORDING] Completed:', data);
        setRecordingStatus('Înregistrare completă! Pregătire email...');
        setIsRecording(false);
        setRecordingDuration(0);
        
        // Clear recording timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        // Update Firestore with recording completion
        if (documentId) {
          updateDoc(doc(db, "RezervariConsultatii", documentId), {
            recording: {
              isRecording: false,
              endTime: Date.now(),
              status: 'completed',
              recordingType: 'browser',
              downloadURL: data.downloadURL,
              fileName: data.fileName,
              fileSize: data.size,
              duration: data.duration
            }
          }).catch(error => {
            console.error('Error updating Firestore:', error);
          });
        }
      },
      onError: (error) => {
        console.error('❌ [ADMIN RECORDING] Error:', error);
        setRecordingError('Eroare la înregistrare: ' + error.message);
        setIsRecording(false);
        setRecordingStatus('');
        
        // Clear recording timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      }
    });
  });

  // Check browser recording support
  const isRecordingSupported = AgoraStreamRecorder.isSupported();
  
  // Log recording capabilities
  useEffect(() => {
    console.log('🎥 [ADMIN] Recording capabilities:', {
      isSupported: isRecordingSupported,
      supportedMimeTypes: AgoraStreamRecorder.getSupportedMimeTypes(),
      meetingCode,
      userAgent: navigator.userAgent
    });
  }, [isRecordingSupported, meetingCode]);

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

  // Function to capture existing Agora video streams from DOM
  const captureExistingAgoraStreams = async () => {
    try {
      console.log('🔍 [ADMIN] Searching for existing Agora video streams in DOM...');
      
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
            
            console.log('📹 [ADMIN] Found video stream:', {
              streamId,
              videoTracks: videoTracks.length,
              audioTracks: stream.getAudioTracks().length,
              videoElement: {
                width: videoElement.videoWidth,
                height: videoElement.videoHeight,
                readyState: videoElement.readyState
              }
            });
            
            // Add stream to recorder
            recorder.addVideoStream(streamId, stream);
            streamsCaptured++;
            
            console.log(`✅ [ADMIN] Added stream ${streamId} to recorder`);
          }
        }
      }
      
      console.log(`🎯 [ADMIN] Captured ${streamsCaptured} video streams from DOM`);
      return streamsCaptured;
      
    } catch (error) {
      console.error('❌ [ADMIN] Error capturing existing streams:', error);
      return 0;
    }
  };

  // Recording functionality (Simple Browser Recording with Firebase Storage)
  const startRecording = async () => {
    try {
      setRecordingError("");
      setRecordingStatus("Pregătire înregistrare...");

      // Check browser support
              if (!AgoraStreamRecorder.isSupported()) {
        setRecordingError("Browser-ul nu suportă înregistrarea video");
        return;
      }

      console.log('🎬 [ADMIN] Starting recording process for meeting:', meetingCode);

      // First, capture existing video streams from Agora DOM elements
      const streamsCaptured = await captureExistingAgoraStreams();
      
      if (streamsCaptured === 0) {
        console.warn('⚠️ [ADMIN] No video streams found, waiting for participants...');
        setRecordingStatus("Așteptare participanți cu video...");
        // Continue anyway - streams might be added during recording via callbacks
      }

      // Start recording using AgoraStreamRecorder (no screen share dialog!)
      const result = await recorder.startRecording();
      
      if (result.success) {
        setIsRecording(true);
        setRecordingStartTime(Date.now());
        setRecordingStatus('Înregistrare activă - capturează streamuri video');
        
        // Start recording duration timer
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);

        // Update recording status in Firebase
        if (documentId) {
          const docRef = doc(db, "RezervariConsultatii", documentId);
          await updateDoc(docRef, {
            recording: {
              isRecording: true,
              startTime: Date.now(),
              recordingType: 'browser',
              status: 'recording'
            }
          });
        }

        console.log('✅ [ADMIN] Recording started successfully');
      } else {
        setRecordingError(result.message || "Eroare la pornirea înregistrării");
        setRecordingStatus("");
      }
    } catch (error) {
      console.error("❌ [ADMIN] Recording start error:", error);
      setRecordingError("Eroare la pornirea înregistrării");
      setRecordingStatus("");
    }
  };

  const stopRecording = () => {
    // Show email dialog instead of stopping immediately
    setEmailError("");
    setRecipientEmail("");
    setShowEmailDialog(true);
  };

  const confirmStopRecording = async () => {
    if (!recipientEmail.trim()) {
      setEmailError("Vă rugăm să introduceți o adresă de email validă");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      setEmailError("Adresa de email nu este validă");
      return;
    }

    try {
      setIsSendingEmail(true);
      setEmailError("");
      setRecordingStatus("Oprire înregistrare...");
      
      console.log('🛑 [ADMIN] Stopping recording for meeting:', meetingCode);
      console.log('📧 [ADMIN] Recipient email:', recipientEmail.trim());
      
              // Stop recording using AgoraStreamRecorder
      // The onComplete callback will handle Firebase updates and file upload
      await recorder.stopRecording();
      
      // Close email dialog
      setShowEmailDialog(false);
      
              // The AgoraStreamRecorder will handle:
      // 1. Processing and uploading the video to Firebase Storage
      // 2. Updating Firestore with completion status
      // 3. Getting download URL
      
      // After recording completes, send notification email with the download URL
      // This will be triggered from the onComplete callback
      console.log('✅ [ADMIN] Recording stop process initiated');
      
      // Send notification email with recipient
      await sendRecordingNotification();

    } catch (error) {
      console.error("❌ [ADMIN] Recording stop error:", error);
      setRecordingError("Eroare la oprirea înregistrării");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendRecordingNotification = async () => {
    try {
      const response = await fetch('/api/recording/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingCode: meetingCode,
          recipientEmail: recipientEmail.trim(),
          duration: recordingDuration
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("Notification email sent successfully");
      } else {
        console.error("Failed to send notification email:", data.message);
      }
    } catch (error) {
      console.error("Error sending notification email:", error);
    }
  };

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
        console.log('🎥 Stopping recording due to call end');
        recorder.stopRecording();
        setIsRecording(false);
      }
      
      // Cleanup recorder resources
      if (recorder) {
        recorder.cleanup();
      }

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

                {/* Recording Controls */}
                {isRecordingSupported ? (
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
                      <i className={`fas ${isRecording ? "fa-stop-circle" : "fa-circle"}`} />
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
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.recordingUnsupported}>
                    <i className="fas fa-exclamation-triangle" style={{marginRight: '8px', color: '#ff6b6b'}}></i>
                    <span>Înregistrarea video nu este suportată în acest browser</span>
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
                    },
                    'user-joined': (user) => {
                      console.log('👥 User joined:', user.uid);
                      // Add user's video stream to recorder when available
                      if (isRecording && user.videoTrack) {
                        const stream = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
                        if (user.audioTrack) {
                          stream.addTrack(user.audioTrack.getMediaStreamTrack());
                        }
                        recorder.addVideoStream(user.uid, stream);
                        console.log('🎥 Added stream to recorder for user:', user.uid);
                      }
                    },
                    'user-left': (user) => {
                      console.log('👥 User left:', user.uid);
                      // Remove user's video stream from recorder
                      if (isRecording) {
                        recorder.removeVideoStream(user.uid);
                        console.log('🎥 Removed stream from recorder for user:', user.uid);
                      }
                    },
                    'user-published': (user, mediaType) => {
                      console.log('📡 User published:', user.uid, mediaType);
                      // Handle when user starts sharing video/audio
                      if (isRecording && mediaType === 'video' && user.videoTrack) {
                        const stream = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
                        if (user.audioTrack) {
                          stream.addTrack(user.audioTrack.getMediaStreamTrack());
                        }
                        recorder.addVideoStream(user.uid, stream);
                        console.log('🎥 Added published stream to recorder for user:', user.uid);
                      }
                    },
                    'user-unpublished': (user, mediaType) => {
                      console.log('📡 User unpublished:', user.uid, mediaType);
                      // Handle when user stops sharing video/audio
                      if (isRecording && mediaType === 'video') {
                        recorder.removeVideoStream(user.uid);
                        console.log('🎥 Removed unpublished stream from recorder for user:', user.uid);
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
                      </label>
                      <input
                        type="email"
                        style={styles.emailInput}
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="client@example.com"
                        disabled={isSendingEmail}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !isSendingEmail) {
                            confirmStopRecording();
                          }
                        }}
                      />
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
                      disabled={isSendingEmail || !recipientEmail.trim()}
                    >
                      {isSendingEmail ? (
                        <>
                          <i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i>
                          Se procesează...
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
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #bbdefb',
    textAlign: 'center',
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
