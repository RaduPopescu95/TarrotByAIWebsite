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
                Politica de Confidențialitate și Protecția Datelor (GDPR)
              </h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-2">Acasă</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Politica de Confidențialitate și Protecția Datelor (GDPR)
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
                <h2>Politica de Confidențialitate și Protecția Datelor (GDPR)</h2>
                <div className="terms-text">
                  <p>
                    Această politică explică ce date personale prelucrăm, în ce
                    scopuri, care sunt temeiurile legale, cui le divulgăm,
                    cât timp le păstrăm și ce drepturi aveți conform Regulamentului (UE)
                    2016/679 (GDPR) și legislației aplicabile.
                  </p>

                  <h4>1. Operatorul de date și contact</h4>
                  <p>
                    Operatorul platformei este entitatea indicată pe site în secțiunea
                    „Contact”. Pentru orice solicitare privind protecția datelor,
                    ne puteți scrie la adresa de email afișată pe platformă. Vă rugăm
                    să includeți suficiente informații pentru a vă identifica în mod
                    rezonabil (de ex. nume, adresă de email folosită la rezervare).
                  </p>

                  <h4>2. Categorii de date prelucrate</h4>
                  <ul>
                    <li>
                      <strong>Date de identificare</strong>: nume și prenume (inclusiv
                      numele afișat în întâlnirile video Daily.co, care poate fi completat
                      automat din rezervare).
                    </li>
                    <li>
                      <strong>Date de contact</strong>: adresa de email, număr de telefon.
                    </li>
                    <li>
                      <strong>Date privind rezervările</strong>: data/ora sesiunii,
                      codul întâlnirii, istoricul rezervărilor, linkuri de acces.
                    </li>
                    <li>
                      <strong>Date tranzacționale</strong>: detalii despre plată și statut
                      (procesate prin furnizori terți precum Stripe; nu stocăm datele
                      cardului pe platformă).
                    </li>
                    <li>
                      <strong>Date tehnice</strong>: adresa IP, identificatori cookie, tipul
                      dispozitivului/navigatoare, log-uri tehnice și evenimente (de ex.
                      webhook-uri pentru înregistrări Daily.co), în măsura în care sunt
                      necesare pentru funcționare, securitate și auditare.
                    </li>
                    <li>
                      <strong>Înregistrări video</strong>: numai dacă vă exprimați
                      consimțământul explicit. Linkurile de descărcare sunt temporare și
                      securizate.
                    </li>
                  </ul>

                  <h4>3. Scopurile și temeiurile legale ale prelucrării</h4>
                  <ul>
                    <li>
                      <strong>Furnizarea serviciilor și gestionarea rezervărilor</strong>
                      (crearea camerelor video, trimiterea linkurilor, asigurarea accesului):
                      temeiul este executarea contractului sau pași precontractuali la cererea
                      dvs. (art. 6(1)(b) GDPR).
                    </li>
                    <li>
                      <strong>Procesarea plăților și facturare</strong> (Stripe): temeiul este
                      executarea contractului și îndeplinirea obligațiilor legale contabile și
                      fiscale (art. 6(1)(b) și 6(1)(c) GDPR).
                    </li>
                    <li>
                      <strong>Comunicări operaționale</strong> (confirmări, linkuri de acces,
                      notificări privind reprogramări, transmiterea linkurilor de înregistrare,
                      inclusiv către participanți în conferințe): temeiul este interesul legitim
                      de a furniza serviciul și de a informa participanții (art. 6(1)(f) GDPR).
                    </li>
                    <li>
                      <strong>Înregistrări video</strong> (acolo unde sunt activate): temeiul este
                      consimțământul explicit al persoanei vizate (art. 6(1)(a) GDPR). Puteți
                      retrage consimțământul oricând, fără a afecta legalitatea prelucrării
                      realizate înainte de retragere.
                    </li>
                    <li>
                      <strong>Securitate, prevenirea abuzurilor și audit</strong>: temeiul este
                      interesul legitim (art. 6(1)(f) GDPR) și, după caz, obligația legală.
                    </li>
                    <li>
                      <strong>Marketing</strong> (de ex. newsletter): doar pe baza consimțământului
                      dvs. (art. 6(1)(a) GDPR). Vă puteți dezabona oricând.
                    </li>
                  </ul>

                  <h4>4. Destinatari și împuterniciți</h4>
                  <p>Partajăm datele numai atunci când este necesar, cu garanții adecvate:</p>
                  <ul>
                    <li>
                      <strong>Stripe, Inc.</strong> – procesator plăți; detalii în Politica lor de
                      confidențialitate (consultați site-ul Stripe).
                    </li>
                    <li>
                      <strong>Daily.co</strong> – furnizor infrastructură video și înregistrări;
                      linkuri de acces și linkuri de descărcare temporare sunt generate și
                      gestionate prin serviciile lor.
                    </li>
                    <li>
                      <strong>Google Firebase / Google Cloud</strong> – găzduire și baze de date;
                      datele sunt securizate în infrastructura Google.
                    </li>
                    <li>
                      <strong>Furnizori de email</strong> – pentru trimiterea comunicărilor
                      (ex. confirmări, linkuri de înregistrare, reprogramări) prin protocoale
                      securizate.
                    </li>
                    <li>
                      <strong>Autorități</strong> – atunci când legea o impune.
                    </li>
                  </ul>

                  <h4>5. Transferuri în afara SEE</h4>
                  <p>
                    Când folosim furnizori cu servere în afara Spațiului Economic European (de ex.
                    SUA), ne bazăm pe Clauzele Contractuale Standard (SCC) și măsuri suplimentare
                    de securitate (criptare, control acces) pentru a proteja datele.
                  </p>

                  <h4>6. Perioade de stocare</h4>
                  <ul>
                    <li>
                      <strong>Date cont și rezervări</strong>: pe durata relației contractuale și
                      pentru perioada necesară îndeplinirii obligațiilor legale (de regulă 5–10 ani
                      pentru documente financiar-contabile, conform legislației aplicabile).
                    </li>
                    <li>
                      <strong>Înregistrări video</strong>: păstrate strict pe durata necesară
                      furnizării linkului către participanți și pentru termenul comunicat în
                      interfață (de ex. până la 90 zile), după care sunt șterse.
                    </li>
                    <li>
                      <strong>Log-uri tehnice</strong>: de regulă până la 12 luni, cu excepții
                      justificate de securitate.
                    </li>
                  </ul>

                  <h4>7. Drepturile dvs.</h4>
                  <p>
                    Conform GDPR, beneficiați de dreptul de acces, rectificare, ștergere
                    („dreptul de a fi uitat”), restricționare, portabilitate, opoziție, precum și
                    dreptul de a nu face obiectul unei decizii bazate exclusiv pe prelucrare
                    automată. Dacă prelucrarea se bazează pe consimțământ, îl puteți retrage oricând.
                  </p>
                  <p>
                    Pentru exercitarea drepturilor, ne puteți contacta la adresa de email afișată pe
                    platformă. Aveți, de asemenea, dreptul de a depune o plângere la Autoritatea
                    Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) –
                    consultați site-ul autorității pentru detalii și modalități de contact.
                  </p>

                  <h4>8. Securitate</h4>
                  <p>
                    Implementăm măsuri tehnice și organizatorice adecvate: criptare în tranzit (TLS),
                    controale de acces pe bază de roluri, auditări periodice, politici de backup și
                    separarea mediilor. Datele cardului nu sunt stocate pe platformă.
                  </p>

                  <h4>9. Minori</h4>
                  <p>
                    Serviciile nu sunt destinate persoanelor sub 16 ani. Dacă sunteți părinte/tutore
                    și considerați că am colectat date ale unui minor fără consimțământul dvs., vă
                    rugăm să ne contactați pentru a le șterge.
                  </p>

                  <h4>10. Cookie-uri și tehnologii similare</h4>
                  <p>
                    Folosim cookie-uri tehnice pentru funcționarea site-ului și, după caz, cookie-uri
                    de analiză/marketing pe baza consimțământului. Detalii complete sunt disponibile
                    în politica noastră de cookie-uri.
                  </p>

                  <h4>11. Înregistrări video și comunicarea linkurilor</h4>
                  <ul>
                    <li>
                      Înregistrarea unei sesiuni are loc doar cu consimțământul explicit al
                      participanților. Puteți refuza înregistrarea fără a afecta accesul la sesiune,
                      dacă natura serviciului permite.
                    </li>
                    <li>
                      Linkurile de descărcare generate de Daily.co sunt temporare și protejate.
                      Pentru consultații individuale, linkul este transmis clientului; pentru
                      conferințe de grup, linkul poate fi transmis participanților înregistrați.
                    </li>
                    <li>
                      Puteți solicita ștergerea unei înregistrări în limitele permise de lege și de
                      interesele legitime (de ex. apărarea drepturilor legitime, obligații legale).
                    </li>
                  </ul>

                  <h4>12. Actualizări ale politicii</h4>
                  <p>
                    Putem modifica această politică pentru a reflecta schimbări legislative sau ale
                    serviciilor. Vom publica întotdeauna cea mai recentă versiune pe această pagină.
                    Data ultimei actualizări: {new Date().toLocaleDateString("ro-RO")}.
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
