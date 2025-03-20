import React from "react";
import Link from "next/link";

import Footer from "../../footer";
import Home1Header from "../../home/home-1/header";

const PrivacyPolicy = (props) => {
  return (
    <>
      <Home1Header />

      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">
                Politica de Confidențialitate
              </h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-2">Acasă</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Politica de Confidențialitate
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* /Breadcrumb */}
      {/* Politica de Confidențialitate */}
      <section className="terms-section">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="terms-content">
                <h2>Politica de Confidențialitate</h2>
                <div className="terms-text">
                  <p>
                    Această politică de confidențialitate explică modul în care
                    colectăm, utilizăm, stocăm și protejăm informațiile
                    dumneavoastră personale atunci când utilizați platforma
                    noastră de consiliere online. Protecția datelor cu caracter
                    personal este o prioritate pentru noi, iar toate
                    informațiile sunt tratate în conformitate cu legislația în
                    vigoare.
                  </p>

                  <h4>1. Ce date colectăm</h4>
                  <ul>
                    <li>
                      <strong>Nume și Prenume:</strong> Aceste informații sunt
                      necesare pentru identificarea clienților și pentru
                      gestionarea rezervărilor.
                    </li>
                    <li>
                      <strong>Email:</strong> Folosit pentru confirmarea
                      rezervărilor, trimiterea de informații despre sesiuni și
                      pentru comunicarea cu utilizatorii platformei.
                    </li>
                    <li>
                      <strong>Număr de Telefon:</strong> Utilizat pentru
                      contactarea rapidă în cazuri de urgență sau modificări ale
                      programărilor.
                    </li>
                    <li>
                      <strong>Informații despre Programări:</strong> Data și ora
                      sesiunii, precum și istoricul rezervărilor pentru a oferi
                      o experiență personalizată.
                    </li>
                    <li>
                      <strong>Informații privind Plățile:</strong> Datele
                      tranzacțiilor sunt colectate și procesate prin intermediul
                      unui serviciu terț de plăți (ex: Stripe) pentru a garanta
                      securitatea acestora.
                    </li>
                    <li>
                      <strong>Detalii despre Sesiuni:</strong> Informațiile
                      discutate în cadrul sesiunilor de consiliere nu sunt
                      înregistrate sau stocate pe platformă, cu excepția cazului
                      în care se oferă consimțământul expres al utilizatorului.
                    </li>
                  </ul>

                  <h4>2. Cum utilizăm datele colectate</h4>
                  <ul>
                    <li>Procesarea și gestionarea programărilor.</li>
                    <li>
                      Comunicarea cu utilizatorii platformei, inclusiv
                      trimiterea de confirmări și notificări.
                    </li>
                    <li>
                      Îmbunătățirea serviciilor noastre prin analizarea
                      feedback-ului și comportamentului utilizatorilor.
                    </li>
                    <li>
                      Asigurarea unei experiențe personalizate pentru fiecare
                      utilizator pe baza preferințelor și istoricului acestora.
                    </li>
                  </ul>

                  <h4>3. Stocarea și protecția datelor</h4>
                  <p>
                    Datele colectate sunt stocate pe servere securizate și
                    accesibile doar personalului autorizat. Utilizăm măsuri de
                    securitate adecvate pentru a proteja informațiile împotriva
                    accesului neautorizat, pierderii sau modificării acestora.
                    Datele tranzacțiilor sunt procesate prin intermediul
                    serviciilor terțe de plată și nu stocăm detalii complete ale
                    cardurilor de credit/debit.
                  </p>

                  <h4>4. Distribuirea datelor către terți</h4>
                  <p>
                    Nu vindem, nu închiriem și nu distribuim informațiile
                    dumneavoastră personale către terți, cu excepția cazurilor
                    în care acest lucru este necesar pentru furnizarea
                    serviciilor (ex: procesarea plăților) sau pentru a respecta
                    obligațiile legale.
                  </p>

                  <h4>5. Drepturile utilizatorilor</h4>
                  <p>
                    Utilizatorii au dreptul de a solicita accesul, modificarea
                    sau ștergerea datelor personale colectate. De asemenea,
                    aveți dreptul de a vă opune prelucrării datelor sau de a
                    solicita restricționarea prelucrării acestora. Pentru orice
                    solicitare, ne puteți contacta la adresa de email indicată
                    pe platformă.
                  </p>

                  <h4>6. Modificări ale politicii de confidențialitate</h4>
                  <p>
                    Ne rezervăm dreptul de a modifica această politică de
                    confidențialitate în orice moment. Orice modificare va fi
                    publicată pe această pagină, iar utilizatorii vor fi
                    notificați cu privire la schimbările efectuate.
                  </p>

                  <p>
                    Prin utilizarea platformei noastre, sunteți de acord cu
                    termenii și condițiile acestei politici de
                    confidențialitate.
                  </p>
                </div>
                <div className="terms-btn">
                  {/* <Link href="#" className="btn btn-right-now">
                    Nu sunt de acord
                  </Link> */}
                  <Link href="/calendar" className="btn btn-primary prime-btn">
                    Rezerva consultatie
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /Politica de Confidențialitate */}

      <Footer {...props} />
    </>
  );
};

export default PrivacyPolicy;
