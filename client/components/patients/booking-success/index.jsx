import React, { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../../footer";
import Home1Header from "../../home/home-1/header";
import { useAuth } from "../../../../context/AuthContext";
import { useRouter } from "next/router";
import { handleUploadFirestoreGeneral, handleGetFirestore } from "../../../../utils/firestoreUtils";
import { formatDateSlot } from "../../../../utils/timeUtils";
import { v4 as uuidv4 } from 'uuid'; // Importă uuid pentru generarea codurilor unice

const BookingSuccess = (props) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [dateRezervari, setDateRezervari] = useState({});
  const [loading, setLoading] = useState(true);

  // Verifică dacă session_id există deja în Firestore și returnează documentul dacă există
  const checkIfSessionExists = async (session_id) => {
    try {
      const querySnapshot = await handleGetFirestore("RezervariConsultatii"); // Obține toate documentele din colecția "RezervariConsultatii"
      const existingDocument = querySnapshot.find((doc) => doc.session_id === session_id); // Găsește documentul cu session_id corespunzător
      return existingDocument || null; // Returnează documentul găsit sau null dacă nu există
    } catch (error) {
      console.error("Eroare la verificarea existenței session_id în Firestore:", error);
      return null;
    }
  };

  // Preluarea session_id din URL și stocarea datelor în Firestore
  useEffect(() => {
    const { session_id } = router.query;

    if (session_id) {
      const fetchSession = async () => {
        try {
          // Verifică dacă `session_id` există deja în Firestore
          const existingDocument = await checkIfSessionExists(session_id);

          if (existingDocument) {
            console.log(`Session ID ${session_id} există deja în Firestore. Datele nu vor fi reîncărcate.`);
            setDateRezervari(existingDocument); // Setează datele din documentul existent
            setLoading(false);
            return; // Oprește executarea dacă `session_id` există deja
          }

          // Apelează API-ul Stripe pentru a obține detaliile sesiunii
          const response = await fetch(`/api/get-session?session_id=${session_id}`);
          const sessionData = await response.json();

          if (sessionData) {
            const meetingCode = uuidv4(); // Generează un cod unic pentru întâlnire
            const rezervareData = {
              nume: sessionData.metadata.nume,
              alteInformatii: sessionData.metadata.alteInformatii,
              email: sessionData.customer_email,
              telefon: sessionData.metadata.telefon,
              categorie: JSON.parse(sessionData.metadata.categorie),
              tipConsultatie: sessionData.metadata.tipConsultatie,
              selectedSlot: JSON.parse(sessionData.metadata.selectedSlot),
              costConsultatie: sessionData.amount_total / 100,
              session_id: session_id,
              meetingCode: meetingCode, // Adaugă codul unic de meeting
              meetingActive: false, // Inițial meeting-ul este inactiv
            };

            console.log("Datele rezervării:", rezervareData);
            setDateRezervari(rezervareData); // Setează datele în state pentru a fi afișate
            setLoading(false);

            // Salvează datele în Firestore dacă nu există deja
            await handleUploadFirestoreGeneral(rezervareData, "RezervariConsultatii");
            console.log("Rezervarea a fost salvată cu succes în Firestore.");
          }
        } catch (error) {
          console.error("Eroare la preluarea sesiunii Stripe:", error);
          setLoading(false);
        }
      };

      fetchSession(); // Apelează funcția pentru a prelua sesiunea
    }
  }, [router.query]); // Se declanșează când router.query se schimbă

  return (
    <>
      <Home1Header />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Rezervare</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Rezervare</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Rezervare finalizată
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Conținut principal */}
      <div className="content success-page-cont">
  <div className="container-fluid">
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <div className="card success-card">
          <div className="card-body">
            <div className="success-cont">
              <i className="fas fa-check"></i>
              <h3>Rezervarea a fost realizată cu succes!</h3>
              {!loading && dateRezervari?.selectedSlot?.day ? (
                <p>
                  Rezervarea cu <strong>Cristina Zurba</strong>
                  <br /> pe <strong>{formatDateSlot(dateRezervari?.selectedSlot?.day)}-{dateRezervari?.selectedSlot?.currentYear}</strong> de la{" "}
                  <strong>{dateRezervari?.selectedSlot?.slot || ""}</strong> a fost realizată cu success
                </p>
              ) : (
                <p>Se încarcă detaliile rezervării...</p> // Afișează un mesaj de încărcare dacă datele nu sunt disponibile
              )}
              {currentUser?.uid && currentUser.uid !== "AW8kjQIhAiaJM5q0QgGlOKpGF2j1" ? (
                <>
                  <p>
                    Accesați rezervarea din cont la data rezervării pentru a începe întâlnirea
                  </p>
                  <Link
                    href={currentUser?.uid ? "/panou-utilizator" : "/login-client"}
                    className="btn btn-primary view-inv-btn"
                  >
                    Verifică programările tale
                  </Link>
                </>
              ) : !loading && dateRezervari?.selectedSlot?.day ? (
                <p>
                  Pe adresa de e-mail, precum și pe numărul de telefon, a fost transmis link-ul de conectare. Conectați-vă la link la <strong>{formatDateSlot(dateRezervari?.selectedSlot?.day)}-{dateRezervari?.selectedSlot?.currentYear}</strong> de la{" "}
                  <strong>{dateRezervari?.selectedSlot?.slot || ""}</strong> pentru a începe întâlnirea.
                </p>
              ) : (
                null
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      <Footer {...props} />
    </>
  );
};

export default BookingSuccess;
