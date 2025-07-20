import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Home1Header from "../home/home-1/header";
import { handleGetFirestore } from "../../../utils/firestoreUtils";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";
import "moment/locale/ro";
import dynamic from "next/dynamic";
import RecordingProgressWidget from "../../../components/RecordingProgressWidget";
import { AgoraStreamRecorder } from "../../../utils/agoraStreamRecorder";
// Old chat imports removed - using custom chat implementation
import { setUserOfflineInChat } from "../../../utils/chatUtils";
import { ref, push, onValue, off, serverTimestamp, set, update } from 'firebase/database';
import { database } from "../../../firebase";

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
  // Email dialog states for multi-recipient notification
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailInput, setEmailInput] = useState(""); // current text in input
  const [emailList, setEmailList] = useState([]); // array of validated emails
  const [emailError, setEmailError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const recordingIntervalRef = useRef(null);

  /* ---------------- AgoraStreamRecorder initializare ---------------- */
  const [recorder] = useState(() => new AgoraStreamRecorder({
    onProgress: (msg) => setRecordingStatus(msg),
    onComplete: (data) => {
      console.log('🎉 [GROUP RECORDING] Completed:', data);
      setRecordingStatus('📧 Se trimit emailurile...');
      
      // Track email sending progress
      let emailsSent = 0;
      const totalEmails = emailList.length;
      
      // trimite email pentru fiecare destinatar cu link către pagina publică de acces
      emailList.forEach(async (dest, index) => {
        try {
          const res = await fetch('/api/recording/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              meetingCode: `group_${conferinta?.documentId || 'unknown'}`,
              recipientEmail: dest,
              // No downloadURL - email will contain link to public access page only
              duration: data.duration
            })
          });
          const jr = await res.json();
          console.log('📧 Email access page sent to', dest, jr.success ? '✅' : '❌');
          
          emailsSent++;
          setRecordingStatus(`📧 Emailuri trimise: ${emailsSent}/${totalEmails}`);
          
          // Reset UI when all emails are sent
          if (emailsSent === totalEmails) {
            setTimeout(() => {
              setRecordingStatus('✅ Toate emailurile au fost trimise!');
              
              setTimeout(() => {
                setRecordingStatus('');
                setEmailList([]);
                setEmailInput('');
                setEmailError('');
                console.log('🔄 [UI RESET] Group recording interface reset after completion');
              }, 3000);
            }, 500);
          }
          
        } catch (err) {
          console.error('Email send error', dest, err);
          emailsSent++;
          
          // Handle errors but still reset UI when done
          if (emailsSent === totalEmails) {
            setTimeout(() => {
              setRecordingStatus('⚠️ Unele emailuri au eșuat');
              
              setTimeout(() => {
                setRecordingStatus('');
              }, 5000);
            }, 500);
          }
        }
      });

      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
      
      // Fallback reset in case no emails to send
      if (totalEmails === 0) {
        setTimeout(() => {
          setRecordingStatus('');
          console.log('🔄 [UI RESET] Group recording interface reset (no emails)');
        }, 2000);
      }
    },
    onError: (err) => {
      console.error('Recorder error', err);
      setRecordingError(err.message);
      setIsRecording(false);
    }
  }));

  const isRecordingSupported = AgoraStreamRecorder.isSupported();
  const [recordingStatus, setRecordingStatus] = useState("");

  /* ---------- helper: capture all video elements ---------- */
  const captureAllAgoraStreams = async () => {
    // Use recorder's built-in method to capture all videos
    const captured = await recorder.captureExistingAgoraStreams();
    console.log('🎥 [GROUP ADMIN] Captured streams:', captured);
    return captured;
  };

  /* ---------- Recording controls ---------- */
  const startRecording = async () => {
    try {
      setRecordingError("");
      if (!isRecordingSupported) {
        setRecordingError('Browser-ul nu suportă înregistrarea');
        return;
      }
      await captureAllAgoraStreams();
      const res = await recorder.startRecording();
      if (res.success) {
        setIsRecording(true);
        setRecordingDuration(0);
        recordingIntervalRef.current = setInterval(() => setRecordingDuration(prev=>prev+1), 1000);
      } else {
        setRecordingError(res.message);
      }
    } catch(e) { setRecordingError(e.message);}  };

  const stopRecording = () => {
    // deschide dialog emailuri pre-populate
    const preEmails = participantsOnline.filter(p=>p && p.email).map(p=>p.email);
    setEmailList(preEmails);
    setShowEmailDialog(true);
  };

  const validateEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);

  const addEmailFromInput = () => {
    const parts = emailInput.split(',').map(e=>e.trim()).filter(Boolean);
    const invalid = parts.find(p=>!validateEmail(p));
    if (invalid) { setEmailError(`Email invalid: ${invalid}`); return; }
    setEmailList(prev=>[...prev, ...parts.filter(p=>!prev.includes(p))]);
    setEmailInput(''); setEmailError('');
  };

  const confirmStopRecording = async () => {
    if (!emailList.length) { setEmailError('Adaugă cel puțin un email'); return; }
    setIsSendingEmail(true);
    await recorder.stopRecording(); // onComplete va trimite emailuri
    setShowEmailDialog(false);
    setIsSendingEmail(false);
  };

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
    const chatId = `conference_${conferinta.documentId}`;
    await setUserOfflineInChat(chatId, currentUser?.uid || 'admin');
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

  // ADMIN CUSTOM CHAT COMPONENT
  const AdminCustomChat = ({ meetingId, adminData }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [participants, setParticipants] = useState({});
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [isNearBottom, setIsNearBottom] = useState(true);
    
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    
    const chatRoomId = `conference_${meetingId}`;
    // FIXED: Force admin prefix to prevent confusion with regular users
    const adminUserId = `admin_${currentUser?.uid || 'default'}`;
    
    console.log("🚀 [ADMIN CUSTOM CHAT] Initializing with:", {
      meetingId,
      chatRoomId,
      adminUserId,
      adminData
    });

    useEffect(() => {
      if (!meetingId) return;

      const initAdminChat = async () => {
        try {
          console.log("🔗 [ADMIN CUSTOM CHAT] Connecting to Firebase...");
          
          // Setup participants listener
          const participantsRef = ref(database, `chats/${chatRoomId}/participants`);
          onValue(participantsRef, (snapshot) => {
            const data = snapshot.val();
            console.log("👥 [ADMIN CUSTOM CHAT] Participants update:", data);
            setParticipants(data || {});
          });

          // Setup messages listener
          const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
          onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            console.log("💬 [ADMIN CUSTOM CHAT] Messages update:", data);
            if (data) {
              const messagesList = Object.entries(data)
                .map(([key, value]) => ({ id: key, ...value }))
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              setMessages(messagesList);
            } else {
              setMessages([]);
            }
          });

          // Set admin as participant
          const adminParticipantRef = ref(database, `chats/${chatRoomId}/participants/${adminUserId}`);
          await set(adminParticipantRef, {
            name: `${adminData.nume} ${adminData.prenume}`.trim() || "Admin",
            role: "admin",
            isOnline: true,
            lastSeen: serverTimestamp(),
            isGuest: false
          });

          console.log("✅ [ADMIN CUSTOM CHAT] Connected successfully");

        } catch (error) {
          console.error("💥 [ADMIN CUSTOM CHAT] Connection error:", error);
        }
      };

      initAdminChat();

      // Cleanup
      return () => {
        console.log("🧹 [ADMIN CUSTOM CHAT] Cleaning up...");
        const chatRef = ref(database, `chats/${chatRoomId}`);
        off(chatRef);
      };
    }, [meetingId, chatRoomId, adminUserId]);

    const sendMessage = async () => {
      if (!inputText.trim()) return;

      try {
        console.log("📤 [ADMIN CUSTOM CHAT] Sending message:", inputText);
        
        // Get current participant name
        const currentParticipant = participants[adminUserId];
        const senderName = currentParticipant?.name || `${adminData.nume} ${adminData.prenume}`.trim() || "Admin";
        
        const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
        await push(messagesRef, {
          senderId: adminUserId,
          senderName: senderName,
          message: inputText.trim(),
          timestamp: serverTimestamp(),
          type: 'text'
        });

        // Update last activity
        const metadataRef = ref(database, `chats/${chatRoomId}/metadata`);
        await update(metadataRef, {
          lastActivity: serverTimestamp()
        });

        setInputText('');
        scrollToBottomAfterSend();
        console.log("✅ [ADMIN CUSTOM CHAT] Message sent");
      } catch (error) {
        console.error("💥 [ADMIN CUSTOM CHAT] Send error:", error);
      }
    };

    const startEditingName = () => {
      const currentParticipant = participants[adminUserId];
      const currentName = currentParticipant?.name || `${adminData.nume} ${adminData.prenume}`.trim() || "Admin";
      setEditedName(currentName);
      setIsEditingName(true);
    };

    const saveEditedName = async () => {
      if (!editedName.trim()) return;

      try {
        console.log("✏️ [ADMIN CUSTOM CHAT] Updating name to:", editedName.trim());
        
        const adminParticipantRef = ref(database, `chats/${chatRoomId}/participants/${adminUserId}`);
        await update(adminParticipantRef, {
          name: editedName.trim(),
          lastSeen: serverTimestamp()
        });

        setIsEditingName(false);
        console.log("✅ [ADMIN CUSTOM CHAT] Name updated successfully");
      } catch (error) {
        console.error("💥 [ADMIN CUSTOM CHAT] Error updating name:", error);
      }
    };

    const cancelEditingName = () => {
      setIsEditingName(false);
      setEditedName('');
    };

    // Auto-scroll functions
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const checkIfNearBottom = () => {
      if (!messagesContainerRef.current) return true;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 100; // pixels from bottom
      return scrollHeight - scrollTop - clientHeight < threshold;
    };

    const handleScroll = () => {
      setIsNearBottom(checkIfNearBottom());
    };

    // Auto-scroll when messages change
    useEffect(() => {
      if (isNearBottom) {
        scrollToBottom();
      }
    }, [messages, isNearBottom]);

    // Always scroll to bottom when sending a message
    const scrollToBottomAfterSend = () => {
      setIsNearBottom(true);
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    };

    const onlineCount = Object.values(participants).filter(p => p.isOnline).length;

    return (
      <>
        {/* Chat FAB */}
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '20px',
          zIndex: 11000
        }}>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: isChatOpen ? '#dc2626' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              position: 'relative'
            }}
          >
            {isChatOpen ? '✕' : '💬'}
            {onlineCount > 1 && !isChatOpen && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#10b981',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {onlineCount}
              </span>
            )}
          </button>
        </div>

        {/* Chat Panel */}
        {isChatOpen && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(15% + 30px)',
            right: '20px',
            width: '350px',
            height: '500px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 11001
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isEditingName ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveEditedName();
                        if (e.key === 'Escape') cancelEditingName();
                      }}
                      onBlur={saveEditedName}
                      autoFocus
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        outline: 'none',
                        minWidth: '120px'
                      }}
                      placeholder="Numele tău"
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>
                        {participants[adminUserId]?.name || `${adminData.nume} ${adminData.prenume}`.trim() || "Admin"}
                      </span>
                      <button
                        onClick={startEditingName}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          opacity: '0.7',
                          padding: '2px'
                        }}
                        title="Editează numele"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                  <span style={{
                    fontSize: '10px',
                    opacity: '0.8',
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '8px'
                  }}>
                    ADMIN
                  </span>
                </div>
                <span style={{ fontSize: '12px', opacity: '0.9' }}>
                  👥 {onlineCount} online
                </span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {messages.map((message) => (
                <div key={message.id} style={{
                  alignSelf: message.senderId === adminUserId ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    {message.senderName}
                  </div>
                  <div style={{
                    background: message.senderId === adminUserId 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#f1f5f9',
                    color: message.senderId === adminUserId ? 'white' : '#374151',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    wordWrap: 'break-word'
                  }}>
                    {message.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
              
              {/* Scroll to bottom indicator */}
              {!isNearBottom && (
                <div style={{
                  position: 'absolute',
                  bottom: '80px',
                  right: '50%',
                  transform: 'translateX(50%)',
                  zIndex: 1000
                }}>
                  <button
                    onClick={() => {
                      setIsNearBottom(true);
                      scrollToBottom();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ↓ Mesaje noi
                  </button>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end'
            }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Scrie un mesaj..."
                style={{
                  flex: 1,
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                  opacity: inputText.trim() ? 1 : 0.5
                }}
              >
                📤
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  // (vechea implementare API start/stop a fost înlocuită)

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
        <div className="content" style={{ paddingTop: "100px", position: "relative" }}>
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
        <div className="content" style={{ paddingTop: "100px", position: "relative" }}>
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
            enableScreensharing: true, // Enable screen sharing for admin
            screenShareUID: 1, // Unique UID for screen sharing
            // enableDualStream: true, // Disabled to prevent conflicts - managed by AgoraUIKit internally
          }}
          rtmProps={{ 
            username: currentUser?.displayName || 'Admin', 
            displayUsername: true 
          }}
          styleProps={{
            UIKitContainer: {
              width: '100vw',
              height: '100vh',
            },
            localBtnContainer: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '8px',
            },
            maxViewContainer: {
              backgroundColor: '#000',
            },
            minViewContainer: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            },
          }}
          settings={{
            host: true,
            mode: 0, // FIXED: RTC mode for group conferences (not live broadcast)
            role: 1, // Host role
            enableScreensharing: true, // Enable screen sharing in settings
            enableWhiteboard: false, // Disable whiteboard for cleaner UI
          }}
          callbacks={{
            EndCall: leaveConference,
            'rtc-screen-share-start': () => {
              console.log('🖥️ [ADMIN] Screen sharing started');
            },
            'rtc-screen-share-stop': () => {
              console.log('🖥️ [ADMIN] Screen sharing stopped');
            },
          }}
        />
        
        {/* Compact Recording Progress Monitor - Bottom Right */}
        {/* <RecordingProgressWidget
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          recordingStatus={recordingStatus}
          recordingError={recordingError}
          showCancelButton={false}
          showStartStopButtons={false}
          onCancel={() => {
            recorder.cleanup();
            setIsRecording(false);
            setRecordingStatus('');
            setRecordingError('');
            if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = null;
            }
          }}
        /> */}

        {/* Recording Controls - Main Control Button with Animations */}
        {isRecordingSupported && (
          <div style={recordingControlsStyle}>
            <button
              style={{
                ...recordButtonStyle,
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
              onClick={isRecording ? stopRecording : startRecording}
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

            {recordingStatus && (
              <div style={{
                ...recordingInfoStyle, 
                backgroundColor: '#e3f2fd', 
                color: '#1976d2', 
                padding: '8px 12px', 
                borderRadius: '6px', 
                fontSize: '12px',
                flexDirection: 'column',
                minWidth: '200px'
              }}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: recordingStatus.includes('Upload:') ? '8px' : '0'}}>
                  <i className="fas fa-info-circle" style={{marginRight: '8px'}}></i>
                  {recordingStatus}
                </div>
                
                {/* Progress Bar for Upload */}
                {recordingStatus.includes('Upload:') && (
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '3px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div 
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #3742fa, #5352ed)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                        width: `${recordingStatus.match(/(\d+)%/)?.[1] || 0}%`
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#1976d2',
                      zIndex: 1,
                    }}>
                      {recordingStatus.match(/(\d+)%/)?.[1] || 0}%
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Email Dialog */}
        {showEmailDialog && (
          <div style={emailDialogOverlayStyle}>
            <div style={emailDialogStyle}>
              <h3 style={{marginTop:0}}>Trimite înregistrarea</h3>
              <p>Introduceți una sau mai multe adrese de email separate prin virgule sau Enter.</p>

              <div style={chipContainerStyle}>
                {emailList.map((mail)=>(
                  <span key={mail} style={chipStyle}>
                    {mail}
                    <button
                      onClick={()=>setEmailList(list=>list.filter(e=>e!==mail))}
                      style={chipRemoveBtnStyle}
                    >×</button>
                  </span>
                ))}
              </div>

              <input
                style={emailInputStyle}
                placeholder="email@example.com"
                value={emailInput}
                onChange={e=>setEmailInput(e.target.value)}
                onKeyDown={e=>{
                  if(e.key==='Enter' || e.key===',') { e.preventDefault(); addEmailFromInput(); }
                }}
              />

              {emailError && <div style={emailErrorStyle}>{emailError}</div>}

              <div style={emailDialogFooterStyle}>
                <button onClick={()=>setShowEmailDialog(false)} disabled={isSendingEmail}>Anulează</button>
                <button onClick={confirmStopRecording} disabled={isSendingEmail||!emailList.length}>Trimite</button>
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

        {/* ADMIN CUSTOM CHAT */}
        <AdminCustomChat 
          meetingId={conferinta.documentId}
          adminData={{
            nume: userData?.nume || currentUser?.displayName || "Admin",
            prenume: userData?.prenume || "",
            email: userData?.email || currentUser?.email || "admin@site.com",
            role: "admin"
          }}
        />

      </div>
    );
  }

  // Admin waiting room - ready to start conference
  return (
    <>
      <Home1Header />
      <div className="content" style={{ paddingTop: "100px", position: "relative" }}>
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

              {/* Global Chat FAB & Panel even in waiting room */}
                        {/* Admin Chat in Waiting Room */}
              {conferinta?.documentId && (
                <AdminCustomChat 
                  meetingId={conferinta.documentId}
                  adminData={{
                    nume: userData?.nume || currentUser?.displayName || "Admin",
                    prenume: userData?.prenume || "",
                    email: userData?.email || currentUser?.email || "admin@site.com",
                    role: "admin"
                  }}
                />
              )}

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

// Email Dialog Styles
const emailDialogOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 3000,
};

const emailDialogStyle = {
  background: '#fff',
  padding: '30px',
  borderRadius: '10px',
  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  width: '90%',
  maxWidth: '500px',
  textAlign: 'center',
};

const chipContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '15px',
  justifyContent: 'center',
};

const chipStyle = {
  background: '#e0e0e0',
  borderRadius: '20px',
  padding: '5px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '0.9em',
  color: '#333',
};

const chipRemoveBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#f00',
  fontSize: '1.2em',
  cursor: 'pointer',
  padding: '0 5px',
};

const emailInputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '15px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  fontSize: '1em',
};

const emailErrorStyle = {
  color: '#f00',
  fontSize: '0.9em',
  marginTop: '10px',
};

const emailDialogFooterStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  gap: '10px',
};

export default AdminConferintaGrupVideo;

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