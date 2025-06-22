import React, { useEffect, useState } from "react";
import Link from "next/link";
import Home1Header from "../home/home-1/header";
import DoctorSidebar from "../doctors/sidebar";
import StickyBox from "react-sticky-box";
import { 
  handleGetFirestore, 
  handleUpdateFirestore, 
  handleUploadFirestoreGeneral 
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

  const uploadImageToStorage = async (imageFile, conferintaId) => {
    if (!imageFile) {
      console.log("📷 [UPLOAD] Nu există imagine de încărcat");
      return null;
    }

    try {
      console.log("📷 [UPLOAD] Începe upload-ul imaginii:", imageFile.name);
      console.log("📷 [UPLOAD] Mărimea fișierului:", imageFile.size, "bytes");
      console.log("📷 [UPLOAD] Tipul fișierului:", imageFile.type);

      // Creez un nume unic pentru imagine
      const timestamp = Date.now();
      const fileName = `conferinte-grup/${conferintaId}_${timestamp}_${imageFile.name}`;
      console.log("📷 [UPLOAD] Calea în Storage:", fileName);

      // Creez referința în Storage
      const storageRef = ref(storage, fileName);
      console.log("📷 [UPLOAD] Referința Storage creată");

      // Încarc fișierul
      console.log("📷 [UPLOAD] Începe încărcarea efectivă...");
      const snapshot = await uploadBytes(storageRef, imageFile);
      console.log("📷 [UPLOAD] Upload finalizat. Snapshot:", snapshot);

      // Obțin URL-ul de download
      console.log("📷 [UPLOAD] Obțin URL-ul de download...");
      const downloadURL = await getDownloadURL(storageRef);
      console.log("📷 [UPLOAD] URL obținut:", downloadURL);

      return downloadURL;
    } catch (error) {
      console.error("💥 [UPLOAD] Eroare la upload-ul imaginii:");
      console.error("💥 [UPLOAD] Error object:", error);
      console.error("💥 [UPLOAD] Error message:", error.message);
      console.error("💥 [UPLOAD] Error code:", error.code);
      throw error;
    }
  };

  const fetchConferinte = async () => {
    try {
      console.log("📥 [FETCH] Începe încărcarea conferințelor...");
      setLoading(true);
      const data = await handleGetFirestore("ConferinteGrup");
      console.log("📦 [FETCH] Date primite din Firestore:", data);
      console.log("📊 [FETCH] Numărul de conferințe găsite:", data?.length || 0);
      setConferinte(data || []);
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
      await fetchConferinte();
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
    const onlineList = participantsOnline[selectedConferinta?.documentId] || [];
    return onlineList.some(p => p.uniqueAccessLink === participant.uniqueAccessLink);
  };

  const formatDataDisplay = (conferinta) => {
    if (conferinta.tipConferinta === "course") {
      return `${moment(conferinta.dataInceput).format("DD MMM YYYY")} - ${moment(conferinta.dataFinal).format("DD MMM YYYY")}, ${conferinta.oraInceput} - ${conferinta.oraFinal}`;
    } else {
      return `${moment(conferinta.dataInceput).format("DD MMM YYYY")}, ${conferinta.oraInceput}`;
    }
  };

  const exportParticipants = (conferinta) => {
    const participantsData = conferinta.participanti || [];
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
          await fetchConferinte();
          
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
      await fetchConferinte();
      
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
    const conferenceLink = `${window.location.origin}/conferinta-grup/${conferinta.accessLink}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(conferenceLink)
        .then(() => {
          showAlert("success", "Link-ul a fost copiat în clipboard!");
        })
        .catch(() => {
          // Fallback pentru browsere mai vechi
          fallbackCopyText(conferenceLink);
        });
    } else {
      // Fallback pentru browsere mai vechi
      fallbackCopyText(conferenceLink);
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
      
      // Pregătim datele pentru API Next.js
      const emailData = {
        recipients: [participant],
        conferenceData: conferinta,
        emailType: 'reminder',
        userUID: currentUser?.uid
      };

      console.log("📤 [EMAIL] Apelează API Next.js cu datele:", emailData);
      
      const response = await fetch('/api/send-conference-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      
      console.log("✅ [EMAIL] Răspuns API Next.js:", result);
      
      if (response.ok && result.success) {
        const stats = result.stats;
        if (stats.successful > 0) {
          showAlert("success", `Email trimis cu succes către ${participant.nume}!`);
        } else {
          showAlert("warning", `Email-ul către ${participant.nume} nu a putut fi trimis. Verificați adresa de email.`);
        }
      } else {
        showAlert("danger", result.error || "Eroare la trimiterea email-ului");
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

    if (!window.confirm(`Ești sigur că vrei să trimiți email-ul către toți ${conferinta.participanti.length} participanții?`)) {
      return;
    }

    try {
      setLoading(true);
      console.log("📧 [EMAIL ALL] Trimitere email către toți participanții");
      
      // Pregătim datele pentru API Next.js
      const emailData = {
        recipients: conferinta.participanti,
        conferenceData: conferinta,
        emailType: 'reminder',
        userUID: currentUser?.uid
      };

      console.log("📤 [EMAIL ALL] Apelează API Next.js cu datele:", emailData);
      
      const response = await fetch('/api/send-conference-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      
      console.log("✅ [EMAIL ALL] Răspuns API Next.js:", result);
      
      if (response.ok && result.success) {
        const stats = result.stats;
        showAlert("success", 
          `Email-uri trimise cu succes! ✅ ${stats.successful} succese, ❌ ${stats.failed} eșecuri din ${stats.total} total`
        );
      } else {
        showAlert("danger", result.error || "Eroare la trimiterea email-urilor");
      }
      
    } catch (error) {
      console.error("💥 [EMAIL ALL] Eroare la trimiterea email-urilor:", error);
      showAlert("danger", `Eroare la trimiterea email-urilor: ${error.message}`);
    } finally {
      setLoading(false);
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
                        className="btn btn-success"
                        onClick={() => handleJoinAsAdmin(selectedConferinta)}
                        disabled={!isConferenceActive(selectedConferinta)}
                        title={isConferenceActive(selectedConferinta) ? "Alătură-te ca Admin/Host" : "Conferința nu este activă acum"}
                      >
                        <i className="fa fa-video me-2"></i>
                        Alătură-te ca Host
                      </button>
                    </>
                  )}
                </div>
              </div>

              {activeTab === "list" && (
                <div className="card">
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Imagine</th>
                            <th>Titlu</th>
                            <th>Tip</th>
                            <th>Data & Ora</th>
                            <th>Participanți</th>
                            <th>Locuri Disponibile</th>
                            <th>Preț</th>
                            <th>Status</th>
                            <th>Acțiuni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conferinte.map((conferinta) => (
                            <tr key={conferinta.documentId}>
                              <td>
                                {conferinta.imageUrl ? (
                                  <img 
                                    src={conferinta.imageUrl} 
                                    alt={conferinta.titlu}
                                    style={{
                                      width: "50px",
                                      height: "50px",
                                      objectFit: "cover",
                                      borderRadius: "8px"
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: "50px",
                                    height: "50px",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#6c757d"
                                  }}>
                                    <i className="fa fa-image"></i>
                                  </div>
                                )}
                              </td>
                              <td>
                                <div>
                                  <strong>{conferinta.titlu}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {conferinta.descriere?.substring(0, 50)}...
                                  </small>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${
                                  conferinta.tipConferinta === "course" 
                                    ? "bg-info" 
                                    : "bg-primary"
                                }`}>
                                  {conferinta.tipConferinta === "course" ? "Curs" : "Conferință"}
                                </span>
                              </td>
                              <td>
                                <small>{formatDataDisplay(conferinta)}</small>
                              </td>
                              <td>
                                <span className="fw-bold">
                                  {conferinta.participanti?.length || 0}
                                </span>
                                {conferinta.numarMaxParticipanti && 
                                  ` / ${conferinta.numarMaxParticipanti}`
                                }
                              </td>
                              <td>
                                <span className={`badge ${
                                  calculateAvailableSpots(conferinta) === 0 ? "bg-danger" : 
                                  calculateAvailableSpots(conferinta) === "Nelimitat" ? "bg-success" : "bg-warning"
                                }`}>
                                  {calculateAvailableSpots(conferinta)}
                                </span>
                              </td>
                              <td>{conferinta.pretParticipare} RON</td>
                              <td>
                                <span className={`badge ${
                                  conferinta.status === "activa" 
                                    ? "bg-success" 
                                    : "bg-secondary"
                                }`}>
                                  {conferinta.status}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleEdit(conferinta)}
                                    title="Editează"
                                  >
                                    <i className="fa fa-edit"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() => handleViewParticipants(conferinta)}
                                    title="Participanți"
                                  >
                                    <i className="fa fa-users"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleJoinAsAdmin(conferinta)}
                                    title={isConferenceActive(conferinta) ? "Alătură-te ca Admin/Host" : `Conferință ${conferinta.status} - Click pentru activare`}
                                    disabled={loading}
                                  >
                                    <i className="fa fa-video"></i>
                                    {!isConferenceActive(conferinta) && (
                                      <span className="ms-1 badge bg-warning">
                                        {conferinta.status === "inactiva" ? "INACTIVĂ" : "COMPLETATĂ"}
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {conferinte.length === 0 && !loading && (
                        <div className="text-center py-4">
                          <p className="text-muted">Nu există conferințe create încă.</p>
                        </div>
                      )}
                    </div>
                  </div>
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
                      <div className="col-md-3">
                        <div className="card bg-primary text-white">
                          <div className="card-body text-center">
                            <h4>{selectedConferinta.participanti?.length || 0}</h4>
                            <p className="mb-0">Total Înregistrați</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-success text-white">
                          <div className="card-body text-center">
                            <h4>{(participantsOnline[selectedConferinta.documentId] || []).length}</h4>
                            <p className="mb-0">Online Acum</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-warning text-white">
                          <div className="card-body text-center">
                            <h4>{calculateAvailableSpots(selectedConferinta)}</h4>
                            <p className="mb-0">Locuri Disponibile</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-info text-white">
                          <div className="card-body text-center">
                            <h4>{selectedConferinta.pretParticipare * (selectedConferinta.participanti?.length || 0)} RON</h4>
                            <p className="mb-0">Venituri Total</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista participanților - Format carduri */}
                    <div className="row">
                      {(selectedConferinta.participanti || []).map((participant, index) => (
                        <div key={index} className="col-lg-4 col-md-6 col-sm-12 mb-4">
                          <div className="card h-100 shadow-sm border-0">
                            <div className="card-body">
                              {/* Header cu avatar și status online */}
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="d-flex align-items-center">
                                  <div style={{
                                    width: "50px",
                                    height: "50px",
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #007bff, #0056b3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontWeight: "bold",
                                    fontSize: "18px",
                                    marginRight: "12px",
                                    boxShadow: "0 2px 8px rgba(0,123,255,0.3)"
                                  }}>
                                    {participant.nume?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                  <div>
                                    <h6 className="mb-1 fw-bold">{participant.nume}</h6>
                                    <small className="text-muted">ID: {participant.userId}</small>
                                  </div>
                                </div>
                                
                                {/* Status online */}
                                <div className="text-end">
                                  {isParticipantOnline(participant) ? (
                                    <span className="badge bg-success">
                                      <i className="fa fa-circle me-1"></i>
                                      Online
                                    </span>
                                  ) : (
                                    <span className="badge bg-secondary">
                                      <i className="fa fa-circle me-1"></i>
                                      Offline
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Informații contact */}
                              <div className="mb-3">
                                <div className="d-flex align-items-center mb-2">
                                  <i className="fa fa-envelope text-primary me-2" style={{width: "16px"}}></i>
                                  <a href={`mailto:${participant.email}`} className="text-decoration-none small">
                                    {participant.email}
                                  </a>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="fa fa-phone text-success me-2" style={{width: "16px"}}></i>
                                  <a href={`tel:${participant.telefon}`} className="text-decoration-none small">
                                    {participant.telefon}
                                  </a>
                                </div>
                                <div className="d-flex align-items-center">
                                  <i className="fa fa-calendar text-info me-2" style={{width: "16px"}}></i>
                                  <small className="text-muted">
                                    {moment(participant.dataInscrierii).format("DD/MM/YYYY HH:mm")}
                                  </small>
                                </div>
                              </div>

                              {/* Status participare */}
                              <div className="mb-3">
                                <div className="d-flex align-items-center justify-content-between">
                                  <span className="small fw-medium">Status:</span>
                                  {getParticipantStatus(participant)}
                                </div>
                              </div>

                              {/* Observații */}
                              {participant.observatii && (
                                <div className="mb-3">
                                  <small className="text-muted">
                                    <i className="fa fa-sticky-note me-1"></i>
                                    {participant.observatii}
                                  </small>
                                </div>
                              )}
                            </div>

                            {/* Footer cu butoanele de acțiune */}
                            <div className="card-footer bg-light border-0 d-flex justify-content-between align-items-center">
                              <div className="d-flex gap-2">
                                {/* Buton pentru trimiterea email-ului individual */}
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => sendConferenceEmail(participant, selectedConferinta)}
                                  disabled={loading}
                                  title={`Trimite email cu link-ul către ${participant.nume}`}
                                >
                                  <i className="fa fa-envelope me-1"></i>
                                  Trimite Email
                                </button>
                                
                                {/* Buton pentru copierea link-ului */}
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => copyConferenceLink(selectedConferinta)}
                                  disabled={loading}
                                  title="Copiază link-ul conferinței"
                                >
                                  <i className="fa fa-copy me-1"></i>
                                  Copiază Link
                                </button>
                              </div>
                              
                              {/* Buton pentru eliminare */}
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveParticipant(selectedConferinta, index)}
                                disabled={loading}
                                title={`Elimină participantul ${participant.nume}`}
                              >
                                {loading ? (
                                  <>
                                    <i className="fa fa-spinner fa-spin me-1"></i>
                                    Eliminare...
                                  </>
                                ) : (
                                  <>
                                    <i className="fa fa-trash me-1"></i>
                                    Elimină
                                  </>
                                )}
                              </button>
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
    </>
  );
};

export default AdminConferinteGrup; 