import React, { useEffect, useState } from "react";
import Link from "next/link";
import Home1Header from "../home/home-1/header";
import { handleGetFirestore, handleGetConferinteActive } from "../../../utils/firestoreUtils";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";
import "moment/locale/ro";
import { useRouter } from "next/router";
import styles from "./ConferinteGrup.module.css";
import { formatGross, useVatPercentage } from "../../../utils/vatDisplay";

moment.locale("ro");

const CalendarConferinteGrup = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const vatPercentage = useVatPercentage();
  const [conferinte, setConferinte] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchConferinte = async () => {
    try {
      setLoading(true);
      // Folosim query-ul optimizat care preia doar conferințele active din Firestore
      const activeConferinte = await handleGetConferinteActive();
      // Sortăm local doar după data începerii
      const sortedConferinte = activeConferinte
        .sort((a, b) => moment(a.dataInceput).diff(moment(b.dataInceput)));
        
      setConferinte(sortedConferinte || []);
    } catch (error) {
      console.error("Error fetching conferinte:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConferinte();
    
    // 🚀 OPTIMIZAT: Setez un interval pentru a reîmprospăta datele la fiecare 5 minute
    // Redus de la 30 secunde pentru a economisi read-uri Firestore
    // Acest lucru ajută la sincronizarea cu modificările făcute de admin
    const refreshInterval = setInterval(() => {
      console.log("🔄 [REFRESH OPTIMIZED] Reîmprospătez datele conferințelor...");
      fetchConferinte();
    }, 300000); // 5 minute (300000ms) - redus de la 30s pentru optimizare

    // Cleanup interval când componenta se demontează
    return () => {
      clearInterval(refreshInterval);
      console.log("🧹 [CLEANUP] Interval de refresh oprit");
    };
  }, []);

  const formatDataDisplay = (conferinta) => {
    if (conferinta.tipConferinta === "course") {
      return {
        dataRange: `${moment(conferinta.dataInceput).format("DD MMM")} - ${moment(conferinta.dataFinal).format("DD MMM YYYY")}`,
        oraRange: `${conferinta.oraInceput} - ${conferinta.oraFinal}`,
        type: "Curs"
      };
    } else {
      return {
        dataRange: moment(conferinta.dataInceput).format("DD MMM YYYY"),
        oraRange: conferinta.oraInceput,
        type: "Conferință"
      };
    }
  };

  const handleInscription = async (conferinta) => {
    console.log("🚀 [INSCRIPTION] Funcția handleInscription apelată");
    console.log("🚀 [INSCRIPTION] authLoading:", authLoading);
    console.log("🚀 [INSCRIPTION] currentUser:", currentUser ? "EXISTĂ" : "NU EXISTĂ");
    console.log("🚀 [INSCRIPTION] currentUser.uid:", currentUser?.uid);
    console.log("🚀 [INSCRIPTION] userData:", userData ? "EXISTĂ" : "NU EXISTĂ");
    
    try {
      console.log("🔍 [INSCRIPTION] Verifică statusul conferinței și locurile disponibile");
      
      // Reîmprospătez datele conferinței din Firestore pentru a avea informațiile cele mai recente
      const conferinteUpdated = await handleGetFirestore("ConferinteGrup");
      const conferintaActualizata = conferinteUpdated.find(c => c.documentId === conferinta.documentId);
      
      if (!conferintaActualizata) {
        alert("Conferința nu a fost găsită. Te rog reîmprospătează pagina.");
        return;
      }

      console.log("🔍 [INSCRIPTION] Participanți actuali:", conferintaActualizata.participanti?.length || 0);

      // Verifică dacă utilizatorul este deja înscris (doar dacă este logat)
      if (currentUser) {
        const isInscris = conferintaActualizata.participanti?.some(
          p => p.userId === currentUser.uid
        );

        console.log("🔍 [INSCRIPTION] Este deja înscris?", isInscris);

        if (isInscris) {
          alert("Ești deja înscris la această conferință!");
          return;
        }
      }

      // Verifică dacă mai sunt locuri disponibile
      if (conferintaActualizata.numarMaxParticipanti && 
          conferintaActualizata.participanti?.length >= conferintaActualizata.numarMaxParticipanti) {
        alert("Din păcate, nu mai sunt locuri disponibile pentru această conferință.");
        return;
      }

      console.log("✅ [INSCRIPTION] Utilizatorul poate să se înscrie, redirecționez către checkout");
      
      // Redirecționez către pagina de plată pentru conferința de grup (funcționează și pentru guest users)
      router.push(`/checkout-conferinta-grup/${conferinta.documentId}`);
      
    } catch (error) {
      console.error("💥 [INSCRIPTION] Eroare la verificarea statusului înscrierii:", error);
      alert("A apărut o eroare. Te rog încearcă din nou.");
    }
  };

  const filteredConferinte = conferinte.filter(conferinta => {
    // Elimină tagurile HTML din descriere pentru căutare
    const descriereText = conferinta.descriere?.replace(/<[^>]*>/g, '') || '';
    const matchesSearch = conferinta.titlu.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         descriereText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           conferinta.tipConferinta === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (conferinta) => {
    const now = moment();
    const startDate = moment(conferinta.dataInceput);
    const daysUntil = startDate.diff(now, 'days');

    if (daysUntil <= 3) {
      return <span className="badge bg-warning text-dark">Se apropie!</span>;
    } else if (daysUntil <= 7) {
      return <span className="badge bg-info">Săptămâna aceasta</span>;
    }
    return null;
  };

  return (
    <>
      <Home1Header />
      
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Conferințe de Grup</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/consultatii">Acasă</Link>
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

      <div className="content">
        <div className="container">
          {/* Filtre și căutare */}
          <div className="row mb-4">
            <div className="col-md-7">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Caută conferințe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary">
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-control"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Toate tipurile</option>
                <option value="single">Conferințe unice</option>
                <option value="course">Cursuri</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-primary w-100"
                onClick={fetchConferinte}
                disabled={loading}
                title="Reîmprospătează lista de conferințe"
              >
                {loading ? (
                  <i className="fa fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa fa-refresh"></i>
                )}
              </button>
            </div>
          </div>

          {/* Conferințe disponibile */}
          <div className="row">
            {loading ? (
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Încărcare...</span>
                </div>
                <p className="mt-3">Se încarcă conferințele...</p>
              </div>
            ) : filteredConferinte.length === 0 ? (
              <div className="col-12 text-center py-5">
                <div className="card">
                  <div className="card-body">
                    <i className="fa fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h4 className="text-muted">Nu sunt conferințe disponibile</h4>
                    <p className="text-muted">
                      {searchTerm || selectedCategory !== "all" 
                        ? "Încearcă să modifici filtrele de căutare." 
                        : "Momentan nu există conferințe programate. Verifică din nou în curând!"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              filteredConferinte.map((conferinta) => {
                const displayInfo = formatDataDisplay(conferinta);
                const statusBadge = getStatusBadge(conferinta);
                const locuriDisponibile = conferinta.numarMaxParticipanti 
                  ? conferinta.numarMaxParticipanti - (conferinta.participanti?.length || 0)
                  : null;

                return (
                  <div key={conferinta.documentId} className="col-lg-6 col-xl-4 mb-4">
                    <div className={`card h-100 shadow-sm ${styles.conferintaCard}`}>
                      {conferinta.imageUrl && (
                        <img 
                          src={conferinta.imageUrl} 
                          className="card-img-top" 
                          alt={conferinta.titlu}
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                      )}
                      
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex gap-2">
                            <span className={
                              displayInfo.type === "Curs" ? styles.badgeCurs : styles.badgeConferinta
                            }>
                              {displayInfo.type}
                            </span>
                            {conferinta.hasPassword && (
                              <span className="badge bg-warning text-dark" title="Conferință cu cod de acces">
                                <i className="fa fa-lock me-1"></i>
                                Cod necesar
                              </span>
                            )}
                          </div>
                          {statusBadge}
                        </div>

                        <h5 className="card-title">{conferinta.titlu}</h5>
                        
                        <div className="card-text text-muted flex-grow-1">
                          {(() => {
                            // Elimină tagurile HTML pentru previzualizare
                            const textContent = conferinta.descriere?.replace(/<[^>]*>/g, '') || '';
                            return textContent.length > 100 
                              ? `${textContent.substring(0, 100)}...` 
                              : textContent;
                          })()}
                        </div>

                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <i className="fa fa-calendar text-primary me-2"></i>
                            <span>{displayInfo.dataRange}</span>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <i className="fa fa-clock text-primary me-2"></i>
                            <span>{displayInfo.oraRange}</span>
                          </div>
                          {conferinta.numarMaxParticipanti && (
                            <div className="d-flex align-items-center mb-2">
                              <i className="fa fa-users text-primary me-2"></i>
                              <span>
                                {locuriDisponibile > 0 
                                  ? `${locuriDisponibile} locuri disponibile`
                                  : "Complet ocupat"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-auto">
                          <div className="price">
                            <strong className={styles.conferintaPrice}>
                              {formatGross(conferinta.pretParticipare, {
                                vatPercentage,
                                currency: "RON",
                              })}
                            </strong>
                            <small className="d-block text-muted">TVA inclus</small>
                          </div>
                          
                          <button
                            className={`btn btn-primary ${styles.btnInscrie}`}
                            onClick={() => handleInscription(conferinta)}
                            disabled={conferinta.numarMaxParticipanti && 
                                     (conferinta.participanti?.length || 0) >= conferinta.numarMaxParticipanti}
                          >
                            {conferinta.numarMaxParticipanti && 
                             (conferinta.participanti?.length || 0) >= conferinta.numarMaxParticipanti
                              ? "Complet"
                              : "Înscrie-te"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Informații suplimentare */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="card bg-light">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fa fa-info-circle text-primary me-2"></i>
                    Informații importante
                  </h5>
                  <div className="row">
                    <div className="col-md-6">
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <i className="fa fa-check text-success me-2"></i>
                          Toate conferințele se desfășoară online prin video call
                        </li>
                        <li className="mb-2">
                          <i className="fa fa-check text-success me-2"></i>
                          Vei primi linkul de acces după confirmare plată
                        </li>
                        <li className="mb-2">
                          <i className="fa fa-check text-success me-2"></i>
                          Pentru cursuri, linkul este valabil pentru toată perioada
                        </li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <i className="fa fa-clock text-info me-2"></i>
                          Toate orele sunt în fusul orar al României
                        </li>
                        <li className="mb-2">
                          <i className="fa fa-envelope text-info me-2"></i>
                          Vei primi confirmarea pe email după înregistrare
                        </li>
                   
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CalendarConferinteGrup; 