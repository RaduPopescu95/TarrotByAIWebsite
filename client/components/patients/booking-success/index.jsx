import React, { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../../footer";
import Home1Header from "../../home/home-1/header";
import { useAuth } from "../../../../context/AuthContext";
import { useRouter } from "next/router";
import {
  handleUploadFirestoreGeneral,
  handleGetFirestore,
} from "../../../../utils/firestoreUtils";
import { formatDateSlot } from "../../../../utils/timeUtils";
import { v4 as uuidv4 } from "uuid"; // Importă uuid pentru generarea codurilor unice

const BookingSuccess = (props) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [dateRezervari, setDateRezervari] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasRefreshed, setHasRefreshed] = useState(false);

  useEffect(() => {
    if (!hasRefreshed) {
      const timer = setTimeout(() => {
        setHasRefreshed(true);
        router.replace(router.asPath);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasRefreshed, router]);

  const checkIfSessionExists = async (session_id) => {
    try {
      const querySnapshot = await handleGetFirestore("RezervariConsultatii");
      const existingDocument = querySnapshot.find(
        (doc) => doc.session_id === session_id
      );
      return existingDocument || null;
    } catch (error) {
      console.error(
        "Eroare la verificarea existenței session_id în Firestore:",
        error
      );
      return null;
    }
  };

  useEffect(() => {
    const { session_id } = router.query;

    if (router.isReady && session_id) {
      const fetchSession = async () => {
        try {
          const existingDocument = await checkIfSessionExists(session_id);

          if (existingDocument) {
            setDateRezervari(existingDocument);
            setLoading(false);
            return;
          }

          const response = await fetch(
            `/api/get-session?session_id=${session_id}`
          );
          const sessionData = await response.json();

          if (sessionData) {
            const meetingCode = uuidv4();

            let rezervareData = {
              nume: sessionData.metadata.nume,
              alteInformatii: sessionData.metadata.alteInformatii,
              email: sessionData.customer_email,
              telefon: sessionData.metadata.telefon,
              categorie: JSON.parse(sessionData.metadata.categorie),
              tipConsultatie: sessionData.metadata.tipConsultatie,
              selectedSlot: JSON.parse(sessionData.metadata.selectedSlot),
              costConsultatie: sessionData.amount_total / 100,
              session_id: session_id,
              meetingCode: meetingCode,
              meetingActive: false,
              owner_uid: sessionData.metadata.owner_uid || "",
            };

            let data = await handleUploadFirestoreGeneral(
              rezervareData,
              "RezervariConsultatii"
            );
            rezervareData.documentId = data.documentId;
            setDateRezervari(rezervareData);
            setLoading(false);
          }
        } catch (error) {
          console.error("Eroare la preluarea sesiunii Stripe:", error);
          setLoading(false);
        }
      };

      fetchSession();
    }
  }, [router.isReady, router.query.session_id]);

  return (
    <>
      <Home1Header />
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Rezervare</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/calendar">Rezervare</Link>
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
                        <br /> pe{" "}
                        <strong>
                          {formatDateSlot(dateRezervari?.selectedSlot?.day)}-
                          {dateRezervari?.selectedSlot?.currentYear}
                        </strong>{" "}
                        de la{" "}
                        <strong>
                          {dateRezervari?.selectedSlot?.slot || ""}
                        </strong>{" "}
                        a fost realizată cu succes
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p>Se încarcă detaliile rezervării...</p>
                      </div>
                    )}
                    {currentUser?.uid &&
                    currentUser.uid !== "AW8kjQIhAiaJM5q0QgGlOKpGF2j1" ? (
                      <>
                        <p>
                          Accesați rezervarea din cont la data rezervării pentru
                          a începe întâlnirea
                        </p>
                        <Link
                          href={
                            currentUser?.uid
                              ? "/panou-utilizator"
                              : "/login-client"
                          }
                          className="btn btn-primary view-inv-btn"
                        >
                          Verifică programările tale
                        </Link>
                      </>
                    ) : !loading && dateRezervari?.selectedSlot?.day ? (
                      <>
                        <p>
                          Link de conectare:
                          <a
                            href={`https://www.cristinazurba.com/meeting?meetingCode=${dateRezervari?.meetingCode}__${dateRezervari?.documentId}`}
                            style={{
                              color: "darkblue",
                              textDecoration: "none",
                              marginLeft: "5px",
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {`www.cristinazurba.com/meeting?meetingCode=${dateRezervari?.meetingCode}__${dateRezervari?.documentId}`}
                          </a>
                        </p>

                        <p>
                          Pe adresa de e-mail, precum și pe numărul de telefon,
                          a fost transmis link-ul de conectare. Conectați-vă la
                          link la{" "}
                          <strong>
                            {formatDateSlot(dateRezervari?.selectedSlot?.day)}-
                            {dateRezervari?.selectedSlot?.currentYear}
                          </strong>{" "}
                          de la{" "}
                          <strong>
                            {dateRezervari?.selectedSlot?.slot || ""}
                          </strong>{" "}
                          pentru a începe întâlnirea.
                        </p>
                      </>
                    ) : null}
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
