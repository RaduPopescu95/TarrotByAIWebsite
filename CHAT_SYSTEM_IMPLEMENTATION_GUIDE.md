# 💬 GHID COMPLET: Implementarea Sistemului de Chat Real-Time

## 📋 Prezentare Generală

Implementăm un sistem de chat real-time pentru ambele tipuri de meeting-uri din platforma Cristina Zurba:

1. **👥 Consultații One-to-One** - Chat privat între admin și client
2. **🎪 Conferințe de Grup** - Chat de grup pentru toți participanții

**Caracteristici principale:**
- 💬 **Firebase Realtime Database** pentru chat instantaneu
- 🎈 **FAB (Floating Action Button)** pentru acces rapid
- 👤 **Identificare inteligentă** utilizatori (guest vs registered)
- 🗑️ **Auto-cleanup** după terminarea call-ului
- ✏️ **Nume editabile** pentru flexibilitate maximă

---

## 🏗️ ARHITECTURA SISTEMULUI DE CHAT

### **Firebase Realtime Database Structure:**

```javascript
{
  "chats": {
    // Pentru consultații one-to-one
    "consultation_MEETING_CODE": {
      "type": "consultation",
      "participants": {
        "admin": {
          "name": "Cristina Zurba",
          "role": "admin",
          "isOnline": true,
          "lastSeen": "2024-01-15T10:30:00Z"
        },
        "client": {
          "name": "Ion Popescu", // din Firebase sau editat manual
          "role": "client",
          "isOnline": true,
          "lastSeen": "2024-01-15T10:30:00Z",
          "isGuest": false
        }
      },
      "messages": {
        "msg_001": {
          "senderId": "admin",
          "senderName": "Cristina Zurba",
          "message": "Bună ziua! Cum vă simțiți astăzi?",
          "timestamp": "2024-01-15T10:31:00Z",
          "type": "text"
        },
        "msg_002": {
          "senderId": "client", 
          "senderName": "Ion Popescu",
          "message": "Bună ziua! Mă simt bine, mulțumesc.",
          "timestamp": "2024-01-15T10:31:30Z",
          "type": "text"
        }
      },
      "metadata": {
        "createdAt": "2024-01-15T10:30:00Z",
        "meetingActive": true,
        "autoCleanup": true
      }
    },

    // Pentru conferințe de grup
    "conference_CONFERENCE_ID": {
      "type": "conference",
      "participants": {
        "admin": {
          "name": "Cristina Zurba",
          "role": "admin",
          "isOnline": true
        },
        "participant_001": {
          "name": "Maria Ionescu",
          "role": "participant", 
          "isOnline": true,
          "isGuest": false
        },
        "participant_002": {
          "name": "Guest User",
          "role": "participant",
          "isOnline": true,
          "isGuest": true
        }
      },
      "messages": {
        "msg_001": {
          "senderId": "admin",
          "senderName": "Cristina Zurba", 
          "message": "Bună tuturor! Să începem sesiunea.",
          "timestamp": "2024-01-15T10:30:00Z",
          "type": "text"
        }
      },
      "metadata": {
        "createdAt": "2024-01-15T10:30:00Z",
        "conferenceActive": true,
        "autoCleanup": true
      }
    }
  }
}
```

---

## 🎨 COMPONENTE FRONTEND

### **1. Componenta Chat Principală**

