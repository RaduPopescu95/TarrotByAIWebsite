import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatPanel.module.css';

const ChatPanel = ({ 
  messages = [], 
  onSendMessage, 
  isConnected = false, 
  loading = false, 
  error = null,
  username = '',
  isVisible = true,
  onToggleVisibility
}) => {
  const [messageText, setMessageText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat becomes visible
  useEffect(() => {
    if (isVisible && isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible, isExpanded]);

  const handleSendMessage = () => {
    if (messageText.trim() && onSendMessage) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageClass = (message) => {
    if (message.isSystem) return `${styles.message} ${styles.systemMessage}`;
    if (message.isOwn) return `${styles.message} ${styles.ownMessage}`;
    return `${styles.message} ${styles.otherMessage}`;
  };

  if (!isVisible) {
    return (
      <div className={styles.chatPanelHidden}>
        <button 
          className={styles.chatToggleBtn}
          onClick={onToggleVisibility}
          title="Afișează chat-ul"
        >
          <i className="fa fa-comments"></i>
          <span className={styles.chatBadge}>
            {messages.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.chatPanel} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatTitle}>
          <i className="fa fa-comments me-2"></i>
          <span>Chat Conferință</span>
          <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
            <i className={`fa fa-circle ${isConnected ? 'text-success' : 'text-danger'}`}></i>
          </div>
        </div>
        <div className={styles.chatControls}>
          <button 
            className={styles.chatControlBtn}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimizează" : "Maximizează"}
          >
            <i className={`fa fa-${isExpanded ? 'minus' : 'plus'}`}></i>
          </button>
          <button 
            className={styles.chatControlBtn}
            onClick={onToggleVisibility}
            title="Ascunde chat-ul"
          >
            <i className="fa fa-times"></i>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <>
          {/* Messages Area */}
          <div className={styles.chatMessages}>
            {error && (
              <div className={styles.errorMessage}>
                <i className="fa fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
            
            {loading && (
              <div className={styles.loadingMessage}>
                <i className="fa fa-spinner fa-spin me-2"></i>
                Conectare la chat...
              </div>
            )}

            {!isConnected && !loading && (
              <div className={styles.infoMessage}>
                <i className="fa fa-info-circle me-2"></i>
                Chat indisponibil - reconectare...
              </div>
            )}

            {messages.length === 0 && isConnected && !loading && (
              <div className={styles.emptyMessage}>
                <i className="fa fa-comments me-2"></i>
                Niciun mesaj încă. Începe conversația!
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={getMessageClass(message)}>
                {!message.isSystem && !message.isOwn && (
                  <div className={styles.messageSender}>{message.sender}</div>
                )}
                <div className={styles.messageContent}>{message.text}</div>
                <div className={styles.messageTime}>{formatTime(message.timestamp)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={styles.chatInputArea}>
            <div className={styles.chatInputContainer}>
              <input
                ref={inputRef}
                type="text"
                className={styles.chatInput}
                placeholder={isConnected ? "Scrie un mesaj..." : "Chat indisponibil"}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isConnected || loading}
                maxLength={1000}
              />
              <button
                className={styles.chatSendBtn}
                onClick={handleSendMessage}
                disabled={!messageText.trim() || !isConnected || loading}
                title="Trimite mesaj (Enter)"
              >
                <i className="fa fa-paper-plane"></i>
              </button>
            </div>
            {isConnected && (
              <div className={styles.chatStatus}>
                <span className={styles.onlineIndicator}>
                  <i className="fa fa-circle text-success"></i>
                  Conectat ca {username}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPanel; 