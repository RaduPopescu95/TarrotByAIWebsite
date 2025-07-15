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

  // State-uri pentru adăugarea manuală a participanților
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [addParticipantForm, setAddParticipantForm] = useState({
    nume: "",
    prenume: "",
    email: "",
    telefon: "",
    observatii: ""
  });
  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);
  const [newlyAddedParticipant, setNewlyAddedParticipant] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);

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
    status: "activa",
    hasPassword: false,
    password: ""
  });

  const showAlert = (type, message) => {
    console.log(`🚨 [ALERT] Tip: ${type}, Mesaj: ${message}`);
    setAlert({ type, message, visible: true });
    setTimeout(() => {
      setAlert({ type: "", message: "", visible: false });
      console.log("⏰ [ALERT] Alert-ul a fost ascuns automat");
    }, 5000);
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
    const { name, value, type, checked } = e.target;
    console.log(`📝 [INPUT] Schimbare câmp: ${name} = ${type === 'checkbox' ? checked : value}`);
    setFormData(prev => {
      const newData = {
      ...prev,
      [name]: type === 'checkbox' ? checked : value
      };
      
      // Dacă se debifează hasPassword, golește și parola
      if (name === 'hasPassword' && !checked) {
        newData.password = '';
      }
      
      console.log("📝 [INPUT] FormData actualizat:", newData);
      return newData;
    });
  };

  // Handler pentru input-urile formularului de adăugare participant
  const handleAddParticipantInputChange = (e) => {
    const { name, value } = e.target;
    setAddParticipantForm(prev => ({
      ...prev,
      [name]: value
    }));
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
      status: "activa",
      hasPassword: false,
      password: ""
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

    if (!formData.oraInceput) {
      console.log("❌ [VALIDARE] Ora de început lipsește");
      showAlert("danger", "Ora de început este obligatorie");
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

    if (formData.tipConferinta === "course" && !formData.oraFinal) {
      console.log("❌ [VALIDARE] Pentru curs, ora finală lipsește");
      showAlert("danger", "Pentru cursuri, ora finală este obligatorie");
      return false;
    }
    if (formData.tipConferinta === "course") {
      console.log("✅ [VALIDARE] Ora finală pentru curs validă");
    }

    if (!formData.pretParticipare || parseFloat(formData.pretParticipare) <= 0) {
      console.log("❌ [VALIDARE] Prețul este invalid:", formData.pretParticipare);
      showAlert("danger", "Prețul de participare trebuie să fie mai mare de 0");
      return false;
    }
    console.log("✅ [VALIDARE] Preț valid");

    // Validare parolă dacă este bifată
    if (formData.hasPassword && (!formData.password || formData.password.trim().length < 3)) {
      console.log("❌ [VALIDARE] Parola este invalidă:", formData.password);
      showAlert("danger", "Parola trebuie să aibă cel puțin 3 caractere");
      return false;
    }
    if (formData.hasPassword) {
      console.log("✅ [VALIDARE] Parolă validă");
    }

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
        hasPassword: formData.hasPassword,
        password: formData.hasPassword ? formData.password.trim() : null,
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
      status: conferinta.status,
      hasPassword: conferinta.hasPassword || false,
      password: conferinta.password || ""
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
      return `${moment(conferinta.dataInceput).format("DD MMM YYYY")} - ${moment(conferinta.dataFinal).format("DD MMM YYYY")}, ${conferinta.oraInceput} - ${conferinta.oraFinal}`;
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
    // Noua logică: doar statusul contează, nu timpul
    return conferinta.status === "activa";
  };

  const handleJoinAsAdmin = async (conferinta) => {
    console.log("🎥 [ADMIN JOIN] Admin încearcă să se alăture conferinței:", conferinta.titlu);
    console.log("🎥 [ADMIN JOIN] Conference ID:", conferinta.documentId);
    console.log("🎥 [ADMIN JOIN] Conference status:", conferinta.status);
    
    // Dacă conferința nu este activă, întreb adminul dacă vrea să o activeze
    if (conferinta.status !== "activa") {
      const statusText = conferinta.status === "inactiva" ? "inactivă" : "completată";
      const confirmMessage = `⚠️ CONFERINȚĂ ${statusText.toUpperCase()} ⚠️\n\n` +
        `Conferința "${conferinta.titlu}" este marcată ca ${statusText}.\n\n` +
        `Utilizatorii nu pot participa la această conferință în momentul de față.\n\n` +
        `Vrei să ACTIVEZI conferința acum?\n` +
        `(Utilizatorii vor putea începe să participe imediat)`;
      
      if (window.confirm(confirmMessage)) {
        try {
          console.log("🔄 [ADMIN ACTIVATE] Admin activează conferința...");
          setLoading(true);
          
          // Actualizez statusul în Firestore
          const { updateDoc, doc } = await import("firebase/firestore");
          const { db } = await import("../../../firebase");
          
          const docRef = doc(db, "ConferinteGrup", conferinta.documentId);
          await updateDoc(docRef, {
            status: "activa"
          });
          
          console.log("✅ [ADMIN ACTIVATE] Conferința a fost activată");
          showAlert("success", `Conferința "${conferinta.titlu}" a fost activată! Utilizatorii pot participa acum.`);
          
          // Reîmprospătez lista pentru a reflecta schimbarea
          await fetchConferinte(true);
          
          // Actualizez și conferința selectată dacă este cazul
          if (selectedConferinta && selectedConferinta.documentId === conferinta.documentId) {
            setSelectedConferinta({
              ...selectedConferinta,
              status: "activa"
            });
          }
          
        } catch (error) {
          console.error("💥 [ADMIN ACTIVATE] Eroare la activarea conferinței:", error);
          showAlert("danger", "Eroare la activarea conferinței. Te rog încearcă din nou.");
          setLoading(false);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        console.log("🚫 [ADMIN JOIN] Admin a anulat activarea conferinței");
        return;
      }
    }
    
    // Acum conferința este activă, pot să mă alătur
    console.log("🎥 [ADMIN JOIN] Redirecționez către conferința activă...");
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

  // Funcție pentru generarea unui accessLink unic (similar cu cea din checkout)
  const generateUniqueAccessLink = (conferintaId) => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const userIdentifier = `guest_${Math.random().toString(36).substring(2, 10)}`;
    return `grup_${conferintaId}_${userIdentifier}_${timestamp}_${randomString}`;
  };

  // Funcție pentru validarea formularului de adăugare participant
  const validateAddParticipantForm = () => {
    if (!addParticipantForm.nume.trim()) {
      showAlert("danger", "Numele este obligatoriu");
      return false;
    }
    if (!addParticipantForm.prenume.trim()) {
      showAlert("danger", "Prenumele este obligatoriu");
      return false;
    }
    if (!addParticipantForm.email.trim()) {
      showAlert("danger", "Email-ul este obligatoriu");
      return false;
    }
    if (!addParticipantForm.telefon.trim()) {
      showAlert("danger", "Telefonul este obligatoriu");
      return false;
    }
    
    // Verifică email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addParticipantForm.email)) {
      showAlert("danger", "Format email invalid");
      return false;
    }

    return true;
  };

  // Funcție pentru adăugarea manuală a unui participant
  const handleAddParticipant = async () => {
    if (!validateAddParticipantForm()) return;

    try {
      setLoading(true);
      console.log("➕ [ADD PARTICIPANT] Adăugare participant manual...");

      // Verifică din nou dacă mai sunt locuri disponibile
      const conferinte = await handleGetFirestore("ConferinteGrup");
      const conferintaUpdated = conferinte.find(c => c.documentId === selectedConferinta.documentId);
      
      if (conferintaUpdated.numarMaxParticipanti && 
          (conferintaUpdated.participanti?.length || 0) >= conferintaUpdated.numarMaxParticipanti) {
        showAlert("danger", "Nu mai sunt locuri disponibile pentru această conferință");
        setLoading(false);
        return;
      }

      // Verifică dacă email-ul există deja
      const existingParticipant = conferintaUpdated.participanti?.find(p => 
        p && p.email.toLowerCase() === addParticipantForm.email.toLowerCase()
      );
      
      if (existingParticipant) {
        showAlert("danger", "Există deja un participant cu acest email");
        setLoading(false);
        return;
      }

      // Generează link-ul unic de acces
      const uniqueAccessLink = generateUniqueAccessLink(selectedConferinta.documentId);

      // Creează datele participantului cu aceeași structură ca în checkout
      const participantData = {
        userId: uniqueAccessLink, // Pentru manual addition folosim access link-ul ca ID unic
        nume: addParticipantForm.nume,
        prenume: addParticipantForm.prenume,
        email: addParticipantForm.email,
        telefon: addParticipantForm.telefon,
        observatii: addParticipantForm.observatii,
        dataInscrierii: new Date().toISOString(),
        status: "confirmat",
        accessLink: uniqueAccessLink,
        metodaPlata: "MANUAL_ADMIN",
        pretPlatit: selectedConferinta.pretParticipare,
        isGuestUser: true, // Participanții adăugați manual sunt considerați guest users
        addedBy: currentUser?.uid || "admin",
        addedDate: new Date().toISOString()
      };

      console.log("➕ [ADD PARTICIPANT] Date participant:", participantData);

      // Actualizează conferința cu noul participant
      const participantiExistenti = conferintaUpdated.participanti || [];
      const participantiNoi = [...participantiExistenti, participantData];

      await handleUpdateFirestore(
        `ConferinteGrup/${selectedConferinta.documentId}`,
        { 
          participanti: participantiNoi,
          updatedAt: new Date().toISOString()
        }
      );

      console.log("✅ [ADD PARTICIPANT] Participant adăugat cu succes în conferință");

      // Creează înregistrarea de plată (pentru tracking)
      const plataData = {
        conferintaId: selectedConferinta.documentId,
        conferintaTitlu: selectedConferinta.titlu,
        userId: uniqueAccessLink,
        participantData: participantData,
        suma: selectedConferinta.pretParticipare,
        status: "succeeded",
        metodaPlata: "MANUAL_ADMIN",
        stripeSessionId: `manual_${Date.now()}`,
        stripePaymentIntentId: `manual_pi_${Date.now()}`,
        dataPlata: new Date().toISOString(),
        accessLink: uniqueAccessLink,
        isGuestUser: true,
        addedBy: currentUser?.uid || "admin",
        addedDate: new Date().toISOString()
      };

      await handleUploadFirestoreGeneral(plataData, "PlatiConferinteGrup");
      console.log("✅ [ADD PARTICIPANT] Înregistrarea plății salvată");

      showAlert("success", "Participant adăugat cu succes!");

      // Resetează formularul
      setAddParticipantForm({
        nume: "",
        prenume: "",
        email: "",
        telefon: "",
        observatii: ""
      });

      // Închide modalul
      setShowAddParticipantModal(false);

      // Pregătește pentru dialogul de confirmare email
      setNewlyAddedParticipant(participantData);
      setShowEmailConfirmDialog(true);

      // Reîncarcă conferințele pentru a reflecta modificările
      await fetchConferinte(true);

      // Actualizează conferința selectată
      const updatedConferinta = { ...selectedConferinta, participanti: participantiNoi };
      setSelectedConferinta(updatedConferinta);

    } catch (error) {
      console.error("💥 [ADD PARTICIPANT] Eroare la adăugarea participantului:", error);
      showAlert("danger", "Eroare la adăugarea participantului: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru trimiterea emailului de confirmare
  const sendConfirmationEmail = async (participantData, conferintaData) => {
    try {
      setEmailLoading(true);
      console.log("📧 [SEND EMAIL] Trimitere email confirmare...");
      
      const emailResponse = await fetch('/api/send-email-conferinta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantData: participantData,
          conferintaData: conferintaData,
          accessLink: participantData.accessLink,
          isTestMode: false
        }),
      });

      const emailResult = await emailResponse.json();
      if (emailResult.success) {
        console.log("✅ [SEND EMAIL] Email trimis cu succes:", emailResult.messageId);
        showAlert("success", `Email de confirmare trimis cu succes către ${participantData.email}`);
      } else {
        console.log("⚠️ [SEND EMAIL] Eroare la trimiterea emailului:", emailResult.error);
        showAlert("warning", "Participant adăugat cu succes, dar emailul nu a putut fi trimis");
      }
    } catch (emailError) {
      console.error("💥 [SEND EMAIL] Eroare la trimiterea emailului:", emailError);
      showAlert("warning", "Participant adăugat cu succes, dar emailul nu a putut fi trimis");
    } finally {
      setEmailLoading(false);
    }
  };

  // Funcție pentru gestionarea dialogului de confirmare email
  const handleEmailConfirmation = async (sendEmail) => {
    if (sendEmail && newlyAddedParticipant) {
      await sendConfirmationEmail(newlyAddedParticipant, selectedConferinta);
    }
    
    // Resetează state-ul
    setShowEmailConfirmDialog(false);
    setNewlyAddedParticipant(null);
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

  // Funcție pentru ștergerea completă a unei conferințe
  const handleDeleteConference = async (conferinta) => {
    const confirmMessage = `⚠️ ATENȚIE - ȘTERGERE DEFINITIVĂ ⚠️\n\n` +
      `Ești pe punctul de a ȘTERGE COMPLET conferința:\n` +
      `"${conferinta.titlu}"\n\n` +
      `Această acțiune va elimina:\n` +
      `• Toate datele conferinței\n` +
      `• Lista de participanți (${conferinta.participanti?.length || 0} persoane)\n` +
      `• Imaginea asociată (dacă există)\n` +
      `• Toate înregistrările de prezență\n\n` +
      `⚠️ ACEASTĂ ACȚIUNE NU POATE FI ANULATĂ! ⚠️\n\n` +
      `Ești absolut sigur că vrei să continui?`;

    if (!window.confirm(confirmMessage)) {
      console.log("🚫 [DELETE] Admin a anulat ștergerea conferinței");
      return;
    }

    // A doua confirmare pentru siguranță
    const finalConfirm = `ULTIMĂ CONFIRMARE\n\n` +
      `Scrie "ȘTERGE" (cu majuscule) pentru a confirma ștergerea definitivă a conferinței "${conferinta.titlu}":`;
    
    const userInput = window.prompt(finalConfirm);
    
    if (userInput !== "ȘTERGE") {
      console.log("🚫 [DELETE] Confirmare incorectă, ștergerea a fost anulată");
      showAlert("info", "Ștergerea a fost anulată");
      return;
    }

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

                      
                      <button
                        className="btn btn-success me-2"
                        onClick={() => setShowAddParticipantModal(true)}
                        disabled={loading}
                        title="Adaugă participant manual"
                      >
                        <i className="fa fa-user-plus me-2"></i>
                        Adaugă Participant
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
                          background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                          borderRadius: "12px",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-3px)";
                          e.currentTarget.style.boxShadow = "0 8px 25px rgba(44, 62, 80, 0.25)";
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
                                <span className="text-dark" style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                                  {formatDataDisplay(conferinta)}
                                </span>
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

                            {/* Badge-uri și preț */}
                            <div className="d-flex justify-content-between align-items-center mb-3 pt-2" style={{ borderTop: "1px solid #e9ecef" }}>
                              <div className="d-flex gap-2">
                                <span className={`badge ${
                                  conferinta.tipConferinta === "course" ? "bg-info" : "bg-primary"
                                }`} style={{ fontSize: "0.75rem" }}>
                                  {conferinta.tipConferinta === "course" ? "CURS" : "CONFERINȚĂ"}
                                </span>
                                <span className={`badge ${
                                  conferinta.status === "activa" ? "bg-success" : "bg-secondary"
                                }`} style={{ fontSize: "0.75rem" }}>
                                  {conferinta.status.toUpperCase()}
                                </span>
                                {conferinta.hasPassword && (
                                  <span className="badge bg-warning text-dark" style={{ fontSize: "0.75rem" }} title={`Cod de acces: ${conferinta.password}`}>
                                    <i className="fa fa-lock me-1"></i>
                                    COD: {conferinta.password}
                                  </span>
                                )}
                              </div>
                              <div className="bg-light rounded-pill px-3 py-1">
                                <strong className="text-primary">{conferinta.pretParticipare} RON</strong>
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
                                <div className="d-flex align-items-start mb-2 p-2 rounded" style={{ backgroundColor: "#f8f9fa" }}>
                                  <div 
                                    className="d-flex align-items-center justify-content-center me-3"
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "8px",
                                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                      flexShrink: 0
                                    }}
                                  >
                                    <i className="fa fa-envelope fa-sm text-white"></i>
                                </div>
                                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                    <a 
                                      href={`mailto:${participant.email}`} 
                                      className="text-decoration-none small text-dark fw-medium"
                                      style={{ 
                                        fontSize: "0.85rem",
                                        wordBreak: "break-word",
                                        overflowWrap: "break-word",
                                        display: "block"
                                      }}
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

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Data de Început <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              name="dataInceput"
                              value={formData.dataInceput}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Ora de Început <span className="text-danger">*</span>
                            </label>
                            <input
                              type="time"
                              className="form-control"
                              name="oraInceput"
                              value={formData.oraInceput}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {formData.tipConferinta === "course" && (
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-group mb-3">
                              <label className="form-label">
                                Data Finală <span className="text-danger">*</span>
                              </label>
                              <input
                                type="date"
                                className="form-control"
                                name="dataFinal"
                                value={formData.dataFinal}
                                onChange={handleInputChange}
                                min={formData.dataInceput}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="form-group mb-3">
                              <label className="form-label">
                                Ora Finală <span className="text-danger">*</span>
                              </label>
                              <input
                                type="time"
                                className="form-control"
                                name="oraFinal"
                                value={formData.oraFinal}
                                onChange={handleInputChange}
                                required
                              />
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

                      {/* Secțiunea pentru parola conferinței */}
                      <div className="card border-warning mb-3">
                        <div className="card-header bg-warning bg-opacity-10">
                          <h6 className="mb-0">
                            <i className="fa fa-lock me-2 text-warning"></i>
                            Cod de Acces (Parolă)
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="form-check mb-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="hasPassword"
                              id="hasPassword"
                              checked={formData.hasPassword}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="hasPassword">
                              <strong>Conferință cu cod de acces</strong>
                              <br />
                              <small className="text-muted">
                                Participanții vor avea nevoie de un cod pentru a se putea înscrie
                              </small>
                            </label>
                          </div>

                          {formData.hasPassword && (
                            <div className="form-group">
                              <label className="form-label">
                                Cod de Acces <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="ex: TAROT2024"
                                minLength="3"
                                required
                              />
                              <small className="text-muted">
                                Minimum 3 caractere. Participanții vor introduce acest cod la rezervare.
                              </small>
                            </div>
                          )}

                          {!formData.hasPassword && (
                            <div className="alert alert-info mb-0">
                              <i className="fa fa-info-circle me-2"></i>
                              <small>
                                Conferința va fi deschisă pentru toți utilizatorii fără necesitatea unui cod de acces.
                              </small>
                            </div>
                          )}
                        </div>
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



      {/* Modal pentru adăugarea participantului */}
      {showAddParticipantModal && (
        <div className="modal fade show" style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1055,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} tabIndex="-1">
          <div className="modal-dialog modal-lg" style={{ 
            margin: 0,
            maxWidth: '90vw',
            width: '800px'
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa fa-user-plus me-2"></i>
                  Adaugă Participant Manual
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddParticipantModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="fa fa-info-circle me-2"></i>
                  <strong>Conferință:</strong> {selectedConferinta?.titlu}
                  <br />
                  <strong>Preț:</strong> {selectedConferinta?.pretParticipare} RON
                  <br />
                  <small className="text-muted">
                    Participantul va fi adăugat cu plata marcată ca "MANUAL_ADMIN"
                  </small>
                </div>

                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Nume <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="nume"
                          value={addParticipantForm.nume}
                          onChange={handleAddParticipantInputChange}
                          placeholder="Numele de familie"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Prenume <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="prenume"
                          value={addParticipantForm.prenume}
                          onChange={handleAddParticipantInputChange}
                          placeholder="Prenumele"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Email <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={addParticipantForm.email}
                          onChange={handleAddParticipantInputChange}
                          placeholder="adresa@email.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Telefon <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          name="telefon"
                          value={addParticipantForm.telefon}
                          onChange={handleAddParticipantInputChange}
                          placeholder="+40 xxx xxx xxx"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Observații (opțional)</label>
                    <textarea
                      className="form-control"
                      name="observatii"
                      value={addParticipantForm.observatii}
                      onChange={handleAddParticipantInputChange}
                      rows="3"
                      placeholder="Observații sau note speciale..."
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddParticipantModal(false)}
                >
                  <i className="fa fa-times me-2"></i>
                  Anulează
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddParticipant}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Adaugă...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-user-plus me-2"></i>
                      Adaugă Participant
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog pentru confirmarea trimiterii emailului */}
      {showEmailConfirmDialog && (
        <div className="modal fade show" style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1055,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} tabIndex="-1">
          <div className="modal-dialog" style={{ 
            margin: 0,
            maxWidth: '90vw',
            width: '500px'
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa fa-envelope me-2"></i>
                  Trimite Email de Confirmare?
                </h5>
              </div>
              <div className="modal-body">
                <p>
                  Participantul <strong>{newlyAddedParticipant?.nume} {newlyAddedParticipant?.prenume}</strong> 
                  a fost adăugat cu succes la conferința <strong>{selectedConferinta?.titlu}</strong>.
                </p>
                <p>
                  Vrei să trimiți un email de confirmare cu link-ul de acces către <strong>{newlyAddedParticipant?.email}</strong>?
                </p>
                
                <div className="alert alert-info">
                  <i className="fa fa-info-circle me-2"></i>
                  <strong>Emailul va conține:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Detaliile conferinței</li>
                    <li>Link-ul unic de acces</li>
                    <li>Instrucțiuni de participare</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => handleEmailConfirmation(false)}
                  disabled={emailLoading}
                >
                  <i className="fa fa-times me-2"></i>
                  Nu, mulțumesc
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => handleEmailConfirmation(true)}
                  disabled={emailLoading}
                >
                  {emailLoading ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Trimitere...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-envelope me-2"></i>
                      Da, trimite email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pentru modalele active */}
      {(showAddParticipantModal || showEmailConfirmDialog) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default AdminConferinteGrup; 