import React from "react";
import Link from "next/link";

import Footer from "../../footer";
import StickyBox from "react-sticky-box";
import Home1Header from "../../home/home-1/header";

const Checkout = (props) => {
  const config = "/react/template";
  // const handleChange = () => {
  //   props.history.push("/patient/booking-success");
  // };

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
                  <form action={`/rezervare-finalizata`}>
                    {/* Personal Information */}
                    <div className="info-widget">
                      <h4 className="card-title">Informatii rezervare</h4>
                      <div className="row">
                        <div className="col-md-6 col-sm-12">
                          <div className="form-group card-label">
                            <label>Nume/ Prenume</label>
                            <input className="form-control" type="text" />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="form-group card-label">
                            <label>Alte informatii</label>
                            <input className="form-control" type="text" />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="form-group card-label">
                            <label>Email</label>
                            <input className="form-control" type="email" />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="form-group card-label">
                            <label>Telefon</label>
                            <input className="form-control" type="text" />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="form-group card-label">
                            <label>Categorie</label>
                            <select className="form-control">
                              <option value="">Selectati Categorie</option>
                              <option value="general">
                                Consultatie Generala
                              </option>
                              <option value="specialist">
                                Consultatie Specialist
                              </option>
                              <option value="online">Consultatie Online</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="form-group card-label">
                            <label>Tip consultatie</label>
                            <select className="form-control">
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
                        Aveti cont? <Link href="/login">Autentificare</Link>
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
                      {/* <div className="terms-accept">
                        <div className="custom-checkbox">
                          <input type="checkbox" id="terms_accept" />
                          &nbsp;
                          <label htmlFor="terms_accept">
                            I have read and accept{" "}
                            <Link href="#">Terms &amp; Conditions</Link>
                          </label>
                        </div>
                      </div> */}
                      <div className="submit-section mt-4">
                        <button
                          type="submit"
                          className="btn btn-primary submit-btn"
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
                          src={
                            "../../../../assets/img/login-banner-cristina.png"
                          }
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
                        <ul className="booking-date">
                          <li>
                            Data <span>16 09 2019</span>
                          </li>
                          <li>
                            Ora <span>10:00</span>
                          </li>
                        </ul>

                        <div className="booking-total">
                          <ul className="booking-total-list">
                            <li>
                              <span>Taxa consultatie</span>
                              <span className="total-cost">100 RON</span>
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
    </div>
  );
};

export default Checkout;
