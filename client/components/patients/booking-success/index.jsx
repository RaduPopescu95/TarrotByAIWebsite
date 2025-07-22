import React, { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../../footer";
import Home1Header from "../../home/home-1/header";
import { useAuth } from "../../../../context/AuthContext";
import { useRouter } from "next/router";
import {
  handleGetFirestore,
} from "../../../../utils/firestoreUtils";
import { formatDateSlot } from "../../../../utils/timeUtils";
import { ADMIN_UIDS } from "../../../../data/constants";

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
          console.log("🔍 [FRONTEND] Caută rezervarea pentru session_id:", session_id);
          
          // Verifică dacă rezervarea există în Firestore (salvată prin webhook)
          const existingDocument = await checkIfSessionExists(session_id);

          if (existingDocument) {
            console.log("✅ [FRONTEND] Rezervarea găsită în Firestore:", existingDocument.documentId);
            setDateRezervari(existingDocument);
            setLoading(false);
            return;
          }

          // Dacă nu există în Firestore, înseamnă că webhook-ul încă procesează
          // Așteaptă un timp scurt și încearcă din nou
          console.log("⏳ [FRONTEND] Rezervarea nu există încă, aștept webhook-ul...");
          
          let retryCount = 0;
          const maxRetries = 10; // Încearcă 10 secunde
          
          const waitForWebhook = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Așteaptă 1 secundă
            
            const document = await checkIfSessionExists(session_id);
            if (document) {
              console.log("✅ [FRONTEND] Rezervarea găsită după retry:", document.documentId);
              setDateRezervari(document);
              setLoading(false);
              return true;
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`⏳ [FRONTEND] Retry ${retryCount}/${maxRetries} pentru session_id: ${session_id}`);
              return await waitForWebhook();
            } else {
              console.error("❌ [FRONTEND] Webhook-ul nu a procesat rezervarea în timp util");
              setLoading(false);
              return false;
            }
          };
          
          await waitForWebhook();

        } catch (error) {
          console.error("❌ [FRONTEND] Eroare la căutarea rezervării:", error);
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
                    <h3>Plata a fost realizată cu succes!</h3>
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
                        <p>
                          Va rugam sa asteptati. Se realizeaza rezervarea...
                        </p>
                      </div>
                    )}
                    {currentUser?.uid &&
                    !ADMIN_UIDS.includes(currentUser.uid) ? (
                      <>
                        <p>
                          Accesați rezervarea din cont la data rezervării pentru
                          a începe întâlnirea
                        </p>
                        {!loading && (
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
                        )}
                      </>
                    ) : !loading && dateRezervari?.selectedSlot?.day ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `https://www.cristinazurba.com/meeting?meetingCode=${dateRezervari?.meetingCode}__${dateRezervari?.documentId}`
                            );
                            alert(
                              "Link-ul a fost copiat, vă rugăm să îl salvați și să îl accesați la momentul rezervării."
                            );
                          }}
                        >
                          Copiaza Link de conectare
                        </button>
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
