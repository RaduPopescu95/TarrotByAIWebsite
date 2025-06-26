import React, { useEffect, useState } from "react";
import Link from "next/link";
import Home1Header from "../home/home-1/header";
import DoctorSidebar from "../doctors/sidebar";
import StickyBox from "react-sticky-box";
import { 
  handleGetFirestore, 
  handleUpdateFirestore, 
  handleUploadFirestoreGeneral,
  handleGetConferintePaginated
} from "../../../utils/firestoreUtils";
import AlertMessage from "../AlertMessage";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";
import "moment/locale/ro";
import { doc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase";
// Eliminat Firebase Functions - folosim API Next.js

moment.locale("ro");

const AdminConferinteGrup = () => {
  const { currentUser, userData } = useAuth();
  const [conferinte, setConferinte] = useState([]);
  const [alert, setAlert] = useState({ type: "", message: "", visible: false });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("list"); // "list", "create", "participants"
  const [editingConferinta, setEditingConferinta] = useState(null);
  const [selectedConferinta, setSelectedConferinta] = useState(null);
  const [participantsOnline, setParticipantsOnline] = useState({});
  
  // State pentru dialog-ul de ștergere
  const [deleteConferenceDialog, setDeleteConferenceDialog] = useState({
    isOpen: false,
    conferinta: null
  });
  
  // State-uri pentru paginație
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalStats, setTotalStats] = useState({
    total: 0,
    active: 0,
    participants: 0,
    courses: 0
  });

  // Log pentru a verifica dacă funcțiile Firestore sunt importate corect
  console.log("🔧 [INIT] Funcții Firestore disponibile:", {
    handleGetFirestore: typeof handleGetFirestore,
    handleUpdateFirestore: typeof handleUpdateFirestore,
    handleUploadFirestoreGeneral: typeof handleUploadFirestoreGeneral
  });
  console.log("👤 [INIT] UserData la inițializare:", userData);

  // Stări pentru formularul de creare/editare
  const [formData, setFormData] = useState({
    titlu: "",
    descriere: "",
    dataInceput: "",
    dataFinal: "",
    oraInceput: "",
    oraFinal: "",
    tipConferinta: "single", // "single" sau "course"
    numarMaxParticipanti: "",
    pretParticipare: "",
    imagine: null,
    status: "activa"
  });

  const showAlert = (type, message) => {
    console.log(`🚨 [ALERT] Tip: ${type}, Mesaj: ${message}`);
    setAlert({ type, message, visible: true });
    setTimeout(() => {
      setAlert({ type: "", message: "", visible: false });
      console.log("⏰ [ALERT] Alert-ul a fost ascuns automat");
    }, 5000);
  };

  // Funcție pentru incrementarea/decrementarea timpului cu săgeți
  const handleTimeIncrement = (type, isStartTime, increment) => {
    try {
      console.log(`[TIME INCREMENT] Type: ${type}, isStartTime: ${isStartTime}, increment: ${increment}`);
      
      const currentTime = isStartTime ? formData.oraInceput : formData.oraFinal;
      const [currentHour, currentMinute] = currentTime ? currentTime.split(':') : ['00', '00'];
      
      let newHour = parseInt(currentHour) || 0;
      let newMinute = parseInt(currentMinute) || 0;
      
      if (type === 'hour') {
        // Incrementare/decrementare ore cu 1
        newHour += increment;
        
        // Wrap around pentru ore (0-23)
        if (newHour > 23) newHour = 0;
        if (newHour < 0) newHour = 23;
      } else if (type === 'minute') {
        // Incrementare/decrementare minute cu 5
        newMinute += increment;
        
        // Wrap around pentru minute (0-55, cu pași de 5)
        if (newMinute >= 60) newMinute = 0;
        if (newMinute < 0) newMinute = 55;
      }
      
      // Formatează timpul
      const formattedTime = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
      console.log(`[TIME INCREMENT] New time: ${formattedTime}`);
      
      // Actualizează formData
      if (isStartTime) {
        setFormData(prev => ({ ...prev, oraInceput: formattedTime }));
      } else {
        setFormData(prev => ({ ...prev, oraFinal: formattedTime }));
      }
      
      // Feedback vizual pentru utilizator
      showAlert('success', `Timp actualizat: ${formattedTime}`);
      
    } catch (error) {
      console.error('[TIME INCREMENT] Error:', error);
      showAlert('error', 'Eroare la actualizarea timpului. Vă rugăm să introduceți manual.');
    }
  };

  // State pentru a ține valorile temporare ale inputurilor (fără formatare)
  const [tempTimeValues, setTempTimeValues] = useState({
    hourStart: '',
    minuteStart: '',
    hourEnd: '',
    minuteEnd: ''
  });

  // Sistem robust pentru gestionarea inputului manual de timp
  const handleManualTimeInput = (e, type, isStartTime) => {
    let value = e.target.value;
    
    // Permite doar cifre și limitează la maxim 2 caractere
    value = value.replace(/[^0-9]/g, '').substring(0, 2);
    
    // Validare robustă cu limitele corecte
    if (value !== '') {
      const numValue = parseInt(value);
      
      if (type === 'hour') {
        // Pentru ore: maxim 23
        if (numValue > 23) {
          value = '23';
        }
      } else if (type === 'minute') {
        // Pentru minute: maxim 59
        if (numValue > 59) {
          value = '59';
        }
      }
    }
    
    // Actualizează valoarea temporară
    const tempKey = `${type}${isStartTime ? 'Start' : 'End'}`;
    setTempTimeValues(prev => ({
      ...prev,
      [tempKey]: value
    }));
    
    // Obține timpul curent
    const currentTime = isStartTime ? formData.oraInceput : formData.oraFinal;
    const [currentHour, currentMinute] = currentTime ? currentTime.split(':') : ['00', '00'];
    
    // Pentru stocare în baza de date, formatăm cu zero doar dacă valoarea nu este în curs de editare
    const storageValue = value === '' ? '00' : value.padStart(2, '0');
    
    // Construiește noul timp pentru stocare (format HH:MM pentru Firebase)
    let newTime;
    if (type === 'hour') {
      newTime = `${storageValue}:${currentMinute}`;
    } else {
      newTime = `${currentHour}:${storageValue}`;
    }
    
    // Actualizează formData cu formatul corect pentru baza de date
    if (isStartTime) {
      setFormData(prev => ({ ...prev, oraInceput: newTime }));
    } else {
      setFormData(prev => ({ ...prev, oraFinal: newTime }));
    }
  };

  // Funcție pentru formatarea finală când utilizatorul iese din input
  const handleTimeBlur = (type, isStartTime) => {
    const tempKey = `${type}${isStartTime ? 'Start' : 'End'}`;
    const tempValue = tempTimeValues[tempKey];
    
    if (tempValue === '') {
      // Reset la 00 dacă e gol
      setTempTimeValues(prev => ({
        ...prev,
        [tempKey]: '00'
      }));
      
      const currentTime = isStartTime ? formData.oraInceput : formData.oraFinal;
      const [currentHour, currentMinute] = currentTime ? currentTime.split(':') : ['00', '00'];
      
      let newTime;
      if (type === 'hour') {
        newTime = `00:${currentMinute}`;
      } else {
        newTime = `${currentHour}:00`;
      }
      
      if (isStartTime) {
        setFormData(prev => ({ ...prev, oraInceput: newTime }));
      } else {
        setFormData(prev => ({ ...prev, oraFinal: newTime }));
      }
    }
  };

  // Funcție pentru a obține valoarea de afișat în input
  const getInputDisplayValue = (type, isStartTime) => {
    const tempKey = `${type}${isStartTime ? 'Start' : 'End'}`;
    const tempValue = tempTimeValues[tempKey];
    
    // Dacă avem o valoare temporară, o afișăm
    if (tempValue !== undefined && tempValue !== '') {
      return tempValue;
    }
    
    // Altfel, afișăm valoarea din formData
    const timeValue = isStartTime ? formData.oraInceput : formData.oraFinal;
    const [hour, minute] = timeValue ? timeValue.split(':') : ['00', '00'];
    return type === 'hour' ? hour : minute;
  };

  const uploadImageToStorage = async (imageFile, conferintaId) => {
    try {
      console.log("📷 [STORAGE] Încep upload-ul imaginii...");
      console.log("📷 [STORAGE] Dimensiune fișier:", imageFile.size);
      console.log("📷 [STORAGE] Tip fișier:", imageFile.type);
      console.log("📷 [STORAGE] Nume fișier:", imageFile.name);
      
      // Validez tipul fișierului
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        throw new Error(`Tipul fișierului nu este suportat: ${imageFile.type}`);
      }
      
      // Generez un nume unic pentru fișier
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = imageFile.name.split('.').pop();
      const fileName = `${conferintaId}_${timestamp}_${randomString}.${extension}`;
      
      console.log("📷 [STORAGE] Nume fișier generat:", fileName);
      
      // Creez referința în Firebase Storage
      const storageRef = ref(storage, `conferinte-grup/${fileName}`);
      console.log("📷 [STORAGE] Referință storage creată");
      
      // Upload fișier
      console.log("📷 [STORAGE] Încep upload-ul efectiv...");
      const snapshot = await uploadBytes(storageRef, imageFile);
      console.log("📷 [STORAGE] Upload finalizat. Snapshot:", snapshot.metadata);
      
      // Obțin URL-ul de download
      console.log("📷 [STORAGE] Obțin URL-ul de download...");
      const downloadURL = await getDownloadURL(storageRef);
      console.log("📷 [STORAGE] URL obținut cu succes:", downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error("💥 [STORAGE] Eroare la upload:", error);
      throw error;
    }
  };

  const fetchConferinte = async (reset = true) => {
    try {
      console.log("📥 [FETCH] Începe încărcarea conferințelor...");
      setLoading(true);
      
      if (reset) {
        // Reset pentru prima încărcare
        setLastVisible(null);
        setHasMore(true);
      }
      
      const result = await handleGetConferintePaginated(8, reset ? null : lastVisible);
      console.log("📦 [FETCH] Date primite din Firestore:", result);
      
      if (reset) {
        setConferinte(result.conferinte || []);
      } else {
        setConferinte(prev => [...prev, ...(result.conferinte || [])]);
      }
      
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
      
      // Calculează statisticile pentru toate conferințele (nu doar cele încărcate)
      await calculateTotalStats();
      
      console.log("✅ [FETCH] Conferințele au fost setate în state");
    } catch (error) {
      console.error("💥 [FETCH] Eroare la încărcarea conferințelor:");
      console.error("💥 [FETCH] Error object:", error);
      console.error("💥 [FETCH] Error message:", error.message);
      showAlert("danger", "Eroare la încărcarea conferințelor");
    } finally {
      setLoading(false);
      console.log("🏁 [FETCH] Loading setat pe false");
    }
  };

  const loadMoreConferinte = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      console.log("📥 [LOAD MORE] Încărcare conferințe suplimentare...");
      
      const result = await handleGetConferintePaginated(8, lastVisible);
      console.log("📦 [LOAD MORE] Date suplimentare primite:", result);
      
      setConferinte(prev => [...prev, ...(result.conferinte || [])]);
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
      
      console.log("✅ [LOAD MORE] Conferințele suplimentare au fost adăugate");
    } catch (error) {
      console.error("💥 [LOAD MORE] Eroare la încărcarea conferințelor suplimentare:", error);
      showAlert("danger", "Eroare la încărcarea conferințelor suplimentare");
    } finally {
      setLoadingMore(false);
    }
  };

  const calculateTotalStats = async () => {
    try {
      // Pentru statistici, încărcăm toate conferințele o singură dată
      const allConferinte = await handleGetFirestore("ConferinteGrup");
      
      const stats = {
        total: allConferinte.length,
        active: allConferinte.filter(c => c.status === "activa").length,
        participants: allConferinte.reduce((total, c) => total + (c.participanti?.length || 0), 0),
        courses: allConferinte.filter(c => c.tipConferinta === "course").length
      };
      
      setTotalStats(stats);
      console.log("📊 [STATS] Statistici calculate:", stats);
    } catch (error) {
      console.error("💥 [STATS] Eroare la calcularea statisticilor:", error);
    }
  };

  useEffect(() => {
    console.log("🚀 [MOUNT] Componenta se montează, începe încărcarea conferințelor...");
    fetchConferinte();
  }, []);

  // Real-time listener pentru participanții online
  useEffect(() => {
    if (selectedConferinta && activeTab === "participants") {
      const docRef = doc(db, "ConferinteGrupPresence", selectedConferinta.documentId);
      
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.participants) {
          const onlineParticipants = Object.values(data.participants)
            .filter(p => p.isPresent)
            .map(p => p.participantData);
          setParticipantsOnline(prev => ({
            ...prev,
            [selectedConferinta.documentId]: onlineParticipants
          }));
        }
      });

      return () => unsubscribe();
    }
  }, [selectedConferinta, activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 [INPUT] Schimbare câmp: ${name} = ${value}`);
    setFormData(prev => {
      const newData = {
      ...prev,
      [name]: value
      };
      console.log("📝 [INPUT] FormData actualizat:", newData);
      return newData;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imagine: file
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      titlu: "",
      descriere: "",
      dataInceput: "",
      dataFinal: "",
      oraInceput: "",
      oraFinal: "",
      tipConferinta: "single",
      numarMaxParticipanti: "",
      pretParticipare: "",
      imagine: null,
      status: "activa"
    });
    setEditingConferinta(null);
  };

  const validateForm = () => {
    console.log("🔍 [VALIDARE] Începe validarea formularului...");
    console.log("🔍 [VALIDARE] Date de validat:", {
      titlu: formData.titlu,
      descriere: formData.descriere,
      dataInceput: formData.dataInceput,
      oraInceput: formData.oraInceput,
      tipConferinta: formData.tipConferinta,
      dataFinal: formData.dataFinal,
      oraFinal: formData.oraFinal,
      pretParticipare: formData.pretParticipare
    });

    if (!formData.titlu.trim()) {
      console.log("❌ [VALIDARE] Titlul lipsește");
      showAlert("danger", "Titlul este obligatoriu");
      return false;
    }
    console.log("✅ [VALIDARE] Titlu valid");

    if (!formData.descriere.trim()) {
      console.log("❌ [VALIDARE] Descrierea lipsește");
      showAlert("danger", "Descrierea este obligatorie");
      return false;
    }
    console.log("✅ [VALIDARE] Descriere validă");

    if (!formData.dataInceput) {
      console.log("❌ [VALIDARE] Data de început lipsește");
      showAlert("danger", "Data de început este obligatorie");
      return false;
    }
    console.log("✅ [VALIDARE] Data de început validă");

    if (!formData.oraInceput || !formData.oraInceput.includes(':') || formData.oraInceput.split(':').length !== 2) {
      console.log("❌ [VALIDARE] Ora de început incompletă sau invalidă");
      showAlert("danger", "Selectează ora și minutele pentru începutul conferinței");
      return false;
    }
    const [startHour, startMinute] = formData.oraInceput.split(':');
    if (!startHour || !startMinute) {
      console.log("❌ [VALIDARE] Ora de început incompletă");
      showAlert("danger", "Selectează ora și minutele pentru începutul conferinței");
      return false;
    }
    console.log("✅ [VALIDARE] Ora de început validă");

    if (formData.tipConferinta === "course" && !formData.dataFinal) {
      console.log("❌ [VALIDARE] Pentru curs, data finală lipsește");
      showAlert("danger", "Pentru cursuri, data finală este obligatorie");
      return false;
    }
    if (formData.tipConferinta === "course") {
      console.log("✅ [VALIDARE] Data finală pentru curs validă");
    }

    if (formData.tipConferinta === "course" && (!formData.oraFinal || !formData.oraFinal.includes(':') || formData.oraFinal.split(':').length !== 2)) {
      console.log("❌ [VALIDARE] Pentru curs, ora finală incompletă sau invalidă");
      showAlert("danger", "Pentru cursuri, selectează ora și minutele pentru sfârșitul conferinței");
      return false;
    }
    if (formData.tipConferinta === "course") {
      const [endHour, endMinute] = formData.oraFinal.split(':');
      if (!endHour || !endMinute) {
        console.log("❌ [VALIDARE] Ora finală pentru curs incompletă");
        showAlert("danger", "Pentru cursuri, selectează ora și minutele pentru sfârșitul conferinței");
        return false;
      }
      console.log("✅ [VALIDARE] Ora finală pentru curs validă");
    }

    if (!formData.pretParticipare || parseFloat(formData.pretParticipare) <= 0) {
      console.log("❌ [VALIDARE] Prețul este invalid:", formData.pretParticipare);
      showAlert("danger", "Prețul de participare trebuie să fie mai mare de 0");
      return false;
    }
    console.log("✅ [VALIDARE] Preț valid");

    console.log("🎉 [VALIDARE] Toate validările au trecut cu succes!");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("🚀 [CONFERINTA] Începe procesul de salvare...");
    console.log("📝 [CONFERINTA] FormData primit:", formData);
    
    if (!validateForm()) {
      console.log("❌ [CONFERINTA] Validarea a eșuat");
      return;
    }

    console.log("✅ [CONFERINTA] Validarea a trecut cu succes");

    try {
      setLoading(true);
      
             // Upload imagine dacă există
       let imageUrl = null;
       if (formData.imagine) {
         console.log("📷 [CONFERINTA] Încarc imaginea în Firebase Storage...");
         try {
           // Generez un ID unic pentru conferință pentru a fi folosit în upload
           const conferintaId = editingConferinta?.documentId || Date.now().toString();
           imageUrl = await uploadImageToStorage(formData.imagine, conferintaId);
           console.log("✅ [CONFERINTA] Imagine încărcată cu succes. URL:", imageUrl);
         } catch (uploadError) {
           console.error("💥 [CONFERINTA] Eroare la upload-ul imaginii:", uploadError);
           showAlert("danger", "Eroare la încărcarea imaginii!");
           setLoading(false);
           return;
         }
       } else {
         console.log("📷 [CONFERINTA] Nu există imagine nouă de încărcat");
         // Dacă editez o conferință existentă și nu încarc o imagine nouă, păstrez imaginea existentă
         if (editingConferinta && editingConferinta.imageUrl) {
           imageUrl = editingConferinta.imageUrl;
           console.log("📷 [CONFERINTA] Păstrez imaginea existentă:", imageUrl);
         }
       }
      
      const conferintaData = {
        titlu: formData.titlu,
        descriere: formData.descriere,
        dataInceput: formData.dataInceput,
        dataFinal: formData.dataFinal,
        oraInceput: formData.oraInceput,
        oraFinal: formData.oraFinal,
        tipConferinta: formData.tipConferinta,
        numarMaxParticipanti: formData.numarMaxParticipanti ? parseInt(formData.numarMaxParticipanti) : null,
        pretParticipare: parseFloat(formData.pretParticipare),
        status: formData.status,
        imageUrl: imageUrl, // Salvez URL-ul imaginii, nu obiectul File
        accessLink: editingConferinta?.accessLink || generateConferenceAccessLink(), // Generez accessLink pentru conferință
        participanti: [],
        creatDe: userData?.owner_uid || "admin",
        dataCreare: moment().format("YYYY-MM-DD HH:mm:ss")
      };

      console.log("📦 [CONFERINTA] Date pregătite pentru salvare:", conferintaData);
      console.log("👤 [CONFERINTA] UserData disponibil:", userData);
      console.log("🖼️ [CONFERINTA] Imagine din formData (exclusă din salvare):", formData.imagine?.name || "Nicio imagine");

      if (editingConferinta) {
        console.log("📝 [CONFERINTA] Încep actualizarea conferinței existente...");
        console.log("🆔 [CONFERINTA] ID conferință de editat:", editingConferinta.documentId);
        
        // Update existing
        const updateResult = await handleUpdateFirestore(
          `ConferinteGrup/${editingConferinta.documentId}`,
          conferintaData
        );
        console.log("✅ [CONFERINTA] Rezultat actualizare:", updateResult);
        showAlert("success", "Conferința a fost actualizată cu succes!");
      } else {
        console.log("➕ [CONFERINTA] Încep crearea conferinței noi...");
        
        // Create new
        const createResult = await handleUploadFirestoreGeneral(
          conferintaData,
          "ConferinteGrup"
        );
        console.log("✅ [CONFERINTA] Rezultat creare:", createResult);
        showAlert("success", "Conferința a fost creată cu succes!");
      }

      console.log("🔄 [CONFERINTA] Resetez formularul și reîmprospătez lista...");
      resetForm();
      setActiveTab("list");
      await fetchConferinte(true); // Reset și încarcă prima pagină
      console.log("🎉 [CONFERINTA] Procesul de salvare s-a finalizat cu succes!");
      
    } catch (error) {
      console.error("💥 [CONFERINTA] EROARE la salvarea conferinței:");
      console.error("💥 [CONFERINTA] Error object:", error);
      console.error("💥 [CONFERINTA] Error message:", error.message);
      console.error("💥 [CONFERINTA] Error code:", error.code);
      console.error("💥 [CONFERINTA] Error stack:", error.stack);
      
      if (error.message.includes("Unsupported field value")) {
        console.error("💥 [CONFERINTA] EROARE DE TIP FIRESTORE: Obiect nesuportat în date");
        showAlert("danger", "Eroare: Tip de date nesuportat pentru Firestore");
      } else {
        showAlert("danger", "Eroare la salvarea conferinței: " + error.message);
      }
    } finally {
      setLoading(false);
      console.log("🏁 [CONFERINTA] Loading setat pe false");
    }
  };

  const handleEdit = (conferinta) => {
    setFormData({
      titlu: conferinta.titlu,
      descriere: conferinta.descriere,
      dataInceput: conferinta.dataInceput,
      dataFinal: conferinta.dataFinal || "",
      oraInceput: conferinta.oraInceput,
      oraFinal: conferinta.oraFinal || "",
      tipConferinta: conferinta.tipConferinta,
      numarMaxParticipanti: conferinta.numarMaxParticipanti?.toString() || "",
      pretParticipare: conferinta.pretParticipare?.toString() || "",
      imagine: null,
      status: conferinta.status
    });
    setEditingConferinta(conferinta);
    setActiveTab("create");
  };

  const handleViewParticipants = (conferinta) => {
    setSelectedConferinta(conferinta);
    setActiveTab("participants");
  };

  const calculateAvailableSpots = (conferinta) => {
    const totalParticipants = conferinta.participanti?.length || 0;
    const maxParticipants = conferinta.numarMaxParticipanti;
    
    if (!maxParticipants) return "Nelimitat";
    
    const available = maxParticipants - totalParticipants;
    return available > 0 ? available : 0;
  };

  const getParticipantStatus = (participant) => {
    switch (participant.status) {
      case 'confirmed':
        return <span className="badge bg-success">Confirmat</span>;
      case 'pending':
        return <span className="badge bg-warning">În așteptare</span>;
      case 'cancelled':
        return <span className="badge bg-danger">Anulat</span>;
      default:
        return <span className="badge bg-secondary">Necunoscut</span>;
    }
  };

  const isParticipantOnline = (participant) => {
    // Verifică dacă participantul există și are link de acces
    if (!participant || (!participant.uniqueAccessLink && !participant.accessLink)) {
      return false;
    }
    
    const onlineList = participantsOnline[selectedConferinta?.documentId] || [];
    const participantAccessLink = participant.uniqueAccessLink || participant.accessLink;
    
    // Verifică dacă participantul este în lista online, cu protecție pentru participanți null/undefined
    return onlineList.some(p => {
      // Protecție împotriva participanților null/undefined din lista online
      if (!p) return false;
      
      const onlineAccessLink = p.uniqueAccessLink || p.accessLink;
      return onlineAccessLink && onlineAccessLink === participantAccessLink;
    });
  };

  const formatDataDisplay = (conferinta) => {
    if (conferinta.tipConferinta === "course") {
      return `${moment(conferinta.dataInceput).format("DD MMM YYYY")}, ${conferinta.oraInceput} - ${moment(conferinta.dataFinal).format("DD MMM YYYY")}, ${conferinta.oraFinal}`;
    } else {
      return `${moment(conferinta.dataInceput).format("DD MMM YYYY")}, ${conferinta.oraInceput}`;
    }
  };

  const exportParticipants = (conferinta) => {
    const participantsData = (conferinta.participanti || []).filter(p => p !== null && p !== undefined);
    const csvContent = [
      ["Nume", "Email", "Telefon", "Data Înscrierii", "Status", "Observații"],
      ...participantsData.map(p => [
        p.nume || '',
        p.email || '',
        p.telefon || '',
        moment(p.dataInscrierii).format("DD/MM/YYYY HH:mm"),
        p.status || '',
        p.observatii || ''
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participanti_${conferinta.titlu.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isConferenceActive = (conferinta) => {
    // Eliminat restricțiile - toate conferințele sunt considerate active
    return true;
  };

  const handleJoinAsAdmin = async (conferinta) => {
    console.log("🎥 [ADMIN JOIN] Admin încearcă să se alăture conferinței:", conferinta.titlu);
    console.log("🎥 [ADMIN JOIN] Conference ID:", conferinta.documentId);
    console.log("🎥 [ADMIN JOIN] Conference status:", conferinta.status);
    
    // Eliminat verificările și activarea - acces direct la conferință
    console.log("🎥 [ADMIN JOIN] Redirecționez către conferință...");
    const adminVideoUrl = `/admin-conferinta-grup-video/${conferinta.documentId}`;
    window.open(adminVideoUrl, '_blank');
  };

  const handleRemoveParticipant = async (conferinta, participantIndex) => {
    if (!window.confirm("Ești sigur că vrei să elimini acest participant?")) {
      return;
    }

    try {
      setLoading(true);
      console.log(`🗑️ [REMOVE] Eliminare participant index ${participantIndex} din conferința ${conferinta.documentId}`);
      
      const updatedParticipants = [...conferinta.participanti];
      const removedParticipant = updatedParticipants.splice(participantIndex, 1)[0];
      
      console.log(`🗑️ [REMOVE] Participant eliminat:`, removedParticipant);
      
      await handleUpdateFirestore(`ConferinteGrup/${conferinta.documentId}`, {
        participanti: updatedParticipants
      });
      
      showAlert("success", `Participantul ${removedParticipant.nume} a fost eliminat cu succes`);
      await fetchConferinte(true); // Reset și încarcă prima pagină
      
      // Actualizează conferința selectată
      const updatedConferinta = { ...conferinta, participanti: updatedParticipants };
      setSelectedConferinta(updatedConferinta);
      
    } catch (error) {
      console.error("💥 [REMOVE] Eroare la eliminarea participantului:", error);
      showAlert("danger", "Eroare la eliminarea participantului");
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru copierea link-ului de acces la conferință
  const copyConferenceLink = (conferinta) => {
    if (!conferinta.participanti || conferinta.participanti.length === 0) {
      showAlert("warning", "Nu există participanți înscrși la această conferință încă");
      return;
    }

    // Filtrează participanții valizi (nu null/undefined)
    const validParticipants = conferinta.participanti.filter(p => p && (p.uniqueAccessLink || p.accessLink));
    
    if (validParticipants.length === 0) {
      showAlert("warning", "Nu există participanți cu link-uri de acces valide");
      return;
    }

    // Dacă există un singur participant valid, copiez direct link-ul său
    if (validParticipants.length === 1) {
      const participant = validParticipants[0];
      const accessLink = participant.uniqueAccessLink || participant.accessLink;
      const conferenceLink = `${window.location.origin}/conferinta-grup/${accessLink}`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(conferenceLink)
          .then(() => {
            showAlert("success", `Link-ul pentru ${participant.nume} ${participant.prenume} a fost copiat în clipboard!`);
          })
          .catch(() => {
            fallbackCopyText(conferenceLink);
          });
      } else {
        fallbackCopyText(conferenceLink);
      }
      return;
    }

    // Dacă sunt mai mulți participanți valizi, afișez o listă
    let participantsList = "Există mai mulți participanți înscrși:\n\n";
    validParticipants.forEach((participant, index) => {
      const accessLink = participant.uniqueAccessLink || participant.accessLink;
      participantsList += `${index + 1}. ${participant.nume} ${participant.prenume} (${participant.email})\n`;
      participantsList += `   Link: ${window.location.origin}/conferinta-grup/${accessLink}\n\n`;
    });
    
    participantsList += "Notă: Fiecare participant are un link individual unic.";
    
    showAlert("info", "Vezi consola pentru link-urile tuturor participanților");
    console.log("🔗 [CONFERENCE LINKS] Link-uri participanți:", participantsList);
    
    // Opțional: copiez link-ul primului participant valid
    const firstParticipant = validParticipants[0];
    const firstAccessLink = firstParticipant.uniqueAccessLink || firstParticipant.accessLink;
    const firstConferenceLink = `${window.location.origin}/conferinta-grup/${firstAccessLink}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(firstConferenceLink)
        .then(() => {
          showAlert("success", `Link-ul pentru primul participant (${firstParticipant.nume} ${firstParticipant.prenume}) a fost copiat în clipboard!`);
        })
        .catch(() => {
          fallbackCopyText(firstConferenceLink);
        });
    } else {
      fallbackCopyText(firstConferenceLink);
    }
  };

  // Funcție fallback pentru copierea textului
  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showAlert("success", "Link-ul a fost copiat în clipboard!");
    } catch (err) {
      showAlert("warning", `Nu s-a putut copia automat. Link-ul este: ${text}`);
    }
    
    document.body.removeChild(textArea);
  };

  // Funcție pentru trimiterea email-ului cu link-ul de acces
  const sendConferenceEmail = async (participant, conferinta) => {
    try {
      setLoading(true);
      console.log("📧 [EMAIL] Trimitere email către:", participant.email);
      console.log("📧 [EMAIL] Access link participant:", participant.uniqueAccessLink || participant.accessLink);
      
      // Folosesc API-ul direct pentru email
      const emailResponse = await fetch('/api/send-email-conferinta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantData: participant,
          conferintaData: conferinta,
          accessLink: participant.uniqueAccessLink || participant.accessLink,
          isTestMode: false
        }),
      });

      const emailResult = await emailResponse.json();
      
      console.log("✅ [EMAIL] Răspuns email API:", emailResult);
      
      if (emailResult.success) {
        showAlert("success", `Email trimis cu succes către ${participant.nume}!`);
      } else {
        showAlert("danger", `Eroare la trimiterea email-ului: ${emailResult.error}`);
      }
      
    } catch (error) {
      console.error("💥 [EMAIL] Eroare la trimiterea email-ului:", error);
      showAlert("danger", `Eroare la trimiterea email-ului: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru trimiterea email-urilor către toți participanții
  const sendEmailToAllParticipants = async (conferinta) => {
    if (!conferinta.participanti || conferinta.participanti.length === 0) {
      showAlert("warning", "Nu există participanți pentru această conferință");
      return;
    }

    // Filtrează participanții valizi
    const validParticipants = conferinta.participanti.filter(p => p && p.email);
    
    if (validParticipants.length === 0) {
      showAlert("warning", "Nu există participanți valizi pentru această conferință");
      return;
    }

    if (!window.confirm(`Ești sigur că vrei să trimiți email-ul către toți ${validParticipants.length} participanții valizi?`)) {
      return;
    }

    try {
      setLoading(true);
      console.log("📧 [EMAIL ALL] Trimitere email către toți participanții");
      
      let successful = 0;
      let failed = 0;

      // Trimit email-uri individuale pentru fiecare participant valid
      for (const participant of validParticipants) {
        try {
          console.log(`📧 [EMAIL ALL] Trimitere către: ${participant.email}`);
          
          const emailResponse = await fetch('/api/send-email-conferinta', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              participantData: participant,
              conferintaData: conferinta,
              accessLink: participant.uniqueAccessLink || participant.accessLink,
              isTestMode: false
            }),
          });

          const emailResult = await emailResponse.json();
          
          if (emailResult.success) {
            successful++;
            console.log(`✅ [EMAIL ALL] Succes către: ${participant.email}`);
          } else {
            failed++;
            console.log(`❌ [EMAIL ALL] Eșec către: ${participant.email}`, emailResult.error);
          }
          
        } catch (emailError) {
          failed++;
          console.error(`💥 [EMAIL ALL] Eroare către ${participant.email}:`, emailError);
        }

        // Pauză mică între email-uri pentru a evita rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`📊 [EMAIL ALL] Rezultate finale: ${successful} succese, ${failed} eșecuri`);
      
      showAlert("success", 
        `Email-uri trimise! ✅ ${successful} succese, ❌ ${failed} eșecuri din ${validParticipants.length} total`
      );
      
    } catch (error) {
      console.error("💥 [EMAIL ALL] Eroare generală:", error);
      showAlert("danger", `Eroare la trimiterea email-urilor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru trimiterea SMS către toți participanții
  const sendSMSToAllParticipants = async (conferinta, smsType = 'confirmation') => {
    if (!conferinta || !conferinta.participanti || conferinta.participanti.length === 0) {
      showAlert("warning", "Nu există participanți înscriși la această conferință");
      return;
    }

    // Confirmă acțiunea
    const smsTypeText = smsType === 'reminder' ? 'reminder' : 'confirmare';
    const confirmMessage = `Ești sigur că vrei să trimiți SMS-uri de ${smsTypeText} către toți participanții la "${conferinta.titlu}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      console.log(`📱 [SMS ALL] Începe trimiterea SMS-urilor de ${smsType} pentru conferința:`, conferinta.titlu);

      // Filtrează participanții valizi
      const validParticipants = conferinta.participanti.filter(p => {
        return p && p.email && (p.telefon || p.phone) && (p.uniqueAccessLink || p.accessLink);
      });

      if (validParticipants.length === 0) {
        showAlert("warning", "Nu există participanți cu date complete (email, telefon și link de acces)");
        return;
      }

      console.log(`📱 [SMS ALL] Participanți valizi găsiți: ${validParticipants.length} din ${conferinta.participanti.length}`);

      // Pregătește datele pentru API
      const smsData = {
        recipients: validParticipants,
        conferenceData: conferinta,
        smsType: smsType,
        userUID: userData?.owner_uid || currentUser?.uid || "admin"
      };

      // Apelează API-ul pentru SMS-uri
      const smsResponse = await fetch('/api/send-conference-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smsData)
      });

      const smsResult = await smsResponse.json();

      if (smsResponse.ok && smsResult.success) {
        console.log(`✅ [SMS ALL] Rezultate SMS:`, smsResult.summary);
        
        const { sent, failed, skipped, total } = smsResult.summary;
        let message = `SMS-uri trimise cu succes!\n\n`;
        message += `📤 Trimise: ${sent}\n`;
        if (failed > 0) message += `❌ Eșuate: ${failed}\n`;
        if (skipped > 0) message += `⏭️ Omise: ${skipped}\n`;
        message += `📊 Total: ${total}`;

        // Verifică dacă sunt probleme cu contul Twilio
        if (smsResult.twilioStatus?.accountWarning) {
          message += `\n\n⚠️ ${smsResult.twilioStatus.accountWarning}`;
        }

        showAlert("success", message);

        // Afișează detalii în consolă pentru debugging
        console.log("📱 [SMS ALL] Detalii complete:", smsResult.results);
        
      } else {
        console.error(`❌ [SMS ALL] Eroare API SMS:`, smsResult);
        showAlert("danger", `Eroare la trimiterea SMS-urilor: ${smsResult.error || 'Eroare necunoscută'}`);
      }

    } catch (error) {
      console.error("💥 [SMS ALL] Eroare generală:", error);
      showAlert("danger", `Eroare la trimiterea SMS-urilor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru trimiterea SMS individual către un participant
  const sendSMSToParticipant = async (participant, conferinta, smsType = 'confirmation') => {
    if (!participant || !participant.telefon && !participant.phone) {
      showAlert("warning", `${participant?.nume || 'Participantul'} nu are număr de telefon`);
      return;
    }

    if (!participant.uniqueAccessLink && !participant.accessLink) {
      showAlert("warning", `${participant.nume} nu are link de acces generat`);
      return;
    }

    try {
      setLoading(true);
      console.log(`📱 [SMS INDIVIDUAL] Trimitere SMS către: ${participant.nume} ${participant.prenume}`);

      const smsData = {
        recipients: [participant],
        conferenceData: conferinta,
        smsType: smsType,
        userUID: userData?.owner_uid || currentUser?.uid || "admin"
      };

      const smsResponse = await fetch('/api/send-conference-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smsData)
      });

      const smsResult = await smsResponse.json();

      if (smsResponse.ok && smsResult.success) {
        const result = smsResult.results[0];
        if (result.status === 'success') {
          showAlert("success", `SMS trimis cu succes către ${participant.nume} ${participant.prenume}!`);
        } else {
          showAlert("warning", `SMS către ${participant.nume}: ${result.reason || result.error}`);
        }
      } else {
        showAlert("danger", `Eroare la trimiterea SMS-ului: ${smsResult.error}`);
      }

    } catch (error) {
      console.error("💥 [SMS INDIVIDUAL] Eroare:", error);
      showAlert("danger", `Eroare la trimiterea SMS-ului: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru generarea accessLink-ului pentru conferință
  const generateConferenceAccessLink = () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const conferintaPrefix = "conf";
    return `${conferintaPrefix}_${timestamp}_${randomString}`;
  };

  // Funcție pentru a genera și actualiza link-ul de acces pentru un participant
  const generateAccessLinkForParticipant = async (conferinta, participantIndex) => {
    if (!window.confirm("Ești sigur că vrei să generezi un nou link de acces pentru acest participant?")) {
      return;
    }

    try {
      setLoading(true);
      console.log(`🔗 [GENERATE LINK] Generare link pentru participant index ${participantIndex}`);
      
      const updatedParticipants = [...conferinta.participanti];
      const participant = updatedParticipants[participantIndex];
      
      if (!participant) {
        throw new Error("Participantul nu a fost găsit");
      }
      
      // Generez un nou uniqueAccessLink
      const newAccessLink = `grup_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      console.log(`🔗 [GENERATE LINK] Link nou generat: ${newAccessLink}`);
      
      // Actualizez participantul cu noul link
      updatedParticipants[participantIndex] = {
        ...participant,
        uniqueAccessLink: newAccessLink,
        accessLinkGeneratedAt: new Date().toISOString()
      };
      
      // Actualizez în Firestore
      await handleUpdateFirestore(`ConferinteGrup/${conferinta.documentId}`, {
        participanti: updatedParticipants
      });
      
      console.log(`✅ [GENERATE LINK] Link actualizat în Firestore pentru ${participant.nume} ${participant.prenume}`);
      
      // Actualizez state-ul local
      const updatedConferinta = { ...conferinta, participanti: updatedParticipants };
      setSelectedConferinta(updatedConferinta);
      
      // Reîmprospătez lista de conferințe
      await fetchConferinte(true);
      
      showAlert("success", `Link de acces generat cu succes pentru ${participant.nume} ${participant.prenume}!`);
      
      // Întreb dacă vrea să trimit emailul cu noul link
      if (window.confirm(`Vrei să trimiți emailul cu noul link de acces către ${participant.nume} ${participant.prenume}?`)) {
        await sendConferenceEmail(updatedParticipants[participantIndex], updatedConferinta);
      }
      
    } catch (error) {
      console.error("💥 [GENERATE LINK] Eroare la generarea link-ului:", error);
      showAlert("danger", "Eroare la generarea link-ului de acces");
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru a verifica dacă un participant are link de acces valid
  const hasValidAccessLink = (participant) => {
    return participant && (participant.uniqueAccessLink || participant.accessLink);
  };

  // Funcție pentru deschiderea dialog-ului de ștergere
  const handleDeleteConference = (conferinta) => {
    setDeleteConferenceDialog({
      isOpen: true,
      conferinta: conferinta
    });
  };

  // Funcție pentru confirmarea ștergerii din dialog
  const confirmDeleteConference = async () => {
    const conferinta = deleteConferenceDialog.conferinta;
    if (!conferinta) return;

    // Închide dialog-ul
    setDeleteConferenceDialog({ isOpen: false, conferinta: null });

    try {
      setLoading(true);
      console.log("🗑️ [DELETE] === ÎNCEPE ȘTERGEREA CONFERINȚEI ===");
      console.log("🗑️ [DELETE] Conference ID:", conferinta.documentId);
      console.log("🗑️ [DELETE] Conference title:", conferinta.titlu);
      console.log("🗑️ [DELETE] Participanți de șters:", conferinta.participanti?.length || 0);
      
      // Import Firebase functions pentru ștergere
      const { deleteDoc, doc } = await import("firebase/firestore");
      const { ref, deleteObject } = await import("firebase/storage");
      const { db, storage } = await import("../../../firebase");

      // 1. Șterge documentul principal din ConferinteGrup
      console.log("🗑️ [DELETE] Șterg documentul principal...");
      const conferintaRef = doc(db, "ConferinteGrup", conferinta.documentId);
      await deleteDoc(conferintaRef);
      console.log("✅ [DELETE] Document principal șters din ConferinteGrup");

      // 2. Șterge documentul de prezență din ConferinteGrupPresence (dacă există)
      try {
        console.log("🗑️ [DELETE] Șterg documentul de prezență...");
        const presenceRef = doc(db, "ConferinteGrupPresence", conferinta.documentId);
        await deleteDoc(presenceRef);
        console.log("✅ [DELETE] Document de prezență șters din ConferinteGrupPresence");
      } catch (presenceError) {
        console.log("⚠️ [DELETE] Nu există document de prezență sau a fost deja șters");
      }

      // 3. Șterge imaginea din Storage (dacă există)
      if (conferinta.imageUrl) {
        try {
          console.log("🗑️ [DELETE] Șterg imaginea din Storage...");
          console.log("🗑️ [DELETE] Image URL:", conferinta.imageUrl);
          
          // Extrag calea din URL-ul complet
          const imagePathMatch = conferinta.imageUrl.match(/conferinte-grup%2F([^?]+)/);
          if (imagePathMatch) {
            const imagePath = decodeURIComponent(imagePathMatch[1]);
            console.log("🗑️ [DELETE] Image path extrasa:", imagePath);
            
            const imageRef = ref(storage, `conferinte-grup/${imagePath}`);
            await deleteObject(imageRef);
            console.log("✅ [DELETE] Imaginea a fost ștearsă din Storage");
          } else {
            console.log("⚠️ [DELETE] Nu s-a putut extrage calea imaginii din URL");
          }
        } catch (imageError) {
          console.log("⚠️ [DELETE] Imaginea nu a putut fi ștearsă sau nu există:", imageError.message);
        }
      }

      // 4. Actualizează state-ul local
      console.log("🗑️ [DELETE] Actualizez state-ul local...");
      
      // Elimină conferința din lista locală
      setConferinte(prevConferinte => 
        prevConferinte.filter(c => c.documentId !== conferinta.documentId)
      );
      
      // Dacă conferința ștearsă era selectată, resetează selecția
      if (selectedConferinta && selectedConferinta.documentId === conferinta.documentId) {
        setSelectedConferinta(null);
        setActiveTab("list");
      }
      
      // Dacă conferința ștearsă era în editare, resetează formularul
      if (editingConferinta && editingConferinta.documentId === conferinta.documentId) {
        setEditingConferinta(null);
        resetForm();
        setActiveTab("list");
      }

      // 5. Recalculează statisticile
      await calculateTotalStats();

      console.log("🎉 [DELETE] === ȘTERGERE COMPLETĂ FINALIZATĂ ===");
      showAlert("success", `Conferința "${conferinta.titlu}" a fost ștearsă complet cu succes!`);

    } catch (error) {
      console.error("💥 [DELETE] === EROARE LA ȘTERGEREA CONFERINȚEI ===");
      console.error("💥 [DELETE] Error object:", error);
      console.error("💥 [DELETE] Error message:", error.message);
      console.error("💥 [DELETE] Error stack:", error.stack);
      
      showAlert("danger", `Eroare la ștergerea conferinței: ${error.message}`);
    } finally {
      setLoading(false);
      console.log("🏁 [DELETE] Loading setat pe false");
    }
  };

  return (
    <>
      <Home1Header />
      
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Administrare Conferințe de Grup</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/admin-consultatii">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Conferințe de Grup
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-md-5 col-lg-4 col-xl-3 theiaStickySidebar">
              <StickyBox offsetTop={20} offsetBottom={20}>
                <DoctorSidebar />
              </StickyBox>
            </div>

            <div className="col-lg-8 col-xl-9">
              {/* CSS pentru time spinner */}
              <style jsx>{`
                .time-spinner {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                }
                
                .time-spinner-btn {
                  width: 50px;
                  height: 30px;
                  padding: 2px;
                  border-radius: 4px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: all 0.2s ease;
                  cursor: pointer;
                  border: 2px solid #0d6efd;
                  background-color: white;
                  color: #0d6efd;
                  user-select: none;
                  -webkit-user-select: none;
                  -moz-user-select: none;
                  -ms-user-select: none;
                }
                
                .time-spinner-btn:hover {
                  background-color: #0d6efd;
                  color: white;
                  transform: scale(1.05);
                  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
                }
                
                .time-spinner-btn:active {
                  transform: scale(0.95);
                  background-color: #0b5ed7;
                }
                
                .time-spinner-btn:focus {
                  outline: 2px solid #86b7fe;
                  outline-offset: 2px;
                }
                
                .time-spinner-btn .sr-only {
                  position: absolute;
                  width: 1px;
                  height: 1px;
                  padding: 0;
                  margin: -1px;
                  overflow: hidden;
                  clip: rect(0, 0, 0, 0);
                  white-space: nowrap;
                  border: 0;
                }
                
                /* Fallback pentru cazul în care FontAwesome nu se încarcă */
                .time-spinner-btn .fa:before {
                  font-size: 14px;
                }
                
                .time-spinner-btn .fa-chevron-up:before {
                  content: "▲";
                  font-family: inherit;
                }
                
                .time-spinner-btn .fa-chevron-down:before {
                  content: "▼";
                  font-family: inherit;
                }
                
                /* Stiluri responsive pentru mobil - margin/padding top și bottom */
                @media (max-width: 768px) {
                  .time-controls-container {
                    margin-top: 30px;
                    margin-bottom: 30px;
                    padding-top: 20px;
                    padding-bottom: 20px;
                  }
                  
                  .time-spinner {
                    margin-top: 15px;
                    margin-bottom: 15px;
                  }
                  
                  .time-spinner-btn {
                    margin-top: 5px;
                    margin-bottom: 5px;
                  }
                }
                
                @media (max-width: 576px) {
                  .time-controls-container {
                    margin-top: 40px;
                    margin-bottom: 40px;
                    padding-top: 25px;
                    padding-bottom: 25px;
                  }
                  
                  .time-spinner {
                    margin-top: 20px;
                    margin-bottom: 20px;
                  }
                  
                  .time-spinner-btn {
                    margin-top: 8px;
                    margin-bottom: 8px;
                    height: 35px;
                    width: 55px;
                  }
                  
                  .time-input {
                    height: 45px !important;
                    font-size: 16px !important;
                  }
                }
                
                .time-input {
                  border: 2px solid #dee2e6;
                  border-radius: 4px;
                  margin: 2px 0;
                  background-color: #f8f9fa;
                  color: #495057;
                }
                
                .time-input:focus {
                  border-color: #0d6efd;
                  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
                }
              `}</style>

              {alert.visible && (
                <AlertMessage type={alert.type} message={alert.message} />
              )}

              <div className="dashboard-header">
                <h3>
                  {activeTab === "participants" && selectedConferinta 
                    ? `Participanți - ${selectedConferinta.titlu}` 
                    : "Conferințe de Grup"
                  }
                </h3>
                <div className="d-flex gap-2">
                  <button
                    className={`btn ${activeTab === "list" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => {
                      setActiveTab("list");
                      resetForm();
                      setSelectedConferinta(null);
                    }}
                  >
                    <i className="fa fa-list me-2"></i>
                    Lista Conferințe
                  </button>
                  <button
                    className={`btn ${activeTab === "create" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActiveTab("create")}
                  >
                    <i className="fa fa-plus me-2"></i>
                    {editingConferinta ? "Editează Conferința" : "Conferință Nouă"}
                  </button>
                  {activeTab === "participants" && (
                    <>
                      {/* Butoane pentru email și copierea link-ului */}
                      {selectedConferinta?.participanti && selectedConferinta.participanti.length > 0 && (
                        <>
                    <button
                            className="btn btn-primary me-2"
                            onClick={() => sendEmailToAllParticipants(selectedConferinta)}
                            disabled={loading}
                            title="Trimite email cu link-ul către toți participanții"
                          >
                            <i className="fa fa-envelope me-2"></i>
                            Email Toți ({selectedConferinta.participanti.length})
                          </button>

                          {/* Dropdown pentru SMS-uri */}
                          <div className="btn-group me-2" role="group">
                            <button
                              className="btn btn-success"
                              onClick={() => sendSMSToAllParticipants(selectedConferinta, 'confirmation')}
                              disabled={loading}
                              title="Trimite SMS de confirmare către toți participanții"
                            >
                              <i className="fa fa-mobile me-2"></i>
                              SMS Toți
                            </button>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-success dropdown-toggle dropdown-toggle-split"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                disabled={loading}
                                title="Opțiuni SMS"
                              >
                                <span className="visually-hidden">Toggle Dropdown</span>
                              </button>
                              <ul className="dropdown-menu">
                                <li>
                                  <a 
                                    className="dropdown-item" 
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      sendSMSToAllParticipants(selectedConferinta, 'confirmation');
                                    }}
                                  >
                                    <i className="fa fa-check me-2"></i>
                                    SMS Confirmare
                                  </a>
                                </li>
                                <li>
                                  <a 
                                    className="dropdown-item" 
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      sendSMSToAllParticipants(selectedConferinta, 'reminder');
                                    }}
                                  >
                                    <i className="fa fa-bell me-2"></i>
                                    SMS Reminder
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                          
                          <button
                            className="btn btn-info me-2"
                            onClick={() => copyConferenceLink(selectedConferinta)}
                            disabled={loading}
                            title="Copiază link-ul conferinței"
                          >
                            <i className="fa fa-copy me-2"></i>
                            Copiază Link
                          </button>
                        </>
                      )}
                      
                      <button
                        className="btn btn-outline-success me-2"
                      onClick={() => exportParticipants(selectedConferinta)}
                    >
                      <i className="fa fa-download me-2"></i>
                      Export CSV
                    </button>
                      <button
                        className="btn btn-success me-2"
                        onClick={() => handleJoinAsAdmin(selectedConferinta)}
                        disabled={!isConferenceActive(selectedConferinta)}
                        title={isConferenceActive(selectedConferinta) ? "Alătură-te ca Admin/Host" : "Conferința nu este activă acum"}
                      >
                        <i className="fa fa-video me-2"></i>
                        Alătură-te ca Host
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteConference(selectedConferinta)}
                        disabled={loading}
                        title="Șterge conferința complet"
                      >
                        <i className="fa fa-trash me-2"></i>
                        Șterge Conferința
                      </button>
                    </>
                  )}
                </div>
              </div>

              {activeTab === "list" && (
                <div>
                  {/* Loading State pentru încărcarea inițială */}
                  {loading && conferinte.length === 0 && (
                    <div className="text-center py-5">
                      <div className="d-flex flex-column align-items-center">
                        <div 
                          className="spinner-border text-primary mb-4" 
                          role="status"
                          style={{ width: "3rem", height: "3rem" }}
                        >
                          <span className="visually-hidden">Se încarcă...</span>
                        </div>
                        <h5 className="text-muted mb-2">Se încarcă conferințele...</h5>
                        <p className="text-muted small mb-0">
                          <i className="fa fa-info-circle me-1"></i>
                          Preluăm datele din Firestore
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Content principal - afișat doar când nu se încarcă inițial */}
                  {(!loading || conferinte.length > 0) && (
                    <>
                      {/* Statistici generale */}
                      <div className="row mb-4">
                    <div className="col-md-3 mb-3">
                      <div 
                        className="card border-0 shadow-sm h-100"
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          borderRadius: "12px",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-3px)";
                          e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                        }}
                      >
                        <div className="card-body text-center py-4">
                          <div 
                            className="d-inline-flex align-items-center justify-content-center mb-3"
                            style={{
                              width: "60px",
                              height: "60px",
                              background: "rgba(255,255,255,0.2)",
                              borderRadius: "50%",
                              backdropFilter: "blur(10px)"
                            }}
                          >
                            <i className="fa fa-calendar fa-lg text-white"></i>
                          </div>
                          <h3 className="text-white mb-1 fw-bold">{totalStats.total}</h3>
                          <p className="text-white-50 mb-0 small">Total Conferințe</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <div 
                        className="card border-0 shadow-sm h-100"
                        style={{
                          background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                          borderRadius: "12px",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-3px)";
                          e.currentTarget.style.boxShadow = "0 8px 25px rgba(17, 153, 142, 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                        }}
                      >
                        <div className="card-body text-center py-4">
                          <div 
                            className="d-inline-flex align-items-center justify-content-center mb-3"
                            style={{
                              width: "60px",
                              height: "60px",
                              background: "rgba(255,255,255,0.2)",
                              borderRadius: "50%",
                              backdropFilter: "blur(10px)"
                            }}
                          >
                            <i className="fa fa-check-circle fa-lg text-white"></i>
                          </div>
                          <h3 className="text-white mb-1 fw-bold">{totalStats.active}</h3>
                          <p className="text-white-50 mb-0 small">Conferințe Active</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <div 
                        className="card border-0 shadow-sm h-100"
                        style={{
                          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                          borderRadius: "12px",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-3px)";
                          e.currentTarget.style.boxShadow = "0 8px 25px rgba(79, 172, 254, 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                        }}
                      >
                        <div className="card-body text-center py-4">
                          <div 
                            className="d-inline-flex align-items-center justify-content-center mb-3"
                            style={{
                              width: "60px",
                              height: "60px",
                              background: "rgba(255,255,255,0.2)",
                              borderRadius: "50%",
                              backdropFilter: "blur(10px)"
                            }}
                          >
                            <i className="fa fa-users fa-lg text-white"></i>
                          </div>
                          <h3 className="text-white mb-1 fw-bold">{totalStats.participants}</h3>
                          <p className="text-white-50 mb-0 small">Total Participanți</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <div 
                        className="card border-0 shadow-sm h-100"
                        style={{
                          background: "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 100%)",
                          borderRadius: "12px",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-3px)";
                          e.currentTarget.style.boxShadow = "0 8px 25px rgba(250, 112, 154, 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,1)";
                        }}
                      >
                        <div className="card-body text-center py-4">
                          <div 
                            className="d-inline-flex align-items-center justify-content-center mb-3"
                            style={{
                              width: "60px",
                              height: "60px",
                              background: "rgba(0,0,0,1)",
                              borderRadius: "50%",
                              backdropFilter: "blur(10px)"
                            }}
                          >
                            <i className="fa fa-graduation-cap fa-lg text-white"></i>
                          </div>
                          <h3 className="text-white mb-1 fw-bold">{totalStats.courses}</h3>
                          <p className="text-white-50 mb-0 small">Cursuri Disponibile</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informații despre paginație */}
                  <div className="row mb-3">
                    <div className="col-md-8">
                      <p className="text-muted mb-0">
                        <i className="fa fa-info-circle me-1"></i>
                        Afișează {conferinte.length} din {totalStats.total} conferințe
                        {hasMore && " (încarcă mai multe pentru a vedea toate)"}
                      </p>
                    </div>
                    <div className="col-md-4 text-end">
                      {hasMore && (
                        <small className="text-primary">
                          <i className="fa fa-arrow-down me-1"></i>
                          Mai multe disponibile
                                  </small>
                      )}
                                </div>
                  </div>

                  {/* Carduri pentru conferințe */}
                  <div className="row">
                    {conferinte.map((conferinta) => (
                      <div key={conferinta.documentId} className="col-lg-6 col-xl-4 mb-4">
                        <div 
                          className="card h-100 shadow-sm border-0 conference-card" 
                          style={{ 
                            borderRadius: "15px",
                            overflow: "hidden",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                          }}
                        >
                          {/* Header cu imagine */}
                          <div className="position-relative" style={{ height: "200px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                            {conferinta.imageUrl ? (
                              <img 
                                src={conferinta.imageUrl} 
                                alt={conferinta.titlu}
                                className="w-100 h-100"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center h-100">
                                <i className="fa fa-calendar fa-4x text-white opacity-50"></i>
                              </div>
                            )}
                            
                            {/* Badge pentru tip și status */}
                            <div className="position-absolute top-0 start-0 m-3">
                                <span className={`badge ${
                                conferinta.tipConferinta === "course" ? "bg-info" : "bg-primary"
                              } me-2`} style={{ fontSize: "0.75rem" }}>
                                {conferinta.tipConferinta === "course" ? "CURS" : "CONFERINȚĂ"}
                                </span>
                              <span className={`badge ${
                                conferinta.status === "activa" ? "bg-success" : "bg-secondary"
                              }`} style={{ fontSize: "0.75rem" }}>
                                {conferinta.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Preț */}
                            <div className="position-absolute top-0 end-0 m-3">
                              <div className="bg-white rounded-pill px-3 py-1">
                                <strong className="text-primary">{conferinta.pretParticipare} RON</strong>
                              </div>
                            </div>
                          </div>

                          {/* Conținut card */}
                          <div className="card-body d-flex flex-column">
                            <h5 className="card-title mb-2" style={{ color: "#2c3e50", fontWeight: "600" }}>
                              {conferinta.titlu}
                            </h5>
                            
                            <p className="card-text text-muted mb-3" style={{ 
                              fontSize: "0.9rem",
                              lineHeight: "1.4",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}>
                              {conferinta.descriere}
                            </p>

                            {/* Informații detaliate */}
                            <div className="mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <i className="fa fa-calendar text-primary me-2"></i>
                                <small className="text-muted">{formatDataDisplay(conferinta)}</small>
                              </div>
                              
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                  <i className="fa fa-users text-info me-2"></i>
                                  <span className="fw-bold text-info">
                                  {conferinta.participanti?.length || 0}
                                </span>
                                  {conferinta.numarMaxParticipanti && (
                                    <span className="text-muted">
                                      /{conferinta.numarMaxParticipanti}
                                    </span>
                                  )}
                                  <small className="text-muted ms-1">participanți</small>
                                </div>
                                
                                <span className={`badge ${
                                  calculateAvailableSpots(conferinta) === 0 ? "bg-danger" : 
                                  calculateAvailableSpots(conferinta) === "Nelimitat" ? "bg-success" : "bg-warning"
                                }`}>
                                  {calculateAvailableSpots(conferinta) === "Nelimitat" ? 
                                    "Nelimitat" : 
                                    `${calculateAvailableSpots(conferinta)} locuri`
                                  }
                                </span>
                              </div>
                            </div>

                            {/* Butoane de acțiune */}
                            <div className="mt-auto admin-conference-buttons">
                              <div className="row g-2 mb-2">
                                <div className="col-3">
                                  <button
                                    className="btn btn-outline-primary btn-sm w-100"
                                    onClick={() => handleEdit(conferinta)}
                                    title="Editează conferința"
                                    disabled={loading}
                                  >
                                    <i className="fa fa-edit"></i>
                                  </button>
                                </div>
                                <div className="col-3">
                                  <button
                                    className="btn btn-outline-info btn-sm w-100"
                                    onClick={() => handleViewParticipants(conferinta)}
                                    title="Vezi participanții"
                                    disabled={loading}
                                  >
                                    <i className="fa fa-users"></i>
                                  </button>
                                </div>
                                <div className="col-3">
                                  <button
                                    className={`btn btn-sm w-100 ${
                                      isConferenceActive(conferinta) ? "btn-success" : "btn-warning"
                                    }`}
                                    onClick={() => handleJoinAsAdmin(conferinta)}
                                    title={isConferenceActive(conferinta) ? 
                                      "Alătură-te ca Admin/Host" : 
                                      `Conferință ${conferinta.status} - Click pentru activare`
                                    }
                                    disabled={loading}
                                  >
                                    <i className="fa fa-video"></i>
                                  </button>
                                </div>
                                <div className="col-3">
                                  <button
                                    className="btn btn-outline-danger btn-sm w-100"
                                    onClick={() => handleDeleteConference(conferinta)}
                                    title="Șterge conferința complet"
                                    disabled={loading}
                                  >
                                    <i className="fa fa-trash"></i>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Informații suplimentare pentru conferințe inactive */}
                              {!isConferenceActive(conferinta) && (
                                <div className="text-center mt-2">
                                  <small className="text-warning">
                                    <i className="fa fa-exclamation-triangle me-1"></i>
                                    {conferinta.status === "inactiva" ? "Conferință inactivă" : "Conferință completată"}
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Buton Show More */}
                  {hasMore && conferinte.length > 0 && (
                        <div className="text-center py-4">
                      <button
                        className="btn btn-outline-primary btn-lg"
                        onClick={loadMoreConferinte}
                        disabled={loadingMore}
                        style={{
                          borderRadius: "25px",
                          padding: "12px 30px",
                          fontWeight: "500",
                          transition: "all 0.3s ease"
                        }}
                      >
                        {loadingMore ? (
                          <>
                            <i className="fa fa-spinner fa-spin me-2"></i>
                            Se încarcă...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-chevron-down me-2"></i>
                            Încarcă mai multe ({totalStats.total - conferinte.length} rămase)
                          </>
                        )}
                      </button>
                        </div>
                      )}

                  {/* Mesaj când toate conferințele au fost încărcate */}
                  {!hasMore && conferinte.length > 0 && (
                    <div className="text-center py-3">
                      <div className="alert alert-info d-inline-block">
                        <i className="fa fa-check-circle me-2"></i>
                        Toate conferințele au fost încărcate ({conferinte.length} total)
                    </div>
                  </div>
                  )}
                  
                      {/* Mesaj când nu există conferințe */}
                      {conferinte.length === 0 && !loading && (
                        <div className="text-center py-5">
                          <div className="mb-4">
                            <i className="fa fa-calendar fa-4x text-muted mb-3"></i>
                            <h4 className="text-muted">Nu există conferințe create încă</h4>
                            <p className="text-muted">Începe prin a crea prima ta conferință de grup!</p>
                          </div>
                          <button
                            className="btn btn-primary btn-lg"
                            onClick={() => setActiveTab("create")}
                          >
                            <i className="fa fa-plus me-2"></i>
                            Creează Prima Conferință
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "participants" && selectedConferinta && (
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4>Participanți - {selectedConferinta.titlu}</h4>
                    <div className="d-flex gap-2 align-items-center">
                      <span className="badge bg-info fs-6">
                        {selectedConferinta.participanti?.length || 0} înregistrați
                      </span>
                      <span className="badge bg-success fs-6">
                        {(participantsOnline[selectedConferinta.documentId] || []).length} online acum
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    {/* Statistici rapide */}
                    <div className="row mb-4">
                      <div className="col-md-3 mb-3">
                        <div 
                          className="card border-0 shadow-sm h-100"
                          style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            borderRadius: "12px",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                          }}
                        >
                          <div className="card-body text-center py-4">
                            <div 
                              className="d-inline-flex align-items-center justify-content-center mb-3"
                              style={{
                                width: "50px",
                                height: "50px",
                                background: "rgba(255,255,255,0.2)",
                                borderRadius: "50%",
                                backdropFilter: "blur(10px)"
                              }}
                            >
                              <i className="fa fa-users fa-lg text-white"></i>
                          </div>
                            <h3 className="text-white mb-1 fw-bold">{selectedConferinta.participanti?.length || 0}</h3>
                            <p className="text-white-50 mb-0 small">Total Înregistrați</p>
                        </div>
                      </div>
                          </div>
                      
                      <div className="col-md-3 mb-3">
                        <div 
                          className="card border-0 shadow-sm h-100"
                          style={{
                            background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                            borderRadius: "12px",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = "0 8px 25px rgba(17, 153, 142, 0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                          }}
                        >
                          <div className="card-body text-center py-4">
                            <div 
                              className="d-inline-flex align-items-center justify-content-center mb-3"
                              style={{
                                width: "50px",
                                height: "50px",
                                background: "rgba(255,255,255,0.2)",
                                borderRadius: "50%",
                                backdropFilter: "blur(10px)"
                              }}
                            >
                              <i className="fa fa-wifi fa-lg text-white"></i>
                        </div>
                            <h3 className="text-white mb-1 fw-bold">{(participantsOnline[selectedConferinta.documentId] || []).length}</h3>
                            <p className="text-white-50 mb-0 small">Online Acum</p>
                      </div>
                          </div>
                        </div>
                      
                      <div className="col-md-3 mb-3">
                        <div 
                          className="card border-0 shadow-sm h-100"
                          style={{
                            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            borderRadius: "12px",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = "0 8px 25px rgba(79, 172, 254, 0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                          }}
                        >
                          <div className="card-body text-center py-4">
                            <div 
                              className="d-inline-flex align-items-center justify-content-center mb-3"
                              style={{
                                width: "50px",
                                height: "50px",
                                background: "rgba(255,255,255,0.2)",
                                borderRadius: "50%",
                                backdropFilter: "blur(10px)"
                              }}
                            >
                              <i className="fa fa-ticket fa-lg text-white"></i>
                      </div>
                            <h3 className="text-white mb-1 fw-bold">{calculateAvailableSpots(selectedConferinta)}</h3>
                            <p className="text-white-50 mb-0 small">Locuri Disponibile</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-3 mb-3">
                        <div 
                          className="card border-0 shadow-sm h-100"
                          style={{
                            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                            borderRadius: "12px",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = "0 8px 25px rgba(250, 112, 154, 0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                          }}
                        >
                          <div className="card-body text-center py-4">
                            <div 
                              className="d-inline-flex align-items-center justify-content-center mb-3"
                              style={{
                                width: "50px",
                                height: "50px",
                                background: "rgba(255,255,255,0.2)",
                                borderRadius: "50%",
                                backdropFilter: "blur(10px)"
                              }}
                            >
                              <i className="fa fa-money fa-lg text-white"></i>
                            </div>
                            <h3 className="text-white mb-1 fw-bold">{selectedConferinta.pretParticipare * (selectedConferinta.participanti?.length || 0)} RON</h3>
                            <p className="text-white-50 mb-0 small">Venituri Total</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista participanților - Format carduri */}
                    <div className="row">
                          {(selectedConferinta.participanti || [])
                            .filter(participant => participant !== null && participant !== undefined)
                            .map((participant, index) => (
                        <div key={index} className="col-lg-4 col-md-6 col-sm-12 mb-4">
                          <div 
                            className="card h-100 border-0 shadow-sm"
                            style={{
                              borderRadius: "15px",
                              overflow: "hidden",
                              transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-3px)";
                              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.12)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
                            }}
                          >
                            {/* Header gradient cu avatar */}
                            <div 
                              className="position-relative"
                              style={{
                                background: isParticipantOnline(participant) ? 
                                  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" : 
                                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                padding: "20px 20px 60px 20px"
                              }}
                            >
                              {/* Status online badge */}
                              <div className="position-absolute top-0 end-0 m-3">
                                {isParticipantOnline(participant) ? (
                                  <span className="badge bg-light text-success" style={{ fontSize: "0.75rem" }}>
                                    <i className="fa fa-circle me-1"></i>
                                    Online
                                  </span>
                                ) : (
                                  <span className="badge bg-light text-muted" style={{ fontSize: "0.75rem" }}>
                                    <i className="fa fa-circle me-1"></i>
                                    Offline
                                  </span>
                                )}
                              </div>

                              {/* Guest user indicator */}
                              {participant.isGuestUser && (
                                <div className="position-absolute top-0 start-0 m-3">
                                  <span className="badge bg-light text-info" style={{ fontSize: "0.75rem" }}>
                                    <i className="fa fa-user-o me-1"></i>
                                    Vizitator
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Avatar centrat */}
                            <div 
                              className="position-absolute"
                              style={{
                                top: "50px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                zIndex: 10
                              }}
                            >
                                  <div style={{
                                width: "70px",
                                height: "70px",
                                    borderRadius: "50%",
                                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontWeight: "bold",
                                fontSize: "24px",
                                border: "4px solid white",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.15)"
                                  }}>
                                {participant.nume?.charAt(0)?.toUpperCase() || participant.prenume?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                  </div>

                            <div className="card-body" style={{ paddingTop: "50px" }}>
                              {/* Nume și prenume */}
                              <div className="text-center mb-3">
                                <h5 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                                  {participant.nume} {participant.prenume}
                                </h5>
                                <small className="text-muted">
                                  Înregistrat: {moment(participant.dataInscrierii).format("DD/MM/YYYY")}
                                </small>
                                </div>

                              {/* Informații contact */}
                              <div className="mb-3">
                                <div className="d-flex align-items-center mb-2 p-2 rounded" style={{ backgroundColor: "#f8f9fa" }}>
                                  <div 
                                    className="d-flex align-items-center justify-content-center me-3"
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "8px",
                                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                    }}
                                  >
                                    <i className="fa fa-envelope fa-sm text-white"></i>
                                </div>
                                  <div className="flex-grow-1">
                                    <a 
                                      href={`mailto:${participant.email}`} 
                                      className="text-decoration-none small text-dark fw-medium"
                                      style={{ fontSize: "0.85rem" }}
                                    >
                                      {participant.email}
                                    </a>
                                </div>
                                </div>

                                {participant.telefon && (
                                  <div className="d-flex align-items-center mb-2 p-2 rounded" style={{ backgroundColor: "#f8f9fa" }}>
                                    <div 
                                      className="d-flex align-items-center justify-content-center me-3"
                                      style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "8px",
                                        background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                                      }}
                                    >
                                      <i className="fa fa-phone fa-sm text-white"></i>
                                    </div>
                                    <div className="flex-grow-1">
                                      <a 
                                        href={`tel:${participant.telefon}`} 
                                        className="text-decoration-none small text-dark fw-medium"
                                        style={{ fontSize: "0.85rem" }}
                                      >
                                        {participant.telefon}
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Status participare și link de acces */}
                              <div className="text-center mb-3">
                                {getParticipantStatus(participant)}
                                
                                {/* Indicator pentru link de acces */}
                                <div className="mt-2">
                                  {hasValidAccessLink(participant) ? (
                                    <span className="badge bg-success">
                                      <i className="fa fa-link me-1"></i>
                                      Link generat
                                    </span>
                                  ) : (
                                    <span className="badge bg-warning">
                                      <i className="fa fa-exclamation-triangle me-1"></i>
                                      Link lipsește
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Observații */}
                              {participant.observatii && (
                                <div className="mb-3 p-2 rounded" style={{ backgroundColor: "#fff3cd" }}>
                                <small className="text-muted">
                                    <i className="fa fa-sticky-note me-1 text-warning"></i>
                                    {participant.observatii}
                                </small>
                                </div>
                              )}
                            </div>

                            {/* Footer cu butoanele de acțiune */}
                            <div 
                              className="card-footer border-0"
                              style={{ backgroundColor: "#f8f9fa", padding: "15px 20px" }}
                            >
                              {/* Prima linie de butoane */}
                              <div className="d-flex justify-content-center gap-2 mb-2">
                                {/* Buton pentru trimiterea email-ului individual */}
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => sendConferenceEmail(participant, selectedConferinta)}
                                  disabled={loading || !hasValidAccessLink(participant)}
                                  title={hasValidAccessLink(participant) ? `Trimite email cu link-ul către ${participant.nume}` : "Nu poate trimite email - link lipsește"}
                                  style={{ borderRadius: "8px", padding: "8px 12px" }}
                                >
                                  <i className="fa fa-envelope me-1"></i>
                                  Email
                                </button>

                                {/* Dropdown pentru SMS individual */}
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => sendSMSToParticipant(participant, selectedConferinta, 'confirmation')}
                                    disabled={loading || !hasValidAccessLink(participant) || (!participant.telefon && !participant.phone)}
                                    title={
                                      !hasValidAccessLink(participant) ? "Nu poate trimite SMS - link lipsește" :
                                      (!participant.telefon && !participant.phone) ? "Nu poate trimite SMS - telefon lipsește" :
                                      `Trimite SMS de confirmare către ${participant.nume}`
                                    }
                                    style={{ borderRadius: "8px 0 0 8px", padding: "8px 10px" }}
                                  >
                                    <i className="fa fa-mobile"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-success dropdown-toggle dropdown-toggle-split"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    disabled={loading || !hasValidAccessLink(participant) || (!participant.telefon && !participant.phone)}
                                    style={{ borderRadius: "0 8px 8px 0", padding: "8px 6px" }}
                                    title="Opțiuni SMS"
                                  >
                                    <span className="visually-hidden">Toggle SMS Options</span>
                                  </button>
                                  <ul className="dropdown-menu">
                                    <li>
                                      <a
                                        className="dropdown-item"
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          sendSMSToParticipant(participant, selectedConferinta, 'confirmation');
                                        }}
                                      >
                                        <i className="fa fa-check me-2"></i>
                                        SMS Confirmare
                                      </a>
                                    </li>
                                    <li>
                                      <a
                                        className="dropdown-item"
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          sendSMSToParticipant(participant, selectedConferinta, 'reminder');
                                        }}
                                      >
                                        <i className="fa fa-bell me-2"></i>
                                        SMS Reminder
                                      </a>
                                    </li>
                                  </ul>
                                </div>
                                
                                {/* Buton pentru copierea link-ului */}
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => {
                                    if (hasValidAccessLink(participant)) {
                                      const accessLink = participant.uniqueAccessLink || participant.accessLink;
                                      const conferenceLink = `${window.location.origin}/conferinta-grup/${accessLink}`;
                                      if (navigator.clipboard && navigator.clipboard.writeText) {
                                        navigator.clipboard.writeText(conferenceLink)
                                          .then(() => {
                                            showAlert("success", `Link copiat pentru ${participant.nume} ${participant.prenume}!`);
                                          })
                                          .catch(() => {
                                            fallbackCopyText(conferenceLink);
                                          });
                                      } else {
                                        fallbackCopyText(conferenceLink);
                                      }
                                    } else {
                                      showAlert("warning", "Nu există link de acces pentru acest participant");
                                    }
                                  }}
                                  disabled={loading || !hasValidAccessLink(participant)}
                                  title={hasValidAccessLink(participant) ? "Copiază link-ul individual" : "Nu poate copia - link lipsește"}
                                  style={{ borderRadius: "8px", padding: "8px 12px" }}
                                >
                                  <i className="fa fa-copy me-1"></i>
                                  Link
                                </button>
                                
                                {/* Buton pentru eliminare */}
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveParticipant(selectedConferinta, index)}
                                  disabled={loading}
                                  title={`Elimină participantul ${participant.nume}`}
                                  style={{ borderRadius: "8px", padding: "8px 12px" }}
                                >
                                  {loading ? (
                                    <i className="fa fa-spinner fa-spin"></i>
                                  ) : (
                                    <i className="fa fa-trash"></i>
                                  )}
                                </button>
                              </div>
                              
                              {/* A doua linie - buton pentru generarea link-ului dacă lipsește */}
                              {!hasValidAccessLink(participant) && (
                                <div className="d-flex justify-content-center">
                                  <button
                                    className="btn btn-sm btn-warning"
                                    onClick={() => generateAccessLinkForParticipant(selectedConferinta, index)}
                                    disabled={loading}
                                    title="Generează link de acces pentru acest participant"
                                    style={{ borderRadius: "8px", padding: "8px 16px" }}
                                  >
                                    <i className="fa fa-magic me-1"></i>
                                    Generează Link
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Mesaj când nu există participanți */}
                      {(!selectedConferinta.participanti || selectedConferinta.participanti.length === 0) && (
                      <div className="text-center py-5">
                        <div className="mb-3">
                          <i className="fa fa-users fa-3x text-muted"></i>
                        </div>
                        <h5 className="text-muted">Nu există participanți înregistrați</h5>
                        <p className="text-muted">Participanții vor apărea aici după ce se vor înregistra la conferință.</p>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {activeTab === "create" && (
                <div className="card">
                  <div className="card-header">
                    <h4>{editingConferinta ? "Editează Conferința" : "Creează Conferință Nouă"}</h4>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Titlu Conferință <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="titlu"
                              value={formData.titlu}
                              onChange={handleInputChange}
                              placeholder="ex: Tarot pentru Începători"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">Tip Conferință</label>
                            <select
                              className="form-control"
                              name="tipConferinta"
                              value={formData.tipConferinta}
                              onChange={handleInputChange}
                            >
                              <option value="single">Conferință Unică</option>
                              <option value="course">Curs pe Mai Multe Zile</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label">
                          Descriere <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          name="descriere"
                          value={formData.descriere}
                          onChange={handleInputChange}
                          rows="4"
                          placeholder="Descrierea detaliată a conferinței..."
                          required
                        />
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label">
                          Data și ora de început <span className="text-danger">*</span>
                        </label>
                        <div className="row align-items-end">
                          <div className="col-md-6">
                            <input
                              type="date"
                              className="form-control"
                              name="dataInceput"
                              value={formData.dataInceput}
                              onChange={handleInputChange}
                              required
                              style={{ height: '76px' }}
                            />
                          </div>
                          
                                                      <div className="col-md-6">
                              <div className="d-flex align-items-center gap-2 time-controls-container" style={{ height: '76px' }}>
                              {/* Ore */}
                              <div className="time-spinner">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary time-spinner-btn"
                                  onClick={() => handleTimeIncrement('hour', true, 1)}
                                  title="Crește ora cu 1"
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <i className="fa fa-chevron-up" aria-hidden="true"></i>
                                  <span className="sr-only">▲</span>
                                </button>
                                <input
                                  type="text"
                                  className="form-control text-center time-input"
                                  value={getInputDisplayValue('hour', true)}
                                  onChange={(e) => handleManualTimeInput(e, 'hour', true)}
                                  onBlur={() => handleTimeBlur('hour', true)}
                                  onFocus={(e) => e.target.select()}
                                  maxLength="2"
                                  placeholder="00"
                                  style={{ width: '60px', fontSize: '16px', fontWeight: 'bold' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary time-spinner-btn"
                                  onClick={() => handleTimeIncrement('hour', true, -1)}
                                  title="Scade ora cu 1"
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <i className="fa fa-chevron-down" aria-hidden="true"></i>
                                  <span className="sr-only">▼</span>
                                </button>
                              </div>
                              
                              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>:</span>
                              
                              {/* minute */}
                              <div className="time-spinner">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary time-spinner-btn"
                                  onClick={() => handleTimeIncrement('minute', true, 5)}
                                  title="Crește minutele cu 5"
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <i className="fa fa-chevron-up" aria-hidden="true"></i>
                                  <span className="sr-only">▲</span>
                                </button>
                                <input
                                  type="text"
                                  className="form-control text-center time-input"
                                  value={getInputDisplayValue('minute', true)}
                                  onChange={(e) => handleManualTimeInput(e, 'minute', true)}
                                  onBlur={() => handleTimeBlur('minute', true)}
                                  onFocus={(e) => e.target.select()}
                                  maxLength="2"
                                  placeholder="00"
                                  style={{ width: '60px', fontSize: '16px', fontWeight: 'bold' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary time-spinner-btn"
                                  onClick={() => handleTimeIncrement('minute', true, -5)}
                                  title="Scade minutele cu 5"
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <i className="fa fa-chevron-down" aria-hidden="true"></i>
                                  <span className="sr-only">▼</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* Mesaj de ajutor pentru probleme cu săgețile */}
                   
                          </div>
                        </div>
                      </div>

                      {formData.tipConferinta === "course" && (
                        <div className="form-group mb-3">
                          <label className="form-label">
                            Data și ora finală <span className="text-danger">*</span>
                          </label>
                          <div className="row align-items-end">
                            <div className="col-md-6">
                              <input
                                type="date"
                                className="form-control"
                                name="dataFinal"
                                value={formData.dataFinal}
                                onChange={handleInputChange}
                                min={formData.dataInceput}
                                required
                                style={{ height: '76px' }}
                              />
                            </div>
                            
                            <div className="col-md-6">
                              <div className="d-flex align-items-center gap-2 time-controls-container" style={{ height: '76px' }}>
                                {/* Ore */}
                                <div className="time-spinner">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary time-spinner-btn"
                                    onClick={() => handleTimeIncrement('hour', false, 1)}
                                    title="Crește ora finală cu 1"
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <i className="fa fa-chevron-up" aria-hidden="true"></i>
                                    <span className="sr-only">▲</span>
                                  </button>
                                  <input
                                    type="text"
                                    className="form-control text-center time-input"
                                    value={getInputDisplayValue('hour', false)}
                                    onChange={(e) => handleManualTimeInput(e, 'hour', false)}
                                    onBlur={() => handleTimeBlur('hour', false)}
                                    onFocus={(e) => e.target.select()}
                                    maxLength="2"
                                    placeholder="00"
                                    style={{ width: '60px', fontSize: '16px', fontWeight: 'bold' }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary time-spinner-btn"
                                    onClick={() => handleTimeIncrement('hour', false, -1)}
                                    title="Scade ora finală cu 1"
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <i className="fa fa-chevron-down" aria-hidden="true"></i>
                                    <span className="sr-only">▼</span>
                                  </button>
                                </div>
                                
                                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>:</span>
                                
                                {/* Minute */}
                                <div className="time-spinner">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary time-spinner-btn"
                                    onClick={() => handleTimeIncrement('minute', false, 5)}
                                    title="Crește minutele finale cu 5"
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <i className="fa fa-chevron-up" aria-hidden="true"></i>
                                    <span className="sr-only">▲</span>
                                  </button>
                                  <input
                                    type="text"
                                    className="form-control text-center time-input"
                                    value={getInputDisplayValue('minute', false)}
                                    onChange={(e) => handleManualTimeInput(e, 'minute', false)}
                                    onBlur={() => handleTimeBlur('minute', false)}
                                    onFocus={(e) => e.target.select()}
                                    maxLength="2"
                                    placeholder="00"
                                    style={{ width: '60px', fontSize: '16px', fontWeight: 'bold' }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary time-spinner-btn"
                                    onClick={() => handleTimeIncrement('minute', false, -5)}
                                    title="Scade minutele finale cu 5"
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <i className="fa fa-chevron-down" aria-hidden="true"></i>
                                    <span className="sr-only">▼</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Preț Participare (RON) <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="1"
                              className="form-control"
                              name="pretParticipare"
                              value={formData.pretParticipare}
                              onChange={handleInputChange}
                              placeholder="ex: 150.00"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Număr Maxim Participanți
                            </label>
                            <input
                              type="number"
                              min="1"
                              className="form-control"
                              name="numarMaxParticipanti"
                              value={formData.numarMaxParticipanti}
                              onChange={handleInputChange}
                              placeholder="ex: 20 (opțional)"
                            />
                            <small className="text-muted">
                              Lasă gol pentru număr nelimitat
                            </small>
                          </div>
                        </div>
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label">Imagine Conferință</label>
                        
                        {/* Afișez imaginea existentă dacă editez o conferință */}
                        {editingConferinta && editingConferinta.imageUrl && (
                          <div className="mb-2">
                            <label className="form-label text-muted">Imagine curentă:</label>
                            <div>
                              <img 
                                src={editingConferinta.imageUrl} 
                                alt={editingConferinta.titlu}
                                style={{
                                  width: "150px",
                                  height: "100px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "1px solid #dee2e6"
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        <small className="text-muted">
                          Format acceptat: JPG, PNG, GIF (max 5MB)
                          {editingConferinta && " - Încarcă o nouă imagine pentru a înlocui pe cea existentă"}
                        </small>
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-control"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="activa">Activă</option>
                          <option value="inactiva">Inactivă</option>
                          <option value="completata">Completată</option>
                        </select>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <span>
                              <i className="fa fa-spinner fa-spin me-2"></i>
                              {editingConferinta ? "Actualizez..." : "Creez..."}
                            </span>
                          ) : (
                            <span>
                              <i className="fa fa-save me-2"></i>
                              {editingConferinta ? "Actualizează Conferința" : "Creează Conferința"}
                            </span>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            resetForm();
                            setActiveTab("list");
                          }}
                        >
                          <i className="fa fa-times me-2"></i>
                          Anulează
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog custom pentru ștergerea conferințelor */}
      {deleteConferenceDialog.isOpen && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px' }}>
            <div className="modal-content" style={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <div className="modal-header" style={{ backgroundColor: 'white', borderBottom: '1px solid #f0f0f0', borderRadius: '12px 12px 0 0' }}>
                <h5 className="modal-title" style={{ color: '#0e82fd', fontWeight: '600' }}>
                  <i className="fa fa-trash mr-2" style={{ color: '#0e82fd' }}></i>
                  Confirmare Ștergere
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setDeleteConferenceDialog({ isOpen: false, conferinta: null })}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '20px', 
                    color: '#6c757d',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body" style={{ backgroundColor: 'white', padding: '25px' }}>
                <div className="text-center mb-3">
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto',
                    border: '3px solid #0e82fd'
                  }}>
                    <i className="fa fa-exclamation-triangle" style={{ fontSize: '28px', color: '#0e82fd' }}></i>
                  </div>
                </div>
          
                
                <p className="text-center mb-3" style={{ color: '#666', fontSize: '14px' }}>
                  Ești pe punctul de a <strong style={{ color: '#0e82fd' }}>ȘTERGE COMPLET</strong> conferința:
                </p>
                
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  border: '2px solid #0e82fd', 
                  borderRadius: '8px', 
                  padding: '12px',
                  textAlign: 'center',
                  marginBottom: '15px'
                }}>
                  <h6 className="mb-0" style={{ color: '#0e82fd', fontWeight: '600', fontSize: '15px' }}>
                    "{deleteConferenceDialog.conferinta?.titlu}"
                  </h6>
                </div>
                
           
                
                <div style={{ 
                  backgroundColor: 'transparent', 
                  border: '1px solid #0e82fd', 
                  borderRadius: '8px', 
                  padding: '12px',
                  textAlign: 'center',
                  marginTop: '15px'
                }}>
                  <strong style={{ color: '#0e82fd', fontSize: '13px' }}>⚠️ ACEASTĂ ACȚIUNE NU POATE FI ANULATĂ!</strong>
                </div>
              </div>
              
              <div className="modal-footer" style={{ 
                backgroundColor: 'white', 
                borderTop: '1px solid #f0f0f0', 
                borderRadius: '0 0 12px 12px',
                padding: '15px 25px'
              }}>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setDeleteConferenceDialog({ isOpen: false, conferinta: null })}
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    color: '#6c757d',
                    fontWeight: '500',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    marginRight: '10px'
                  }}
                >
                  <i className="fa fa-times mr-2"></i>
                  Anulează
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={confirmDeleteConference}
                  disabled={loading}
                  style={{
                    backgroundColor: '#0e82fd',
                    border: '1px solid #0e82fd',
                    color: 'white',
                    fontWeight: '500',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    opacity: loading ? '0.7' : '1',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <i className="fa fa-trash mr-2"></i>
                  {loading ? 'Se șterge...' : 'Șterge Definitiv'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AdminConferinteGrup; 