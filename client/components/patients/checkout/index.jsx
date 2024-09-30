"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import Footer from "../../footer";
import StickyBox from "react-sticky-box";
import Home1Header from "../../home/home-1/header";
import { useAuth } from "../../../../context/AuthContext";
import { handleGetFirestore, handleUploadFirestoreGeneral } from "../../../../utils/firestoreUtils";
import { useRouter } from "next/router";
import AlertMessage from "../../AlertMessage";
import { loadStripe } from "@stripe/stripe-js";
import moment from "moment";

const Checkout = (props) => {
  const config = "/react/template";
  const { currentUser, userData, selectedSlot } = useAuth();
  
  // State pentru fiecare input
  const [categorii, setCategorii] = useState([]);
  const [categorie, setCategorie] = useState({});
  const [tipConsultatie, setTipConsultatie] = useState("");
  const [costConsultatie, setCostConsultatie] = useState("100");
  const [nume, setNume] = useState(currentUser?.displayName || "");
  const [alteInformatii, setAlteInformatii] = useState("");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [telefon, setTelefon] = useState(currentUser?.phoneNumber || "");
  const [isLoading, setIsLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false); // Nou state pentru acceptarea termenilor
  const [errors, setErrors] = useState({}); // State pentru erori
  const router = useRouter();
  const [alert, setAlert] = useState({ type: "", message: "" });

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST);

  // Funcția pentru obținerea categoriilor din Firestore
  const handleGetCategories = async () => {
    const data = await handleGetFirestore("CategoriiConsultatii");
    return data[0];
  };

  // Efect pentru a obține categoriile la inițializarea componentelor
  useEffect(() => {
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

  // Funcția pentru încărcarea datelor de rezervare în Firestore
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
      // setAlert({ type: "success", message: "Rezervarea a fost trimisă cu succes!" });
      // setTimeout(() => {
      //   router.push("rezervare-finalizata");
      // }, 3000); // Redirecționează după 3 secunde
    } catch (error) {
      console.error("A apărut o eroare la încărcarea rezervării:", error);
      setAlert({ type: "danger", message: "A apărut o problemă la trimiterea formularului. Te rugăm să încerci din nou." });
    }
  };

  // Funcția de submit care combină logica de plată cu Stripe și încărcarea datelor
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne reîncărcarea paginii

    const newErrors = {};
    if (!nume) newErrors.nume = true;
    if (!email) newErrors.email = true;
    if (!telefon) newErrors.telefon = true;
    if (!categorie?.about) newErrors.categorie = true;
    if (!tipConsultatie) newErrors.tipConsultatie = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Previne submitul dacă sunt erori
    }

    setIsLoading(true);

    // Integrarea Stripe
    const stripe = await stripePromise;

    const pret = parseInt(categorie.price) * 100; // Stripe așteaptă prețul în bani, deci 100 RON => 10000 bani

    try {

let currentYear = moment().format('YYYY');
selectedSlot.currentYear =  currentYear
    const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          costConsultatie: pret, // Suma va fi determinată din prețul categoriei
          nume,
          email,
          alteInformatii,
          telefon,
          categorie,
          tipConsultatie,
          selectedSlot,
        }),
      });

      const { id } = await response.json();

      // Redirecționează utilizatorul către pagina Stripe pentru plată
      const { error } = await stripe.redirectToCheckout({ sessionId: id });
      if (error) {
        console.error(error.message);
        setIsLoading(false);
      } else {
        // După plata realizată cu succes, se continuă cu încărcarea în Firestore
        // await handleUploadRezervare();
      }
    } catch (error) {
      console.error("Eroare la inițializarea plății:", error);
      setIsLoading(false);
      setAlert({ type: "danger", message: "A apărut o problemă la inițializarea plății. Te rugăm să încerci din nou." });
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
                <Link href="/home-1">Rezervare</Link>
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
              {/* Checkout Form */}
              <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="info-widget">
                  <h4 className="card-title">Informatii rezervare</h4>
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <div className={`form-group card-label ${errors.nume ? 'border-danger' : ''}`}>
                        <label>Nume/ Prenume</label>
                        <input
                          className={`form-control ${errors.nume ? 'border-danger' : ''}`}
                          type="text"
                          value={nume}
                          onChange={(e) => { setNume(e.target.value); setErrors(prev => ({ ...prev, nume: false })); }}
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
                          onChange={(e) => setAlteInformatii(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                      <div className={`form-group card-label ${errors.email ? 'border-danger' : ''}`}>
                        <label>Email</label>
                        <input
                          className={`form-control ${errors.email ? 'border-danger' : ''}`}
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: false })); }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                      <div className={`form-group card-label ${errors.telefon ? 'border-danger' : ''}`}>
                        <label>Telefon</label>
                        <input
                          className={`form-control ${errors.telefon ? 'border-danger' : ''}`}
                          type="text"
                          value={telefon}
                          onChange={(e) => { setTelefon(e.target.value); setErrors(prev => ({ ...prev, telefon: false })); }}
                        />
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className={`form-group card-label ${errors.categorie ? 'border-danger' : ''}`}>
                        <label>Categorie</label>
                        <select 
                          className={`form-control ${errors.categorie ? 'border-danger' : ''}`}
                          onChange={(e) => { setCategorie(categorii[e.target.value]); setErrors(prev => ({ ...prev, categorie: false })); }}
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
                      <div className={`form-group card-label ${errors.tipConsultatie ? 'border-danger' : ''}`}>
                        <label>Tip consultatie</label>
                        <select
                          className={`form-control ${errors.tipConsultatie ? 'border-danger' : ''}`}
                          onChange={(e) => { setTipConsultatie(e.target.value); setErrors(prev => ({ ...prev, tipConsultatie: false })); }}
                        >
                          <option value="">
                            Selectati tipul consultatiei
                          </option>
                          <option value="general">Audio</option>
                          <option value="specialist">Video</option>
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
                        <Link href="#">
                          Termenii &amp; si Conditiile
                        </Link>{" "}
                        platformei
                      </label>
                    </div>
                  </div>
                  <div className="submit-section mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary submit-btn"
                      disabled={!termsAccepted} // Disable dacă checkbox-ul nu e bifat
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
                        Data <span> {selectedSlot.day}</span>
                      </li>
                      <li className="col-lg-12">
                        Ora <span> {selectedSlot.slot}</span>
                      </li>
                    </ul>

                    <div className="booking-total">
                      <ul className="booking-total-list">
                        <li>
                          <span>Taxa consultatie</span>
                          <span className="total-cost">{categorie.price ? `${categorie.price} RON` : "Alege categorie consultatie"} </span>
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
  {alert.message && <AlertMessage type={alert.type} message={alert.message} />}

</div>

  );
};

export default Checkout;
