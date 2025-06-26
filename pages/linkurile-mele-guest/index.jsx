import React, { useState, useEffect } from "react";
import Link from "next/link";
import Home1Header from "../../client/components/home/home-1/header";
import Footer from "../../client/components/footer";
import moment from "moment";
import "moment/locale/ro";
import Head from 'next/head';
import { handleGetFirestore } from '../../utils/firestoreUtils';

moment.locale("ro");

const GuestLinks = () => {
  const [localStorageLinks, setLocalStorageLinks] = useState([]);
  const [firestoreLinks, setFirestoreLinks] = useState([]);
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    loadLocalStorageLinks();
  }, []);

  const toggleCardExpansion = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const loadLocalStorageLinks = () => {
    try {
      const savedLinks = JSON.parse(localStorage.getItem('guestConferenceLinks') || '[]');
      console.log('🔍 [GUEST LINKS] Links din localStorage:', savedLinks);
      // Sortez după data conferinței (cele mai recente/viitoare primul)
      const sortedLinks = savedLinks.sort((a, b) => {
        const dateA = moment(`${a.conferenceDate} ${a.conferenceTime}`, 'YYYY-MM-DD HH:mm');
        const dateB = moment(`${b.conferenceDate} ${b.conferenceTime}`, 'YYYY-MM-DD HH:mm');
        return dateB.diff(dateA);
      });
      setLocalStorageLinks(sortedLinks);
    } catch (error) {
      console.error('❌ [GUEST LINKS] Eroare la încărcarea din localStorage:', error);
      setLocalStorageLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const searchInFirestore = async () => {
    if (!email.trim()) {
      alert('Te rugăm să introduci o adresă de email');
      return;
    }

    try {
      setSearching(true);
      setFirestoreLinks([]);
      
      console.log('🔍 [FIRESTORE SEARCH] Căutare pentru email:', email);
      
      // Obțin toate conferințele cu participanții lor
      const conferinte = await handleGetFirestore("ConferinteGrup");
      const foundLinks = [];
      
      // Parcurg fiecare conferință pentru a găsi participanții cu email-ul specificat
      conferinte.forEach(conferinta => {
        if (conferinta.participanti && Array.isArray(conferinta.participanti)) {
          const participantWithEmail = conferinta.participanti.find(
            participant => participant.email && participant.email.toLowerCase() === email.toLowerCase().trim()
          );
          
          if (participantWithEmail) {
            const accessLink = participantWithEmail.uniqueAccessLink || participantWithEmail.accessLink;
            if (accessLink) {
              foundLinks.push({
                accessLink: `/conferinta-grup/${accessLink}`,
                conferenceTitle: conferinta.titlu,
                conferenceDescription: conferinta.descriere,
                participantName: `${participantWithEmail.nume} ${participantWithEmail.prenume}`,
                participantEmail: participantWithEmail.email,
                conferenceDate: conferinta.dataInceput,
                conferenceTime: conferinta.oraInceput,
                conferenceEndDate: conferinta.dataFinal,
                conferenceEndTime: conferinta.oraFinal,
                tipConferinta: conferinta.tipConferinta,
                dataInscrierii: participantWithEmail.dataInscrierii,
                status: participantWithEmail.status,
                observatii: participantWithEmail.observatii,
                pretPlatit: participantWithEmail.pretPlatit,
                metodaPlata: participantWithEmail.metodaPlata,
                numarMaxParticipanti: conferinta.numarMaxParticipanti,
                participantiInregistrati: conferinta.participanti?.length || 0,
                organizator: conferinta.organizator || 'Cristina Zurba',
                isFromFirestore: true,
                conferintaId: conferinta.documentId
              });
            }
          }
        }
      });
      
      // Sortez după data conferinței
      const sortedFoundLinks = foundLinks.sort((a, b) => {
        const dateA = moment(`${a.conferenceDate} ${a.conferenceTime}`, 'YYYY-MM-DD HH:mm');
        const dateB = moment(`${b.conferenceDate} ${b.conferenceTime}`, 'YYYY-MM-DD HH:mm');
        return dateB.diff(dateA);
      });
      
      console.log('✅ [FIRESTORE SEARCH] Links găsite în Firestore:', sortedFoundLinks);
      setFirestoreLinks(sortedFoundLinks);
      setSearchPerformed(true);
      
      if (sortedFoundLinks.length === 0) {
        alert(`Nu s-au găsit conferințe pentru email-ul: ${email}`);
      }
      
    } catch (error) {
      console.error('❌ [FIRESTORE SEARCH] Eroare la căutarea în Firestore:', error);
      alert('Eroare la căutarea în baza de date. Te rugăm să încerci din nou.');
    } finally {
      setSearching(false);
    }
  };

  const clearLocalStorage = () => {
    if (confirm('Ești sigur că vrei să ștergi toate linkurile salvate local?')) {
      localStorage.removeItem('guestConferenceLinks');
      setLocalStorageLinks([]);
      alert('Linkurile au fost șterse cu succes!');
    }
  };

  const removeLocalLink = (indexToRemove) => {
    const updatedLinks = localStorageLinks.filter((_, index) => index !== indexToRemove);
    setLocalStorageLinks(updatedLinks);
    localStorage.setItem('guestConferenceLinks', JSON.stringify(updatedLinks));
    alert('Linkul a fost șters!');
  };

  const formatDate = (dateStr) => {
    return moment(dateStr).format('DD MMMM YYYY');
  };

  const formatDateTime = (dateStr, timeStr) => {
    return `${formatDate(dateStr)} la ${timeStr}`;
  };

  const getConferenceType = (tipConferinta) => {
    return tipConferinta === 'course' ? 'Curs' : 'Conferință';
  };

  const getConferenceTypeIcon = (tipConferinta) => {
    return tipConferinta === 'course' ? '📚' : '🎤';
  };

  const isConferenceExpired = (conferenceDate, conferenceTime) => {
    const conferenceDateTime = moment(`${conferenceDate} ${conferenceTime}`, 'YYYY-MM-DD HH:mm');
    return conferenceDateTime.isBefore(moment());
  };

  const getTimeUntilConference = (conferenceDate, conferenceTime) => {
    const conferenceDateTime = moment(`${conferenceDate} ${conferenceTime}`, 'YYYY-MM-DD HH:mm');
    const now = moment();
    
    if (conferenceDateTime.isBefore(now)) {
      const timePassed = moment.duration(now.diff(conferenceDateTime));
      if (timePassed.asDays() > 1) {
        return `A avut loc acum ${Math.floor(timePassed.asDays())} zile`;
      } else if (timePassed.asHours() > 1) {
        return `A avut loc acum ${Math.floor(timePassed.asHours())} ore`;
      } else {
        return `A avut loc acum ${Math.floor(timePassed.asMinutes())} minute`;
      }
    } else {
      const timeUntil = moment.duration(conferenceDateTime.diff(now));
      if (timeUntil.asDays() > 1) {
        return `Peste ${Math.floor(timeUntil.asDays())} zile`;
      } else if (timeUntil.asHours() > 1) {
        return `Peste ${Math.floor(timeUntil.asHours())} ore`;
      } else if (timeUntil.asMinutes() > 0) {
        return `Peste ${Math.floor(timeUntil.asMinutes())} minute`;
      } else {
        return 'Începe acum!';
      }
    }
  };

  const getStatusBadge = (conferenceDate, conferenceTime) => {
    const conferenceDateTime = moment(`${conferenceDate} ${conferenceTime}`, 'YYYY-MM-DD HH:mm');
    const now = moment();
    
    if (conferenceDateTime.isBefore(now)) {
      return { class: 'bg-secondary', text: 'Finalizată', icon: '✅' };
    } else if (conferenceDateTime.diff(now, 'hours') <= 24) {
      return { class: 'bg-warning', text: 'Aproape', icon: '⏰' };
    } else {
      return { class: 'bg-success', text: 'Programată', icon: '📅' };
    }
  };

  const generateQRCode = (link) => {
    const fullLink = `${window.location.origin}${link}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullLink)}`;
  };

  const copyToClipboard = async (text) => {
    try {
      const fullLink = `${window.location.origin}${text}`;
      await navigator.clipboard.writeText(fullLink);
      alert('Link copiat în clipboard!');
    } catch (error) {
      console.error('Eroare la copierea în clipboard:', error);
      alert('Nu s-a putut copia linkul. Te rugăm să-l selectezi manual.');
    }
  };

  const shareLink = async (link, title) => {
    const fullLink = `${window.location.origin}${link}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Conferință: ${title}`,
          text: `Link pentru conferința "${title}"`,
          url: fullLink,
        });
      } catch (error) {
        copyToClipboard(link);
      }
    } else {
      copyToClipboard(link);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Linkurile Mele - Guest</title>
        </Head>
        <Home1Header />
        <div className="content">
          <div className="container">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Încărcare...</span>
              </div>
              <p className="mt-3">Se încarcă linkurile...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Linkurile Mele - Conferințe și Cursuri</title>
        <meta name="description" content="Accesează și gestionează linkurile pentru conferințe și cursuri" />
      </Head>
      <Home1Header />
      
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <h2 className="breadcrumb-title">Linkurile Mele (Vizitator)</h2>
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/">Acasă</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Linkurile Salvate
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 pt-5">
              
       
              {/* Secțiune căutare în Firestore */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    🔍 Caută conferințele cu email-ul tău
                  </h5>
                </div>
                <div className="card-body">
                  <p className="text-muted mb-3">
                    Introduci email-ul cu care te-ai înscris pentru a găsi toate conferințele tale din baza de date
                  </p>
                  <div className="row">
                    <div className="col-md-8">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Introduci email-ul cu care te-ai înscris..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchInFirestore()}
                      />
                    </div>
                    <div className="col-md-4">
                      <button
                        className="btn btn-primary w-100"
                        onClick={searchInFirestore}
                        disabled={searching}
                      >
                        {searching ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Caută...
                          </>
                        ) : (
                          'Caută Conferințe'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rezultate din Firestore */}
              {searchPerformed && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      📋 Conferințe găsite în baza de date ({firestoreLinks.length})
                    </h5>
                  </div>
                  <div className="card-body">
                    {firestoreLinks.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="mb-3">
                          <i className="fas fa-search fa-3x text-muted"></i>
                        </div>
                        <h5 className="text-muted">Nu s-au găsit conferințe</h5>
                      
                      </div>
                    ) : (
                      <div className="row">
                        {firestoreLinks.map((link, index) => {
                          const isExpired = isConferenceExpired(link.conferenceDate, link.conferenceTime);
                          const status = getStatusBadge(link.conferenceDate, link.conferenceTime);
                          const timeInfo = getTimeUntilConference(link.conferenceDate, link.conferenceTime);
                          const cardId = `firestore-${index}`;
                          const isExpanded = expandedCards[cardId];
                          
                          return (
                            <div key={index} className="col-12 mb-4">
                              <div className={`card h-100 border-2 ${isExpired ? 'border-secondary' : 'border-primary'}`}>
                                {/* Header cu titlu și status */}
                                <div className={`card-header ${isExpired ? 'bg-light' : 'bg-primary text-white'}`}>
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <h5 className="card-title mb-1">
                                        {getConferenceTypeIcon(link.tipConferinta)} {link.conferenceTitle}
                                      </h5>
                                      <div className="d-flex align-items-center gap-3">
                                        <span className={`badge ${status.class}`}>
                                          {status.icon} {status.text}
                                        </span>
                                        <small className={isExpired ? 'text-muted' : 'text-white-50'}>
                                          {timeInfo}
                                        </small>
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className={`badge ${link.tipConferinta === 'course' ? 'bg-success' : 'bg-info'}`}>
                                        {getConferenceType(link.tipConferinta)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Informații principale */}
                                <div className="card-body">
                                  <div className="row">
                                    <div className="col-md-8">
                                      <div className="mb-3">
                                        <h6 className="text-muted mb-2">📅 Program conferință:</h6>
                                        <div className="bg-light p-3 rounded">
                                          <div className="mb-2">
                                            <strong>Start:</strong> {formatDateTime(link.conferenceDate, link.conferenceTime)}
                                          </div>
                                          {link.tipConferinta === 'course' && link.conferenceEndDate && (
                                            <div>
                                              <strong>Final:</strong> {formatDateTime(link.conferenceEndDate, link.conferenceEndTime)}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="mb-3">
                                        <h6 className="text-muted mb-2">👤 Date participare:</h6>
                                        <div className="bg-light p-3 rounded">
                                          <div><strong>Nume:</strong> {link.participantName}</div>
                                          <div><strong>Email:</strong> {link.participantEmail}</div>
                                          <div><strong>Status:</strong> 
                                            <span className={`badge ms-2 ${link.status === 'confirmat' ? 'bg-success' : 'bg-warning'}`}>
                                              {link.status}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-md-4">
                                      <div className="mb-3">
                                        <h6 className="text-muted mb-2">💰 Informații plată:</h6>
                                        <div className="bg-light p-3 rounded">
                                          <div><strong>Preț:</strong> {link.pretPlatit} RON</div>
                                          <div><strong>Metodă:</strong> {link.metodaPlata}</div>
                                        </div>
                                      </div>

                                      {link.numarMaxParticipanti && (
                                        <div className="mb-3">
                                          <h6 className="text-muted mb-2">👥 Participanți:</h6>
                                          <div className="bg-light p-3 rounded">
                                            <div>{link.participantiInregistrati} / {link.numarMaxParticipanti}</div>
                                            <div className="progress mt-1" style={{height: '5px'}}>
                                              <div 
                                                className="progress-bar" 
                                                style={{width: `${(link.participantiInregistrati / link.numarMaxParticipanti) * 100}%`}}
                                              ></div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Detalii extinse */}
                                  {isExpanded && (
                                    <div className="mt-3 pt-3 border-top">
                                      {link.conferenceDescription && (
                                        <div className="mb-3">
                                          <h6 className="text-muted">📝 Descriere:</h6>
                                          <p className="text-muted">{link.conferenceDescription}</p>
                                        </div>
                                      )}
                                      
                                      {link.observatii && (
                                        <div className="mb-3">
                                          <h6 className="text-muted">📋 Observațiile tale:</h6>
                                          <div className="alert alert-secondary">
                                            {link.observatii}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="mb-3">
                                        <h6 className="text-muted">📊 Detalii tehnice:</h6>
                                        <div className="row">
                                          <div className="col-md-6">
                                            <small><strong>Înscris la:</strong> {moment(link.dataInscrierii).format('DD.MM.YYYY HH:mm')}</small>
                                          </div>
                                          <div className="col-md-6">
                                            <small><strong>Organizator:</strong> {link.organizator}</small>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Alertă status */}
                                  {isExpired ? (
                                    <div className="alert alert-secondary">
                                      <i className="fas fa-clock me-2"></i>
                                      <strong>Conferință finalizată</strong> - Această conferință a avut loc deja
                                    </div>
                                  ) : (
                                    <div className="alert alert-success">
                                      <i className="fas fa-check-circle me-2"></i>
                                      <strong>Conferință activă</strong> - Poți accesa linkul pentru a participa
                                    </div>
                                  )}
                                </div>

                                {/* Footer cu acțiuni */}
                                <div className="card-footer bg-light">
                                  <div className="d-flex flex-column gap-2">
                                    <div className="d-grid">
                                      <a 
                                        href={link.accessLink} 
                                        className={`btn ${isExpired ? 'btn-outline-secondary' : 'btn-primary'} btn-lg`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <i className="fas fa-external-link-alt me-2"></i>
                                        {isExpired ? 'Vezi Conferința (Finalizată)' : 'Accesează Conferința ACUM'}
                                      </a>
                                    </div>
                                    
                                    <div className="btn-group">
                                      <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => copyToClipboard(link.accessLink)}
                                      >
                                        <i className="fas fa-copy me-1"></i>
                                        Copiază Link
                                      </button>
                                      <button 
                                        className="btn btn-outline-info btn-sm"
                                        onClick={() => window.open(generateQRCode(link.accessLink), '_blank')}
                                      >
                                        <i className="fas fa-qrcode me-1"></i>
                                        QR Code
                                      </button>
                                      <button 
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => shareLink(link.accessLink, link.conferenceTitle)}
                                      >
                                        <i className="fas fa-share-alt me-1"></i>
                                        Distribuie
                                      </button>
                                      <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => toggleCardExpansion(cardId)}
                                      >
                                        <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} me-1`}></i>
                                        {isExpanded ? 'Mai puțin' : 'Mai mult'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

          

              {/* Bottom Actions */}
              <div className="text-center mt-5 mb-5">
                <Link 
                  href="/calendar-conferinte-grup" 
                  className="btn btn-outline-primary btn-lg me-3"
                >
                  <i className="fa fa-calendar me-2"></i>
                  Vezi Alte Conferințe
                </Link>
                
                <Link 
                  href="/" 
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

      <Footer />
    </>
  );
};

export default GuestLinks; 