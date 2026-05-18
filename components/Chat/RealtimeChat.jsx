import React, { useState, useEffect, useRef } from 'react';
import { 
  ref, 
  push, 
  onValue, 
  off, 
  serverTimestamp, 
  onDisconnect,
  set,
  update,
  query as rtdbQuery,
  limitToLast
} from 'firebase/database';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../firebase';
import { ADMIN_UIDS } from '../../data/constants';

// Iconițe simple (poți înlocui cu Lucide React sau alte librării)
const MessageCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
  </svg>
);

const Send = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m22 2-7 20-4-9-9-4z"/>
  </svg>
);

const X = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m18 6 -12 12"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const Edit2 = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/>
  </svg>
);

const Users = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m22 21-3-3 3-3"/>
  </svg>
);

const RealtimeChat = ({ 
  meetingId, 
  meetingType, // 'consultation' | 'conference'
  participantData,
  isVisible,
  onToggle,
  onClose 
}) => {
  console.log("🚀 [RealtimeChat] Component started rendering with props:", {
    meetingId,
    meetingType,
    isVisible,
    participantData: participantData ? "PROVIDED" : "NULL",
    hasCurrentUser: !!useAuth().currentUser
  });

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
  const listenerUnsubscribesRef = useRef([]);
  const chatRoomId = `${meetingType}_${meetingId}`;
  
  // Determine user role and initial name
  const userRole = ADMIN_UIDS.includes(currentUser?.uid) ? 'admin' : 
                   meetingType === 'consultation' ? 'client' : 'participant';
  
  // FIXED: Force unique identifiers to prevent admin/user confusion
  const userId = userRole === 'admin' 
    ? `admin_${currentUser?.uid || 'default'}` 
    : currentUser?.uid || `guest_${Date.now()}`;

  useEffect(() => {
    if (meetingId) {
      initializeChat();
    }
    return () => cleanup();
  }, [meetingId, meetingType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    // Verifică dacă Firebase Realtime Database este disponibil
    if (typeof window === 'undefined') {
      console.log("⚠️ [RealtimeChat] Window undefined, skipping initialization");
      return;
    }
    
    console.log("🚀 [RealtimeChat] Starting chat initialization...");
    console.log("🔧 [RealtimeChat] Config:", {
      meetingId,
      meetingType,
      chatRoomId,
      userId,
      userRole,
      participantData: participantData ? "PROVIDED" : "MISSING"
    });

    // Test Firebase database connection
    console.log("🔌 [RealtimeChat] Testing database connection...");
    console.log("🔌 [RealtimeChat] Database object:", database);
    console.log("🔌 [RealtimeChat] Database app:", database.app);
    
    // Check environment variables
    console.log("🌍 [RealtimeChat] Environment check:", {
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasDatabaseUrl: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
    
    try {
      // Folosește Firebase Realtime Database
      const realtimeDb = database;
      listenerUnsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      listenerUnsubscribesRef.current = [];
      
      // Test connection first
      console.log("🧪 [RealtimeChat] Testing database write/read...");
      const testRef = ref(realtimeDb, `test/${Date.now()}`);
      await set(testRef, { test: true, timestamp: Date.now() });
      console.log("✅ [RealtimeChat] Database write test successful!");
      
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
      
      console.log("👤 [RealtimeChat] Display name set to:", displayName);
      setUserDisplayName(displayName);

      // Initialize chat room references
      const chatRef = ref(realtimeDb, `chats/${chatRoomId}`);
      const participantRef = ref(realtimeDb, `chats/${chatRoomId}/participants/${userId}`);
      const messagesRef = ref(realtimeDb, `chats/${chatRoomId}/messages`);
      const participantsRef = ref(realtimeDb, `chats/${chatRoomId}/participants`);
      const typingRef = ref(realtimeDb, `chats/${chatRoomId}/typing`);

      console.log("🔗 [RealtimeChat] Setting up database references for:", {
        chatPath: `chats/${chatRoomId}`,
        participantPath: `chats/${chatRoomId}/participants/${userId}`,
        messagesPath: `chats/${chatRoomId}/messages`
      });

      // Set user as online
      const participantInfo = {
        name: displayName,
        role: userRole,
        isOnline: true,
        lastSeen: serverTimestamp(),
        isGuest: !currentUser?.uid || participantData?.isGuestUser || false
      };
      
      console.log("✅ [RealtimeChat] Setting participant online:", participantInfo);
      await set(participantRef, participantInfo);

      // Set user offline on disconnect
      onDisconnect(participantRef).update({
        isOnline: false,
        lastSeen: serverTimestamp()
      });

      console.log("📨 [RealtimeChat] Setting up messages listener...");
      // Listen to messages
      const recentMessagesQuery = rtdbQuery(messagesRef, limitToLast(50));
      const unsubscribeMessages = onValue(recentMessagesQuery, (snapshot) => {
        const data = snapshot.val();
        console.log("💬 [RealtimeChat] Messages received:", data);
        if (data) {
          const messagesList = Object.entries(data)
            .map(([key, value]) => ({ id: key, ...value }))
            .sort((a, b) => {
              const timeA = new Date(a.timestamp || 0).getTime();
              const timeB = new Date(b.timestamp || 0).getTime();
              return timeA - timeB;
            });
          console.log("📋 [RealtimeChat] Processed messages:", messagesList);
          setMessages(messagesList);
        } else {
          console.log("📭 [RealtimeChat] No messages found");
          setMessages([]);
        }
      });
      listenerUnsubscribesRef.current.push(unsubscribeMessages);

      console.log("👥 [RealtimeChat] Setting up participants listener...");
      // Listen to participants
      const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
        const data = snapshot.val();
        console.log("👥 [RealtimeChat] Participants received:", data);
        setParticipants(data || {});
      });
      listenerUnsubscribesRef.current.push(unsubscribeParticipants);

      console.log("⌨️ [RealtimeChat] Setting up typing listener...");
      // Listen to typing indicators
      const unsubscribeTyping = onValue(typingRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Filtrează utilizatorul curent din typing indicators
          const filteredTyping = Object.entries(data)
            .filter(([id]) => id !== userId)
            .reduce((acc, [id, user]) => {
              acc[id] = user;
              return acc;
            }, {});
          console.log("⌨️ [RealtimeChat] Typing users:", filteredTyping);
          setTypingUsers(filteredTyping);
        } else {
          setTypingUsers({});
        }
      });
      listenerUnsubscribesRef.current.push(unsubscribeTyping);

      // Initialize metadata
      const metadataRef = ref(realtimeDb, `chats/${chatRoomId}/metadata`);
      const metadataUpdate = {
        type: meetingType,
        createdAt: serverTimestamp(),
        [`${meetingType}Active`]: true,
        autoCleanup: true,
        lastActivity: serverTimestamp()
      };
      
      console.log("📊 [RealtimeChat] Updating metadata:", metadataUpdate);
      await update(metadataRef, metadataUpdate);

      console.log("🎉 [RealtimeChat] Chat initialization completed successfully!");

    } catch (error) {
      console.error('💥 [RealtimeChat] Error initializing chat:', error);
    }
  };

  const cleanup = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const realtimeDb = database;
      
      // Remove listeners
      listenerUnsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      listenerUnsubscribesRef.current = [];
      const chatRef = ref(realtimeDb, `chats/${chatRoomId}`);
      off(chatRef);
      
      // Set user offline
      const participantRef = ref(realtimeDb, `chats/${chatRoomId}/participants/${userId}`);
      await update(participantRef, {
        isOnline: false,
        lastSeen: serverTimestamp()
      });

      // Clear typing indicator
      const typingRef = ref(realtimeDb, `chats/${chatRoomId}/typing/${userId}`);
      await set(typingRef, null);
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      console.log("⚠️ [RealtimeChat] Empty message, not sending");
      return;
    }

    console.log("📤 [RealtimeChat] Sending message:", {
      message: newMessage.trim(),
      chatRoomId,
      userId,
      userDisplayName
    });

    try {
      const realtimeDb = database;

      const messagesRef = ref(realtimeDb, `chats/${chatRoomId}/messages`);
      const messageData = {
        senderId: userId,
        senderName: userDisplayName,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        type: 'text'
      };
      
      console.log("💾 [RealtimeChat] Pushing message to database:", messageData);
      await push(messagesRef, messageData);

      // Update last activity
      const metadataRef = ref(realtimeDb, `chats/${chatRoomId}/metadata`);
      await update(metadataRef, {
        lastActivity: serverTimestamp()
      });

      console.log("✅ [RealtimeChat] Message sent successfully");
      setNewMessage('');
      stopTyping();
    } catch (error) {
      console.error('💥 [RealtimeChat] Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      try {
        const realtimeDb = database;
        
        const typingRef = ref(realtimeDb, `chats/${chatRoomId}/typing/${userId}`);
        await set(typingRef, {
          name: userDisplayName,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error('Error setting typing indicator:', error);
      }
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

  const stopTyping = async () => {
    setIsTyping(false);
    try {
      const realtimeDb = database;
      
      const typingRef = ref(realtimeDb, `chats/${chatRoomId}/typing/${userId}`);
      await set(typingRef, null);
    } catch (error) {
      console.error('Error removing typing indicator:', error);
    }
  };

  const updateDisplayName = async (newName) => {
    if (!newName.trim()) return;
    
    setUserDisplayName(newName);
    
    try {
      const realtimeDb = database;
      
      const participantRef = ref(realtimeDb, `chats/${chatRoomId}/participants/${userId}`);
      await update(participantRef, {
        name: newName
      });
    } catch (error) {
      console.error('Error updating name:', error);
    }
    
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

  if (!isVisible) {
    console.log("🚫 [RealtimeChat] Not visible, returning null");
    return null;
  }

  console.log("🎯 [RealtimeChat] About to render chat UI, isVisible:", isVisible);

  return (
    <>
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <MessageCircle />
            <span className="chat-title">
              {meetingType === 'consultation' ? 'Chat Privat' : 'Chat Grup'}
            </span>
            <span className="participants-count">
              <Users />
              {getOnlineCount()}
            </span>
          </div>
          <button onClick={onClose} className="chat-close-btn">
            <X />
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
              <Edit2 />
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
          {Object.entries(typingUsers).map(([id, user]) => (
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
              <Send />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .chat-container {
          position: absolute;
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
    </>
  );
};

export default RealtimeChat; 
