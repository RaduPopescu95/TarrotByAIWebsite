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
import {
  buildInvoiceDecision,
  logBillingAudit,
  normalizeBillingContext,
} from "../../../utils/billingAudit.mjs";

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
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  const maintenanceEnabled =
    String(process.env.NEXT_PUBLIC_PAYMENTS_MAINTENANCE_ENABLED || "").toLowerCase() ===
    "true";
  const maintenanceKey = router.query?.maintenance_key;
  const hasBypassKey = !!maintenanceKey;

  // Show maintenance banner immediately (not only after clicking "pay")
  useEffect(() => {
    if (!router.isReady) return;
    if (maintenanceEnabled && !hasBypassKey) {
      setMaintenanceMessage(
        "Această secțiune este în proces de mentenanță. Vă rugăm să încercați mai târziu."
      );
      return;
    }
    setMaintenanceMessage("");
  }, [router.isReady, maintenanceEnabled, hasBypassKey]);

  // Form data pentru participare
  const [formData, setFormData] = useState({
    nume: "",
    prenume: "",
    email: "",
    telefon: "",
    observatii: "",
    password: "",
    // Date facturare (Oblio)
    billingType: "individual", // "individual" | "corporate"
    billingAddress: "",
    billingCity: "",
    billingCounty: "",
    billingCountry: "Romania",
    personalCnp: "",
    companyName: "",
    companyVAT: "",
    companyReg: "",
    companyAddress: ""
  });

  // Test mode pentru simulare fără Stripe
  const [testMode, setTestMode] = useState(false);
  
  // State pentru acceptarea termenilor și condițiilor
  const [termsAccepted, setTermsAccepted] = useState(false);

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

    // Verifică parola dacă conferința are cod de acces
    if (conferinta.hasPassword) {
      if (!formData.password.trim()) {
        showAlert("danger", "Codul de acces este obligatoriu");
        return false;
      }
      if (formData.password.trim() !== conferinta.password) {
        showAlert("danger", "Codul de acces este incorect");
        return false;
      }
    }

    // Verifică acceptarea termenilor și condițiilor
    if (!termsAccepted) {
      showAlert("danger", "Trebuie să acceptați termenii și condițiile pentru a continua");
      return false;
    }

    // Date minime pentru factură (Oblio)
    if (!formData.billingCity?.trim()) {
      showAlert("danger", "Orașul (pentru factură) este obligatoriu");
      return false;
    }
    if (!formData.billingCounty?.trim()) {
      showAlert("danger", "Județul (pentru factură) este obligatoriu");
      return false;
    }
    if (!formData.billingCountry?.trim()) {
      showAlert("danger", "Țara (pentru factură) este obligatorie");
      return false;
    }
    if (formData.billingType !== "corporate" && !formData.billingAddress?.trim()) {
      showAlert("danger", "Adresa (pentru factură) este obligatorie");
      return false;
    }
    if (formData.billingType === "corporate") {
      if (!formData.companyName?.trim()) {
        showAlert("danger", "Denumirea firmei este obligatorie pentru facturare pe firmă");
        return false;
      }
      if (!formData.companyVAT?.trim()) {
        showAlert("danger", "CUI/CIF este obligatoriu pentru facturare pe firmă");
        return false;
      }
      if (!formData.companyAddress?.trim()) {
        showAlert("danger", "Adresa firmei este obligatorie pentru facturare pe firmă");
        return false;
      }
    } else if (!formData.personalCnp?.trim()) {
      showAlert("danger", "CNP-ul este obligatoriu pentru facturare pe persoană fizică");
      return false;
    }

    const rawFormValues = {
      billingType: formData.billingType,
      firstName: formData.prenume,
      lastName: formData.nume,
      name: `${formData.prenume} ${formData.nume}`.trim(),
      cnp: formData.billingType === "corporate" ? "" : formData.personalCnp,
      companyName: formData.companyName,
      cif: formData.companyVAT,
      reg: formData.companyReg,
      address: formData.billingType === "corporate" ? formData.companyAddress : formData.billingAddress,
      state: formData.billingCounty,
      city: formData.billingCity,
      country: formData.billingCountry,
      contact: `${formData.prenume} ${formData.nume}`.trim(),
      email: formData.email,
      phone: formData.telefon,
    };
    const billingAudit = normalizeBillingContext(rawFormValues, { defaultCountry: "Romania" });
    const invoiceDecision = buildInvoiceDecision(billingAudit);
    logBillingAudit({
      flow: "conference",
      stage: "ui_validate",
      raw: rawFormValues,
      normalized: billingAudit.normalizedClient,
      decision: invoiceDecision,
    });
    if (!billingAudit.validation.ok) {
      showAlert("danger", billingAudit.validation.blockingErrors[0]?.message || "Datele de facturare sunt invalide");
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

      // UI maintenance block (server also blocks in the API)
      if (maintenanceEnabled && !hasBypassKey) {
        setMaintenanceMessage(
          "Această secțiune este în proces de mentenanță. Vă rugăm să încercați mai târziu."
        );
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
      const rawFormValues = {
        billingType: formData.billingType,
        firstName: formData.prenume,
        lastName: formData.nume,
        name: `${formData.prenume} ${formData.nume}`.trim(),
        cnp: formData.billingType === "corporate" ? "" : formData.personalCnp,
        companyName: formData.companyName,
        cif: formData.companyVAT,
        reg: formData.companyReg,
        address: formData.billingType === "corporate" ? formData.companyAddress : formData.billingAddress,
        state: formData.billingCounty,
        city: formData.billingCity,
        country: formData.billingCountry,
        contact: `${formData.prenume} ${formData.nume}`.trim(),
        email: formData.email,
        phone: formData.telefon,
      };
      const billingAudit = normalizeBillingContext(rawFormValues, { defaultCountry: "Romania" });
      const invoiceDecision = buildInvoiceDecision(billingAudit);
      logBillingAudit({
        flow: "conference",
        stage: "ui_submit",
        raw: rawFormValues,
        normalized: billingAudit.normalizedClient,
        decision: invoiceDecision,
      });

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
        isGuestUser: !currentUser,
        rawFormValues,
        normalizedBeforeCheckout: billingAudit.normalizedClient,
        // Oblio buyer data (top-level so API can put into Stripe metadata)
        buyerType: formData.billingType === "corporate" ? "company" : "person",
        buyerCompanyName: formData.billingType === "corporate" ? formData.companyName : undefined,
        buyerCif: formData.billingType === "corporate" ? formData.companyVAT : undefined,
        buyerRegCom: formData.billingType === "corporate" ? formData.companyReg : undefined,
        buyerCnp: formData.billingType === "corporate" ? undefined : formData.personalCnp,
        buyerStreet: formData.billingType === "corporate" ? formData.companyAddress : formData.billingAddress,
        buyerCity: formData.billingCity,
        buyerCounty: formData.billingCounty,
        buyerCountry: formData.billingCountry,
        buyerEmail: formData.email,
        buyerPhone: formData.telefon,
        buyerContactName: `${formData.prenume} ${formData.nume}`,
        // Invoice options
        vatRate: 19,
        measureUnit: "bucată",
        sendInvoiceEmail: true,
        eInvoice: invoiceDecision.sendEInvoice
      };

      // Call API pentru a crea Stripe session
      const apiUrl = hasBypassKey
        ? `/api/create-checkout-session-conferinta?maintenance_key=${encodeURIComponent(
            String(maintenanceKey)
          )}`
        : "/api/create-checkout-session-conferinta";

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      const json = await response.json().catch(() => ({}));
      const { sessionId, error } = json;

      if (response.status === 503 && json?.error === "maintenance") {
        setMaintenanceMessage(
          json?.message ||
            "Această secțiune este în proces de mentenanță. Vă rugăm să încercați mai târziu."
        );
        setProcessing(false);
        return;
      }

      if (response.status === 400) {
        showAlert(
          "danger",
          json?.details?.[0]?.message || json?.error || "Datele de facturare sunt invalide."
        );
        setProcessing(false);
        return;
      }

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
          {maintenanceMessage && (
            <div className="alert alert-warning">
              {maintenanceMessage}
            </div>
          )}
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
                    <div 
                      className="text-muted"
                      style={{ lineHeight: '1.6' }}
                      dangerouslySetInnerHTML={{ 
                        __html: conferinta.descriere?.includes('<') ? conferinta.descriere : `<p>${conferinta.descriere || ''}</p>`
                      }}
                    />
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

                    {/* Câmp pentru codul de acces (parola) - doar dacă conferința are parolă */}
                    {conferinta.hasPassword && (
                      <div className="form-group mb-4">
                        <div className="card border-warning">
                          <div className="card-header bg-warning bg-opacity-10">
                            <h6 className="mb-0">
                              <i className="fa fa-lock me-2 text-warning"></i>
                              Cod de Acces Necesar
                            </h6>
                          </div>
                          <div className="card-body">
                            <label className="form-label">
                              Introdu codul de acces pentru această conferință <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Codul de acces primit"
                              required
                            />
                            <small className="text-muted">
                              Această conferință necesită un cod de acces special. Dacă nu ai codul, contactează organizatorul.
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

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

                    {/* Date facturare (Oblio) */}
                    <div className="form-group mb-4">
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">
                            <i className="fa fa-file-invoice me-2"></i>
                            Date pentru factură
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-12">
                              <div className="form-group mb-3">
                                <label className="form-label">Tip facturare</label>
                                <select
                                  className="form-control"
                                  name="billingType"
                                  value={formData.billingType}
                                  onChange={handleInputChange}
                                >
                                  <option value="individual">Persoană fizică</option>
                                  <option value="corporate">Firmă</option>
                                </select>
                              </div>
                            </div>

                            {formData.billingType === "corporate" && (
                              <>
                                <div className="col-md-6">
                                  <div className="form-group mb-3">
                                    <label className="form-label">Denumire firmă *</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      name="companyName"
                                      value={formData.companyName}
                                      onChange={handleInputChange}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-group mb-3">
                                    <label className="form-label">CUI / CIF *</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      name="companyVAT"
                                      value={formData.companyVAT}
                                      onChange={handleInputChange}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-group mb-3">
                                    <label className="form-label">Nr. Reg. Com. (opțional)</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      name="companyReg"
                                      value={formData.companyReg}
                                      onChange={handleInputChange}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-group mb-3">
                                    <label className="form-label">Adresă firmă *</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      name="companyAddress"
                                      value={formData.companyAddress}
                                      onChange={handleInputChange}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            {formData.billingType !== "corporate" && (
                              <>
                                <div className="col-md-6">
                                  <div className="form-group mb-3">
                                    <label className="form-label">CNP *</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      name="personalCnp"
                                      value={formData.personalCnp}
                                      onChange={handleInputChange}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-group mb-3">
                                    <label className="form-label">Adresă *</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      name="billingAddress"
                                      value={formData.billingAddress}
                                      onChange={handleInputChange}
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="col-md-4">
                              <div className="form-group mb-3">
                                <label className="form-label">Oraș *</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="billingCity"
                                  value={formData.billingCity}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="form-group mb-3">
                                <label className="form-label">Județ *</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="billingCounty"
                                  value={formData.billingCounty}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="form-group mb-3">
                                <label className="form-label">Țară</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="billingCountry"
                                  value={formData.billingCountry}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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

                          {/* ⚠️ DISCLAIMER IMPORTANT ÎNAINTE DE PLATĂ */}
                          <div className="alert alert-danger border-danger mb-4" style={{
                            backgroundColor: '#ffebee',
                            border: '2px solid #f44336',
                            borderRadius: '8px',
                            padding: '20px'
                          }}>
                            <div className="text-center">
                              <h4 className="text-danger fw-bold mb-3" style={{ fontSize: '1.4rem' }}>
                                ATENȚIE - CONDIȚII IMPORTANTE
                              </h4>
                              <div className="text-danger" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                                <p className="fw-bold mb-2">
                                  Intrarea la {conferinta.tipConferinta === 'course' ? 'curs' : 'conferință'} se face la ora exact stabilită în programare. (ORA ROMÂNIEI)
                                </p>
                                <p className="fw-bold mb-0">
                                  Nu se acordă rambursări în cazul în care clientul nu se prezintă la programarea stabilită.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Acceptarea termenilor și condițiilor */}
                          <div className="terms-accept mb-4">
                            <div className="custom-checkbox">
                              <input
                                type="checkbox"
                                id="terms_accept"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                style={{ 
                                  marginRight: '8px',
                                  cursor: 'pointer',
                                  transform: 'scale(1.2)'
                                }}
                              />
                              <label 
                                htmlFor="terms_accept" 
                                className="text-dark fw-medium"
                                style={{ 
                                  cursor: 'pointer',
                                  lineHeight: '1.5',
                                  fontSize: '1rem'
                                }}
                              >
                                Am citit și accept{" "}
                                <Link 
                                  href="/politica-platforma" 
                                  className="text-primary text-decoration-underline fw-bold"
                                  target="_blank"
                                >
                                  Termenii &amp; Condițiile
                                </Link>{" "}
                                platformei ȘI condițiile importante de mai sus
                              </label>
                            </div>
                            {!termsAccepted && (
                              <div className="alert alert-warning mt-2 py-2 px-3" style={{ fontSize: '0.9rem' }}>
                                <i className="fa fa-exclamation-triangle me-2"></i>
                                <strong>Atenție:</strong> Bifarea acestui câmp este obligatorie pentru a continua cu plata
                              </div>
                            )}
                          </div>

                        
                          {testMode ? (
                            <button
                              type="button"
                              className="btn btn-warning btn-lg w-100"
                              onClick={simulateSuccessfulPayment}
                              disabled={processing || !termsAccepted}
                            >
                              {processing ? (
                                <>
                                  <i className="fa fa-spinner fa-spin me-2"></i>
                                  Simulez plata...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-flask me-2"></i>
                                  Simulează Plata (TEST MODE)
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={`btn ${!termsAccepted ? 'btn-secondary' : 'btn-primary'} btn-lg w-100`}
                              onClick={createStripeCheckoutSession}
                              disabled={
                                processing ||
                                !termsAccepted ||
                                (maintenanceEnabled && !hasBypassKey)
                              }
                              title={
                                maintenanceEnabled && !hasBypassKey
                                  ? "Plățile sunt momentan în mentenanță"
                                  : !termsAccepted
                                    ? "Trebuie să acceptați termenii și condițiile pentru a continua"
                                    : ""
                              }
                            >
                              {processing ? (
                                <>
                                  <i className="fa fa-spinner fa-spin me-2"></i>
                                  Procesare...
                                </>
                              ) : !termsAccepted ? (
                                <>
                                  <i className="fa fa-exclamation-triangle me-2"></i>
                                  Acceptați termenii pentru a continua
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
                            {!termsAccepted ? (
                              <small className="text-danger">
                                <i className="fa fa-exclamation-circle me-1"></i>
                                Pentru a continua, bifați căsuța de acceptare a termenilor și condițiilor
                              </small>
                            ) : testMode ? (
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
