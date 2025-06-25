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

// Import chat components - TEMPORAR DEZACTIVAT
// import ChatPanel from "../../../components/Chat/ChatPanel";
// import useAgoraRTM from "../../../utils/useAgoraRTM";

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

  // Chat state - TEMPORAR DEZACTIVAT
  // const [chatVisible, setChatVisible] = useState(true);
  // const [username, setUsername] = useState('');

  // RTM Chat hook - TEMPORAR DEZACTIVAT
  /*
  const {
    messages,
    isConnected: chatConnected,
    loading: chatLoading,
    error: chatError,
    connect: connectChat,
    disconnect: disconnectChat,
    sendMessage,
    isReady: chatReady
  } = useAgoraRTM({
    appId: appID,
    channelName: conferinta?.documentId || '',
    username: username,
    onMessage: (message) => {
      console.log("📧 [CHAT] Mesaj nou primit:", message);
    }
  });
  */

  // Clean Agora UIKit implementation

  // Conference timing
  const [conferenceStarted, setConferenceStarted] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(null);
  const [adminIsPresent, setAdminIsPresent] = useState(false);

  // Set username based on participant data - TEMPORAR DEZACTIVAT
  /*
  useEffect(() => {
    if (participant && participant.nume && participant.prenume) {
      const fullName = `${participant.nume} ${participant.prenume}`;
      setUsername(fullName);
      console.log("👤 [CHAT] Username setat pentru chat:", fullName);
    }
  }, [participant]);
  */

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

  const joinConference = async () => {
    console.log("🎥 [PARTICIPANT] Se alătură conferinței - Agora va gestiona permisiunile");
    setIsInCall(true);
    
    // Conectează chat-ul RTM - TEMPORAR DEZACTIVAT
    /*
    if (username && conferinta?.documentId) {
      console.log("📧 [JOIN] Conectare chat RTM...");
      try {
        await connectChat();
      } catch (error) {
        console.error("💥 [JOIN] Eroare la conectarea chat-ului:", error);
      }
    }
    */
  };

  const leaveConference = async () => {
    setIsInCall(false);
    
    // Deconectează chat-ul RTM - TEMPORAR DEZACTIVAT
    /*
    console.log("📧 [LEAVE] Deconectare chat RTM...");
    try {
      await disconnectChat();
    } catch (error) {
      console.error("💥 [LEAVE] Eroare la deconectarea chat-ului:", error);
    }
    */
    
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
        dataRange: `${moment(conferinta.dataInceput).format("DD MMMM YYYY")}, ${conferinta.oraInceput} - ${moment(conferinta.dataFinal).format("DD MMMM YYYY")}, ${conferinta.oraFinal}`,
        oraRange: `${conferinta.oraInceput} - ${conferinta.oraFinal}`,
        type: "Curs"
      };
    } else {
      return {
        dataRange: `${moment(conferinta.dataInceput).format("DD MMMM YYYY")}, ${conferinta.oraInceput}`,
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

  // Conference in progress - show video interface with integrated chat
  if (isInCall && conferenceStarted) {
    return (
      <>
        <AgoraUIKit
          rtcProps={{
            appId: appID,
            channel: conferinta.documentId,
            token: null,
            role: "host",
            enableScreensharing: true,
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
        
        {/* Chat Panel integrat - TEMPORAR DEZACTIVAT */}
        {/*
        <ChatPanel
          messages={messages}
          onSendMessage={sendMessage}
          isConnected={chatConnected}
          loading={chatLoading}
          error={chatError}
          username={username}
          isVisible={chatVisible}
          onToggleVisibility={() => setChatVisible(!chatVisible)}
        />
        */}
      </>
    );
  }

  // Waiting room - conference not started yet
  return (
    <>
      <Home1Header />
      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 pt-5">
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
                        <p><strong>{displayInfo.type === "Curs" ? "Interval:" : "Data & Ora:"}</strong> {displayInfo.dataRange}</p>
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