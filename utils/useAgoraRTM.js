import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTM from 'agora-rtm-sdk';

const useAgoraRTM = ({ appId, channelName, username, onMessage }) => {
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const clientRef = useRef(null);
  const channelRef = useRef(null);

  // Initialize RTM client
  const initializeClient = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📧 [RTM] Inițializare client RTM...");
      
      const rtmClient = AgoraRTM.createInstance(appId);
      clientRef.current = rtmClient;
      setClient(rtmClient);

      // Set up client event listeners
      rtmClient.on('ConnectionStateChanged', (newState, reason) => {
        console.log(`📧 [RTM] Connection state changed: ${newState}, reason: ${reason}`);
        setIsConnected(newState === 'CONNECTED');
      });

      rtmClient.on('MessageFromPeer', (message, peerId) => {
        console.log(`📧 [RTM] Message from peer ${peerId}:`, message.text);
        // Handle direct messages if needed
      });

      console.log("✅ [RTM] Client RTM inițializat cu succes");
      return rtmClient;
      
    } catch (error) {
      console.error("💥 [RTM] Eroare la inițializarea clientului:", error);
      setError("Eroare la inițializarea chat-ului");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [appId]);

  // Login to RTM
  const login = useCallback(async (rtmClient) => {
    try {
      console.log(`📧 [RTM] Login cu username: ${username}`);
      
      await rtmClient.login({ uid: username });
      setIsConnected(true);
      
      console.log("✅ [RTM] Login RTM reușit");
      return true;
      
    } catch (error) {
      console.error("💥 [RTM] Eroare la login RTM:", error);
      setError("Eroare la conectarea la chat");
      throw error;
    }
  }, [username]);

  // Join channel
  const joinChannel = useCallback(async (rtmClient) => {
    try {
      console.log(`📧 [RTM] Join canal: ${channelName}`);
      
      const rtmChannel = rtmClient.createChannel(channelName);
      channelRef.current = rtmChannel;
      setChannel(rtmChannel);

      // Set up channel event listeners
      rtmChannel.on('ChannelMessage', (message, memberId) => {
        console.log(`📧 [RTM] Message în canal de la ${memberId}:`, message.text);
        
        const newMessage = {
          id: Date.now() + Math.random(),
          text: message.text,
          sender: memberId,
          timestamp: new Date(),
          isOwn: memberId === username
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Call external callback if provided
        if (onMessage) {
          onMessage(newMessage);
        }
      });

      rtmChannel.on('MemberJoined', (memberId) => {
        console.log(`📧 [RTM] Membru nou în canal: ${memberId}`);
        
        const joinMessage = {
          id: Date.now() + Math.random(),
          text: `${memberId} s-a alăturat conversației`,
          sender: 'system',
          timestamp: new Date(),
          isSystem: true
        };
        
        setMessages(prev => [...prev, joinMessage]);
      });

      rtmChannel.on('MemberLeft', (memberId) => {
        console.log(`📧 [RTM] Membru a părăsit canalul: ${memberId}`);
        
        const leaveMessage = {
          id: Date.now() + Math.random(),
          text: `${memberId} a părăsit conversația`,
          sender: 'system',
          timestamp: new Date(),
          isSystem: true
        };
        
        setMessages(prev => [...prev, leaveMessage]);
      });

      await rtmChannel.join();
      setIsJoined(true);
      
      console.log("✅ [RTM] Join canal RTM reușit");
      
      // Add welcome message
      const welcomeMessage = {
        id: Date.now(),
        text: `Bun venit în chat! Ești conectat ca ${username}`,
        sender: 'system',
        timestamp: new Date(),
        isSystem: true
      };
      
      setMessages(prev => [...prev, welcomeMessage]);
      
      return rtmChannel;
      
    } catch (error) {
      console.error("💥 [RTM] Eroare la join canal:", error);
      setError("Eroare la alăturarea la chat");
      throw error;
    }
  }, [channelName, username, onMessage]);

  // Send message
  const sendMessage = useCallback(async (messageText) => {
    if (!channelRef.current || !messageText.trim()) {
      console.warn("📧 [RTM] Nu se poate trimite mesajul - canal sau text lipsă");
      return false;
    }

    try {
      console.log(`📧 [RTM] Trimite mesaj: ${messageText}`);
      
      await channelRef.current.sendMessage({ text: messageText.trim() });
      
      // Add own message to state
      const ownMessage = {
        id: Date.now() + Math.random(),
        text: messageText.trim(),
        sender: username,
        timestamp: new Date(),
        isOwn: true
      };
      
      setMessages(prev => [...prev, ownMessage]);
      
      console.log("✅ [RTM] Mesaj trimis cu succes");
      return true;
      
    } catch (error) {
      console.error("💥 [RTM] Eroare la trimiterea mesajului:", error);
      setError("Eroare la trimiterea mesajului");
      return false;
    }
  }, [username]);

  // Connect (initialize + login + join)
  const connect = useCallback(async () => {
    if (isConnected && isJoined) {
      console.log("📧 [RTM] Deja conectat și în canal");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let rtmClient = clientRef.current;
      
      if (!rtmClient) {
        rtmClient = await initializeClient();
      }
      
      if (!isConnected) {
        await login(rtmClient);
      }
      
      if (!isJoined) {
        await joinChannel(rtmClient);
      }
      
      console.log("✅ [RTM] Conectare completă RTM");
      
    } catch (error) {
      console.error("💥 [RTM] Eroare la conectare:", error);
      setError("Eroare la conectarea la chat");
    } finally {
      setLoading(false);
    }
  }, [isConnected, isJoined, initializeClient, login, joinChannel]);

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      console.log("📧 [RTM] Deconectare RTM...");
      
      if (channelRef.current) {
        await channelRef.current.leave();
        channelRef.current = null;
        setChannel(null);
        setIsJoined(false);
      }
      
      if (clientRef.current) {
        await clientRef.current.logout();
        clientRef.current = null;
        setClient(null);
        setIsConnected(false);
      }
      
      setMessages([]);
      setError(null);
      
      console.log("✅ [RTM] Deconectare RTM completă");
      
    } catch (error) {
      console.error("💥 [RTM] Eroare la deconectare:", error);
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    client,
    channel,
    messages,
    isConnected,
    isJoined,
    loading,
    error,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    
    // Status
    isReady: isConnected && isJoined
  };
};

export default useAgoraRTM; 