import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Home1Header from "../home/home-1/header";
import { 
  handleGetFirestore, 
  handleUpdateFirestore,
  handleUploadFirestoreGeneral 
} from "../../../utils/firestoreUtils";
import { useAuth } from "../../../context/AuthContext";
import AlertMessage from "../AlertMessage";
import moment from "moment";
import "moment/locale/ro";
import { loadStripe } from "@stripe/stripe-js";

moment.locale("ro");

// Stripe configuration
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutConferintaGrup = ({ conferintaId }) => {
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [conferinta, setConferinta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "", visible: false });

  // Form data pentru participare
  const [formData, setFormData] = useState({
    nume: "",
    prenume: "",
    email: "",
    telefon: "",
    observatii: ""
  });

  // Test mode pentru simulare fără Stripe
  const [testMode, setTestMode] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message, visible: true });
    setTimeout(() => {
      setAlert({ type: "", message: "", visible: false });
    }, 5000);
  };

  // Fetch conferinta details
  const fetchConferinta = async () => {
    if (!conferintaId) return;
    
    try {
      setLoading(true);
      const conferinte = await handleGetFirestore("ConferinteGrup");
      const conferintaFound = conferinte.find(c => c.documentId === conferintaId);
      
      if (!conferintaFound) {
        showAlert("danger", "Conferința nu a fost găsită");
        router.push("/calendar-conferinte-grup");
        return;
      }

      // Verifică dacă conferința este activă
      if (conferintaFound.status !== "activa") {
        const statusText = conferintaFound.status === "inactiva" ? "inactivă" : "completată";
        showAlert("danger", `Această conferință este ${statusText} și nu este disponibilă pentru înscriere`);
        router.push("/calendar-conferinte-grup");
        return;
      }

      // Verifică locuri disponibile
      if (conferintaFound.numarMaxParticipanti && 
          (conferintaFound.participanti?.length || 0) >= conferintaFound.numarMaxParticipanti) {
        showAlert("danger", "Nu mai sunt locuri disponibile pentru această conferință");
        router.push("/calendar-conferinte-grup");
        return;
      }

      setConferinta(conferintaFound);
      
      // Pre-populez cu datele utilizatorului dacă sunt disponibile
      if (userData) {
        setFormData(prev => ({
          ...prev,
          nume: userData.last_name || "",
          prenume: userData.first_name || "",
          email: userData.email || "",
          telefon: userData.telefon || ""
        }));
      }
    } catch (error) {
      console.error("Error fetching conferinta:", error);
      showAlert("danger", "Eroare la încărcarea conferinței");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Permitem accesul și fără cont (guest checkout)
    fetchConferinta();
  }, [conferintaId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.nume.trim()) {
      showAlert("danger", "Numele este obligatoriu");
      return false;
    }
    if (!formData.prenume.trim()) {
      showAlert("danger", "Prenumele este obligatoriu");
      return false;
    }
    if (!formData.email.trim()) {
      showAlert("danger", "Email-ul este obligatoriu");
      return false;
    }
    if (!formData.telefon.trim()) {
      showAlert("danger", "Telefonul este obligatoriu");
      return false;
    }
    
    // Verifică email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert("danger", "Format email invalid");
      return false;
    }

    return true;
  };

  const generateUniqueAccessLink = () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const userIdentifier = currentUser?.uid || `guest_${Math.random().toString(36).substring(2, 10)}`;
    return `grup_${conferintaId}_${userIdentifier}_${timestamp}_${randomString}`;
  };

  const simulateSuccessfulPayment = async () => {
    try {
      setProcessing(true);

      if (!validateForm()) {
        setProcessing(false);
        return;
      }

      console.log("🧪 [TEST MODE] Simulez plata reușită fără Stripe...");

      // Verifică din nou dacă mai sunt locuri disponibile
      const conferinte = await handleGetFirestore("ConferinteGrup");
      const conferintaUpdated = conferinte.find(c => c.documentId === conferintaId);
      
      if (conferintaUpdated.numarMaxParticipanti && 
          (conferintaUpdated.participanti?.length || 0) >= conferintaUpdated.numarMaxParticipanti) {
        showAlert("danger", "Din păcate, nu mai sunt locuri disponibile");
        setProcessing(false);
        return;
      }

      // Generez link-ul unic de acces
      const uniqueAccessLink = generateUniqueAccessLink();

      // Simulez delay pentru procesare
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Creez datele participantului
      const participantData = {
        userId: currentUser?.uid || uniqueAccessLink, // Pentru guest users folosim access link-ul ca ID unic
        nume: formData.nume,
        prenume: formData.prenume,
        email: formData.email,
        telefon: formData.telefon,
        observatii: formData.observatii,
        dataInscrierii: new Date().toISOString(),
        status: "confirmat",
        accessLink: uniqueAccessLink,
        metodaPlata: "TEST_MODE",
        pretPlatit: conferinta.pretParticipare,
        isGuestUser: !currentUser // Marcăm dacă este guest user
      };

      console.log("🧪 [TEST MODE] Date participant:", participantData);

      // Actualizez conferința cu noul participant
      const participantiExistenti = conferintaUpdated.participanti || [];
      const participantiNoi = [...participantiExistenti, participantData];

      await handleUpdateFirestore(
        `ConferinteGrup/${conferintaId}`,
        { 
          participanti: participantiNoi,
          updatedAt: new Date().toISOString()
        }
      );

      console.log("✅ [TEST MODE] Participant adăugat cu succes în conferință");

      // Creez înregistrarea de plată (simulată)
      const plataData = {
        conferintaId: conferinta.documentId,
        conferintaTitlu: conferinta.titlu,
        userId: currentUser?.uid || uniqueAccessLink,
        participantData: participantData,
        suma: conferinta.pretParticipare,
        status: "succeeded",
        metodaPlata: "TEST_MODE",
        stripeSessionId: `test_session_${Date.now()}`,
        stripePaymentIntentId: `test_pi_${Date.now()}`,
        dataPlata: new Date().toISOString(),
        accessLink: uniqueAccessLink,
        isGuestUser: !currentUser
      };

      await handleUploadFirestoreGeneral(plataData, "PlatiConferinteGrup");
      console.log("✅ [TEST MODE] Înregistrarea plății simulată salvată");

      // Trimit email-ul de confirmare
      console.log("📧 [TEST MODE] Trimit email-ul de confirmare...");
      try {
        const emailResponse = await fetch('/api/send-email-conferinta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantData: participantData,
            conferintaData: conferinta,
            accessLink: uniqueAccessLink,
            isTestMode: true
          }),
        });

        const emailResult = await emailResponse.json();
        if (emailResult.success) {
          console.log("✅ [TEST MODE] Email trimis cu succes:", emailResult.messageId);
        } else {
          console.log("⚠️ [TEST MODE] Eroare la trimiterea emailului:", emailResult.error);
        }
      } catch (emailError) {
        console.error("💥 [TEST MODE] Eroare la trimiterea emailului:", emailError);
      }
      
      showAlert("success", "🧪 TEST MODE: Plata simulată cu succes! Redirecționare...");

      // Redirecționez către pagina de succes după o scurtă întârziere
      setTimeout(() => {
        router.push(`/success-conferinta-grup?session_id=test_session_${Date.now()}&access_link=${uniqueAccessLink}`);
      }, 2000);

    } catch (error) {
      console.error("💥 [TEST MODE] Eroare la simularea plății:", error);
      showAlert("danger", "Eroare la simularea plății: " + error.message);
      setProcessing(false);
    }
  };

  const createStripeCheckoutSession = async () => {
    try {
      setProcessing(true);

      if (!validateForm()) {
        setProcessing(false);
        return;
      }

      // Verifică din nou dacă mai sunt locuri disponibile
      const conferinte = await handleGetFirestore("ConferinteGrup");
      const conferintaUpdated = conferinte.find(c => c.documentId === conferintaId);
      
      if (conferintaUpdated.numarMaxParticipanti && 
          (conferintaUpdated.participanti?.length || 0) >= conferintaUpdated.numarMaxParticipanti) {
        showAlert("danger", "Din păcate, nu mai sunt locuri disponibile");
        setProcessing(false);
        return;
      }

      // Generez link-ul unic de acces
      const uniqueAccessLink = generateUniqueAccessLink();

      // Datele pentru Stripe checkout
      const checkoutData = {
        conferintaId: conferinta.documentId,
        conferintaTitlu: conferinta.titlu,
        participantData: formData,
        pretParticipare: conferinta.pretParticipare,
        userId: currentUser?.uid || uniqueAccessLink,
        uniqueAccessLink: uniqueAccessLink,
        tipConferinta: conferinta.tipConferinta,
        dataInceput: conferinta.dataInceput,
        dataFinal: conferinta.dataFinal,
        oraInceput: conferinta.oraInceput,
        oraFinal: conferinta.oraFinal,
        isGuestUser: !currentUser
      };

      // Call API pentru a crea Stripe session
      const response = await fetch('/api/create-checkout-session-conferinta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        showAlert("danger", "Eroare la crearea sesiunii de plată: " + error);
        setProcessing(false);
        return;
      }

      // Redirect către Stripe Checkout
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (stripeError) {
        showAlert("danger", "Eroare la redirecționarea către plată: " + stripeError.message);
        setProcessing(false);
      }

    } catch (error) {
      console.error("Error creating checkout session:", error);
      showAlert("danger", "Eroare la procesarea plății");
      setProcessing(false);
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
              <p className="mt-3">Se încarcă detaliile conferinței...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!conferinta) {
    return (
      <>
        <Home1Header />
        <div className="content">
          <div className="container">
            <div className="text-center py-5">
              <h3>Conferința nu a fost găsită</h3>
              <Link href="/calendar-conferinte-grup" className="btn btn-primary mt-3">
                Înapoi la Conferințe
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const displayInfo = formatDataDisplay(conferinta);
  const locuriDisponibile = conferinta.numarMaxParticipanti 
    ? conferinta.numarMaxParticipanti - (conferinta.participanti?.length || 0)
    : null;

  return (
    <>
      <Home1Header />
      
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Finalizare Înscriere</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/calendar-conferinte-grup">Conferințe</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Checkout
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="container">
          {alert.visible && (
            <AlertMessage type={alert.type} message={alert.message} />
          )}

          <div className="row">
            {/* Detaliile conferinței */}
            <div className="col-lg-4 col-xl-4">
              <div className="card">
                <div className="card-header">
                  <h4>
                    <i className="fa fa-calendar me-2"></i>
                    Detalii Conferință
                  </h4>
                </div>
                <div className="card-body">
                  {conferinta.imagine && (
                    <img 
                      src={conferinta.imagine} 
                      className="img-fluid rounded mb-3" 
                      alt={conferinta.titlu}
                    />
                  )}
                  
                  <h5 className="text-primary">{conferinta.titlu}</h5>
                  
                  <span className={`badge mb-3 ${
                    displayInfo.type === "Curs" ? "bg-info" : "bg-primary"
                  }`}>
                    {displayInfo.type}
                  </span>

                  <div className="mb-3">
                    <p className="text-muted">{conferinta.descriere}</p>
                  </div>

                  <div className="detail-item mb-2">
                    <i className="fa fa-calendar text-primary me-2"></i>
                    <strong>Data:</strong> {displayInfo.dataRange}
                  </div>
                  
                  <div className="detail-item mb-2">
                    <i className="fa fa-clock text-primary me-2"></i>
                    <strong>Ora:</strong> {displayInfo.oraRange}
                  </div>

                  {conferinta.numarMaxParticipanti && (
                    <div className="detail-item mb-2">
                      <i className="fa fa-users text-primary me-2"></i>
                      <strong>Locuri disponibile:</strong> {locuriDisponibile}
                    </div>
                  )}

                  <hr />

                  <div className="text-center">
                    <div className="price-display">
                      <span className="text-muted">Preț participare:</span>
                      <div className="h3 text-primary mb-0">{conferinta.pretParticipare} RON</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informații importante */}
              <div className="card mt-3">
                <div className="card-body">
                  <h6 className="text-primary">
                    <i className="fa fa-info-circle me-2"></i>
                    Ce vei primi:
                  </h6>
                  <ul className="list-unstyled">
                    <li>
                      <i className="fa fa-check text-success me-2"></i>
                      Link unic de acces la conferință
                    </li>
                    <li>
                      <i className="fa fa-check text-success me-2"></i>
                      Confirmare prin email
                    </li>
                    <li>
                      <i className="fa fa-check text-success me-2"></i>
                      Factură fiscală
                    </li>
                    {conferinta.tipConferinta === "course" && (
                      <li>
                        <i className="fa fa-check text-success me-2"></i>
                        Acces pentru toată perioada cursului
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Formularul de checkout */}
            <div className="col-lg-8 col-xl-8">
              <div className="card">
                <div className="card-header">
                  <h4>
                    <i className="fa fa-user me-2"></i>
                    Datele Participantului
                  </h4>
                </div>
                <div className="card-body">
                  {!currentUser && (
                    <div className="alert alert-info mb-4">
                      <i className="fa fa-info-circle me-2"></i>
                      <strong>Înregistrare fără cont:</strong> Nu este nevoie să ai un cont pentru a participa. 
                      Completează datele de mai jos și vei primi toate informațiile pe email.
                    </div>
                  )}
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            Nume <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="nume"
                            value={formData.nume}
                            onChange={handleInputChange}
                            placeholder="Numele de familie"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            Prenume <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="prenume"
                            value={formData.prenume}
                            onChange={handleInputChange}
                            placeholder="Prenumele"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            Email <span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="adresa@email.com"
                            required
                          />
                          <small className="text-muted">
                            Vei primi confirmarea și link-ul pe acest email
                          </small>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            Telefon <span className="text-danger">*</span>
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            name="telefon"
                            value={formData.telefon}
                            onChange={handleInputChange}
                            placeholder="+40 xxx xxx xxx"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group mb-4">
                      <label className="form-label">Observații (opțional)</label>
                      <textarea
                        className="form-control"
                        name="observatii"
                        value={formData.observatii}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Întrebări sau observații speciale..."
                      />
                    </div>

                    <div className="payment-section">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h5 className="mb-3">
                            <i className="fa fa-credit-card me-2"></i>
                            Sumar Comandă
                          </h5>
                          
                          <div className="row">
                            <div className="col-md-8">
                              <p className="mb-1"><strong>{conferinta.titlu}</strong></p>
                              <p className="text-muted mb-0">{displayInfo.type} • {displayInfo.dataRange}</p>
                            </div>
                            <div className="col-md-4 text-end">
                              <h4 className="text-primary mb-0">{conferinta.pretParticipare} RON</h4>
                            </div>
                          </div>
                          
                          <hr />
                          
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span><strong>Total de plată:</strong></span>
                            <span className="h4 text-primary">{conferinta.pretParticipare} RON</span>
                          </div>

                          {/* Test Mode Checkbox */}
                          <div className="form-check mb-3 p-3 bg-warning bg-opacity-10 border border-warning rounded">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="testMode"
                              checked={testMode}
                              onChange={(e) => setTestMode(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="testMode">
                              <i className="fa fa-flask text-warning me-2"></i>
                              <strong>Mod Test - Simulează plata fără Stripe</strong>
                            </label>
                            <div className="mt-1">
                              <small className="text-muted">
                                ⚠️ Folosește doar pentru testare. Completează întreg fluxul fără plată reală.
                              </small>
                            </div>
                          </div>

                          {testMode ? (
                            <button
                              type="button"
                              className="btn btn-warning btn-lg w-100"
                              onClick={simulateSuccessfulPayment}
                              disabled={processing}
                            >
                              {processing ? (
                                <>
                                  <i className="fa fa-spinner fa-spin me-2"></i>
                                  Simulez plata...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-flask me-2"></i>
                                  🧪 Simulează Plata (TEST MODE)
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-lg w-100"
                              onClick={createStripeCheckoutSession}
                              disabled={processing}
                            >
                              {processing ? (
                                <>
                                  <i className="fa fa-spinner fa-spin me-2"></i>
                                  Procesare...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-lock me-2"></i>
                                  Plătește Securizat cu Stripe
                                </>
                              )}
                            </button>
                          )}

                          <div className="text-center mt-3">
                            {testMode ? (
                              <small className="text-warning">
                                <i className="fa fa-exclamation-triangle me-1"></i>
                                Mod Test Activ - Nu se va efectua plata reală
                              </small>
                            ) : (
                              <small className="text-muted">
                                <i className="fa fa-shield-alt me-1"></i>
                                Plata este procesată securizat prin Stripe. 
                                Nu salvăm datele cardului.
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutConferintaGrup; 