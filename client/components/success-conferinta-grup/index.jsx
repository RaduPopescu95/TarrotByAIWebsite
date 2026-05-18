import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Home1Header from "../home/home-1/header";
import { handleGetFirestore } from "../../../utils/firestoreUtils";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";
import "moment/locale/ro";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

moment.locale("ro");

const SuccessConferintaGrup = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conferinta, setConferinta] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const { session_id, conferinta_id, access_link } = router.query;

  const getConferenceIdFromAccessLink = (link) => {
    if (typeof link !== "string") return null;
    const match = link.match(/^grup_([^_]+)_/);
    return match?.[1] || null;
  };

  const fetchConferenceById = async (id) => {
    if (!id) return null;
    const snapshot = await getDoc(doc(db, "ConferinteGrup", id));
    if (!snapshot.exists()) return null;
    return {
      documentId: snapshot.id,
      ...snapshot.data(),
    };
  };

  const findParticipantByAccessLink = (conferenceData, link) =>
    conferenceData?.participanti?.some(p =>
      p?.uniqueAccessLink === link || p?.accessLink === link
    );

  useEffect(() => {
    if (session_id) {
      // Detectez dacă este test mode
      if (session_id.startsWith('test_session_')) {
        setIsTestMode(true);
      }
      
      if (conferinta_id || access_link) {
        fetchPaymentDetails();
      }
    }
  }, [session_id, conferinta_id, access_link, currentUser]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);

      console.log("🔍 [SUCCESS] Căutare detalii plată...", { 
        conferinta_id, 
        access_link, 
        isTestMode,
        session_id,
        currentUser: currentUser ? "LOGAT" : "GUEST"
      });

      let conferintaFound = null;

      if (conferinta_id) {
        conferintaFound = await fetchConferenceById(conferinta_id);
      } else if (access_link) {
        const parsedConferenceId = getConferenceIdFromAccessLink(access_link);
        if (parsedConferenceId) {
          const directConference = await fetchConferenceById(parsedConferenceId);
          if (findParticipantByAccessLink(directConference, access_link)) {
            conferintaFound = directConference;
          }
        }

        if (!conferintaFound) {
          const conferinte = await handleGetFirestore("ConferinteGrup");
          conferintaFound = conferinte.find(c => findParticipantByAccessLink(c, access_link));
        }
      }
      
      if (conferintaFound) {
        setConferinta(conferintaFound);
        console.log("✅ [SUCCESS] Conferință găsită:", conferintaFound.titlu);
        
        // Găsește participantul curent (pentru utilizatori cu cont sau guest users)
        let participantFound;
        if (currentUser) {
          // Pentru utilizatori cu cont
          participantFound = conferintaFound.participanti?.find(
            p => p.userId === currentUser.uid
          );
        } else {
          // Pentru guest users, căutăm după access_link
          participantFound = conferintaFound.participanti?.find(
            p => p.uniqueAccessLink === access_link || p.accessLink === access_link
          );
        }
        
        if (participantFound) {
          setParticipant(participantFound);
          console.log("✅ [SUCCESS] Participant găsit:", participantFound.nume, participantFound.prenume);
          console.log("✅ [SUCCESS] Este guest user:", participantFound.isGuestUser ? "DA" : "NU");
        } else {
          console.log("⚠️ [SUCCESS] Participant nu a fost găsit pentru access_link:", access_link);
          console.log("⚠️ [SUCCESS] Participanți disponibili:", conferintaFound.participanti?.map(p => ({
            nume: p.nume,
            uniqueAccessLink: p.uniqueAccessLink,
            accessLink: p.accessLink,
            isGuestUser: p.isGuestUser
          })));
        }
      } else {
        console.log("⚠️ [SUCCESS] Conferința nu a fost găsită");
      }
    } catch (error) {
      console.error("💥 [SUCCESS] Eroare la căutarea detaliilor plății:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDataDisplay = (conferinta) => {
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

  const getAccessLink = () => {
    // Pentru test mode, folosesc access_link din URL
    if (access_link) {
      return `/conferinta-grup/${access_link}`;
    }
    // Pentru plata normală, folosesc uniqueAccessLink din participant
    if (participant?.uniqueAccessLink) {
      return `/conferinta-grup/${participant.uniqueAccessLink}`;
    }
    // Fallback: încerc accessLink din participant
    if (participant?.accessLink) {
      return `/conferinta-grup/${participant.accessLink}`;
    }
    return null;
  };

  if (loading) {
    return (
      <>
        <Home1Header />
        <div className="content">
          <div className="container">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Încărcare...</span>
              </div>
              <p className="mt-3">Se procesează plata...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!conferinta || !participant) {
    return (
      <>
        <Home1Header />
        <div className="content">
          <div className="container">
            <div className="text-center py-5">
              <div className="alert alert-warning">
                <h4>Plata nu a putut fi verificată</h4>
                <p>Te rugăm să ne contactezi dacă ai efectuat plata.</p>
              </div>
              <Link href="/calendar-conferinte-grup" className="btn btn-primary">
                Înapoi la Conferințe
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const displayInfo = formatDataDisplay(conferinta);
  const accessLink = getAccessLink();

  return (
    <>
      <Home1Header />
      
      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Test Mode Alert */}
              {isTestMode && (
                <div className="alert alert-warning text-center mb-4">
                  <i className="fa fa-flask fa-2x mb-2"></i>
                  <h5>🧪 MOD TEST ACTIV</h5>
                  <p className="mb-0">
                    Aceasta este o simulare. Nu s-a efectuat nicio plată reală.
                  </p>
                </div>
              )}

              {/* Guest User Alert */}
              {!currentUser && participant?.isGuestUser && (
                <div className="alert alert-info text-center mb-4">
                  <i className="fa fa-user-o fa-2x mb-2"></i>
                  <h5>👋 Participare ca Vizitator</h5>
                  <p className="mb-0">
                    Participi la această conferință fără să ai nevoie de cont. Link-ul tău de acces este unic și securizat.
                  </p>
                </div>
              )}

              {/* Success Header */}
              <div className="text-center mb-5">
                <div className="success-icon mb-4">
                  <i className="fa fa-check-circle fa-5x text-success"></i>
                </div>
                <h1 className="text-success mb-3">
                  {isTestMode ? "Simularea a fost completată cu succes!" : "Plata a fost procesată cu succes!"}
                </h1>
                <p className="lead text-muted">
                  Înregistrarea ta pentru <strong>{conferinta.titlu}</strong> a fost confirmată.
                </p>
              </div>

              {/* Confirmation Details */}
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-success text-white">
                  <h4 className="mb-0">
                    <i className="fa fa-calendar me-2"></i>
                    Detalii Rezervare
                  </h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h5 className="text-primary">{conferinta.titlu}</h5>
                      <span className={`badge mb-3 ${
                        displayInfo.type === "Curs" ? "bg-info" : "bg-primary"
                      }`}>
                        {displayInfo.type}
                      </span>
                      
                      <div className="detail-item mb-2">
                        <i className="fa fa-calendar text-primary me-2"></i>
                        <strong>Data:</strong> {displayInfo.dataRange}
                      </div>
                      
                      <div className="detail-item mb-2">
                        <i className="fa fa-clock text-primary me-2"></i>
                        <strong>Ora:</strong> {displayInfo.oraRange}
                      </div>

                      <div className="detail-item mb-2">
                        <i className="fa fa-user text-primary me-2"></i>
                        <strong>Participant:</strong> {participant.nume} {participant.prenume}
                        {participant.isGuestUser && (
                          <span className="badge bg-info ms-2">Vizitator</span>
                        )}
                      </div>

                      <div className="detail-item mb-2">
                        <i className="fa fa-envelope text-primary me-2"></i>
                        <strong>Email:</strong> {participant.email}
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      {conferinta.imagine && (
                        <img 
                          src={conferinta.imagine} 
                          className="img-fluid rounded" 
                          alt={conferinta.titlu}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Link */}
              {accessLink && (
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">
                      <i className="fa fa-link me-2"></i>
                      Link de Acces
                    </h4>
                  </div>
                  <div className="card-body text-center">
                    <p className="mb-3">
                      Folosește acest link pentru a accesa conferința:
                    </p>
                    
                    <div className="access-link-container p-3 bg-light rounded mb-3">
                      <code className="text-primary">{window.location.origin}{accessLink}</code>
                    </div>
                    
                    <Link 
                      href={accessLink}
                      className="btn btn-primary btn-lg me-3"
                    >
                      <i className="fa fa-video me-2"></i>
                      Acces Direct la Conferință
                    </Link>
                    
                    <button 
                      className="btn btn-outline-primary btn-lg"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${accessLink}`);
                        alert('Link copiat în clipboard!');
                      }}
                    >
                      <i className="fa fa-copy me-2"></i>
                      Copiază Link
                    </button>
                  </div>
                </div>
              )}

              {/* Important Information */}
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-info text-white">
                  <h4 className="mb-0">
                    <i className="fa fa-info-circle me-2"></i>
                    Informații Importante
                  </h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-primary">Ce urmează:</h6>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <i className="fa fa-check text-success me-2"></i>
                          Vei primi un email de confirmare cu toate detaliile
                        </li>
                        <li className="mb-2">
                          <i className="fa fa-check text-success me-2"></i>
                          Link-ul de acces este unic și personal
                        </li>
                        <li className="mb-2">
                          <i className="fa fa-check text-success me-2"></i>
                          Salvează link-ul pentru accesul la conferință
                        </li>
                        {conferinta.tipConferinta === "course" && (
                          <li className="mb-2">
                            <i className="fa fa-check text-success me-2"></i>
                            Link-ul este valabil pentru toată perioada cursului
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="col-md-6">
                      <h6 className="text-primary">Ai întrebări?</h6>
                      <p className="text-muted">
                        Dacă ai întrebări sau probleme tehnice, ne poți contacta:
                      </p>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <i className="fa fa-envelope text-primary me-2"></i>
                          Email: webdynamicx@gmail.com
                        </li>
                     
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="text-primary mb-3">
                    <i className="fa fa-receipt me-2"></i>
                    Sumar Plată
                  </h5>
                  
                  <div className="row">
                    <div className="col-md-8">
                      <p className="mb-1"><strong>{conferinta.titlu}</strong></p>
                      <p className="text-muted mb-0">{displayInfo.type} • {displayInfo.dataRange}</p>
                    </div>
                    <div className="col-md-4 text-end">
                      <h4 className="text-success mb-0">{conferinta.pretParticipare} RON</h4>
                      <small className="text-muted">Plătit cu succes</small>
                    </div>
                  </div>
                  
                  <hr />
                  
                  <div className="row">
                    <div className="col-md-6">
                      <small className="text-muted">Session ID: {session_id}</small>
                    </div>
                    <div className="col-md-6 text-end">
                      <small className="text-muted">
                        Data plății: {moment().format("DD MMMM YYYY, HH:mm")}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="text-center mb-5">
                <Link 
                  href="/calendar-conferinte-grup" 
                  className="btn btn-outline-primary btn-lg me-3"
                >
                  <i className="fa fa-calendar me-2"></i>
                  Vezi Alte Conferințe
                </Link>
                
                <Link 
                  href="/consultatii" 
                  className="btn btn-outline-secondary btn-lg"
                >
                  <i className="fa fa-home me-2"></i>
                  Acasă
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuccessConferintaGrup; 
