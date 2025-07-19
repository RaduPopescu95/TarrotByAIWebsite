import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Home1Header from "../home/home-1/header";
import { handleGetFirestore, handleUpdateFirestore } from "../../../utils/firestoreUtils";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";
import "moment/locale/ro";
import dynamic from "next/dynamic";
import { SimpleVideoRecorder } from "../../../utils/mediaRecorder";
import { createRecordingLogger } from "../../../utils/recordingLogger";
import RecordingDebugPanel from "../../../components/RecordingDebugPanel";

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
// Chat imports removed - using custom chat implementation
import { setUserOfflineInChat, monitorConferenceForChatCleanup } from "../../../utils/chatUtils";
import { ref, push, onValue, off, serverTimestamp, set, update } from 'firebase/database';
import { database } from "../../../firebase";

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

  // Simple Recording states (updated for new system with detailed logging)
  const [recorder] = useState(() => {
    const componentLogger = createRecordingLogger('ConferenceGroup-Recording');
    
    return new SimpleVideoRecorder({
      onProgress: (message) => {
        componentLogger.progress('📊 Group recording progress update', { 
          status: message,
          accessLink: accessLink || 'unknown',
          conferenceId: conferinta?.documentId || 'unknown',
          component: 'conferinta-grup-access/index.jsx'
        });
        setRecordingStatus(message);
      },
      onComplete: (data) => {
        componentLogger.success('🎉 Group recording completed successfully', {
          meetingCode: data.meetingCode,
          fileName: data.fileName,
          fileSize: data.size,
          duration: data.duration,
          downloadURL: data.downloadURL ? '[PROVIDED]' : '[MISSING]',
          accessLink: accessLink || 'unknown',
          conferenceId: conferinta?.documentId || 'unknown',
          component: 'conferinta-grup-access/index.jsx'
        });
        setRecordingStatus('Înregistrare completă! Email trimis.');
        setIsRecording(false);
        setRecordingDuration(0);
        // Update Firestore with recording completion
        if (conferinta?.documentId) {
          componentLogger.info('💾 Updating Firestore with group recording completion', {
            documentId: conferinta.documentId,
            collection: 'ConferinteGrup'
          });
          updateDoc(doc(db, "ConferinteGrup", conferinta.documentId), {
            recording: {
              isRecording: false,
              endTime: Date.now(),
              status: 'completed',
              downloadURL: data.downloadURL,
              fileName: data.fileName
            }
          }).catch(error => {
            componentLogger.error('❌ Failed to update Firestore after group recording completion', {
              error: error.message,
              documentId: conferinta.documentId
            });
          });
        }
      },
      onError: (error) => {
        componentLogger.error('💥 Group recording failed in component', {
          error: error.message,
          errorName: error.name,
          accessLink: accessLink || 'unknown',
          conferenceId: conferinta?.documentId || 'unknown',
          component: 'conferinta-grup-access/index.jsx'
        });
        setRecordingError(error.message || 'Eroare la înregistrare');
        setIsRecording(false);
      }
    });
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [recordingError, setRecordingError] = useState("");
  const [recordingPermission, setRecordingPermission] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const recordingIntervalRef = useRef(null);

  // Conference timing
  const [conferenceStarted, setConferenceStarted] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(null);
  const [adminIsPresent, setAdminIsPresent] = useState(false);

  // Chat functionality replaced with custom chat
  const chatCleanupMonitorRef = useRef(null);

  // Check browser recording support with logging
  const isRecordingSupported = SimpleVideoRecorder.isSupported();
  
  // Component initialization logging
  useEffect(() => {
    const componentLogger = createRecordingLogger('ConferenceGroup-Init');
    componentLogger.info('🎬 Conference Group component initialized', {
      accessLink: accessLink || 'unknown',
      conferenceId: conferinta?.documentId || 'unknown',
      isRecordingSupported,
      supportedMimeTypes: SimpleVideoRecorder.getSupportedMimeTypes(),
      userAgent: navigator.userAgent,
      component: 'conferinta-grup-access/index.jsx'
    });
  }, [accessLink, conferinta]);

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

  // CUSTOM CHAT COMPONENT FOR CLIENTS
  const CustomUserChat = ({ meetingId, participantData }) => {
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
    // Fix userId stability for guest users
    const [stableUserId] = useState(() => {
      if (currentUser?.uid) {
        return currentUser.uid;
      }
      // For guest users, create a stable ID based on participant data
      if (participantData?.uniqueAccessLink) {
        return `guest_${participantData.uniqueAccessLink.slice(-8)}`;
      }
      if (participantData?.accessLink) {
        return `guest_${participantData.accessLink.slice(-8)}`;
      }
      return `guest_${Date.now()}`;
    });
    
    console.log("🚀 [USER CUSTOM CHAT] Initializing with:", {
      meetingId,
      chatRoomId,
      userId: stableUserId,
      currentUser: currentUser ? "LOGGED_IN" : "GUEST",
      participantData: participantData ? "PROVIDED" : "MISSING",
      accessLink: participantData?.uniqueAccessLink || participantData?.accessLink
    });

    useEffect(() => {
      if (!meetingId) return;

      const initUserChat = async () => {
        try {
                  console.log("🔗 [USER CUSTOM CHAT] Connecting to Firebase...");
        console.log("🔧 [USER CUSTOM CHAT] Database object:", database);
        console.log("🔧 [USER CUSTOM CHAT] Database app:", database.app);
        
        // Test Firebase connection
        console.log("🧪 [USER CUSTOM CHAT] Testing Firebase write access...");
        const testRef = ref(database, `test/${Date.now()}`);
        await set(testRef, { test: true, timestamp: Date.now(), userId: stableUserId });
        console.log("✅ [USER CUSTOM CHAT] Firebase write test successful!");
        
        // Setup participants listener
          const participantsRef = ref(database, `chats/${chatRoomId}/participants`);
          onValue(participantsRef, (snapshot) => {
            const data = snapshot.val();
            console.log("👥 [USER CUSTOM CHAT] Participants update:", data);
            setParticipants(data || {});
          });

          // Setup messages listener
          const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
          onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            console.log("💬 [USER CUSTOM CHAT] Messages update:", data);
            if (data) {
              const messagesList = Object.entries(data)
                .map(([key, value]) => ({ id: key, ...value }))
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              setMessages(messagesList);
            } else {
              setMessages([]);
            }
          });

          // Set user as participant
          const userName = participantData?.nume && participantData?.prenume 
            ? `${participantData.nume} ${participantData.prenume}`.trim()
            : participantData?.name || "Participant";
            
          const userParticipantRef = ref(database, `chats/${chatRoomId}/participants/${stableUserId}`);
          await set(userParticipantRef, {
            name: userName,
            role: "participant",
            isOnline: true,
            lastSeen: serverTimestamp(),
            isGuest: participantData?.isGuestUser || false
          });

          console.log("✅ [USER CUSTOM CHAT] Connected successfully as:", userName);

        } catch (error) {
          console.error("💥 [USER CUSTOM CHAT] Connection error:", error);
        }
      };

      initUserChat();

      // Cleanup
      return () => {
        console.log("🧹 [USER CUSTOM CHAT] Cleaning up...");
        const chatRef = ref(database, `chats/${chatRoomId}`);
        off(chatRef);
        
        // Set user offline
        const userParticipantRef = ref(database, `chats/${chatRoomId}/participants/${stableUserId}`);
        update(userParticipantRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        }).catch(console.error);
      };
          }, [meetingId, chatRoomId, stableUserId]);

    const sendMessage = async () => {
      if (!inputText.trim()) {
        console.log("⚠️ [USER CUSTOM CHAT] Empty message, not sending");
        return;
      }

      try {
        // Get current participant name from Firebase or default
        const currentParticipant = participants[stableUserId];
        const userName = currentParticipant?.name || 
          (participantData?.nume && participantData?.prenume 
            ? `${participantData.nume} ${participantData.prenume}`.trim()
            : participantData?.name || "Participant");
        
        const messageData = {
          senderId: stableUserId,
          senderName: userName,
          message: inputText.trim(),
          timestamp: serverTimestamp(),
          type: 'text'
        };

        console.log("📤 [USER CUSTOM CHAT] Attempting to send message:", {
          chatRoomId,
          userId: stableUserId,
          userName,
          messageText: inputText.trim(),
          messageData,
          databaseRef: `chats/${chatRoomId}/messages`
        });
        
        const messagesRef = ref(database, `chats/${chatRoomId}/messages`);
        console.log("🔗 [USER CUSTOM CHAT] Messages ref created:", messagesRef);
        console.log("🗂️ [USER CUSTOM CHAT] Full Firebase path:", `chats/${chatRoomId}/messages`);
        
        const result = await push(messagesRef, messageData);
        console.log("✅ [USER CUSTOM CHAT] Push result:", result);

        // Update last activity
        const metadataRef = ref(database, `chats/${chatRoomId}/metadata`);
        await update(metadataRef, {
          lastActivity: serverTimestamp()
        });

        setInputText('');
        scrollToBottomAfterSend();
        console.log("🎉 [USER CUSTOM CHAT] Message sent successfully!");
      } catch (error) {
        console.error("💥 [USER CUSTOM CHAT] Send error details:", {
          error: error.message,
          errorCode: error.code,
          errorStack: error.stack,
          chatRoomId,
          userId: stableUserId
        });
      }
    };

    const startEditingName = () => {
      const currentParticipant = participants[stableUserId];
      const currentName = currentParticipant?.name || 
        (participantData?.nume && participantData?.prenume 
          ? `${participantData.nume} ${participantData.prenume}`.trim()
          : participantData?.name || "Participant");
      setEditedName(currentName);
      setIsEditingName(true);
    };

    const saveEditedName = async () => {
      if (!editedName.trim()) return;

      try {
        console.log("✏️ [USER CUSTOM CHAT] Updating name to:", editedName.trim());
        
        const userParticipantRef = ref(database, `chats/${chatRoomId}/participants/${stableUserId}`);
        await update(userParticipantRef, {
          name: editedName.trim(),
          lastSeen: serverTimestamp()
        });

        setIsEditingName(false);
        console.log("✅ [USER CUSTOM CHAT] Name updated successfully");
      } catch (error) {
        console.error("💥 [USER CUSTOM CHAT] Error updating name:", error);
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
              background: isChatOpen ? '#dc2626' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
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
                background: '#f59e0b',
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
            bottom: 'calc(15% + 40px)',
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
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                        {participants[stableUserId]?.name || 
                          (participantData?.nume && participantData?.prenume 
                            ? `${participantData.nume} ${participantData.prenume}`.trim()
                            : participantData?.name || "Participant")}
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
                    {currentUser ? 'USER' : 'GUEST'}
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
                  alignSelf: message.senderId === stableUserId ? 'flex-end' : 'flex-start',
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
                    background: message.senderId === stableUserId 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : '#f1f5f9',
                    color: message.senderId === stableUserId ? 'white' : '#374151',
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
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                onClick={() => {
                  setInputText('TEST mesaj de la client');
                  setTimeout(() => sendMessage(), 100);
                }}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🧪
              </button>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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

  // Simple Recording functions (Browser-based)
  const startRecording = async () => {
    const componentLogger = createRecordingLogger('ConferenceGroup-Start');
    
    try {
      componentLogger.info('🎬 Starting recording process in group conference', {
        accessLink: accessLink || 'unknown',
        conferenceId: conferinta?.documentId || 'unknown',
        hasPermission: recordingPermission,
        userAgent: navigator.userAgent,
        component: 'conferinta-grup-access/index.jsx'
      });

      setRecordingError('');
      setRecordingStatus('Pregătire înregistrare...');
      
      // Check if participant consented to recording
      if (!recordingPermission) {
        componentLogger.warning('⚠️ Group recording permission not granted, showing modal', {
          accessLink: accessLink || 'unknown',
          conferenceId: conferinta?.documentId || 'unknown'
        });
        setShowRecordingModal(true);
        return;
      }

      // Check browser support before starting
      if (!SimpleVideoRecorder.isSupported()) {
        componentLogger.error('❌ Browser does not support group recording', {
          userAgent: navigator.userAgent,
          supportedMimeTypes: SimpleVideoRecorder.getSupportedMimeTypes()
        });
        throw new Error('Browser nu suportă înregistrarea video');
      }
      
      componentLogger.info('✅ Browser support confirmed, proceeding with group recording', {
        supportedMimeTypes: SimpleVideoRecorder.getSupportedMimeTypes()
      });

      const result = await recorder.startRecording();
      
      if (result.success) {
        componentLogger.success('▶️ Group recording started successfully', {
          mimeType: result.mimeType,
          accessLink: accessLink || 'unknown',
          conferenceId: conferinta?.documentId || 'unknown'
        });

        setIsRecording(true);
        setRecordingStatus('Înregistrare activă');
        startRecordingTimer();

        // Update recording status in Firebase
        if (conferinta?.documentId) {
          componentLogger.info('💾 Updating Firestore with group recording start', {
            documentId: conferinta.documentId,
            collection: 'ConferinteGrup',
            format: result.mimeType
          });

          const docRef = doc(db, "ConferinteGrup", conferinta.documentId);
          await updateDoc(docRef, {
            recording: {
              isRecording: true,
              startTime: Date.now(),
              status: 'recording',
              type: 'browser_simple',
              format: result.mimeType
            }
          });

          componentLogger.success('✅ Firestore updated with group recording start', {
            documentId: conferinta.documentId
          });
        }
      } else {
        componentLogger.error('❌ Failed to start group recording', {
          message: result.message,
          accessLink: accessLink || 'unknown',
          conferenceId: conferinta?.documentId || 'unknown'
        });
        setRecordingError(result.message);
        setRecordingStatus('');
      }
    } catch (error) {
      componentLogger.error('💥 Critical error starting group recording', {
        error: error.message,
        errorStack: error.stack,
        accessLink: accessLink || 'unknown',
        conferenceId: conferinta?.documentId || 'unknown',
        userAgent: navigator.userAgent
      });
      setRecordingError('Eroare la pornirea înregistrării');
      setRecordingStatus('');
    }
  };

  const stopRecording = () => {
    const componentLogger = createRecordingLogger('ConferenceGroup-Stop');
    
    try {
      componentLogger.info('⏹️ Stopping group recording', {
        accessLink: accessLink || 'unknown',
        conferenceId: conferinta?.documentId || 'unknown',
        recordingDuration,
        component: 'conferinta-grup-access/index.jsx'
      });

      setRecordingStatus('Oprire înregistrare...');
      recorder.stopRecording();
        
      // Timer se va opri automat în useEffect când isRecording devine false
        if (recordingIntervalRef.current) {
        componentLogger.debug('⏰ Clearing group recording timer', {
          timerId: recordingIntervalRef.current
        });
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

      componentLogger.success('✅ Group recording stop initiated successfully', {
        accessLink: accessLink || 'unknown',
        conferenceId: conferinta?.documentId || 'unknown'
      });
    } catch (error) {
      componentLogger.error('💥 Error stopping group recording', {
        error: error.message,
        errorStack: error.stack,
        accessLink: accessLink || 'unknown',
        conferenceId: conferinta?.documentId || 'unknown'
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
          rtmProps={{ username: participant?.nume || 'Participant', displayUsername: true }}
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
        
        {/* Simple Recording Controls */}
        {isRecordingSupported ? (
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
              <i className={`fas ${isRecording ? "fa-stop-circle" : "fa-video"}`} />
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
              <div style={recordingStatusStyle}>
                {recordingStatus}
        </div>
            )}
            
            {recordingError && (
              <div style={recordingErrorInlineStyle}>
                ❌ {recordingError}
              </div>
            )}
          </div>
        ) : (
          <div style={recordingUnsupportedStyle}>
            ⚠️ Browserul nu suportă înregistrarea video
          </div>
        )}

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

        {/* CUSTOM USER CHAT */}
        {conferinta?.documentId && participant && (
          <CustomUserChat 
            meetingId={conferinta.documentId}
            participantData={participant}
          />
        )}

        {/* Recording Debug Panel - Only show in development or when debug=true */}
        <RecordingDebugPanel 
          show={isRecordingSupported && (process.env.NODE_ENV === 'development' || typeof window !== 'undefined' && window.location.search.includes('debug=true'))} 
          maxLogs={30} 
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

              {/* Chat in Waiting Room */}
              {conferinta?.documentId && participant && (
                <CustomUserChat 
                  meetingId={conferinta.documentId}
                  participantData={participant}
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

const recordingStatusStyle = {
  backgroundColor: "rgba(52, 152, 219, 0.9)",
  color: "#ffffff",
  padding: "8px 12px",
  borderRadius: "15px",
  fontSize: "12px",
  textAlign: "center",
  maxWidth: "200px",
  marginTop: "5px",
};

const recordingErrorInlineStyle = {
  backgroundColor: "rgba(231, 76, 60, 0.9)",
  color: "#ffffff",
  padding: "8px 12px",
  borderRadius: "15px",
  fontSize: "12px",
  textAlign: "center",
  maxWidth: "200px",
  marginTop: "5px",
};

const recordingUnsupportedStyle = {
  position: "absolute",
  top: "20px",
  right: "20px",
  backgroundColor: "rgba(230, 126, 34, 0.9)",
  color: "#ffffff",
  padding: "10px 15px",
  borderRadius: "15px",
  fontSize: "12px",
  zIndex: 1000,
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