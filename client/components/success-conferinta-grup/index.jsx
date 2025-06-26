import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Home1Header from "../home/home-1/header";
import { handleGetFirestore } from "../../../utils/firestoreUtils";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";
import "moment/locale/ro";

moment.locale("ro");

const SuccessConferintaGrup = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conferinta, setConferinta] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const { session_id, conferinta_id, access_link } = router.query;

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

  // Salvare link în localStorage pentru toți utilizatorii (nu doar guest users)
  useEffect(() => {
    const accessLinkValue = getAccessLink();
    if (accessLinkValue && participant && conferinta) {
      const guestConferenceData = {
        accessLink: accessLinkValue,
        conferenceTitle: conferinta.titlu,
        participantName: `${participant.nume} ${participant.prenume}`,
        participantEmail: participant.email,
        conferenceDate: conferinta.dataInceput,
        conferenceTime: conferinta.oraInceput,
        conferenceEndDate: conferinta.dataFinal,
        conferenceEndTime: conferinta.oraFinal,
        tipConferinta: conferinta.tipConferinta,
        savedAt: new Date().toISOString(),
        sessionId: session_id,
        isGuestUser: !currentUser, // Marcăm dacă este guest user
        userId: currentUser?.uid || null
      };
      
      // Salvez în localStorage
      const existingGuestLinks = JSON.parse(localStorage.getItem('guestConferenceLinks') || '[]');
      const filteredLinks = existingGuestLinks.filter(link => link.sessionId !== session_id);
      filteredLinks.push(guestConferenceData);
      
      // Păstrez doar ultimele 15 linkuri
      const limitedLinks = filteredLinks.slice(-15);
      localStorage.setItem('guestConferenceLinks', JSON.stringify(limitedLinks));
      
      console.log("💾 [LOCAL STORAGE] Link salvat în localStorage:", {
        isGuestUser: !currentUser,
        userId: currentUser?.uid || 'GUEST',
        conferenceTitle: conferinta.titlu,
        accessLink: accessLinkValue
      });
    }
  }, [conferinta, participant, session_id, currentUser]);

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

      // Fetch toate conferințele
      const conferinte = await handleGetFirestore("ConferinteGrup");
      let conferintaFound = null;

      if (conferinta_id) {
        // Căutare după ID conferință (metoda normală)
        conferintaFound = conferinte.find(c => c.documentId === conferinta_id);
      } else if (access_link) {
        // Căutare după access link (pentru test mode și guest users)
        conferintaFound = conferinte.find(c => 
          c.participanti?.some(p => 
            p.uniqueAccessLink === access_link || p.accessLink === access_link
          )
        );
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
        dataRange: `${moment(conferinta.dataInceput).format("DD MMMM YYYY")}, ${conferinta.oraInceput} - ${moment(conferinta.dataFinal).format("DD MMMM YYYY")}, ${conferinta.oraFinal}`,
        oraRange: `${conferinta.oraInceput} - ${conferinta.oraFinal}`,
        type: "Curs"
      };
    } else {
      return {
        dataRange: `${moment(conferinta.dataInceput).format("DD MMMM YYYY")}, ${conferinta.oraInceput}`,
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

  // Funcții pentru opțiuni îmbunătățite de salvare
  const generateQRCode = (text) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    return qrCodeUrl;
  };

  const downloadBookmarkFile = () => {
    const accessLinkValue = getAccessLink();
    if (!accessLinkValue) return;
    
    const fullLink = `${window.location.origin}${accessLinkValue}`;
    const bookmarkContent = `[InternetShortcut]
URL=${fullLink}
IconFile=${window.location.origin}/favicon.ico
IconIndex=0`;

    const blob = new Blob([bookmarkContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Conferinta_${conferinta?.titlu?.replace(/[^a-zA-Z0-9]/g, '_')}.url`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Fișier bookmark descărcat! Poți să-l salvezi pe desktop pentru acces rapid.');
  };

  const saveToCalendar = () => {
    if (!conferinta) return;
    
    const startDate = moment(`${conferinta.dataInceput} ${conferinta.oraInceput}`, "YYYY-MM-DD HH:mm");
    const endDate = conferinta.tipConferinta === "course" ? 
      moment(`${conferinta.dataFinal} ${conferinta.oraFinal}`, "YYYY-MM-DD HH:mm") :
      startDate.clone().add(2, 'hours'); // Default 2 ore pentru conferințe
    
    const accessLinkValue = getAccessLink();
    const fullLink = `${window.location.origin}${accessLinkValue}`;
    
    const calendarEvent = {
      title: conferinta.titlu,
      start: startDate.format('YYYYMMDDTHHmmss'),
      end: endDate.format('YYYYMMDDTHHmmss'),
      description: `${conferinta.descriere}\\n\\nLink de acces: ${fullLink}\\n\\nParticipant: ${participant?.nume} ${participant?.prenume}`,
      location: 'Online - Link în descriere'
    };
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cristina Zurba//Conference Reminder//EN
BEGIN:VEVENT
UID:${session_id}@cristinazurba.com
DTSTAMP:${moment().format('YYYYMMDDTHHmmss')}Z
DTSTART:${calendarEvent.start}Z
DTEND:${calendarEvent.end}Z
SUMMARY:${calendarEvent.title}
DESCRIPTION:${calendarEvent.description}
LOCATION:${calendarEvent.location}
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Conferinta_${conferinta.titlu.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Eveniment calendar descărcat! Poți să-l adaugi în aplicația ta de calendar.');
  };

  const sendSMSReminder = () => {
    if (!participant?.telefon) {
      alert('Nu există număr de telefon pentru trimiterea SMS-ului');
      return;
    }
    
    const accessLinkValue = getAccessLink();
    const fullLink = `${window.location.origin}${accessLinkValue}`;
    const message = `Conferinta: ${conferinta?.titlu}
Data: ${moment(conferinta?.dataInceput).format("DD MMMM YYYY")}, ${conferinta?.oraInceput}
Link acces: ${fullLink}`;
    
    const smsUrl = `sms:${participant.telefon}?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
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
            <div className="col-lg-8 pt-5">
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
              <div className="text-center mb-5 pt-5">
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
                        <strong>{displayInfo.type === "Curs" ? "Interval:" : "Data & Ora:"}</strong> {displayInfo.dataRange}
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
                    
                    <div className="access-link-container p-3 bg-light rounded mb-4">
                      <code className="text-primary">{window.location.origin}{accessLink}</code>
                    </div>
                    
                    {/* Butoane principale */}
                    <div className="d-flex justify-content-center gap-3 mb-4">
                      <Link 
                        href={accessLink}
                        className="btn btn-primary btn-lg"
                      >
                        <i className="fa fa-video me-2"></i>
                        Acces Direct
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

                    {/* Opțiuni avansate de salvare pentru guest users */}
                    {!currentUser && participant?.isGuestUser && (
                      <>
                        <div className="alert alert-info">
                          <i className="fa fa-lightbulb me-2"></i>
                          <strong>Pentru că nu ai cont,</strong> îți recomandăm să salvezi link-ul în mai multe moduri pentru siguranță:
                        </div>

                        <div className="d-flex justify-content-center">
                          <button 
                            className="btn btn-outline-info"
                            onClick={() => setShowSaveOptions(!showSaveOptions)}
                          >
                            <i className="fa fa-chevron-down me-2"></i>
                            {showSaveOptions ? 'Ascunde' : 'Vezi'} Opțiuni de Salvare
                          </button>
                        </div>

                        {showSaveOptions && (
                          <div className="row mt-4">
                            <div className="col-12">
                              <h6 className="text-primary mb-3">Salvează link-ul în mai multe moduri:</h6>
                            </div>

                            {/* QR Code */}
                            <div className="col-md-6 mb-3">
                              <div className="card h-100">
                                <div className="card-body text-center">
                                  <i className="fa fa-qrcode fa-2x text-primary mb-2"></i>
                                  <h6>QR Code</h6>
                                  <p className="small text-muted">Scanează cu telefonul pentru acces rapid</p>
                                  <img 
                                    src={generateQRCode(`${window.location.origin}${accessLink}`)}
                                    alt="QR Code pentru conferință"
                                    className="img-fluid mb-2"
                                    style={{ maxWidth: '120px' }}
                                  />
                                  <br />
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => {
                                      const qrImg = generateQRCode(`${window.location.origin}${accessLink}`);
                                      const newWindow = window.open();
                                      newWindow.document.write(`<img src="${qrImg}" />`);
                                    }}
                                  >
                                    Mărește QR
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Calendar Event */}
                            <div className="col-md-6 mb-3">
                              <div className="card h-100">
                                <div className="card-body text-center">
                                  <i className="fa fa-calendar fa-2x text-success mb-2"></i>
                                  <h6>Adaugă în Calendar</h6>
                                  <p className="small text-muted">Descarcă eveniment pentru calendar</p>
                                  <button 
                                    className="btn btn-outline-success"
                                    onClick={saveToCalendar}
                                  >
                                    <i className="fa fa-download me-1"></i>
                                    Descarcă .ics
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Bookmark File */}
                            <div className="col-md-6 mb-3">
                              <div className="card h-100">
                                <div className="card-body text-center">
                                  <i className="fa fa-bookmark fa-2x text-warning mb-2"></i>
                                  <h6>Fișier Bookmark</h6>
                                  <p className="small text-muted">Salvează pe desktop pentru acces rapid</p>
                                  <button 
                                    className="btn btn-outline-warning"
                                    onClick={downloadBookmarkFile}
                                  >
                                    <i className="fa fa-download me-1"></i>
                                    Descarcă .url
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* SMS Reminder */}
                            {participant?.telefon && (
                              <div className="col-md-6 mb-3">
                                <div className="card h-100">
                                  <div className="card-body text-center">
                                    <i className="fa fa-mobile fa-2x text-info mb-2"></i>
                                    <h6>SMS Personal</h6>
                                    <p className="small text-muted">Trimite-ți link-ul prin SMS</p>
                                    <button 
                                      className="btn btn-outline-info"
                                      onClick={sendSMSReminder}
                                    >
                                      <i className="fa fa-sms me-1"></i>
                                      Trimite SMS
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                                                         {/* Browser Storage Info */}
                             <div className="col-12 mt-3">
                               <div className="alert alert-success">
                                 <i className="fa fa-check-circle me-2"></i>
                                 <strong>Salvat automat!</strong> Link-ul a fost salvat în browser-ul tău. 
                                 <Link href="/linkurile-mele-guest" className="alert-link">
                                   Vezi toate linkurile salvate
                                 </Link> chiar dacă închidem pagina.
                               </div>
                             </div>
                          </div>
                        )}
                      </>
                    )}
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