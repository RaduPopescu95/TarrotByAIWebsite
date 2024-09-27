import React from "react";
import Link from "next/link";
import Footer from "../../footer";
import Home1Header from "../../home/home-1/header";
import { useAuth } from "../../../../context/AuthContext";

const BookingSuccess = (props) => {
  const {currentUser} = useAuth()
  return (
    <>
      <Home1Header />
      {/* // <!-- Breadcrumb --> */}
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
                    Rezervare finalizata
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* // <!-- /Breadcrumb -->       */}
      <div className="content success-page-cont">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card success-card">
                <div className="card-body">
                  <div className="success-cont">
                    <i className="fas fa-check"></i>
                    <h3>Rezevarea a fost realizata cu success!</h3>
                    <p>
                      Rezervarea cu <strong>Cristina Zurba</strong>
                      <br /> pe <strong>12 09 2019</strong> de la{" "}
                      <strong>15:00 la 16:00</strong>
                    </p>
                    {
                      currentUser?.uid
                      ?
                    <Link
                      href={currentUser?.uid ? "/panou-utilizator" : "/login-client"}
                      className="btn btn-primary view-inv-btn"
                    >
                      Verifica programarile tale
                    </Link>
                    :
                    <>
                    {/* <h4>Link-ul pentru intalnire a fost transmit pe e-mail si pe numarul de telefon</h4> */}
                    <p>
                      Pe adresa de e-mail precum si pe numarul de telefon a fost transmis link-ul de conectare. Conectati-va la link la <strong>12 09 2019</strong> ora <strong>15:00</strong>.
                     
                    </p>
                    </>
                    }
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
