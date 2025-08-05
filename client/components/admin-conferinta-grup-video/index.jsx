import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Home1Header from "../home/home-1/header";
// REMOVED: import { useAuth } from "../../../context/AuthContext"; - Now using simple password auth
import { handleGetFirestore } from "../../../utils/firestoreUtils";
import { SimpleAgoraRecorder } from "../../../utils/simpleAgoraRecorder";
import { createUILogger } from "../../../utils/logger";
import moment from "moment";
import "moment/locale/ro";
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
import { doc, onSnapshot, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

moment.locale("ro");

// Debug function that only logs in development
const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const AdminConferintaGrupVideo = ({ conferenceId }) => {
  debugLog("=== ADMIN CONFERINTA GRUP VIDEO COMPONENT LOADED ===");
  debugLog("DEBUGGING: Component is starting with conferenceId:", conferenceId);
  
  // Only alert on client side
  if (typeof window !== 'undefined') {
    debugLog("✅ COMPONENT LOADED ON CLIENT - Check console for details");
  }
  
  debugLog("🏗️ [ADMIN VIDEO] === COMPONENT INIT ===");
  debugLog("🏗️ [ADMIN VIDEO] Props conferenceId:", conferenceId);
  debugLog("🏗️ [ADMIN VIDEO] Props type:", typeof conferenceId);
  
  const router = useRouter();
  debugLog("🏗️ [ADMIN VIDEO] Router query:", router.query);
  debugLog("🏗️ [ADMIN VIDEO] Router.query.conferenceId:", router.query.conferenceId);
  debugLog("🏗️ [ADMIN VIDEO] Router isReady:", router.isReady);
  
  debugLog("🏗️ [ADMIN VIDEO] Component initialized - DIRECT ACCESS (no auth needed)");
  
  const [loading, setLoading] = useState(true);
  const [conferinta, setConferinta] = useState(null);
  const [error, setError] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [participantsOnline, setParticipantsOnline] = useState([]);
  const [loadingAttempted, setLoadingAttempted] = useState(false);

  debugLog("🏗️ [ADMIN VIDEO] State inițial - loading:", loading, "error:", error);
  
  // Agora settings pentru admin (HOST)
  const appID = "e17715cba7c84bfc9dbd1b5231b6f86f";
  const [isHost, setIsHost] = useState(true); // Admin este întotdeauna HOST
  const [isPinned, setPinned] = useState(false); // Grid layout pentru grup
  const [isFullscreen, setFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoContainerRef = useRef(null);

  // Minimal state pentru Agora UIKit

  // Screen Recording states (SimpleAgoraRecorder)
  const [simpleRecorder, setSimpleRecorder] = useState(null);
  const [isSimpleRecording, setIsSimpleRecording] = useState(false);
  const [simpleRecordingStatus, setSimpleRecordingStatus] = useState('');
  const [simpleRecordingDuration, setSimpleRecordingDuration] = useState(0);
  const [showSimpleEmailDialog, setShowSimpleEmailDialog] = useState(false);
  const [simpleRecipientEmails, setSimpleRecipientEmails] = useState([]);
  const [isSimpleProcessing, setIsSimpleProcessing] = useState(false);
  const [simpleUploadProgress, setSimpleUploadProgress] = useState('');
  const recordingIntervalRef = useRef(null);

  // Logger for UI events
  const uiLogger = createUILogger('UI:GROUP_CONFERENCE_VIDEO');

  // Cleanup for Screen Recording on unmount
  useEffect(() => {
    return () => {
      if (simpleRecorder) {
        console.log('🧹 [CLEANUP] Cleaning up screen recorder on component unmount');
        simpleRecorder.cleanup();
      }
      if (recordingIntervalRef.current) {
        console.log('🧹 [CLEANUP] Clearing recording interval on component unmount');
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, [simpleRecorder]);

  // ========================== SCREEN RECORDING FUNCTIONS ==========================

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startSimpleRecording = async () => {
    try {
      console.log('🎬 [SIMPLE] Starting screen recording for group conference:', conferinta?.titlu);
      setSimpleRecordingStatus('Inițializare...');
      uiLogger.info('🎬 RECORDING STARTED', { conferenceId: conferinta?.documentId, conferenceTitle: conferinta?.titlu });

      // Browser support check
      if (!SimpleAgoraRecorder.isSupported()) {
        throw new Error('Browser-ul nu suportă înregistrarea video');
      }

      // Extract participant emails for later use
      const participantEmails = conferinta?.participanti?.map(p => p.email).filter(email => email) || [];
      const uniqueEmails = [...new Set(participantEmails)]; // Remove duplicates

      // Set up recorder
      const recorder = new SimpleAgoraRecorder({
        meetingCode: `group_${conferinta?.documentId}`,
        documentId: conferinta?.documentId,
        recipientEmails: uniqueEmails, // Use multiple emails
        onProgress: (status) => {
          setSimpleRecordingStatus(status);
          setSimpleUploadProgress(status);
        },
        onComplete: async () => {
          setSimpleRecordingStatus('✅ Înregistrare finalizată și email trimis!');
          setIsSimpleRecording(false);
          setSimpleRecorder(null);
          setTimeout(() => {
            setSimpleRecordingStatus('');
            setSimpleUploadProgress('');
          }, 3000);
        },
        onError: (error) => {
          setSimpleRecordingStatus(`❌ Eroare: ${error}`);
          setIsSimpleRecording(false);
          setSimpleRecorder(null);
          setTimeout(() => {
            setSimpleRecordingStatus('');
            setSimpleUploadProgress('');
          }, 5000);
        }
      });

      setSimpleRecorder(recorder);

      const result = await recorder.startRecording();
      
      if (result.success) {
        setIsSimpleRecording(true);
        console.log('✅ [SIMPLE] Recording started successfully for group conference');
        
        // Start duration counter
        const startTime = Date.now();
        recordingIntervalRef.current = setInterval(() => {
          if (recorder.isRecording) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setSimpleRecordingDuration(elapsed);
          } else {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
        }, 1000);
        
        // Pre-populate emails for dialog
        setSimpleRecipientEmails(uniqueEmails);
        
      } else {
        throw new Error(result.error || 'Failed to start recording');
      }
      
    } catch (error) {
      console.error('❌ [SIMPLE] Error starting recording:', error);
      setSimpleRecordingStatus(`❌ Eroare: ${error.message}`);
      uiLogger.error('❌ RECORDING ERROR', { error: error.message });
      setTimeout(() => {
        setSimpleRecordingStatus('');
        setSimpleUploadProgress('');
      }, 5000);
    }
  };

  const stopSimpleRecording = () => {
    console.log('🛑 [SIMPLE] User requested to stop recording');
    
    // Pre-fill emails if available from conference
    if (conferinta) {
      const participantEmails = conferinta.participanti?.map(p => p.email).filter(email => email) || [];
      const uniqueEmails = [...new Set(participantEmails)];
      setSimpleRecipientEmails(uniqueEmails);
    }
    
    setShowSimpleEmailDialog(true);
  };

  const confirmStopSimpleRecording = async () => {
    try {
      setIsSimpleProcessing(true);
      setShowSimpleEmailDialog(false);
      
      if (simpleRecorder) {
        // Update recorder with emails before stopping
        simpleRecorder.recipientEmails = simpleRecipientEmails;
        
        // Set progress handler for upload
        simpleRecorder.onProgress = (progress) => {
          setSimpleUploadProgress(progress);
        };
        
        // Stop recording - this will trigger upload and email to multiple recipients
        simpleRecorder.stopRecording();
        setSimpleRecordingDuration(0);
        
        // Clear interval
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      }
      
    } catch (error) {
      console.error('❌ [SIMPLE] Error stopping recording:', error);
      setSimpleRecordingStatus(`❌ Eroare: ${error.message}`);
      setIsSimpleProcessing(false);
    }
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...simpleRecipientEmails];
    newEmails[index] = value;
    setSimpleRecipientEmails(newEmails);
  };

  const addEmailField = () => {
    setSimpleRecipientEmails([...simpleRecipientEmails, '']);
  };

  const removeEmailField = (index) => {
    const newEmails = simpleRecipientEmails.filter((_, i) => i !== index);
    setSimpleRecipientEmails(newEmails);
  };

  // ========================== END SCREEN RECORDING FUNCTIONS ==========================

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

  // 🔥 ADMIN PAGE - NO AUTHENTICATION NEEDED (already authenticated to reach this page)

  // Timeout pentru debugging - dacă loading durează prea mult
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log("⏰ [ADMIN VIDEO] TIMEOUT: Loading durează prea mult (10 secunde)");
        console.log("⏰ [ADMIN VIDEO] State curent:", {
          loading,
          error,
          conferinta: conferinta ? "DA" : "NU"
        });
      }
    }, 10000); // 10 secunde

    return () => clearTimeout(timeout);
  }, [loading, error, conferinta]);

  // Load conference data - DIRECT LOADING (no auth check needed for admin page)
  useEffect(() => {
    console.log("🚀 [ADMIN VIDEO] === DIRECT DATA LOADING (NO AUTH CHECK) ===");
    console.log("🚀 [ADMIN VIDEO] useEffect triggered with dependencies:", {
      conferenceId: conferenceId,
      conferenceIdType: typeof conferenceId,
      conferenceIdExists: !!conferenceId,
      routerQuery: router.query,
      routerQueryId: router.query.conferenceId,
      routerIsReady: router.isReady,
      loadingAttempted: loadingAttempted
    });
    console.log("🚀 [ADMIN VIDEO] Current state:", {
      loading: loading,
      error: error ? error.toString() : null,
      conferinta: conferinta ? "LOADED" : "NULL",
      loadingAttempted: loadingAttempted
    });

    // Dacă deja a încercat să încarce sau are deja date, nu mai executa
    if (loadingAttempted || conferinta || error) {
      console.log("🛑 [ADMIN VIDEO] Skip useEffect - already attempted or has data");
      console.log("🛑 [ADMIN VIDEO] Skip reason:", {
        loadingAttempted: loadingAttempted,
        conferintaExists: !!conferinta,
        errorExists: !!error,
        errorMessage: error
      });
      return;
    }

    // Verifică și router.query.conferenceId dacă props conferenceId nu există
    const actualConferenceId = conferenceId || router.query.conferenceId;
    console.log("🎯 [ADMIN VIDEO] Actual conferenceId to use:", actualConferenceId);

    if (actualConferenceId) {
      console.log("🎯 [ADMIN VIDEO] ✅ DIRECT LOADING - CALLING loadConferenceData()");
      console.log("🎯 [ADMIN VIDEO] Using conferenceId:", actualConferenceId);
      console.log("🎯 [ADMIN VIDEO] Source:", conferenceId ? "props" : "router.query");
      setLoadingAttempted(true); // Mark that we're attempting to load
      loadConferenceData();
    } else {
      console.log("⚠️ [ADMIN VIDEO] ❌ Nu există conferenceId în props sau router.query");
      console.log("⚠️ [ADMIN VIDEO] Debug info:", {
        propsConferenceId: conferenceId,
        routerQueryConferenceId: router.query.conferenceId,
        routerQuery: router.query,
        routerIsReady: router.isReady
      });
      setError("Conference ID lipsește din URL");
      setLoading(false);
      setLoadingAttempted(true);
    }
  }, [conferenceId, router]); // Only depend on conferenceId and router

  // Debugging - afișează starea fără să forțeze reîncărcarea
  useEffect(() => {
    const debugTimeout = setTimeout(() => {
      if (loading && conferenceId) {
        console.log("🚨 [DEBUG] Încă se încarcă după 10 secunde...");
        console.log("🚨 [DEBUG] Stare:", {
          loading,
          error,
          conferinta: !!conferinta,
          conferenceId
        });
      }
    }, 10000);

    return () => clearTimeout(debugTimeout);
  }, [loading, error, conferinta, conferenceId]);

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
      // Determine the actual conference ID to use
      const actualConferenceId = conferenceId || router.query.conferenceId;
      
      debugLog("🔍 [ADMIN VIDEO] === ÎNCEPE ÎNCĂRCAREA ===");
      debugLog(`🚀 [CONFERENCE SEARCH] Loading conference data for ID: ${actualConferenceId}`);
      debugLog(`🚀 [CONFERENCE SEARCH] ID source: ${conferenceId ? 'props' : 'router.query'}`);
      debugLog(`🚀 DEBUGGING: Loading conference data for ID: ${actualConferenceId} (source: ${conferenceId ? 'props' : 'router.query'})`);
      
      debugLog("🔍 [LOADING CHECK] Current loading state:", loading);
      debugLog("🔍 [LOADING CHECK] Current error state:", error);
      debugLog("🔍 [LOADING CHECK] Current conferinta state:", conferinta ? "LOADED" : "NULL");
      
      // Allow reloading if no conference is loaded yet
      if (loading && !conferinta) {
        debugLog("🔄 [ADMIN VIDEO] Loading in progress but no conference loaded, forcing reload...");
      } else if (loading) {
        debugLog("⚠️ [ADMIN VIDEO] Încărcarea deja în progres și conferința încărcată, skip...");
        return;
      }
      
      setLoading(true);
      setError(null); // Clear previous errors
      
      console.log("🔍 [ADMIN VIDEO] Parametri pentru Firestore:", {
        propsConferenceId: conferenceId,
        routerConferenceId: router.query.conferenceId,
        actualConferenceId: actualConferenceId,
        adminUser: "Cristina Admin",
        conferenceIdType: typeof actualConferenceId,
        conferenceIdLength: actualConferenceId?.length
      });

      if (!actualConferenceId) {
        throw new Error("Conference ID lipsește din props și router.query");
      }

      // 🔥 DEBUG: Start Firestore operation
      console.log("🔍 [ADMIN VIDEO] Starting Firestore query...");

      console.log("📥 [ADMIN VIDEO] Apelează Firestore cu timeout...");
      const startTime = Date.now();
      
      // Add timeout pentru Firestore call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: Firestore call took too long")), 15000);
      });
      
      console.log("📥 [ADMIN VIDEO] Pornește handleGetFirestore('ConferinteGrup')...");
      console.log("📥 [FIRESTORE] About to call getDocs on ConferinteGrup collection");
      console.log("📥 [FIRESTORE] Database instance:", db ? "AVAILABLE" : "NULL");
      
      // 🔥 IMPORTANT: Use manual Firestore call to ensure documentId is included
      const firestorePromise = getDocs(collection(db, "ConferinteGrup")).then(querySnapshot => {
        console.log("📥 [FIRESTORE] getDocs completed successfully");
        console.log("📥 [FIRESTORE] Query snapshot received:", querySnapshot ? "YES" : "NO");
        console.log("📥 [FIRESTORE] Snapshot size:", querySnapshot.size);
        console.log("📥 [FIRESTORE] Snapshot empty:", querySnapshot.empty);
        
        const arr = [];
        console.log(`🔍 [FIRESTORE] Processing ${querySnapshot.size} documents from ConferinteGrup`);
        
        querySnapshot.forEach((doc) => {
          const docData = {
            documentId: doc.id, // 🔥 Include documentId
            ...doc.data()
          };
          console.log(`🔍 [FIRESTORE] Document found:`, {
            id: doc.id,
            titlu: docData.titlu,
            status: docData.status,
            dataInceput: docData.dataInceput
          });
          arr.push(docData);
        });
        
        console.log(`🔍 [FIRESTORE] Total documents processed: ${arr.length}`);
        console.log(`🔍 [FIRESTORE] Returning array with ${arr.length} items`);
        return arr;
      }).catch(firestoreError => {
        console.error("💥 [FIRESTORE] getDocs failed:", firestoreError);
        console.error("💥 [FIRESTORE] Error type:", firestoreError.constructor.name);
        console.error("💥 [FIRESTORE] Error message:", firestoreError.message);
        console.error("💥 [FIRESTORE] Error code:", firestoreError.code);
        throw firestoreError;
      });
      
      console.log("📥 [ADMIN VIDEO] Așteaptă răspuns Firestore...");
      const conferinte = await Promise.race([firestorePromise, timeoutPromise]);
      
      const endTime = Date.now();
      console.log("📦 [ADMIN VIDEO] Firestore răspuns în", endTime - startTime, "ms");
      console.log("📦 [ADMIN VIDEO] Tip răspuns:", typeof conferinte);
      console.log("📦 [ADMIN VIDEO] Este array:", Array.isArray(conferinte));
      console.log("📦 [ADMIN VIDEO] Conferințe găsite:", conferinte?.length || 0);
      
      console.log(`📦 DEBUGGING: Firestore response: ${conferinte?.length || 0} conferences found`);

      // 🔥 DEBUG: Firestore call completed successfully
      console.log("🔍 [ADMIN VIDEO] Firestore call completed successfully");

      if (!conferinte) {
        console.error("💥 [ADMIN VIDEO] Conferinte este null/undefined");
        throw new Error("Firestore a returnat null/undefined");
      }

      if (!Array.isArray(conferinte)) {
        console.error("💥 [ADMIN VIDEO] Conferinte nu este array:", typeof conferinte);
        throw new Error("Date invalide din Firestore - nu este array");
      }

      if (conferinte.length === 0) {
        console.warn("⚠️ [ADMIN VIDEO] Array-ul conferințe este gol");
        throw new Error("Nu există conferințe în baza de date");
      }

      console.log("🔍 [CONFERENCE SEARCH] === DETAILED SEARCH ANALYSIS ===");
      console.log(`🔍 [CONFERENCE SEARCH] Searching for ID: "${actualConferenceId}"`);
      console.log(`🔍 [CONFERENCE SEARCH] ID length: ${actualConferenceId.length}`);
      console.log(`🔍 [CONFERENCE SEARCH] ID type: ${typeof actualConferenceId}`);
      
      // Log toate conferințele disponibile cu detalii complete
      console.log("🔍 [CONFERENCE SEARCH] Available conferences:");
      conferinte.forEach((conf, index) => {
        console.log(`🔍 [CONFERENCE SEARCH] [${index}] ID: "${conf.documentId}" (length: ${conf.documentId?.length}) - Title: "${conf.titlu}" - Status: "${conf.status}"`);
        console.log(`🔍 [CONFERENCE SEARCH] [${index}] ID === actualConferenceId: ${conf.documentId === actualConferenceId}`);
        console.log(`🔍 [CONFERENCE SEARCH] [${index}] ID comparison chars:`, {
          confId: conf.documentId.split(''),
          searchId: actualConferenceId.split('')
        });
      });
      
      // Încercăm să găsim conferința cu logging detaliat
      console.log("🔍 [CONFERENCE SEARCH] Starting find operation...");
      const conferintaFound = conferinte.find((c, index) => {
        const match = c.documentId === actualConferenceId;
        console.log(`🔍 [CONFERENCE SEARCH] Checking [${index}]: "${c.documentId}" === "${actualConferenceId}" = ${match}`);
        return match;
      });
      
      if (!conferintaFound) {
        console.error("💥 [CONFERENCE SEARCH] === CONFERENCE NOT FOUND ===");
        console.error("💥 [CONFERENCE SEARCH] Searched ID:", `"${actualConferenceId}"`);
        console.error("💥 [CONFERENCE SEARCH] Available IDs:", conferinte.map(c => `"${c.documentId}"`));
        console.error("💥 [CONFERENCE SEARCH] Total conferences searched:", conferinte.length);
        
        // Check for similar IDs
        const similarIds = conferinte.filter(c => 
          c.documentId.includes(actualConferenceId) || 
          actualConferenceId.includes(c.documentId) ||
          c.documentId.toLowerCase() === actualConferenceId.toLowerCase()
        );
        
        if (similarIds.length > 0) {
          console.error("💥 [CONFERENCE SEARCH] Similar IDs found:", similarIds.map(c => c.documentId));
          console.error(`❌ DEBUGGING: Conference NOT FOUND! Searching for: "${actualConferenceId}". Similar found: ${similarIds.map(c => c.documentId).join(', ')}`);
        } else {
          console.error(`❌ DEBUGGING: Conference NOT FOUND! Searching for: "${actualConferenceId}". Available: ${conferinte.map(c => c.documentId).join(', ')}`);
        }
        
        throw new Error(`Conferința cu ID "${actualConferenceId}" nu a fost găsită în ${conferinte.length} conferințe`);
      }

      console.log("✅ [CONFERENCE SEARCH] === CONFERENCE FOUND ===");
      console.log("✅ [CONFERENCE SEARCH] Found conference:", conferintaFound.titlu);
      console.log("✅ [CONFERENCE SEARCH] Conference details:", {
        id: conferintaFound.documentId,
        titlu: conferintaFound.titlu,
        status: conferintaFound.status,
        participanti: conferintaFound.participanti?.length || 0,
        dataInceput: conferintaFound.dataInceput
      });
      
      console.log(`✅ DEBUGGING: Conference found: "${conferintaFound.titlu}" (ID: ${conferintaFound.documentId})`);

      setConferinta(conferintaFound);
      setConferenceStarted(true); // Simplificat pentru debug

      // Ascultă pentru actualizări în timp real
      console.log("🔗 [ADMIN VIDEO] Inițializează ascultarea actualizărilor...");
      listenToConferenceUpdates(actualConferenceId);

      console.log("🎉 [ADMIN VIDEO] === ÎNCĂRCARE COMPLETĂ ===");

    } catch (error) {
      console.error("💥 [ADMIN VIDEO] === EROARE ÎNCĂRCARE ===");
      console.error("💥 [ADMIN VIDEO] Tip eroare:", error.constructor.name);
      console.error("💥 [ADMIN VIDEO] Mesaj:", error.message);
      console.error("💥 [ADMIN VIDEO] Stack:", error.stack);
      
      // 🔥 DEBUG: Error details
      console.log("🔍 [ADMIN VIDEO] Error context:", {
        adminUser: "Cristina",
        propsConferenceId: conferenceId,
        routerConferenceId: router.query.conferenceId,
        actualConferenceId: actualConferenceId,
        error: error.message
      });
      
      console.error(`❌ DEBUGGING: ERROR - ${error.message}`);
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
      
      // Creăm datele admin static pentru simple auth
      const adminData = {
        name: "Cristina Zurba",
        email: "cristinazurbac@gmail.com",
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
    await setUserOfflineInChat(chatId, 'cristina_admin');
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
    const adminUserId = `admin_cristina_zurba`;
    
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
            name: "Cristina Zurba",
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
        const senderName = currentParticipant?.name || "Cristina Zurba";
        
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
      const currentName = currentParticipant?.name || "Cristina Zurba";
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
          position: 'fixed',
          bottom: '20px',
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
            position: 'fixed',
            bottom: '100px',
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
                        {participants[adminUserId]?.name || "Cristina Zurba"}
                      </span>
                      <button
                        onClick={startEditingName}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '11px',
                          opacity: '0.7',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Editează numele"
                      >
                        ✏️ <span style={{ fontSize: '10px' }}>Schimbă Nume Chat</span>
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



  const isConferenceActive = (conferinta) => {
    // 🚫 GUARD: Verifică dacă conferința există
    if (!conferinta) {
      return false;
    }
    // Noua logică: doar statusul contează
    return conferinta.status === "activa";
  };

  const formatDataDisplay = (conferinta) => {
    // 🚫 GUARD: Verifică dacă conferința există
    if (!conferinta) {
      return {
        dataRange: "Încarcă...",
        oraRange: "Încarcă...",
        type: "Conferință"
      };
    }

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

  // 🔥 NO AUTHENTICATION DIALOG NEEDED - DIRECT ACCESS FOR ADMIN

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

  // 🚫 GUARD: Verifică dacă conferința a fost încărcată
  if (!conferinta) {
    return (
      <>
        <Home1Header />
        <div className="content" style={{ paddingTop: "100px", position: "relative" }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="text-center py-5">
                  <i className="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                  <h3>Conferința nu a fost găsită</h3>
                  <p className="text-muted">
                    Nu s-au putut încărca datele conferinței. Verificați ID-ul și încercați din nou.
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => router.push("/admin-conferinte-grup")}
                  >
                    Înapoi la Lista Conferințe
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
            username: 'Cristina Zurba', 
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

        {/* Screen Recording Controls - Simple and Clean */}
        {SimpleAgoraRecorder.isSupported() && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 1000
          }}>
            <button
              style={{
                backgroundColor: isSimpleRecording ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                fontSize: '20px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                animation: isSimpleRecording ? 'pulse 2s infinite' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={isSimpleRecording ? stopSimpleRecording : startSimpleRecording}
              title={isSimpleRecording ? `Recording: ${formatDuration(simpleRecordingDuration)} - Click to stop` : 'Începe Screen Recording'}
              disabled={isSimpleProcessing}
            >
              <i className={`fa ${isSimpleRecording ? 'fa-stop' : 'fa-desktop'}`}></i>
              {isSimpleRecording && (
                <div style={{ fontSize: '10px', marginTop: '2px' }}>
                  {formatDuration(simpleRecordingDuration)}
                </div>
              )}
              {!isSimpleRecording && (
                <div style={{ fontSize: '10px', marginTop: '2px' }}>REC</div>
              )}
            </button>
          </div>
        )}

        {/* Screen Recording Status Indicator */}
        {(simpleRecordingStatus || isSimpleProcessing) && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            padding: '10px 20px',
            borderRadius: '20px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            background: simpleRecordingStatus.includes('❌') ? 'rgba(220, 53, 69, 0.95)' : 'rgba(40, 167, 69, 0.95)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className={`fa ${simpleRecordingStatus.includes('❌') ? 'fa-exclamation-triangle' : 'fa-desktop'}`}></i>
            <span>{simpleRecordingStatus}</span>
            {simpleUploadProgress && simpleUploadProgress !== simpleRecordingStatus && (
              <span style={{ marginLeft: '10px', fontSize: '12px' }}>({simpleUploadProgress})</span>
            )}
          </div>
        )}

        {/* Multi-Email Dialog for Screen Recording */}
        {showSimpleEmailDialog && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa fa-desktop me-2"></i>
                    Oprire Screen Recording și Trimitere Email
                  </h5>
                </div>
                
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Despre Screen Recording:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Înregistrarea va fi oprită și salvată în cloud</li>
                      <li>Un email cu link de descărcare va fi trimis la adresele de mai jos</li>
                      <li>Fiecare participant poate descărca fișierul doar o dată</li>
                      <li>Link-ul îi va direcționa către pagina de acces înregistrări</li>
                    </ul>
                  </div>

                  {conferinta && (
                    <div className="mb-3 p-2 bg-light rounded">
                      <strong>Participanți conferință:</strong> {conferinta.titlu}
                      <br />
                      <small className="text-muted">
                        Total: {conferinta.participanti?.length || 0} | 
                        Cu email: {conferinta.participanti?.filter(p => p?.email?.trim())?.length || 0}
                      </small>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-bold">📧 Destinatari email:</label>
                    {simpleRecipientEmails.map((email, index) => (
                      <div key={index} className="input-group mb-2">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                        />
                        <button
                          className="btn btn-outline-danger"
                          type="button"
                          onClick={() => removeEmailField(index)}
                          disabled={simpleRecipientEmails.length === 1}
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={addEmailField}
                    >
                      <i className="fa fa-plus me-1"></i>
                      Adaugă alt email
                    </button>
                  </div>
                  
                  {/* Summary */}
                  <div className="bg-light p-3 rounded">
                    <small className="text-muted">
                      <i className="fa fa-info-circle me-1"></i>
                      Înregistrarea va fi oprită și un email cu link-ul de descărcare va fi trimis la
                      <strong> {simpleRecipientEmails.filter(e => e.trim()).length}</strong> adres
                      {simpleRecipientEmails.filter(e => e.trim()).length === 1 ? 'ă' : 'e'} de email.
                      <br />
                      <strong>Important:</strong> Fiecare participant poate descărca înregistrarea doar o dată!
                    </small>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSimpleEmailDialog(false)}
                    disabled={isSimpleProcessing}
                  >
                    Anulează
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmStopSimpleRecording}
                    disabled={isSimpleProcessing || simpleRecipientEmails.filter(e => e.trim()).length === 0}
                  >
                    {isSimpleProcessing ? (
                      <>
                        <i className="fa fa-spinner fa-spin me-1"></i>
                        Se procesează...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-stop me-1"></i>
                        Oprește și trimite email ({simpleRecipientEmails.filter(e => e.trim()).length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN CUSTOM CHAT */}
        <AdminCustomChat 
          meetingId={conferinta.documentId}
          adminData={{
            nume: "Cristina",
            prenume: "Zurba",
            email: "cristinazurbac@gmail.com",
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
                <div className="card-header bg-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
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
                    {/* <button
                      onClick={handleLogout}
                      className="btn btn-outline-light btn-sm"
                      title="Deconectare"
                    >
                      <i className="fa fa-sign-out-alt me-1"></i>
                      Logout
                    </button> */}
                  </div>
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
                    nume: "Cristina",
                    prenume: "Zurba",
                    email: "cristinazurbac@gmail.com",
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

// Note: Old recording system styles removed - using SimpleAgoraRecorder now





// Note: All old email dialog styles removed - using Bootstrap modals now

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
  `;
  document.head.appendChild(style);
}

 