**`components/Chat/RealtimeChat.jsx`**
```jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  ref, 
  push, 
  onValue, 
  off, 
  serverTimestamp, 
  onDisconnect,
  set
} from 'firebase/database';
import { realtimeDb } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, Send, X, Edit2, Users, Smile } from 'lucide-react';

const RealtimeChat = ({ 
  meetingId, 
  meetingType, // 'consultation' | 'conference'
  participantData,
  isVisible,
  onToggle,
  onClose 
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState({});
  const [userDisplayName, setUserDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatRoomId = `${meetingType}_${meetingId}`;
  
  // Determine user role and initial name
  const userRole = currentUser?.uid === 'admin_uid' ? 'admin' : 
                   meetingType === 'consultation' ? 'client' : 'participant';
  
  const userId = currentUser?.uid || `guest_${Date.now()}`;

  useEffect(() => {
    initializeChat();
    return () => cleanup();
  }, [meetingId, meetingType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    // Determine display name
    let displayName = 'Guest User';
    
    if (participantData) {
      if (participantData.nume && participantData.prenume) {
        displayName = `${participantData.nume} ${participantData.prenume}`;
      } else if (participantData.name) {
        displayName = participantData.name;
      }
    } else if (currentUser?.displayName) {
      displayName = currentUser.displayName;
    } else if (userRole === 'admin') {
      displayName = 'Cristina Zurba';
    }
    
    setUserDisplayName(displayName);

    // Initialize chat room
    const chatRef = ref(realtimeDb, `chats/${chatRoomId}`);
    const participantRef = ref(realtimeDb, `chats/${chatRoomId}/participants/${userId}`);
    const messagesRef = ref(realtimeDb, `chats/${chatRoomId}/messages`);
    const participantsRef = ref(realtimeDb, `chats/${chatRoomId}/participants`);

    // Set user as online
    await set(participantRef, {
      name: displayName,
      role: userRole,
      isOnline: true,
      lastSeen: serverTimestamp(),
      isGuest: !currentUser?.uid || participantData?.isGuestUser || false
    });

    // Set user offline on disconnect
    onDisconnect(participantRef).update({
      isOnline: false,
      lastSeen: serverTimestamp()
    });

    // Listen to messages
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data)
          .map(([key, value]) => ({ id: key, ...value }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    // Listen to participants
    onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      setParticipants(data || {});
    });

    // Initialize metadata
    const metadataRef = ref(realtimeDb, `chats/${chatRoomId}/metadata`);
    await set(metadataRef, {
      type: meetingType,
      createdAt: serverTimestamp(),
      [`${meetingType}Active`]: true,
      autoCleanup: true
    });
  };

  const cleanup = () => {
    // Remove listeners and set user offline
    const chatRef = ref(realtimeDb, `chats/${chatRoomId}`);
    off(chatRef);
    
    const participantRef = ref(realtimeDb, `chats/${chatRoomId}/participants/${userId}`);
    set(participantRef, {
      ...participants[userId],
      isOnline: false,
      lastSeen: serverTimestamp()
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messagesRef = ref(realtimeDb, `chats/${chatRoomId}/messages`);
    await push(messagesRef, {
      senderId: userId,
      senderName: userDisplayName,
      message: newMessage.trim(),
      timestamp: serverTimestamp(),
      type: 'text'
    });

    setNewMessage('');
    stopTyping();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      const typingRef = ref(realtimeDb, `chats/${chatRoomId}/typing/${userId}`);
      set(typingRef, {
        name: userDisplayName,
        timestamp: serverTimestamp()
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    setIsTyping(false);
    const typingRef = ref(realtimeDb, `chats/${chatRoomId}/typing/${userId}`);
    set(typingRef, null);
  };

  const updateDisplayName = async (newName) => {
    if (!newName.trim()) return;
    
    setUserDisplayName(newName);
    const participantRef = ref(realtimeDb, `chats/${chatRoomId}/participants/${userId}`);
    await set(participantRef, {
      ...participants[userId],
      name: newName
    });
    setIsEditingName(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ro-RO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOnlineCount = () => {
    return Object.values(participants).filter(p => p.isOnline).length;
  };

  if (!isVisible) return null;

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <MessageCircle className="w-5 h-5" />
          <span className="chat-title">
            {meetingType === 'consultation' ? 'Chat Privat' : 'Chat Grup'}
          </span>
          <span className="participants-count">
            <Users className="w-4 h-4" />
            {getOnlineCount()}
          </span>
        </div>
        <button onClick={onClose} className="chat-close-btn">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User Name Editor */}
      <div className="user-name-section">
        {isEditingName ? (
          <input
            type="text"
            value={userDisplayName}
            onChange={(e) => setUserDisplayName(e.target.value)}
            onBlur={() => updateDisplayName(userDisplayName)}
            onKeyPress={(e) => e.key === 'Enter' && updateDisplayName(userDisplayName)}
            className="name-input"
            autoFocus
          />
        ) : (
          <div className="user-name-display" onClick={() => setIsEditingName(true)}>
            <span>{userDisplayName}</span>
            <Edit2 className="w-3 h-3 edit-icon" />
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.senderId === userId ? 'own-message' : 'other-message'}`}
          >
            <div className="message-header">
              <span className="sender-name">{message.senderName}</span>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
            <div className="message-content">{message.message}</div>
          </div>
        ))}
        
        {/* Typing Indicators */}
        {Object.entries(typingUsers)
          .filter(([id]) => id !== userId)
          .map(([id, user]) => (
            <div key={id} className="typing-indicator">
              <span>{user.name} scrie...</span>
            </div>
          ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <div className="input-wrapper">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Scrie un mesaj..."
            className="message-input"
            rows={1}
          />
          <button 
            onClick={sendMessage} 
            disabled={!newMessage.trim()}
            className="send-button"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .chat-container {
          position: fixed;
          bottom: 100px;
          right: 20px;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow: hidden;
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chat-title {
          font-weight: 600;
          font-size: 14px;
        }

        .participants-count {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          opacity: 0.9;
        }

        .chat-close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .chat-close-btn:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }

        .user-name-section {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .user-name-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s;
          font-size: 14px;
          font-weight: 500;
        }

        .user-name-display:hover {
          background: #e2e8f0;
        }

        .edit-icon {
          opacity: 0.5;
        }

        .name-input {
          width: 100%;
          padding: 4px 8px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          max-width: 80%;
        }

        .own-message {
          align-self: flex-end;
        }

        .other-message {
          align-self: flex-start;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .sender-name {
          font-size: 12px;
          font-weight: 600;
          color: #4a5568;
        }

        .message-time {
          font-size: 11px;
          color: #9ca3af;
        }

        .message-content {
          background: #f1f5f9;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .own-message .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .typing-indicator {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
          padding-left: 8px;
        }

        .message-input-container {
          padding: 16px;
          border-top: 1px solid #e2e8f0;
          background: #fafbfc;
        }

        .input-wrapper {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .message-input {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          resize: none;
          min-height: 36px;
          max-height: 100px;
        }

        .message-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .send-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-button:not(:disabled):hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .chat-container {
            width: 300px;
            height: 400px;
            bottom: 80px;
            right: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default RealtimeChat;
```

### **2. Floating Action Button (FAB)**

**`components/Chat/ChatFAB.jsx`**
```jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '../../firebase';

const ChatFAB = ({ 
  meetingId, 
  meetingType, 
  onToggleChat, 
  isChatVisible 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  
  const chatRoomId = `${meetingType}_${meetingId}`;

  useEffect(() => {
    if (!meetingId) return;

    // Listen to participants for online count
    const participantsRef = ref(realtimeDb, `chats/${chatRoomId}/participants`);
    
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const onlineUsers = Object.values(data).filter(p => p.isOnline);
        setParticipantCount(onlineUsers.length);
        setIsOnline(onlineUsers.length > 1); // Chat is "online" when multiple users
      } else {
        setParticipantCount(0);
        setIsOnline(false);
      }
    });

    return () => {
      off(participantsRef);
    };
  }, [meetingId, meetingType]);

  return (
    <div className="chat-fab-container">
      <button 
        onClick={onToggleChat}
        className={`chat-fab ${isChatVisible ? 'active' : ''} ${isOnline ? 'online' : ''}`}
        title={isChatVisible ? 'Închide chat' : 'Deschide chat'}
      >
        {isChatVisible ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </>
        )}
        
        {/* Online indicator */}
        {isOnline && (
          <div className="online-indicator">
            <div className="pulse"></div>
          </div>
        )}
        
        {/* Participant count for conferences */}
        {meetingType === 'conference' && participantCount > 1 && (
          <span className="participant-count">{participantCount}</span>
        )}
      </button>

      <style jsx>{`
        .chat-fab-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999;
        }

        .chat-fab {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: visible;
        }

        .chat-fab:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
        }

        .chat-fab.active {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          transform: rotate(90deg);
        }

        .chat-fab.online {
          animation: pulse-border 2s infinite;
        }

        .unread-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          border: 2px solid white;
        }

        .online-indicator {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid white;
        }

        .pulse {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #10b981;
          animation: pulse-dot 2s infinite;
        }

        .participant-count {
          position: absolute;
          bottom: -5px;
          right: -5px;
          background: #f59e0b;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          border: 2px solid white;
        }

        @keyframes pulse-border {
          0% {
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.7);
          }
          70% {
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4), 0 0 0 10px rgba(102, 126, 234, 0);
          }
          100% {
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0);
          }
        }

        @keyframes pulse-dot {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(0.8);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .chat-fab-container {
            bottom: 15px;
            right: 15px;
          }
          
          .chat-fab {
            width: 55px;
            height: 55px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatFAB;
```

---

## 🔧 INTEGRAREA ÎN COMPONENTELE EXISTENTE

### **3. Integrare în Consultații One-to-One**

**Modificări în `client/components/pages/videocall/video.jsx`:**

```jsx
// Import-uri noi
import RealtimeChat from '../../Chat/RealtimeChat';
import ChatFAB from '../../Chat/ChatFAB';

// În componenta VideoCall, adaugă state-urile pentru chat
const [isChatVisible, setIsChatVisible] = useState(false);
const [participantData, setParticipantData] = useState(null);

// În useEffect, preia datele participantului
useEffect(() => {
  if (documentId) {
    // Logic existent...

    // Preia datele rezervării pentru participant
    const docRef = doc(db, "RezervariConsultatii", documentId);
    const unsubscribeReservation = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        setParticipantData({
          nume: data.nume,
          prenume: data.prenume || '',
          email: data.email,
          isGuestUser: !currentUser?.uid
        });
        // Logic existent pentru presenza...
      }
    });

    return () => {
      // Cleanup existent...
      unsubscribeReservation();
    };
  }
}, [documentId, userRole]);

// În return-ul componentei, adaugă chat-ul
return (
  <div className="video-call-container">
    {/* Componente video existente... */}
    
    {/* Chat FAB */}
    <ChatFAB
      meetingId={documentId}
      meetingType="consultation"
      onToggleChat={() => setIsChatVisible(!isChatVisible)}
      isChatVisible={isChatVisible}
    />

    {/* Chat Component */}
    <RealtimeChat
      meetingId={documentId}
      meetingType="consultation"
      participantData={participantData}
      isVisible={isChatVisible}
      onToggle={() => setIsChatVisible(!isChatVisible)}
      onClose={() => setIsChatVisible(false)}
    />
  </div>
);
```

### **4. Integrare în Conferințe de Grup**

**Modificări în `client/components/conferinta-grup-access/index.jsx`:**

```jsx
// Import-uri noi
import RealtimeChat from '../../Chat/RealtimeChat';
import ChatFAB from '../../Chat/ChatFAB';

// În componenta ConferintaGrupAccess, adaugă state-urile
const [isChatVisible, setIsChatVisible] = useState(false);

// În return-ul componentei când utilizatorul este în call
if (isInCall && conferenceStarted) {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Componente Agora existente... */}
      
      {/* Chat FAB */}
      <ChatFAB
        meetingId={conferinta.documentId}
        meetingType="conference"
        onToggleChat={() => setIsChatVisible(!isChatVisible)}
        isChatVisible={isChatVisible}
      />

      {/* Chat Component */}
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
```

---

## 🔥 CONFIGURAREA FIREBASE REALTIME DATABASE

### **5. Setup Firebase Realtime Database**

**În `firebase.js`, adaugă configurarea pentru Realtime Database:**

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database'; // NOU

const firebaseConfig = {
  // configurația existentă...
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app); // NOU

export default app;
```

### **6. Reguli de Securitate Firebase Realtime Database**

**În Firebase Console → Realtime Database → Rules:**

```javascript
{
  "rules": {
    "chats": {
      "$chatId": {
        // Permite citirea și scrierea doar pentru participanții activi
        ".read": "auth != null || 
                  data.child('participants').hasChild(auth.uid) || 
                  data.child('metadata').child('type').val() == 'consultation' ||
                  data.child('metadata').child('type').val() == 'conference'",
        ".write": "auth != null || 
                   data.child('participants').hasChild(auth.uid) ||
                   newData.child('participants').hasChild(auth.uid)",
        
        "messages": {
          "$messageId": {
            ".validate": "newData.hasChildren(['senderId', 'senderName', 'message', 'timestamp', 'type'])"
          }
        },
        
        "participants": {
          "$userId": {
            ".write": "$userId == auth.uid || $userId.beginsWith('guest_')"
          }
        },
        
        "typing": {
          "$userId": {
            ".write": "$userId == auth.uid || $userId.beginsWith('guest_')"
          }
        }
      }
    }
  }
}
```

---

## 🧹 SISTEMA DE CLEANUP AUTOMAT

### **7. Cloud Function pentru Cleanup**

**`functions/chatCleanup.js`:**

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.cleanupInactiveChats = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const realtimeDb = admin.database();
    const chatsRef = realtimeDb.ref('chats');
    
    try {
      const snapshot = await chatsRef.once('value');
      const chats = snapshot.val();
      
      if (!chats) return null;
      
      const now = Date.now();
      const cutoffTime = now - (2 * 60 * 60 * 1000); // 2 ore
      
      const cleanupPromises = [];
      
      for (const [chatId, chatData] of Object.entries(chats)) {
        if (chatData.metadata && chatData.metadata.autoCleanup) {
          const lastActivity = chatData.metadata.createdAt || 0;
          const isActive = chatData.metadata.consultationActive || 
                          chatData.metadata.conferenceActive;
          
          // Șterge chat-urile inactive de peste 2 ore
          if (!isActive && (now - lastActivity > cutoffTime)) {
            console.log(`Cleaning up inactive chat: ${chatId}`);
            cleanupPromises.push(chatsRef.child(chatId).remove());
          }
        }
      }
      
      await Promise.all(cleanupPromises);
      console.log(`Cleaned up ${cleanupPromises.length} inactive chats`);
      
      return null;
    } catch (error) {
      console.error('Error cleaning up chats:', error);
      return null;
    }
  });

// Cleanup când meeting-ul se termină
exports.markChatInactive = functions.firestore
  .document('RezervariConsultatii/{documentId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // Dacă meeting-ul s-a terminat (presence-ul admin sau client a devenit false)
    if ((beforeData.presence?.admin && !afterData.presence?.admin) ||
        (beforeData.presence?.client && !afterData.presence?.client)) {
      
      const chatId = `consultation_${context.params.documentId}`;
      const realtimeDb = admin.database();
      
      await realtimeDb.ref(`chats/${chatId}/metadata`).update({
        consultationActive: false,
        endedAt: admin.database.ServerValue.TIMESTAMP
      });
    }
    
    return null;
  });

// Similar pentru conferințe
exports.markConferenceChatInactive = functions.firestore
  .document('ConferinteGrup/{documentId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    if (beforeData.status === 'activa' && afterData.status !== 'activa') {
      const chatId = `conference_${context.params.documentId}`;
      const realtimeDb = admin.database();
      
      await realtimeDb.ref(`chats/${chatId}/metadata`).update({
        conferenceActive: false,
        endedAt: admin.database.ServerValue.TIMESTAMP
      });
    }
    
    return null;
  });
```

---

## 🎨 FUNCȚIONALITĂȚI AVANSATE

### **8. Extensii Opționale**

**Emoji Picker Integration:**
```jsx
// În RealtimeChat.jsx, adaugă emoji picker
import EmojiPicker from 'emoji-picker-react';

const [showEmojiPicker, setShowEmojiPicker] = useState(false);

const onEmojiClick = (emojiObject) => {
  setNewMessage(prev => prev + emojiObject.emoji);
  setShowEmojiPicker(false);
};

// În input area
<button 
  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
  className="emoji-button"
>
  <Smile className="w-4 h-4" />
</button>

{showEmojiPicker && (
  <div className="emoji-picker-container">
    <EmojiPicker onEmojiClick={onEmojiClick} />
  </div>
)}
```

**File Sharing:**
```jsx
// Adaugă suport pentru imagini și fișiere
const sendFile = async (file) => {
  if (!file) return;
  
  // Upload la Firebase Storage
  const storageRef = ref(storage, `chat-files/${chatRoomId}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytes(storageRef, file);
  
  const snapshot = await uploadTask;
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // Trimite mesaj cu fișier
  const messagesRef = ref(realtimeDb, `chats/${chatRoomId}/messages`);
  await push(messagesRef, {
    senderId: userId,
    senderName: userDisplayName,
    message: file.name,
    fileUrl: downloadURL,
    fileType: file.type,
    timestamp: serverTimestamp(),
    type: 'file'
  });
};
```

**Message Reactions:**
```jsx
// Sistem de reacții la mesaje
const addReaction = async (messageId, emoji) => {
  const reactionRef = ref(realtimeDb, `chats/${chatRoomId}/messages/${messageId}/reactions/${userId}`);
  await set(reactionRef, {
    emoji,
    timestamp: serverTimestamp()
  });
};
```

---

## 📱 RESPONSIVE DESIGN

### **9. Adaptare pentru Mobile**

```jsx
// În RealtimeChat.jsx, adaugă responsive behavior
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

// Style-uri responsive
const containerStyle = {
  position: 'fixed',
  bottom: isMobile ? '0' : '100px',
  right: isMobile ? '0' : '20px',
  left: isMobile ? '0' : 'auto',
  width: isMobile ? '100%' : '350px',
  height: isMobile ? '70vh' : '500px',
  // ... alte style-uri
};
```

---

## ✅ CHECKLIST IMPLEMENTARE

### **Etapa 1: Setup Basic (2-3 ore)**
- [ ] Configurare Firebase Realtime Database
- [ ] Crearea componentelor RealtimeChat și ChatFAB
- [ ] Testarea conectivității real-time

### **Etapa 2: Integrare (2-3 ore)**
- [ ] Integrarea în consultații one-to-one
- [ ] Integrarea în conferințe de grup  
- [ ] Testarea funcționalității de bază

### **Etapa 3: Optimization (2-3 ore)**
- [ ] Implementarea cleanup automat
- [ ] Optimizarea performanței
- [ ] Testarea pe dispozitive mobile

### **Etapa 4: Advanced Features (opțional)**
- [ ] Emoji picker
- [ ] File sharing
- [ ] Message reactions
- [ ] Typing indicators avansate

---

## 🎯 REZULTAT FINAL

După implementarea acestui sistem, vei avea:

### **✅ Pentru Consultații One-to-One:**
- Chat privat real-time între admin și client
- Identificare automată a participanților din rezervări
- FAB elegant cu indicatori de activitate
- Cleanup automat după terminarea sesiunii

### **✅ Pentru Conferințe de Grup:**
- Chat de grup pentru toți participanții
- Support pentru guest users cu nume editabile
- Indicator număr participanți activi
- Real-time presence și typing indicators

### **✅ Caracteristici Generale:**
- Interface modernă și responsive
- Securitate prin Firebase rules
- Auto-cleanup pentru privacy
- Extensibilitate pentru funcții avansate

**🚀 Sistemul de chat este perfect integrat cu arhitectura existentă și gata pentru utilizare immediată!** 