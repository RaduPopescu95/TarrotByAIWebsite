import { ref, remove, update, serverTimestamp, onValue, off } from 'firebase/database';
import { doc, onSnapshot } from 'firebase/firestore';
import { database, db } from '../firebase';

/**
 * Marchează un chat ca inactiv când meeting-ul se termină
 * @param {string} chatId - ID-ul chat-ului (ex: "consultation_documentId" sau "conference_documentId")
 * @param {string} meetingType - Tipul meeting-ului ("consultation" sau "conference")
 */
export const markChatInactive = async (chatId, meetingType) => {
  try {
    const metadataRef = ref(database, `chats/${chatId}/metadata`);
    await update(metadataRef, {
      [`${meetingType}Active`]: false,
      endedAt: serverTimestamp(),
      lastActivity: serverTimestamp()
    });
    
    console.log(`✅ [CHAT] Chat marcat ca inactiv: ${chatId}`);
  } catch (error) {
    console.error('❌ [CHAT] Eroare la marcarea chat-ului ca inactiv:', error);
  }
};

/**
 * Șterge un chat complet din Realtime Database
 * @param {string} chatId - ID-ul chat-ului de șters
 */
export const deleteChatRoom = async (chatId) => {
  try {
    const chatRef = ref(database, `chats/${chatId}`);
    await remove(chatRef);
    
    console.log(`🗑️ [CHAT] Chat șters: ${chatId}`);
  } catch (error) {
    console.error('❌ [CHAT] Eroare la ștergerea chat-ului:', error);
  }
};

/**
 * Cleanup automat pentru chat-urile inactive mai vechi de X ore
 * @param {number} hoursOld - Numărul de ore după care să se șteargă chat-urile inactive (default: 2)
 */
export const cleanupInactiveChats = async (hoursOld = 2) => {
  try {
    const chatsRef = ref(database, 'chats');
    
    return new Promise((resolve) => {
      onValue(chatsRef, async (snapshot) => {
        const chats = snapshot.val();
        if (!chats) {
          resolve(0);
          return;
        }

        const now = Date.now();
        const cutoffTime = now - (hoursOld * 60 * 60 * 1000); // Convertește ore în millisecunde
        
        const cleanupPromises = [];
        let cleanedCount = 0;

        for (const [chatId, chatData] of Object.entries(chats)) {
          if (chatData.metadata && chatData.metadata.autoCleanup) {
            const lastActivity = chatData.metadata.lastActivity || chatData.metadata.createdAt || 0;
            const isActive = chatData.metadata.consultationActive || 
                           chatData.metadata.conferenceActive;
            
            // Șterge chat-urile inactive de peste X ore
            if (!isActive && (now - lastActivity > cutoffTime)) {
              console.log(`🧹 [CHAT] Cleanup chat inactiv: ${chatId}`);
              cleanupPromises.push(deleteChatRoom(chatId));
              cleanedCount++;
            }
          }
        }
        
        await Promise.all(cleanupPromises);
        console.log(`✅ [CHAT] Cleanup completat: ${cleanedCount} chat-uri șterse`);
        
        // Dezabonează listener-ul
        off(chatsRef);
        resolve(cleanedCount);
      }, { onlyOnce: true });
    });
  } catch (error) {
    console.error('❌ [CHAT] Eroare la cleanup chat-uri:', error);
    return 0;
  }
};

/**
 * Monitorizează statusul unei consultații și marchează chat-ul ca inactiv când se termină
 * @param {string} documentId - ID-ul documentului consultației
 * @param {Function} onChatInactive - Callback apelat când chat-ul devine inactiv (opțional)
 */
export const monitorConsultationForChatCleanup = (documentId, onChatInactive = null) => {
  const docRef = doc(db, "RezervariConsultatii", documentId);
  const chatId = `consultation_${documentId}`;
  
  const unsubscribe = onSnapshot(docRef, async (snapshot) => {
    const data = snapshot.data();
    
    if (data && data.presence) {
      // Verifică dacă ambii participanți au părăsit meeting-ul
      const adminPresent = data.presence.admin;
      const clientPresent = data.presence.client;
      
      if (!adminPresent && !clientPresent) {
        console.log(`📞 [CHAT] Consultația s-a terminat, marchează chat-ul ca inactiv: ${chatId}`);
        await markChatInactive(chatId, 'consultation');
        
        if (onChatInactive) {
          onChatInactive(chatId);
        }
        
        // Oprește monitorizarea
        unsubscribe();
      }
    }
  });
  
  return unsubscribe;
};

