import React, { useState, useEffect } from 'react';
import { database } from '../../firebase';

// Simple SVG Icons
const MessageCircle = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
  </svg>
);

const X = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m18 6 -12 12"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const ChatFAB = ({ 
  meetingId, 
  meetingType, 
  onToggleChat, 
  isChatVisible 
}) => {
  console.log("🚀 [ChatFAB] Component started rendering with props:", {
    meetingId,
    meetingType,
    isChatVisible,
    onToggleChat: typeof onToggleChat
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  
  const chatRoomId = `${meetingType}_${meetingId}`;

  console.log("🟦 [ChatFAB] Initialized with:", { 
    meetingId, 
    meetingType, 
    chatRoomId,
    isChatVisible
  });

  useEffect(() => {
    if (!meetingId) {
      console.log("🔴 [ChatFAB] No meetingId provided, returning");
      return;
    }

    console.log("🟢 [ChatFAB] Setting up listeners for chatRoomId:", chatRoomId);

    let unsubscribeParticipants = () => {};

    const initializeListeners = async () => {
      try {
        if (typeof window === 'undefined') {
          console.log("⚠️ [ChatFAB] Window undefined, skipping setup");
          return;
        }
        
        console.log("📡 [ChatFAB] Importing Firebase functions...");
        // Import Firebase Realtime Database functions
        const { ref, onValue } = await import('firebase/database');
        const realtimeDb = database;

        console.log("📊 [ChatFAB] Setting up participants listener...");
        // Listen to participants for online count
        const participantsRef = ref(realtimeDb, `chats/${chatRoomId}/participants`);
        
        unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
          const data = snapshot.val();
          console.log("👥 [ChatFAB] Participants data received:", data);
          
          if (data) {
            const onlineUsers = Object.values(data).filter(p => p.isOnline);
            console.log("✅ [ChatFAB] Online users:", onlineUsers);
            setParticipantCount(onlineUsers.length);
            setIsOnline(onlineUsers.length > 0); // Changed from > 1 to > 0 for admin visibility
            console.log(`📈 [ChatFAB] Updated counts - Participants: ${onlineUsers.length}, IsOnline: ${onlineUsers.length > 0}`);
          } else {
            console.log("📊 [ChatFAB] No participants data");
            setParticipantCount(0);
            setIsOnline(false);
          }
        });

      } catch (error) {
        console.error('💥 [ChatFAB] Error setting up chat FAB listeners:', error);
      }
    };

    initializeListeners();

    return () => {
      console.log("🧹 [ChatFAB] Cleaning up listeners for:", chatRoomId);
      unsubscribeParticipants();
    };
  }, [meetingId, meetingType, chatRoomId]);

  if (!meetingId) {
    console.log("🚫 [ChatFAB] Rendering null - no meetingId");
    return null;
  }

  console.log("🎨 [ChatFAB] Rendering FAB with state:", {
    participantCount,
    isOnline,
    isChatVisible,
    unreadCount
  });

  console.log("🎯 [ChatFAB] About to render JSX, final check:", {
    meetingId,
    chatRoomId,
    willRender: true
  });

  return (
    <>
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
          {isOnline && !isChatVisible && (
            <div className="online-indicator">
              <div className="pulse"></div>
            </div>
          )}
          
          {/* Participant count for conferences */}
          {meetingType === 'conference' && participantCount > 1 && !isChatVisible && (
            <span className="participant-count">{participantCount}</span>
          )}
        </button>
      </div>

      <style jsx>{`
        .chat-fab-container {
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 5000;
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
          
          .unread-badge {
            width: 20px;
            height: 20px;
            font-size: 10px;
          }
          
          .participant-count {
            width: 18px;
            height: 18px;
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
};

export default ChatFAB; 