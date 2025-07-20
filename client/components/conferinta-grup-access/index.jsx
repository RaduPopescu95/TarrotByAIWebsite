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



  // Conference timing
  const [conferenceStarted, setConferenceStarted] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(null);
  const [adminIsPresent, setAdminIsPresent] = useState(false);

  // Chat functionality replaced with custom chat
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
        // Check if user is admin - if so, force them to use admin interface
        const adminUIDs = [
          'zFsAwNZA5bUonVRIQzRn2HZB3y62',
          'BhJZdiWVQJNnbLOCGWxzjGHVjHB2', 
          'MSBePxFVcVO3vsfM5nwHr36ROfh2'
        ];
        
        if (adminUIDs.includes(currentUser.uid)) {
          console.warn("⚠️ [USER CHAT] Admin detected in user interface - using participant_admin prefix");
          return `participant_admin_${currentUser.uid}`;
        }
        
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
        <div className="content" style={{ position: "relative" }}>
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
        <div className="content" style={{ position: "relative" }}>
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

  // Conference in progress - show Agora UIKit interface
  if (isInCall && conferenceStarted) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <AgoraUIKit
          rtcProps={{
            appId: appID,
            channel: conferinta.documentId,
            token: null,
            role: "audience", // Participants are audience, not host
            enableScreensharing: true, // Enable screen sharing for participants too
            screenShareUID: 2, // Different UID for participant screen sharing
            enableDualStream: true, // Enable dual stream for better quality
          }}
          rtmProps={{ 
            username: participant?.nume || 'Participant', 
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
            host: false, // Participants are not hosts
            mode: 1, // Live broadcast mode
            role: 2, // Audience role
            enableScreensharing: true, // Enable screen sharing in settings
            enableWhiteboard: false, // Disable whiteboard for cleaner UI
          }}
          callbacks={{
            EndCall: leaveConference,
            'rtc-screen-share-start': () => {
              console.log('🖥️ [PARTICIPANT] Screen sharing started');
            },
            'rtc-screen-share-stop': () => {
              console.log('🖥️ [PARTICIPANT] Screen sharing stopped');
            },
          }}
        />
        


        {/* CUSTOM USER CHAT */}
        {conferinta?.documentId && participant && (
          <CustomUserChat 
          meetingId={conferinta.documentId}
          participantData={participant}
          />
        )}


      </div>
    );
  }

  // Waiting room - conference not started yet
  return (
    <>
      <Home1Header />
      <div className="content" style={{ position: "relative" }}>
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



export default ConferintaGrupAccess; 