import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Home1Header from "../home/home-1/header";
import { handleGetFirestore, handleUpdateFirestore } from "../../../utils/firestoreUtils";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";
import "moment/locale/ro";
import dynamic from "next/dynamic";

// Import dinamic pentru AgoraUIKit pentru a evita SSR issues
const AgoraUIKit = dynamic(() => import("agora-react-uikit"), { 
  ssr: false,
  loading: () => <div>Loading video...</div>
});

// Definim layout-ul în mod safe
const LAYOUT_TYPES = {
  grid: 0,
  pin: 1
};
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import RealtimeChat from "../../../components/Chat/RealtimeChat";
import ChatFAB from "../../../components/Chat/ChatFAB";
import { setUserOfflineInChat, monitorConferenceForChatCleanup } from "../../../utils/chatUtils";

moment.locale("ro");

const ConferintaGrupAccess = ({ accessLink }) => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conferinta, setConferinta] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [error, setError] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [participantsOnline, setParticipantsOnline] = useState([]);
  
  // Agora settings
  const appID = "e17715cba7c84bfc9dbd1b5231b6f86f"; // Același App ID ca pentru consultații
  const [isHost, setIsHost] = useState(false); // Pentru conferințe de grup, toată lumea poate fi participant
  const [isPinned, setPinned] = useState(false); // Grid layout pentru grup
  const [isFullscreen, setFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoContainerRef = useRef(null);

  // Clean Agora UIKit implementation

  // Recording states (copied from one-to-one videocall)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [recordingPermission, setRecordingPermission] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const recordingIntervalRef = useRef(null);

  // Conference timing
  const [conferenceStarted, setConferenceStarted] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(null);
  const [adminIsPresent, setAdminIsPresent] = useState(false);

  // Chat states
  const [isChatVisible, setIsChatVisible] = useState(false);
  const chatCleanupMonitorRef = useRef(null);

  // Încarcă CSS-ul Agora doar pe client
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("agora-react-uikit/dist/index.css")
        .then(() => console.log("✅ [VIDEO] CSS Agora încărcat"))
        .catch(err => console.error("💥 [VIDEO] Eroare la încărcarea CSS:", err));
      
      // Nu mai adăugăm CSS custom care să interfereze cu Agora UI Kit
      console.log("🎨 [VIDEO] Lăsăm Agora UI Kit să gestioneze propriile stiluri");
    }
  }, []);

  useEffect(() => {
    if (accessLink) {
      validateAccessAndLoadConference();
    }
  }, [accessLink, currentUser]);

  // Re-evaluează statusul conferinței când se schimbă prezența adminului
  useEffect(() => {
    if (conferinta) {
      console.log("🔄 [EFFECT] Re-evaluare status pentru adminIsPresent:", adminIsPresent);
      checkConferenceTiming(conferinta);
    }
  }, [adminIsPresent, conferinta]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Chat cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (conferinta) {
        const chatId = `conference_${conferinta.documentId}`;
        const userId = currentUser?.uid || `guest_${Date.now()}`;
        await setUserOfflineInChat(chatId, userId);
      }
      
      // Stop chat cleanup monitoring
      if (chatCleanupMonitorRef.current) {
        chatCleanupMonitorRef.current();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Cleanup on component unmount
      handleBeforeUnload();
    };
  }, [conferinta, currentUser]);

  const validateAccessAndLoadConference = async () => {
    try {
      setLoading(true);
      console.log("🔍 [ACCESS] Validare acces pentru link:", accessLink);
      console.log("🔍 [ACCESS] Current user:", currentUser ? "LOGAT" : "NELOGAT");

      if (!accessLink) {
        setError("Link de acces invalid");
        return;
      }

      // Căutăm conferința și participantul cu link-ul unic
      const conferinte = await handleGetFirestore("ConferinteGrup");
      console.log("📦 [ACCESS] Conferințe găsite:", conferinte.length);
      
      let conferintaFound = null;
      let participantFound = null;

      for (const conf of conferinte) {
        const participant = conf.participanti?.find(p => 
          p.uniqueAccessLink === accessLink || p.accessLink === accessLink
        );
        if (participant) {
          conferintaFound = conf;
          participantFound = participant;
          console.log("✅ [ACCESS] Participant găsit:", participant.nume, participant.prenume);
          console.log("✅ [ACCESS] Este guest user:", participant.isGuestUser ? "DA" : "NU");
          break;
        }
      }

      if (!conferintaFound || !participantFound) {
        setError("Link de acces invalid sau expirat");
        return;
      }

      // Verifică dacă participantul este autentificat cu contul corect (doar pentru utilizatori cu cont)
      if (currentUser && participantFound.userId && !participantFound.isGuestUser && participantFound.userId !== currentUser.uid) {
        setError("Acest link nu poate fi accesat cu contul curent");
        return;
      }
      
      // Pentru guest users sau utilizatori neautentificați, permitem accesul direct prin link
      if (!currentUser && participantFound.isGuestUser) {
        console.log("✅ [ACCESS] Guest user acces permis prin link");
      } else if (!currentUser && !participantFound.isGuestUser) {
        console.log("⚠️ [ACCESS] Utilizator neautentificat încearcă să acceseze link-ul unui utilizator cu cont");
        // Permitem accesul oricum, dar logăm pentru monitoring
      }

      // Verifică dacă conferința este activă
      if (conferintaFound.status !== "activa") {
        const statusText = conferintaFound.status === "inactiva" ? "inactivă" : "completată";
        setError(`Această conferință este ${statusText} și nu este disponibilă pentru participare în acest moment.`);
        return;
      }

      setConferinta(conferintaFound);
      setParticipant(participantFound);

      // Start monitoring chat for cleanup
      chatCleanupMonitorRef.current = monitorConferenceForChatCleanup(
        conferintaFound.documentId,
        (chatId) => {
          console.log(`💬 [CHAT] Chat de conferință marcat pentru cleanup: ${chatId}`);
        }
      );

      // Verifică timingul conferinței
      checkConferenceTiming(conferintaFound);

      // Setează prezența participantului
      if (conferintaFound.documentId) {
        const accessLinkToUse = participantFound.uniqueAccessLink || participantFound.accessLink;
        console.log("🔄 [PRESENCE] Setare prezență pentru:", accessLinkToUse);
        await updateParticipantPresence(conferintaFound.documentId, accessLinkToUse, true);
        
        // Ascultă pentru actualizări în timp real
        listenToConferenceUpdates(conferintaFound.documentId);
      }

    } catch (error) {
      console.error("Error validating access:", error);
      setError("Eroare la verificarea accesului");
    } finally {
      setLoading(false);
    }
  };

  const checkConferenceTiming = (conferinta) => {
    // Verificăm dacă conferința este activă ȘI dacă adminul este prezent
    console.log("🔍 [PARTICIPANT] === VERIFICARE STATUS CONFERINȚĂ ===");
    console.log("🔍 [PARTICIPANT] Conference ID:", conferinta.documentId);
    console.log("🔍 [PARTICIPANT] Conference status:", conferinta.status);
    console.log("🔍 [PARTICIPANT] Admin present (state):", adminIsPresent);
    console.log("🔍 [PARTICIPANT] Conference started (state):", conferenceStarted);
    
    if (conferinta.status === "activa" && adminIsPresent) {
      console.log("✅ [PARTICIPANT] Conferința este LIVE - adminul este prezent");
      setConferenceStarted(true);
    } else if (conferinta.status === "activa" && !adminIsPresent) {
      console.log("⏳ [PARTICIPANT] Conferința este activă dar adminul nu a intrat încă");
      setConferenceStarted(false);
    } else {
      console.log("❌ [PARTICIPANT] Conferința nu este activă");
      setConferenceStarted(false);
    }
    
    console.log("🔍 [PARTICIPANT] === SFÂRȘIT VERIFICARE ===");
  };

  const updateParticipantPresence = async (conferintaId, uniqueAccessLink, isPresent) => {
    try {
      const docRef = doc(db, "ConferinteGrupPresence", conferintaId);
      await updateDoc(docRef, {
        [`participants.${uniqueAccessLink}`]: {
          isPresent: isPresent,
          lastSeen: new Date().toISOString(),
          participantData: participant
        }
      });
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  };

  const listenToConferenceUpdates = (conferintaId) => {
    const docRef = doc(db, "ConferinteGrupPresence", conferintaId);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      
      // Verifică participanții online
      if (data?.participants) {
        const onlineParticipants = Object.values(data.participants)
          .filter(p => p.isPresent)
          .map(p => p.participantData);
        setParticipantsOnline(onlineParticipants);
      }
      
      // Verifică dacă adminul este prezent
      const adminPresent = data?.admin?.isPresent || false;
      console.log("👑 [ADMIN PRESENCE] Admin prezent:", adminPresent);
      setAdminIsPresent(adminPresent);
    });

    // Cleanup când componenta se demontează
    return () => {
      const accessLinkToUse = participant?.uniqueAccessLink || participant?.accessLink;
      if (accessLinkToUse) {
        updateParticipantPresence(conferintaId, accessLinkToUse, false);
      }
      unsubscribe();
    };
  };

  const joinConference = () => {
    console.log("🎥 [PARTICIPANT] Se alătură conferinței - Agora va gestiona permisiunile");
    setIsInCall(true);
  };

  const leaveConference = async () => {
    setIsInCall(false);
    
    // Set user offline in chat before leaving
    if (conferinta) {
      const chatId = `conference_${conferinta.documentId}`;
      const userId = currentUser?.uid || `guest_${Date.now()}`;
      await setUserOfflineInChat(chatId, userId);
    }
    
    if (conferinta && participant) {
      const accessLinkToUse = participant.uniqueAccessLink || participant.accessLink;
      if (accessLinkToUse) {
        await updateParticipantPresence(conferinta.documentId, accessLinkToUse, false);
      }
    }
  };

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

  // Recording functions (adapted from one-to-one videocall)
  const startRecording = async () => {
    try {
      setRecordingError("");
      
      // Check if participant consented to recording
      if (!recordingPermission) {
        setShowRecordingModal(true);
        return;
      }

      const response = await fetch('/api/recording/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: conferinta.documentId,
          meetingCode: `group_${conferinta.documentId}`,
          userRole: 'participant'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsRecording(true);
        setRecordingStartTime(Date.now());
        
        // Start recording duration timer
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);

        // Update recording status in Firebase (ConferinteGrup instead of RezervariConsultatii)
        if (conferinta.documentId) {
          const docRef = doc(db, "ConferinteGrup", conferinta.documentId);
          await updateDoc(docRef, {
            recording: {
              isRecording: true,
              startTime: Date.now(),
              resourceId: data.resourceId,
              sid: data.sid
            }
          });
        }
      } else {
        setRecordingError(data.message || "Eroare la pornirea înregistrării");
      }
    } catch (error) {
      console.error("Recording start error:", error);
      setRecordingError("Eroare la pornirea înregistrării");
    }
  };

  const stopRecording = async () => {
    try {
      setRecordingError("");
      
      const response = await fetch('/api/recording/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: conferinta.documentId,
          meetingCode: `group_${conferinta.documentId}`,
          userRole: 'participant'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsRecording(false);
        setRecordingStartTime(null);
        setRecordingDuration(0);
        
        // Clear recording timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        // Update recording status in Firebase
        if (conferinta.documentId) {
          const docRef = doc(db, "ConferinteGrup", conferinta.documentId);
          await updateDoc(docRef, {
            recording: {
              isRecording: false,
              endTime: Date.now(),
              processingStatus: 'processing'
            }
          });
        }
      } else {
        setRecordingError(data.message || "Eroare la oprirea înregistrării");
      }
    } catch (error) {
      console.error("Recording stop error:", error);
      setRecordingError("Eroare la oprirea înregistrării");
    }
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

  const formatDataDisplay = (conferinta) => {
    if (conferinta.tipConferinta === "course") {
      return {
        dataRange: `${moment(conferinta.dataInceput).format("DD MMMM YYYY")} - ${moment(conferinta.dataFinal).format("DD MMMM YYYY")}`,
        oraRange: `${conferinta.oraInceput} - ${conferinta.oraFinal}`,
        type: "Curs"
      };
    } else {
      return {
        dataRange: moment(conferinta.dataInceput).format("DD MMMM YYYY"),
        oraRange: conferinta.oraInceput,
        type: "Conferință"
      };
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Home1Header />
        <div className="content">
          <div className="container">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Verificare acces...</span>
              </div>
              <p className="mt-3">Se verifică accesul la conferință...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Home1Header />
        <div className="content">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="text-center py-5">
                  <i className="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                  <h3>Acces restricționat</h3>
                  <p className="text-muted mb-4">{error}</p>
                  <Link href="/calendar-conferinte-grup" className="btn btn-primary">
                    Vezi Conferințele Disponibile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const displayInfo = formatDataDisplay(conferinta);

  // Conference in progress - show Agora UIKit interface with recording controls
  if (isInCall && conferenceStarted) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <AgoraUIKit
          rtcProps={{
            appId: appID,
            channel: conferinta.documentId,
            token: null,
            role: "host",
          }}
          styleProps={{
            UIKitContainer: {
              width: '100vw',
              height: '100vh',
            },
          }}
          callbacks={{
            EndCall: leaveConference,
          }}
        />
        
        {/* Recording Controls */}
        <div style={recordingControlsStyle}>
          <button
            style={{
              ...recordButtonStyle,
              backgroundColor: isRecording ? "#ff4757" : "#e74c3c",
              animation: isRecording ? "pulse 2s infinite" : "none",
            }}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? "Oprește înregistrarea" : "Începe înregistrarea"}
          >
            <i className={`fas ${isRecording ? "fa-stop-circle" : "fa-circle"}`} />
          </button>
          
          {isRecording && (
            <div style={recordingInfoStyle}>
              <div style={recordingIndicatorStyle}>
                <div style={recordingDotStyle}></div>
                <span>REC</span>
              </div>
              <div style={recordingTimeStyle}>
                {formatRecordingTime(recordingDuration)}
              </div>
            </div>
          )}
        </div>

        {/* Recording Permission Modal */}
        {showRecordingModal && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div style={modalHeaderStyle}>
                <h3>Consimțământ pentru înregistrare</h3>
                <i className="fas fa-video" style={modalIconStyle}></i>
              </div>
              <div style={modalContentStyle}>
                <p>
                  Această conferință va fi înregistrată pentru scopuri de documentare și pentru a putea fi revizuită ulterior.
                </p>
                <p>
                  <strong>Înregistrarea va conține:</strong>
                </p>
                <ul style={modalListStyle}>
                  <li>Video și audio din întreaga conversație</li>
                  <li>Ecranul partajat (dacă este cazul)</li>
                  <li>Toate interacțiunile din timpul conferinței</li>
                </ul>
                <p>
                  <strong>Confidențialitate:</strong> Înregistrarea va fi stocată securizat și va fi accesibilă doar participanților la conferință.
                </p>
              </div>
              <div style={modalFooterStyle}>
                <button
                  style={modalButtonDeclineStyle}
                  onClick={() => handleRecordingPermission(false)}
                >
                  Nu permit înregistrarea
                </button>
                <button
                  style={modalButtonAcceptStyle}
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
          <div style={errorNotificationStyle}>
            <i className="fas fa-exclamation-triangle"></i>
            <span>{recordingError}</span>
            <button
              style={errorCloseButtonStyle}
              onClick={() => setRecordingError("")}
            >
              ✕
            </button>
          </div>
        )}

        {/* Chat Components */}
        <ChatFAB
          meetingId={conferinta.documentId}
          meetingType="conference"
          onToggleChat={() => setIsChatVisible(!isChatVisible)}
          isChatVisible={isChatVisible}
        />

        <RealtimeChat
          meetingId={conferinta.documentId}
          meetingType="conference"
          participantData={participant}
          isVisible={isChatVisible}
          onToggle={() => setIsChatVisible(!isChatVisible)}
          onClose={() => setIsChatVisible(false)}
        />
      </div>
    );
  }

  // Waiting room - conference not started yet
  return (
    <>
      <Home1Header />
      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center mb-4">
                <h2 className="text-primary">{conferinta.titlu}</h2>
                <span className={`badge ${
                  displayInfo.type === "Curs" ? "bg-info" : "bg-primary"
                } fs-6`}>
                  {displayInfo.type}
                </span>
              </div>

              <div className="card shadow-sm">
                <div className="card-body text-center p-5">
                  {conferinta.status !== "activa" ? (
                    <>
                      <i className="fa fa-clock fa-3x text-warning mb-3"></i>
                      <h3>Conferința nu este activă</h3>
                      <p className="text-muted mb-4">
                        Conferința nu a fost încă activată de către organizator.
                      </p>
                      <div className="mt-4">
                        <p><strong>Data:</strong> {displayInfo.dataRange}</p>
                        <p><strong>Ora:</strong> {displayInfo.oraRange}</p>
                      </div>
                    </>
                  ) : !adminIsPresent ? (
                    <>
                      <i className="fa fa-hourglass-half fa-3x text-warning mb-3"></i>
                      <h3>În așteptarea organizatorului</h3>
                      <p className="text-muted mb-4">
                        Conferința este activă, dar organizatorul nu a intrat încă în sesiune.
                        Vei putea să te alături când organizatorul începe conferința.
                      </p>
                      
                      {participantsOnline.length > 0 && (
                        <div className="mb-4">
                          <p className="text-info">
                            <i className="fa fa-users me-2"></i>
                            {participantsOnline.length} participanți așteaptă, la fel ca tine
                          </p>
                        </div>
                      )}
                      
                      <div className="alert alert-info">
                        <i className="fa fa-info-circle me-2"></i>
                        Această pagină se va actualiza automat când organizatorul începe conferința.
                      </div>
                    </>
                  ) : conferenceStarted ? (
                    <>
                      <i className="fa fa-video fa-3x text-success mb-3"></i>
                      <h3>Conferința este live!</h3>
                      <p className="text-muted mb-4">
                        Organizatorul a început conferința. Ești gata să participi la {conferinta.titlu}?
                      </p>
                      
                      {participantsOnline.length > 0 && (
                        <div className="mb-4">
                          <p className="text-success">
                            <i className="fa fa-users me-2"></i>
                            {participantsOnline.length} participanți sunt deja online
                          </p>
                        </div>
                      )}

                      <button
                        className="btn btn-success btn-lg"
                        onClick={joinConference}
                      >
                        <i className="fa fa-video me-2"></i>
                        Alătură-te Conferinței
                      </button>
                    </>
                  ) : null}

                  {!currentUser && participant?.isGuestUser && (
                    <div className="alert alert-info mt-4">
                      <i className="fa fa-info-circle me-2"></i>
                      <strong>Acces ca vizitator:</strong> Participi la această conferință fără să ai nevoie de cont. 
                      Link-ul tău de acces este unic și securizat.
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-top">
                    <div className="row text-start">
                      <div className="col-md-6">
                        <h6 className="text-primary">Participant:</h6>
                        <p>{participant?.nume} {participant?.prenume}</p>
                        <p className="text-muted">{participant?.email}</p>
                        {participant?.isGuestUser && (
                          <small className="text-info">
                            <i className="fa fa-user-o me-1"></i>
                            Participant vizitator
                          </small>
                        )}
                      </div>
                      <div className="col-md-6">
                        <h6 className="text-primary">Detalii conferință:</h6>
                        <div 
                          style={{ lineHeight: '1.6' }}
                          dangerouslySetInnerHTML={{ 
                            __html: conferinta.descriere?.includes('<') ? conferinta.descriere : `<p>${conferinta.descriere || ''}</p>`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <Link 
                  href="/calendar-conferinte-grup"
                  className="btn btn-outline-primary"
                >
                  <i className="fa fa-arrow-left me-2"></i>
                  Înapoi la Conferințe
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Recording styles - positioned top-right
const recordingControlsStyle = {
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
};

const recordButtonStyle = {
  backgroundColor: "#e74c3c",
  color: "#ffffff",
  border: "none",
  borderRadius: "50%",
  width: "50px",
  height: "50px",
  fontSize: "18px",
  cursor: "pointer",
  marginRight: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s ease",
};

const recordingInfoStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const recordingIndicatorStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
};

const recordingDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  backgroundColor: "#ff4757",
  animation: "blink 1s infinite",
};

const recordingTimeStyle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#ffffff",
};

const modalOverlayStyle = {
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
};

const modalStyle = {
  backgroundColor: "#ffffff",
  padding: "30px",
  borderRadius: "12px",
  maxWidth: "500px",
  width: "90%",
  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "center",
  marginBottom: "20px",
  borderBottom: "2px solid #f0f0f0",
  paddingBottom: "15px",
};

const modalIconStyle = {
  fontSize: "28px",
  marginRight: "15px",
  color: "#e74c3c",
};

const modalContentStyle = {
  marginBottom: "25px",
  lineHeight: "1.6",
};

const modalListStyle = {
  listStyleType: "disc",
  paddingLeft: "20px",
  margin: "15px 0",
};

const modalFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "15px",
};

const modalButtonDeclineStyle = {
  backgroundColor: "#6c757d",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  padding: "12px 24px",
  cursor: "pointer",
  fontSize: "16px",
  flex: 1,
};

const modalButtonAcceptStyle = {
  backgroundColor: "#28a745",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  padding: "12px 24px",
  cursor: "pointer",
  fontSize: "16px",
  flex: 1,
};

const errorNotificationStyle = {
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
};

const errorCloseButtonStyle = {
  backgroundColor: "transparent",
  border: "none",
  color: "#ffffff",
  fontSize: "18px",
  cursor: "pointer",
  marginLeft: "10px",
};

export default ConferintaGrupAccess; 