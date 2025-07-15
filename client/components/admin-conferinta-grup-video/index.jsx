import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Home1Header from "../home/home-1/header";
import { handleGetFirestore } from "../../../utils/firestoreUtils";
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

const AdminConferintaGrupVideo = ({ conferenceId }) => {
  console.log("🏗️ [ADMIN VIDEO] Componenta se inițializează cu conferenceId:", conferenceId);
  
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conferinta, setConferinta] = useState(null);
  const [error, setError] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [participantsOnline, setParticipantsOnline] = useState([]);

  console.log("🏗️ [ADMIN VIDEO] State inițial - loading:", loading, "error:", error);
  
  // Agora settings pentru admin (HOST)
  const appID = "e17715cba7c84bfc9dbd1b5231b6f86f";
  const [isHost, setIsHost] = useState(true); // Admin este întotdeauna HOST
  const [isPinned, setPinned] = useState(false); // Grid layout pentru grup
  const [isFullscreen, setFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoContainerRef = useRef(null);

  // Minimal state pentru Agora UIKit

  // Recording states (copied from one-to-one videocall)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [recordingPermission, setRecordingPermission] = useState(true); // Admin has default permission
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const recordingIntervalRef = useRef(null);

  // Clean Agora UIKit implementation

  // Conference timing
  const [conferenceStarted, setConferenceStarted] = useState(false);

  // Încarcă CSS-ul Agora doar pe client
  useEffect(() => {
    console.log("🎨 [ADMIN VIDEO] Încarcă CSS-ul Agora...");
    if (typeof window !== "undefined") {
      console.log("🎨 [ADMIN VIDEO] Window disponibil, încarcă CSS...");
      import("agora-react-uikit/dist/index.css")
        .then(() => console.log("✅ [ADMIN VIDEO] CSS Agora încărcat"))
        .catch(err => console.error("💥 [ADMIN VIDEO] Eroare la încărcarea CSS:", err));
    } else {
      console.log("⚠️ [ADMIN VIDEO] Window nu este disponibil pentru CSS");
    }
  }, []);

  // Timeout pentru debugging - dacă loading durează prea mult
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log("⏰ [ADMIN VIDEO] TIMEOUT: Loading durează prea mult (10 secunde)");
        console.log("⏰ [ADMIN VIDEO] State curent:", {
          loading,
          error,
          conferinta: conferinta ? "DA" : "NU",
          currentUser: currentUser ? "DA" : "NU",
          userData: userData ? "DA" : "NU"
        });
      }
    }, 10000); // 10 secunde

    return () => clearTimeout(timeout);
  }, [loading, error, conferinta, currentUser, userData]);

  // Check admin access
  useEffect(() => {
    console.log("🚀 [ADMIN VIDEO] useEffect pentru verificarea accesului...");
    console.log("🚀 [ADMIN VIDEO] currentUser:", currentUser ? "DA" : "NU");
    console.log("🚀 [ADMIN VIDEO] userData:", userData ? "DA" : "NU");
    console.log("🚀 [ADMIN VIDEO] conferenceId:", conferenceId);

    if (!currentUser) {
      console.log("❌ [ADMIN VIDEO] Utilizator neautentificat");
      setError("Trebuie să fii autentificat ca admin");
      return;
    }

    // Verifică dacă utilizatorul este admin - folosim direct UID-ul din currentUser
    const adminUIDs = [
      "zFsAwNZA5bUonVRIQzRn2HZB3y62", // UID-ul tău de admin
      "BhJZdiWVQJNnbLOCGWxzjGHVjHB2", // Alt UID admin dacă există
    ];

    console.log("🔐 [ADMIN VIDEO] Verifică UID admin:", currentUser.uid);
    console.log("🔐 [ADMIN VIDEO] UIDs admin permise:", adminUIDs);

    if (!adminUIDs.includes(currentUser.uid)) {
      console.log("❌ [ADMIN VIDEO] UID nu este în lista de admin");
      setError("Acces restricționat. Doar adminii pot accesa această pagină.");
      return;
    }

    console.log("✅ [ADMIN VIDEO] Utilizator admin verificat");

    // Creăm userData pentru admin dacă nu există
    if (!userData) {
      console.log("🔧 [ADMIN VIDEO] Creez userData pentru admin...");
      const adminUserData = {
        nume: currentUser.displayName || "Admin",
        email: currentUser.email || "admin@site.com",
        owner_uid: currentUser.uid,
        role: "admin"
      };
      console.log("🔧 [ADMIN VIDEO] AdminUserData creat:", adminUserData);
      // Nu setăm userData în context pentru a nu afecta alte părți ale aplicației
      // Doar continuăm cu încărcarea conferinței
    }

    if (conferenceId) {
      console.log("🎯 [ADMIN VIDEO] Pornește încărcarea datelor pentru conferința:", conferenceId);
      loadConferenceData();
    } else {
      console.log("⚠️ [ADMIN VIDEO] Nu există conferenceId");
    }
  }, [conferenceId, currentUser]); // Am eliminat userData din dependențe

  // Funcție separată pentru debugging - forțează încărcarea dacă nu se întâmplă
  useEffect(() => {
    const debugTimeout = setTimeout(() => {
      if (loading && conferenceId && currentUser) {
        console.log("🚨 [DEBUG] Forțez reîncărcarea după 5 secunde...");
        loadConferenceData();
      }
    }, 5000);

    return () => clearTimeout(debugTimeout);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadConferenceData = async () => {
    try {
      console.log("🔍 [ADMIN VIDEO] === ÎNCEPE ÎNCĂRCAREA ===");
      setLoading(true);
      
      console.log("🔍 [ADMIN VIDEO] Parametri:", {
        conferenceId,
        handleGetFirestore: typeof handleGetFirestore,
        currentUser: currentUser?.uid,
        userDisplayName: currentUser?.displayName,
        userEmail: currentUser?.email
      });

      if (!conferenceId) {
        throw new Error("Conference ID lipsește");
      }

      if (typeof handleGetFirestore !== 'function') {
        throw new Error("handleGetFirestore nu este o funcție");
      }

      console.log("📥 [ADMIN VIDEO] Apelează Firestore...");
      const startTime = Date.now();
      
      const conferinte = await handleGetFirestore("ConferinteGrup");
      
      const endTime = Date.now();
      console.log("📦 [ADMIN VIDEO] Firestore răspuns în", endTime - startTime, "ms");
      console.log("📦 [ADMIN VIDEO] Conferințe găsite:", conferinte?.length || 0);

      if (!conferinte || !Array.isArray(conferinte)) {
        throw new Error("Date invalide din Firestore");
      }

      console.log("🔍 [ADMIN VIDEO] Caută conferința cu ID:", conferenceId);
      console.log("🔍 [ADMIN VIDEO] IDs disponibile:", conferinte.map(c => c.documentId));

      const conferintaFound = conferinte.find(c => c.documentId === conferenceId);
      
      if (!conferintaFound) {
        throw new Error(`Conferința cu ID ${conferenceId} nu a fost găsită`);
      }

      console.log("✅ [ADMIN VIDEO] Conferința găsită:", conferintaFound.titlu);
      setConferinta(conferintaFound);
      setConferenceStarted(true); // Simplificat pentru debug

      // Ascultă pentru actualizări în timp real
      console.log("🔗 [ADMIN VIDEO] Inițializează ascultarea actualizărilor...");
      listenToConferenceUpdates(conferenceId);

      console.log("🎉 [ADMIN VIDEO] === ÎNCĂRCARE COMPLETĂ ===");

    } catch (error) {
      console.error("💥 [ADMIN VIDEO] === EROARE ÎNCĂRCARE ===");
      console.error("💥 [ADMIN VIDEO] Tip eroare:", error.constructor.name);
      console.error("💥 [ADMIN VIDEO] Mesaj:", error.message);
      console.error("💥 [ADMIN VIDEO] Stack:", error.stack);
      setError(`Eroare: ${error.message}`);
    } finally {
      console.log("🏁 [ADMIN VIDEO] Finalizează loading");
      setLoading(false);
    }
  };

  const checkConferenceStatus = (conferinta) => {
    console.log("🔍 [ADMIN STATUS] Verificare status conferință pentru admin...");
    console.log("🔍 [ADMIN STATUS] Conference status:", conferinta.status);
    
    // Noua logică: adminul poate accesa oricând, dar doar conferințele active sunt funcționale
    if (conferinta.status === "activa") {
      console.log("✅ [ADMIN STATUS] Conferința este activă - access complet");
      setConferenceStarted(true);
    } else {
      console.log("⚠️ [ADMIN STATUS] Conferința nu este activă - access admin pentru activare");
      setConferenceStarted(true); // Admin poate accesa pentru activare
    }
  };

  const updateAdminPresence = async (conferintaId, isPresent) => {
    try {
      const docRef = doc(db, "ConferinteGrupPresence", conferintaId);
      
      // Creăm datele admin local dacă userData nu există
      const adminData = {
        name: userData?.nume || currentUser?.displayName || "Admin",
        email: userData?.email || currentUser?.email || "admin@site.com",
        role: "host"
      };
      
      // Încercăm să facem update, dacă documentul nu există, folosim setDoc
      try {
        await updateDoc(docRef, {
          [`admin`]: {
            isPresent: isPresent,
            lastSeen: new Date().toISOString(),
            joinedAt: isPresent ? new Date().toISOString() : null,
            adminData: adminData
          }
        });
      } catch (updateError) {
        // Dacă updateDoc eșuează (document inexistent), creăm documentul
        console.log("📝 [ADMIN PRESENCE] Document nu există, îl creez...");
        const { setDoc } = await import("firebase/firestore");
        await setDoc(docRef, {
          admin: {
            isPresent: isPresent,
            lastSeen: new Date().toISOString(),
            joinedAt: isPresent ? new Date().toISOString() : null,
            adminData: adminData
          },
          participants: {}
        });
      }
      
      console.log(`🔄 [ADMIN PRESENCE] Admin presence updated: ${isPresent}`);
      console.log(`🔄 [ADMIN PRESENCE] Admin data used:`, adminData);
    } catch (error) {
      console.error("💥 [ADMIN PRESENCE] Error updating admin presence:", error);
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
        console.log(`👥 [PARTICIPANTS] ${onlineParticipants.length} participanți online`);
      }
    });

    // Cleanup când componenta se demontează
    return () => {
      updateAdminPresence(conferintaId, false);
      unsubscribe();
    };
  };

  const joinConference = async () => {
    console.log("🎥 [ADMIN] Admin se alătură conferinței - Agora va gestiona permisiunile");
    
    // Marchează adminul ca prezent în Firestore
    if (conferinta) {
      await updateAdminPresence(conferinta.documentId, true);
    }
    
    setIsInCall(true);
  };

  const leaveConference = async () => {
    console.log("🚪 [ADMIN] Admin părăsește conferința");
    setIsInCall(false);
    if (conferinta) {
      await updateAdminPresence(conferinta.documentId, false);
    }
    // Redirecționez înapoi la panoul de administrare
    router.push("/admin-conferinte-grup");
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

  // Recording functions (adapted from one-to-one videocall for admin)
  const startRecording = async () => {
    try {
      setRecordingError("");

      const response = await fetch('/api/recording/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: conferinta.documentId,
          meetingCode: `group_${conferinta.documentId}`,
          userRole: 'admin'
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
          userRole: 'admin'
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

  const isConferenceActive = (conferinta) => {
    // Noua logică: doar statusul contează
    return conferinta.status === "activa";
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
        <div className="content" style={{ paddingTop: "100px" }}>
          <div className="container">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Se încarcă conferința...</span>
              </div>
              <p className="mt-3">Se încarcă datele conferinței...</p>
         
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
        <div className="content" style={{ paddingTop: "100px" }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="text-center py-5">
                  <i className="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                  <h3>Acces restricționat</h3>
                  <p className="text-muted mb-4">{error}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => router.push("/admin-conferinte-grup")}
                  >
                    Înapoi la Administrare
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const displayInfo = formatDataDisplay(conferinta);

  // Admin in video call - show Agora UIKit interface with recording controls
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
        
        {/* Recording Controls for Admin */}
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
      </div>
    );
  }

  // Admin waiting room - ready to start conference
  return (
    <>
      <Home1Header />
      <div className="content" style={{ paddingTop: "100px" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card shadow-lg">
                <div className="card-header bg-primary text-white text-center">
                  <h3 className="mb-0">
                    <i className="fa fa-video me-2"></i>
                    Conferință de Grup - Acces Admin
                    {!isConferenceActive(conferinta) && (
                      <span className="badge bg-danger ms-2">
                        {conferinta.status === "inactiva" ? "INACTIVĂ" : "COMPLETATĂ"}
                      </span>
                    )}
                  </h3>
                </div>
                <div className="card-body text-center py-5">
                  <div className="mb-4">
                    <div className="badge bg-success fs-6 mb-3">
                      {displayInfo.type}
                    </div>
                    <h2 className="text-primary">{conferinta.titlu}</h2>
                    <div 
                      className="text-muted"
                      style={{ lineHeight: '1.6' }}
                      dangerouslySetInnerHTML={{ 
                        __html: conferinta.descriere?.includes('<') ? conferinta.descriere : `<p>${conferinta.descriere || ''}</p>`
                      }}
                    />
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body">
                          <i className="fa fa-calendar fa-2x text-primary mb-2"></i>
                          <h6>Data & Ora</h6>
                          <p className="mb-0">{displayInfo.dataRange}</p>
                          <p className="mb-0">{displayInfo.oraRange}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body">
                          <i className="fa fa-users fa-2x text-success mb-2"></i>
                          <h6>Participanți</h6>
                          <p className="mb-0">{conferinta.participanti?.length || 0} înregistrați</p>
                          <p className="mb-0 text-success">{participantsOnline.length} online acum</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {conferenceStarted ? (
                    <>
                      <i className="fa fa-video fa-3x text-success mb-3"></i>
                      <h3>Gata să începi conferința!</h3>
                      <p className="text-muted mb-4">
                        Vei intra ca <strong>HOST</strong> și vei putea modera conferința.
                        {!isConferenceActive(conferinta) && (
                          <>
                            <br />
                            <span className="text-warning">
                              <i className="fa fa-exclamation-triangle me-1"></i>
                              <strong>ATENȚIE:</strong> Conferința este marcată ca {conferinta.status === "inactiva" ? "INACTIVĂ" : "COMPLETATĂ"}. Utilizatorii nu pot participa momentan.
                            </span>
                          </>
                        )}
                      </p>
                      
                      {participantsOnline.length > 0 && (
                        <div className="mb-4">
                          <p className="text-success">
                            <i className="fa fa-users me-2"></i>
                            {participantsOnline.length} participanți te așteaptă deja!
                          </p>
                        </div>
                      )}

                      <button
                        className="btn btn-success btn-lg"
                        onClick={joinConference}
                      >
                        <i className="fa fa-video me-2"></i>
                        Începe Conferința ca HOST
                      </button>
                    </>
                  ) : (
                    <>
                      <i className="fa fa-clock fa-3x text-warning mb-3"></i>
                      <h3>Conferința nu este încă activă</h3>
                      <p className="text-muted">
                        Conferința poate fi accesată cu 30 de minute înainte de ora programată.
                      </p>
                    </>
                  )}

                  <div className="mt-4 pt-4 border-top">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => router.push("/admin-conferinte-grup")}
                    >
                      <i className="fa fa-arrow-left me-2"></i>
                      Înapoi la Administrare
                    </button>
                  </div>
                </div>
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

export default AdminConferintaGrupVideo; 