/**
 * Monitorizează statusul unei conferințe și marchează chat-ul ca inactiv când se termină
 * @param {string} documentId - ID-ul documentului conferinței
 * @param {Function} onChatInactive - Callback apelat când chat-ul devine inactiv (opțional)
 */
export const monitorConferenceForChatCleanup = (documentId, onChatInactive = null) => {
  const docRef = doc(db, "ConferinteGrup", documentId);
  const chatId = `conference_${documentId}`;
  
  const unsubscribe = onSnapshot(docRef, async (snapshot) => {
    const data = snapshot.data();
    
    if (data) {
      // Verifică dacă conferința nu mai este activă
      const isActive = data.status === 'activa' || data.status === 'in_desfasurare';
      
      if (!isActive && data.status === 'finalizata') {
        console.log(`🎪 [CHAT] Conferința s-a terminat, marchează chat-ul ca inactiv: ${chatId}`);
        await markChatInactive(chatId, 'conference');
        
        if (onChatInactive) {
          onChatInactive(chatId);
        }
        
        // Oprește monitorizarea
        unsubscribe();
      }
    }
  });
  
  return unsubscribe;
};

/**
 * Setează utilizatorul ca offline în chat când părăsește pagina
 * @param {string} chatId - ID-ul chat-ului
 * @param {string} userId - ID-ul utilizatorului
 */
export const setUserOfflineInChat = async (chatId, userId) => {
  try {
    const participantRef = ref(database, `chats/${chatId}/participants/${userId}`);
    await update(participantRef, {
      isOnline: false,
      lastSeen: serverTimestamp()
    });
    
    // Șterge și typing indicator-ul
    const typingRef = ref(database, `chats/${chatId}/typing/${userId}`);
    await remove(typingRef);
    
    console.log(`👋 [CHAT] Utilizator setat ca offline: ${userId} din ${chatId}`);
  } catch (error) {
    console.error('❌ [CHAT] Eroare la setarea utilizatorului ca offline:', error);
  }
};

/**
 * Verifică dacă un chat există și este activ
 * @param {string} chatId - ID-ul chat-ului
 * @returns {Promise<boolean>} - True dacă chat-ul este activ
 */
export const isChatActive = async (chatId) => {
  try {
    const metadataRef = ref(database, `chats/${chatId}/metadata`);
    
    return new Promise((resolve) => {
      onValue(metadataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const isActive = data.consultationActive || data.conferenceActive;
          resolve(!!isActive);
        } else {
          resolve(false);
        }
        
        // Dezabonează listener-ul după prima citire
        off(metadataRef);
      }, { onlyOnce: true });
    });
  } catch (error) {
    console.error('❌ [CHAT] Eroare la verificarea statusului chat-ului:', error);
    return false;
  }
};

/**
 * Pornește cleanup automata la intervale regulate
 * @param {number} intervalMinutes - Intervalul în minute între cleanup-uri (default: 60)
 * @param {number} hoursOld - Vârsta chat-urilor de șters în ore (default: 2)
 * @returns {Function} - Funcție pentru oprirea cleanup-ului automat
 */
export const startAutomaticCleanup = (intervalMinutes = 60, hoursOld = 2) => {
  console.log(`🔄 [CHAT] Pornire cleanup automat la fiecare ${intervalMinutes} minute`);
  
  // Rulează cleanup-ul imediat
  cleanupInactiveChats(hoursOld);
  
  // Setează intervalul pentru cleanup-uri regulate
  const intervalId = setInterval(() => {
    console.log(`🧹 [CHAT] Rulare cleanup automat...`);
    cleanupInactiveChats(hoursOld);
  }, intervalMinutes * 60 * 1000);
  
  // Returnează funcția de oprire
  return () => {
    clearInterval(intervalId);
    console.log(`⏹️ [CHAT] Cleanup automat oprit`);
  };
};

export default {
  markChatInactive,
  deleteChatRoom,
  cleanupInactiveChats,
  monitorConsultationForChatCleanup,
  monitorConferenceForChatCleanup,
  setUserOfflineInChat,
  isChatActive,
  startAutomaticCleanup
}; 