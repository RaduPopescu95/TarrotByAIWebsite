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

  // Enhanced controls
  const [showParticipants, setShowParticipants] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // Logging pentru starea inițială
  useEffect(() => {
    console.log("🎥 [INIT] Stare inițială video:", cameraEnabled);
    console.log("🎵 [INIT] Stare inițială audio:", micEnabled);
  }, []);

  // Logging pentru schimbările de stare
  useEffect(() => {
    console.log("🎥 [STATE] Cameră activată:", cameraEnabled);
  }, [cameraEnabled]);

  useEffect(() => {
    console.log("🎵 [STATE] Microfon activat:", micEnabled);
  }, [micEnabled]);

  // Conference timing
  const [conferenceStarted, setConferenceStarted] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(null);

  // Încarcă CSS-ul Agora doar pe client
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("agora-react-uikit/dist/index.css");
    }
  }, []);

  useEffect(() => {
    if (accessLink) {
      validateAccessAndLoadConference();
    }
  }, [accessLink, currentUser]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    // Noua logică: dacă conferința este activă, utilizatorii pot participa oricând
    // Nu mai verificăm timpul, doar statusul (care a fost deja verificat)
    console.log("✅ [PARTICIPANT] Conferința este activă - utilizatorul poate participa");
    setConferenceStarted(true);
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
      if (data?.participants) {
        const onlineParticipants = Object.values(data.participants)
          .filter(p => p.isPresent)
          .map(p => p.participantData);
        setParticipantsOnline(onlineParticipants);
      }
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

  const joinConference = async () => {
    try {
      // Verificăm și cerem permisiuni pentru cameră și microfon
      console.log("🎥 [PERMISSIONS] Verificare permisiuni cameră și microfon...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: cameraEnabled, 
        audio: micEnabled 
      });
      
      console.log("✅ [PERMISSIONS] Permisiuni obținute cu succes");
      console.log("🎥 [PERMISSIONS] Video tracks:", stream.getVideoTracks().length);
      console.log("🎵 [PERMISSIONS] Audio tracks:", stream.getAudioTracks().length);
      
      // Oprim stream-ul temporar pentru că Agora va gestiona propriul stream
      stream.getTracks().forEach(track => track.stop());
      
      setIsInCall(true);
    } catch (error) {
      console.error("❌ [PERMISSIONS] Eroare la obținerea permisiunilor:", error);
      alert("Pentru a participa la conferință, trebuie să accepți permisiunile pentru cameră și microfon. Te rugăm să reîmprospătezi pagina și să accepți permisiunile.");
    }
  };

  const leaveConference = async () => {
    setIsInCall(false);
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

  // Conference in progress - show video interface
  if (isInCall && conferenceStarted) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }} ref={videoContainerRef}>
          {/* Enhanced Control Panel */}
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 1000,
            display: "flex",
            gap: "10px"
          }}>
            {/* Participants Panel Toggle */}
            <button
              style={{
                background: showParticipants ? "#007bff" : "rgba(0,0,0,0.7)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                width: "50px",
                height: "50px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => setShowParticipants(!showParticipants)}
              title="Vizualizare Participanți"
            >
              <i className="fas fa-users" />
            </button>

            {/* Layout Toggle */}
            <button
              style={{
                background: "rgba(0,0,0,0.7)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                width: "50px",
                height: "50px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => setPinned(!isPinned)}
              title={isPinned ? "Grid View" : "Speaker View"}
            >
              <i className={`fas ${isPinned ? "fa-th-large" : "fa-thumbtack"}`} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              style={{
                background: "rgba(0,0,0,0.7)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                width: "50px",
                height: "50px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              <i className={`fas ${isFullscreen ? "fa-compress" : "fa-expand"}`} />
            </button>
          </div>

          {/* Participants Sidebar */}
          {showParticipants && (
            <div style={{
              position: "absolute",
              top: "0",
              right: "0",
              width: "300px",
              height: "100%",
              background: "rgba(0,0,0,0.9)",
              color: "white",
              zIndex: 999,
              overflowY: "auto",
              padding: "20px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                paddingBottom: "10px"
              }}>
                <h5 style={{ margin: 0 }}>
                  <i className="fa fa-users me-2"></i>
                  Participanți ({participantsOnline.length})
                </h5>
                <button
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "16px"
                  }}
                  onClick={() => setShowParticipants(false)}
                >
                  <i className="fa fa-times" />
                </button>
              </div>
              
              <div>
                {participantsOnline.map((p, index) => (
                  <div key={index} style={{
                    padding: "10px",
                    marginBottom: "10px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#007bff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold"
                    }}>
                      {p.nume?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                        {p.nume || "Participant"}
                      </div>
                      <div style={{ fontSize: "12px", opacity: 0.7 }}>
                        {p.email}
                      </div>
                    </div>
                  </div>
                ))}
                
                {participantsOnline.length === 0 && (
                  <div style={{
                    textAlign: "center",
                    opacity: 0.7,
                    padding: "20px"
                  }}>
                    Nu sunt participanți online
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conference info overlay */}
          <div style={{
            position: "absolute",
            top: "100px",
            left: "20px",
            zIndex: 1000,
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "15px 20px",
            borderRadius: "8px",
            fontSize: "14px"
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
              {conferinta.titlu}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <span>
                <i className="fa fa-users me-1"></i>
                {participantsOnline.length} participanți
              </span>
              <span>
                <i className="fa fa-clock me-1"></i>
                Live
              </span>
            </div>
          </div>

          {/* Enhanced Bottom Controls */}
          <div style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            gap: "15px",
            alignItems: "center"
          }}>
            {/* Camera Control */}
            <button
              style={{
                background: cameraEnabled ? "rgba(0,0,0,0.7)" : "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => {
                console.log("🎥 [CAMERA] Schimbare stare cameră:", !cameraEnabled);
                setCameraEnabled(!cameraEnabled);
              }}
              title={cameraEnabled ? "Dezactivează Camera" : "Activează Camera"}
            >
              <i className={`fa ${cameraEnabled ? "fa-video" : "fa-video-slash"}`} />
            </button>

            {/* Microphone Control */}
            <button
              style={{
                background: micEnabled ? "rgba(0,0,0,0.7)" : "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                cursor: "cursor",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => {
                console.log("🎵 [MIC] Schimbare stare microfon:", !micEnabled);
                setMicEnabled(!micEnabled);
              }}
              title={micEnabled ? "Dezactivează Microfonul" : "Activează Microfonul"}
            >
              <i className={`fa ${micEnabled ? "fa-microphone" : "fa-microphone-slash"}`} />
            </button>

            {/* Screen Share (pentru admin sau pe request) */}
            <button
              style={{
                background: screenSharing ? "#28a745" : "rgba(0,0,0,0.7)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => setScreenSharing(!screenSharing)}
              title="Partajare Ecran"
            >
              <i className="fa fa-desktop" />
            </button>

            {/* Leave Call */}
            <button
              style={{
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "25px",
                padding: "12px 20px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold"
              }}
              onClick={leaveConference}
            >
              <i className="fa fa-phone-slash me-2"></i>
              Părăsește
            </button>
          </div>

          <AgoraUIKit
            rtcProps={{
              appId: appID,
              channel: conferinta.documentId,
              token: null,
              role: "host", // Toți participanții sunt host pentru a putea publica video/audio
              layout: isPinned ? LAYOUT_TYPES.pin : LAYOUT_TYPES.grid,
              enableScreensharing: screenSharing,
              enableVideo: cameraEnabled,
              enableAudio: micEnabled,
              videoMode: {
                max: "cover",
                min: "contain",
              },
              // Configurații suplimentare pentru debugging
              dual: false,
              activeSpeaker: true,
            }}
            styleProps={{
              localBtnContainer: {
                display: "none" // Ascundem controalele default pentru a folosi pe ale noastre
              },
              maxViewRemoteBtnContainer: {
                display: "none"
              },
            }}
            callbacks={{
              EndCall: leaveConference,
              'rtc-sdk': {
                onUserJoined: (uid) => {
                  console.log("🎥 [AGORA] User joined:", uid);
                },
                onUserLeft: (uid) => {
                  console.log("🎥 [AGORA] User left:", uid);
                },
                onConnectionStateChanged: (curState, revState) => {
                  console.log("🎥 [AGORA] Connection state changed:", curState, revState);
                }
              }
            }}
          />
        </div>
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
                  {timeUntilStart && !conferenceStarted ? (
                    <>
                      <i className="fa fa-clock fa-3x text-warning mb-3"></i>
                      <h3>Conferința nu a început încă</h3>
                      <p className="text-muted mb-4">
                        {displayInfo.type === "Curs" 
                          ? "Următoarea sesiune începe în:"
                          : "Conferința începe în:"
                        }
                      </p>
                      <div className="countdown">
                        <h2 className="text-primary">
                          {moment.duration(timeUntilStart).humanize()}
                        </h2>
                      </div>
                      <div className="mt-4">
                        <p><strong>Data:</strong> {displayInfo.dataRange}</p>
                        <p><strong>Ora:</strong> {displayInfo.oraRange}</p>
                      </div>
                    </>
                  ) : conferenceStarted ? (
                    <>
                      <i className="fa fa-video fa-3x text-success mb-3"></i>
                      <h3>Conferința este live!</h3>
                      <p className="text-muted mb-4">
                        Ești gata să participi la {conferinta.titlu}?
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
                        <p>{conferinta.descriere}</p>
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

export default ConferintaGrupAccess; 