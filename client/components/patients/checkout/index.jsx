"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import Footer from "../../footer";
import StickyBox from "react-sticky-box";
import Home1Header from "../../home/home-1/header";
import { useAuth } from "../../../../context/AuthContext";
import {
  handleGetFirestore,
  handleUploadFirestoreGeneral,
} from "../../../../utils/firestoreUtils";
import { useRouter } from "next/router";
import AlertMessage from "../../AlertMessage";
import { loadStripe } from "@stripe/stripe-js";
import moment from "moment";
import {
  formatSelectedSlot,
  validatePhoneNumber,
} from "../../../../utils/commonUtils";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  getExampleNumber,
} from "libphonenumber-js";

const Checkout = (props) => {
  const config = "/react/template";
  const { currentUser, userData, selectedSlot } = useAuth();

  const [categorii, setCategorii] = useState([]);
  const [categorie, setCategorie] = useState({});
  const [tipConsultatie, setTipConsultatie] = useState("");
  const [costConsultatie, setCostConsultatie] = useState("100");
  const [adresa, setAdresa] = useState("");
  // Date facturare (Oblio)
  const [billingType, setBillingType] = useState("individual"); // "individual" | "corporate"
  const [billingCity, setBillingCity] = useState("");
  const [billingCounty, setBillingCounty] = useState("");
  const [billingCountry, setBillingCountry] = useState("Romania");
  const [companyName, setCompanyName] = useState("");
  const [companyVAT, setCompanyVAT] = useState("");
  const [companyReg, setCompanyReg] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [language, setLanguage] = useState("ro"); // Poate fi "ro" pentru română sau "en" pentru engleză

  const [nume, setNume] = useState(
    (userData?.first_name?.length > 0 ? `${userData.first_name}` : "") +
      (userData?.last_name?.length > 0 ? ` ${userData.last_name}` : "")
  );

  const [alteInformatii, setAlteInformatii] = useState("");
  const [email, setEmail] = useState(userData?.email || "");
  const [telefon, setTelefon] = useState(userData?.phoneNumber || "");
  const [isLoading, setIsLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const { activeYear } = router.query; // Extrage activeYear din query
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
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

  const handleGetCategories = async () => {
    const data = await handleGetFirestore("CategoriiConsultatii");
    return data[0];
  };

  useEffect(() => {
    if (!selectedSlot.slot) {
      router.push("/calendar");
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await handleGetCategories();
        if (data?.categorii) {
          setCategorii([...data.categorii]);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching categorii:", error);
      }
    };
    fetchData();
  }, []);

  const handleUploadRezervare = async () => {
    const data = {
      nume,
      alteInformatii,
      email,
      telefon,
      categorie,
      tipConsultatie,
      selectedSlot,
      costConsultatie,
    };
    try {
      // await handleUploadFirestoreGeneral(data, "RezervariConsultatii");
    } catch (error) {
      console.error("A apărut o eroare la încărcarea rezervării:", error);
      setAlert({
        type: "danger",
        message:
          "A apărut o problemă la trimiterea formularului. Te rugăm să încerci din nou.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("phone number....", telefon);

    const newErrors = {};
    if (!nume) newErrors.nume = true;
    if (!email) newErrors.email = true;
    if (!telefon) newErrors.telefon = true;
    if (!categorie?.about) newErrors.categorie = true;
    if (!tipConsultatie) newErrors.tipConsultatie = true;
    if (!adresa) newErrors.adresa = true;
    if (!billingCity) newErrors.billingCity = true;
    if (!billingCounty) newErrors.billingCounty = true;
    if (billingType === "corporate") {
      if (!companyName) newErrors.companyName = true;
      if (!companyVAT) newErrors.companyVAT = true;
      if (!companyAddress) newErrors.companyAddress = true;
    }

    // Validare număr de telefon cu sugestii de format
    let prefixSugerat = "";
    let lungimeNecesară = 0;
    if (telefon) {
      const parsedPhone = parsePhoneNumberFromString(telefon);
      if (parsedPhone) {
        prefixSugerat = parsedPhone.countryCallingCode;

        // Obține un exemplu de număr pentru a calcula lungimea corectă
        const exampleNumber = getExampleNumber(parsedPhone.country);
        if (exampleNumber) {
          lungimeNecesară = exampleNumber.nationalNumber.length;
        }
      }
    }

    if (!telefon || !isValidPhoneNumber(telefon)) {
      newErrors.telefon = true;
      const phoneErrorMessage = `Numărul de telefon nu este valid.`;

      setAlert({
        type: "danger",
        message: phoneErrorMessage,
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // UI maintenance block (prevents calling API; server also blocks)
    if (maintenanceEnabled && !hasBypassKey) {
      setMaintenanceMessage(
        "Această secțiune este în proces de mentenanță. Vă rugăm să încercați mai târziu."
      );
      return;
    }

    // Continuă cu trimiterea formularului dacă nu există erori
    setIsLoading(true);
    const stripe = await stripePromise;
    const pret = parseInt(categorie.price) * 100;

    try {
      let owner_uid;
      if (userData?.owner_uid) {
        owner_uid = userData?.owner_uid;
      }

      selectedSlot.currentYear = activeYear;
      console.log("body....sent...", {
        costConsultatie: pret,
        nume,
        email,
        alteInformatii,
        telefon, // Trimitere telefon formatat corect
        categorie,
        tipConsultatie,
        selectedSlot,
        owner_uid,
        adresaClient: adresa,
      });
      const apiUrl = hasBypassKey
        ? `/api/create-checkout-session?maintenance_key=${encodeURIComponent(
            String(maintenanceKey)
          )}`
        : "/api/create-checkout-session";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          costConsultatie: pret,
          nume,
          email,
          alteInformatii,
          telefon, // Trimitere telefon formatat corect
          categorie,
          tipConsultatie,
          selectedSlot,
          owner_uid,
          adresaClient: adresa,
          // Oblio buyer data
          buyerType: billingType === "corporate" ? "company" : "person",
          buyerCompanyName: billingType === "corporate" ? companyName : undefined,
          buyerCif: billingType === "corporate" ? companyVAT : undefined,
          buyerRegCom: billingType === "corporate" ? companyReg : undefined,
          buyerStreet: billingType === "corporate" ? companyAddress : adresa,
          buyerCity: billingCity,
          buyerCounty: billingCounty,
          buyerCountry: billingCountry,
          buyerEmail: email,
          buyerPhone: telefon,
          buyerContactName: nume,
          // Invoice options
          vatRate: 19,
          measureUnit: "bucată",
          sendInvoiceEmail: true,
          eInvoice: true,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 503 && errJson?.error === "maintenance") {
          setMaintenanceMessage(
            errJson?.message ||
              "Această secțiune este în proces de mentenanță. Vă rugăm să încercați mai târziu."
          );
          setIsLoading(false);
          return;
        }
      }

      const { id } = await response.json();
      const { error } = await stripe.redirectToCheckout({ sessionId: id });

      if (error) {
        console.error(error.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Eroare la inițializarea plății:", error);
      setIsLoading(false);
      setAlert({
        type: "danger",
        message:
          "A apărut o problemă la inițializarea plății. Te rugăm să încerci din nou.",
      });
    }
  };

  return (
    <div>
      <Home1Header />

      {/* <!-- Breadcrumb --> */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Rezervare si plata</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/calendar">Rezervare</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Rezervare si plata
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* <!-- /Breadcrumb -->     */}

      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-md-7 col-lg-8">
              <div className="card">
                <div className="card-body">
                  {maintenanceMessage && (
                    <div className="alert alert-warning">
                      {maintenanceMessage}
                    </div>
                  )}
                  {/* Checkout Form */}
                  <form onSubmit={handleSubmit}>
                    {/* Personal Information */}
                    <div className="info-widget">
                      <h4 className="card-title">Informatii rezervare</h4>
                      <div className="row">
                        <div className="col-md-6 col-sm-12">
                          <div
                            className={`form-group card-label ${
                              errors.nume ? "border-danger" : ""
                            }`}
                          >
                            <label>Nume/ Prenume</label>
                            <input
                              className={`form-control ${
                                errors.nume ? "border-danger" : ""
                              }`}
                              type="text"
                              value={nume}
                              onChange={(e) => {
                                setNume(e.target.value);
                                setErrors((prev) => ({ ...prev, nume: false }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="form-group card-label">
                            <label>Alte informatii</label>
                            <input
                              className="form-control"
                              type="text"
                              value={alteInformatii}
                              onChange={(e) =>
                                setAlteInformatii(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div
                            className={`form-group card-label ${
                              errors.email ? "border-danger" : ""
                            }`}
                          >
                            <label>Email</label>
                            <input
                              className={`form-control ${
                                errors.email ? "border-danger" : ""
                              }`}
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setErrors((prev) => ({
                                  ...prev,
                                  email: false,
                                }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div
                            className={`form-group card-label ${
                              errors.telefon ? "border-danger" : ""
                            }`}
                          >
                            <label>Telefon</label>
                            {/* <input
                              className={`form-control ${
                                errors.telefon ? "border-danger" : ""
                              }`}
                              type="text"
                              value={telefon}
                              onChange={(e) => {
                                setTelefon(e.target.value);
                                setErrors((prev) => ({
                                  ...prev,
                                  telefon: false,
                                }));
                              }}
                            /> */}
                            <PhoneInput
                              international
                              defaultCountry="RO" // Setează România ca țară implicită, dacă este necesar
                              value={telefon}
                              onChange={(value) => {
                                setTelefon(value); // Setează telefonul în format E.164

                                if (value && isValidPhoneNumber(value)) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    telefon: false,
                                  }));
                                } else {
                                  setErrors((prev) => ({
                                    ...prev,
                                    telefon: true,
                                  }));
                                }
                              }}
                              className={`form-control ${errors.telefon ? "border-danger" : ""}`}
                            />
                          </div>
                        </div>
                        <div className="col-md-12 col-sm-12">
                          <div
                            className={`form-group card-label ${errors.adresa ? "border-danger" : ""}`}
                          >
                            <label>Adresa</label>
                            <input
                              className={`form-control ${errors.adresa ? "border-danger" : ""}`}
                              type="text"
                              value={adresa}
                              onChange={(e) => {
                                setAdresa(e.target.value);
                                setErrors((prev) => ({
                                  ...prev,
                                  adresa: false,
                                }));
                              }}
                            />
                          </div>
                        </div>

                        {/* Date facturare pentru Oblio */}
                        <div className="col-md-12 col-sm-12">
                          <div className="form-group card-label">
                            <label>Facturare</label>
                            <select
                              className="form-control"
                              value={billingType}
                              onChange={(e) => setBillingType(e.target.value)}
                            >
                              <option value="individual">Persoană fizică</option>
                              <option value="corporate">Firmă</option>
                            </select>
                          </div>
                        </div>

                        {billingType === "corporate" && (
                          <>
                            <div className="col-md-6 col-sm-12">
                              <div className={`form-group card-label ${errors.companyName ? "border-danger" : ""}`}>
                                <label>Denumire firmă</label>
                                <input
                                  className={`form-control ${errors.companyName ? "border-danger" : ""}`}
                                  type="text"
                                  value={companyName}
                                  onChange={(e) => {
                                    setCompanyName(e.target.value);
                                    setErrors((prev) => ({ ...prev, companyName: false }));
                                  }}
                                />
                              </div>
                            </div>
                            <div className="col-md-6 col-sm-12">
                              <div className={`form-group card-label ${errors.companyVAT ? "border-danger" : ""}`}>
                                <label>CUI / CIF</label>
                                <input
                                  className={`form-control ${errors.companyVAT ? "border-danger" : ""}`}
                                  type="text"
                                  value={companyVAT}
                                  onChange={(e) => {
                                    setCompanyVAT(e.target.value);
                                    setErrors((prev) => ({ ...prev, companyVAT: false }));
                                  }}
                                />
                              </div>
                            </div>
                            <div className="col-md-6 col-sm-12">
                              <div className="form-group card-label">
                                <label>Nr. Reg. Com. (opțional)</label>
                                <input
                                  className="form-control"
                                  type="text"
                                  value={companyReg}
                                  onChange={(e) => setCompanyReg(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-md-6 col-sm-12">
                              <div className={`form-group card-label ${errors.companyAddress ? "border-danger" : ""}`}>
                                <label>Adresă firmă</label>
                                <input
                                  className={`form-control ${errors.companyAddress ? "border-danger" : ""}`}
                                  type="text"
                                  value={companyAddress}
                                  onChange={(e) => {
                                    setCompanyAddress(e.target.value);
                                    setErrors((prev) => ({ ...prev, companyAddress: false }));
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="col-md-4 col-sm-12">
                          <div className={`form-group card-label ${errors.billingCity ? "border-danger" : ""}`}>
                            <label>Oraș</label>
                            <input
                              className={`form-control ${errors.billingCity ? "border-danger" : ""}`}
                              type="text"
                              value={billingCity}
                              onChange={(e) => {
                                setBillingCity(e.target.value);
                                setErrors((prev) => ({ ...prev, billingCity: false }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-md-4 col-sm-12">
                          <div className={`form-group card-label ${errors.billingCounty ? "border-danger" : ""}`}>
                            <label>Județ</label>
                            <input
                              className={`form-control ${errors.billingCounty ? "border-danger" : ""}`}
                              type="text"
                              value={billingCounty}
                              onChange={(e) => {
                                setBillingCounty(e.target.value);
                                setErrors((prev) => ({ ...prev, billingCounty: false }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-md-4 col-sm-12">
                          <div className="form-group card-label">
                            <label>Țară</label>
                            <input
                              className="form-control"
                              type="text"
                              value={billingCountry}
                              onChange={(e) => setBillingCountry(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-md-3 col-sm-6">
                          <div
                            className={`form-group card-label ${
                              errors.categorie ? "border-danger" : ""
                            }`}
                          >
                            <label>Categorie</label>
                            <select
                              className={`form-control ${
                                errors.categorie ? "border-danger" : ""
                              }`}
                              onChange={(e) => {
                                setCategorie(categorii[e.target.value]);
                                setErrors((prev) => ({
                                  ...prev,
                                  categorie: false,
                                }));
                              }}
                            >
                              <option value="">Selectati Categorie</option>
                              {categorii.map((cat, i) => (
                                <option value={i} key={i}>
                                  {cat.about}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="col-md-3 col-sm-6">
                          <div className="form-group card-label">
                            <label>Timp alocat</label>
                            <input
                              readOnly
                              className="form-control"
                              type="text"
                              value={categorie?.timp || ""}
                            />
                          </div>
                        </div>

                        <div className="col-md-6 col-sm-12">
                          <div
                            className={`form-group card-label ${
                              errors.tipConsultatie ? "border-danger" : ""
                            }`}
                          >
                            <label>Tip consultatie</label>
                            <select
                              className={`form-control ${
                                errors.tipConsultatie ? "border-danger" : ""
                              }`}
                              onChange={(e) => {
                                setTipConsultatie(e.target.value);
                                setErrors((prev) => ({
                                  ...prev,
                                  tipConsultatie: false,
                                }));
                              }}
                            >
                              <option value="">
                                Selectati tipul consultatiei
                              </option>
                      
                              <option value="Video">Video</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="exist-customer">
                        Aveti cont?{" "}
                        <Link href="/login-client?fromPayment=true">
                          Autentificare
                        </Link>
                      </div>
                    </div>

                    {/* /Personal Information */}
                    <div className="payment-widget">
                      {/* <h4 className="card-title">Payment Method</h4> */}
                      {/* <div className="payment-list">
                    <label className="payment-radio credit-card-option">
                      <input type="radio" name="radio" defaultChecked="" />
                      <span className="checkmark" />
                      Credit card
                    </label>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group card-label">
                          <label htmlFor="card_name">Name on Card</label>
                          <input
                            className="form-control"
                            id="card_name"
                            type="text"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group card-label">
                          <label htmlFor="card_number">Card Number</label>
                          <input
                            className="form-control"
                            id="card_number"
                            placeholder="1234  5678  9876  5432"
                            type="text"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group card-label">
                          <label htmlFor="expiry_month">Expiry Month</label>
                          <input
                            className="form-control"
                            id="expiry_month"
                            placeholder="MM"
                            type="text"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group card-label">
                          <label htmlFor="expiry_year">Expiry Year</label>
                          <input
                            className="form-control"
                            id="expiry_year"
                            placeholder="YY"
                            type="text"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group card-label">
                          <label htmlFor="cvv">CVV</label>
                          <input
                            className="form-control"
                            id="cvv"
                            type="text"
                          />
                        </div>
                      </div>
                    </div>
                  </div> */}
                      {/* <div className="payment-list">
                    <label className="payment-radio paypal-option">
                      <input type="radio" name="radio" />
                      <span className="checkmark" />
                      Paypal
                    </label>
                  </div> */}
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
                              Intrarea la consultație se face la ora exact stabilită în programare (ORA ROMÂNIEI). 
                            </p>
                            <p className="fw-bold mb-0">
                              Nu se acordă rambursări în cazul în care clientul nu se prezintă la programarea stabilită.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="terms-accept">
                        <div className="custom-checkbox">
                          <input
                            type="checkbox"
                            id="terms_accept"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)} // Actualizare stare pentru checkbox
                          />
                          &nbsp;
                          <label htmlFor="terms_accept">
                            Am citit si accept{" "}
                            <Link href="/politica-platforma">
                              Termenii &amp; si Conditiile
                            </Link>{" "}
                            platformei ȘI condiții importante de mai sus
                          </label>
                        </div>
                      </div>
                      <div className="submit-section mt-4">
                        <button
                          type="submit"
                          className="btn btn-primary submit-btn"
                          disabled={
                            !termsAccepted || (maintenanceEnabled && !hasBypassKey)
                          } // Disable dacă checkbox-ul nu e bifat sau e mentenanță
                        >
                          Finalizeaza rezervare
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-md-5 col-lg-4 theiaStickySidebar">
              <StickyBox offsetTop={20} offsetBottom={20}>
                {/* Booking Summary */}
                <div className="card booking-card">
                  <div className="card-header">
                    <h4 className="card-title">Informatii rezervare</h4>
                  </div>
                  <div className="card-body">
                    {/* Booking Doctor Info */}
                    <div className="booking-doc-info">
                      <Link
                        href="/patient/doctor-profile"
                        className="booking-doc-img"
                      >
                        <img
                          src={"/img/profilecristina.png"}
                          alt="Cristina Zurba"
                        />
                      </Link>
                      <div className="booking-info">
                        <h4>
                          <Link href="/patient/doctor-profile">
                            Cristina Zurba
                          </Link>
                        </h4>
                      </div>
                    </div>
                    {/* Booking Doctor Info */}
                    <div className="booking-summary">
                      <div className="booking-item-wrap">
                        <ul className="row booking-date">
                          <li className="col-lg-12">
                            Data{" "}
                            <span>
                              {" "}
                              {selectedSlot.day
                                ? formatSelectedSlot(
                                    selectedSlot.day,
                                    activeYear
                                  )
                                : ""}
                            </span>
                          </li>
                          <li className="col-lg-12">
                            Ora <span> {selectedSlot.slot}</span>
                          </li>
                        </ul>

                        <div className="booking-total">
                          <ul className="boosking-total-list">
                            <li>
                              <span>Taxa consultatie</span>
                              <span className="total-cost">
                                {categorie.price
                                  ? `${categorie.price} RON`
                                  : "Alege categorie consultatie"}{" "}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* /Booking Summary */}
              </StickyBox>
            </div>
          </div>
        </div>
      </div>

      <Footer {...props} />
      {alert.message && (
        <AlertMessage type={alert.type} message={alert.message} />
      )}
    </div>
  );
};

export default Checkout;
