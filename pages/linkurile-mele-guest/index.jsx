import React, { useState, useEffect } from "react";
import Link from "next/link";
import Home1Header from "../../client/components/home/home-1/header";
import Footer from "../../client/components/footer";
import moment from "moment";
import "moment/locale/ro";

moment.locale("ro");

const LinkurileGuestPage = () => {
  const [guestLinks, setGuestLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Încarcă linkurile salvate din localStorage
    const savedLinks = localStorage.getItem('guestConferenceLinks');
    if (savedLinks) {
      const parsedLinks = JSON.parse(savedLinks);
      // Sortează după data salvării (cel mai recent primul)
      const sortedLinks = parsedLinks.sort((a, b) => 
        new Date(b.savedAt) - new Date(a.savedAt)
      );
      setGuestLinks(sortedLinks);
    }
    setLoading(false);
  }, []);

  const handleDeleteLink = (sessionId) => {
    if (window.confirm('Ești sigur că vrei să ștergi acest link?')) {
      const updatedLinks = guestLinks.filter(link => link.sessionId !== sessionId);
      setGuestLinks(updatedLinks);
      localStorage.setItem('guestConferenceLinks', JSON.stringify(updatedLinks));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Ești sigur că vrei să ștergi toate linkurile salvate?')) {
      setGuestLinks([]);
      localStorage.removeItem('guestConferenceLinks');
    }
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
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
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
              
              {/* Header Info */}
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-info text-white">
                  <h4 className="mb-0">
                    <i className="fa fa-info-circle me-2"></i>
                    Despre Această Pagină
                  </h4>
                </div>
                <div className="card-body">
                  <p className="mb-2">
                    <strong>Această pagină afișează linkurile de conferință salvate local în browser-ul tău.</strong>
                  </p>
                  <ul className="list-unstyled mb-0">
                    <li><i className="fa fa-check text-success me-2"></i>Linkurile sunt salvate doar pe acest dispozitiv</li>
                    <li><i className="fa fa-check text-success me-2"></i>Nu sunt sincronizate pe alte dispozitive</li>
                    <li><i className="fa fa-check text-success me-2"></i>Se pot pierde la ștergerea datelor browser-ului</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              {guestLinks.length > 0 && (
                <div className="text-center mb-4">
                  <button 
                    className="btn btn-outline-danger"
                    onClick={handleClearAll}
                  >
                    <i className="fa fa-trash me-2"></i>
                    Șterge Toate Linkurile
                  </button>
                </div>
              )}

              {/* Links List */}
              {guestLinks.length === 0 ? (
                <div className="card shadow-sm">
                  <div className="card-body text-center py-5">
                    <i className="fa fa-link fa-3x text-muted mb-3"></i>
                    <h4 className="text-muted">Nu există linkuri salvate</h4>
                    <p className="text-muted mb-4">
                      Nu ai încă niciun link de conferință salvat pe acest dispozitiv.
                    </p>
                    <Link 
                      href="/calendar-conferinte-grup"
                      className="btn btn-primary"
                    >
                      <i className="fa fa-calendar me-2"></i>
                      Vezi Conferințele Disponibile
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="row">
                  {guestLinks.map((link, index) => (
                    <div key={link.sessionId} className="col-md-6 mb-4">
                      <div className="card shadow-sm h-100">
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">
                            <i className="fa fa-video me-2"></i>
                            {link.conferenceTitle}
                          </h6>
                          <button
                            className="btn btn-sm btn-outline-light"
                            onClick={() => handleDeleteLink(link.sessionId)}
                            title="Șterge link"
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <small className="text-muted">Participant:</small>
                            <div><strong>{link.participantName}</strong></div>
                            <div className="text-muted">{link.participantEmail}</div>
                          </div>
                          
                          <div className="mb-3">
                            <small className="text-muted">Data conferinței:</small>
                            <div>
                              <i className="fa fa-calendar text-primary me-2"></i>
                              {moment(link.conferenceDate).format("DD MMMM YYYY")}
                            </div>
                            <div>
                              <i className="fa fa-clock text-primary me-2"></i>
                              {link.conferenceTime}
                            </div>
                          </div>

                          <div className="mb-3">
                            <small className="text-muted">Salvat la:</small>
                            <div className="small">
                              {moment(link.savedAt).format("DD MMMM YYYY, HH:mm")}
                            </div>
                          </div>

                          <div className="access-link-container p-2 bg-light rounded mb-3">
                            <code className="small">{window.location.origin}{link.accessLink}</code>
                          </div>
                        </div>
                        <div className="card-footer">
                          <div className="d-flex gap-2">
                            <Link 
                              href={link.accessLink}
                              className="btn btn-primary flex-fill"
                            >
                              <i className="fa fa-video me-2"></i>
                              Accesează
                            </Link>
                            <button 
                              className="btn btn-outline-primary"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}${link.accessLink}`);
                                alert('Link copiat în clipboard!');
                              }}
                              title="Copiază link"
                            >
                              <i className="fa fa-copy"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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

export default LinkurileGuestPage; 