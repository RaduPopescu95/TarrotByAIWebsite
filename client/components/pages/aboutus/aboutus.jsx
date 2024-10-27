/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "../../footer";
import {
  vect1,
  vect2,
  vect3,
  feature7,
  feature8,
  feature9,
  feature10,
  feature11,
  feature12,
  specialities1,
  specialities2,
  specialities3,
  specialities4,
  specialities5,
  patient1,
  patient2,
  patient3,
  patient4,
  aboutimg1,
  aboutimg2,
  aboutimg3,
  phoneicon,
  choose01,
  choose02,
  choose03,
  choose04,
  smilingicon,
  shape06,
  shape07,
  wayimg,
  doctor03,
  doctor04,
  doctor05,
  doctor02,
  shape04,
  shape05,
  client01,
  client02,
  client03,
  client04,
  client05,
  faqimg,
} from "../aboutus/img";
import CountUp from "react-countup";
import Home1Header from "../../home/home-1/header";
import Image from "next/image";

const Aboutus = (props) => {
  const settings = {
    arrows: false,
    dots: true,
    autoplay: false,
    infinite: true,
    prevArrow: false,
    nextArrow: false,
    rtl: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 776,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 567,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <>
      <Home1Header />
      <>
        {/* Breadcrumb */}
        <div className="breadcrumb-bar-two">
          <div className="container">
            <div className="row align-items-center inner-banner">
              <div className="col-md-12 col-12 text-center">
                <h2 className="breadcrumb-title">Despre Platforma</h2>
                <nav aria-label="breadcrumb" className="page-breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link href="/home-2">Consultatii</Link>
                    </li>
                    <li className="breadcrumb-item" aria-current="page">
                      Despre Platforma
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
        {/* /Breadcrumb */}
        {/* About Us */}
        <section className="about-section">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6 col-md-12">
                <div className="about-img-info">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="about-inner-img">
                        <div className="about-img">
                          <Image
                            src="/img/banner-image.png" // Calea relativă din folderul public
                            alt="Cristina Zurba"
                            width={512} // Lățimea originală a imaginii
                            height={672} // Înălțimea originală a imaginii
                          />
                        </div>
                        {/* <div className="about-img">
                          <img
                            src="/img/banner-image.png"
                            className="img-fluid"
                            alt=""
                          />
                        </div> */}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="about-inner-img">
                        <div className="about-box">
                          <h4>Peste 130 000 de urmăritori pe Youtube</h4>
                        </div>
                        <div className="about-img">
                          <img src={aboutimg3} className="img-fluid" alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 col-md-12">
                <div className="section-inner-header about-inner-header">
                  <h6>Despre Platformă</h6>
                  <h2>
                    Ghidare Spirituală și Consiliere Personalizată pentru
                    Echilibrul Tău Interior
                  </h2>
                </div>

                <div className="about-content">
                  <div className="about-content-details">
                    <p>
                      Cu peste 130.000 de urmăritori dedicați pe YouTube,
                      Cristina Zurba este o creatoare de conținut de renume,
                      cunoscută pentru abordarea sa autentică și profundă în
                      domeniul dezvoltării personale și spiritualității. Prin
                      videoclipurile sale inspiraționale și sesiuni de mentorat,
                      ea a ajutat mii de oameni să descopere echilibrul interior
                      și să depășească provocările vieții.
                    </p>
                    <p>
                      Platforma sa de consultații online este dedicată celor
                      care doresc să exploreze și să se conecteze cu
                      spiritualitatea la un nivel mai profund. Clienții pot
                      rezerva sesiuni individuale sau de grup pentru a primi
                      ghidare personalizată, consiliere pe teme de dezvoltare
                      spirituală și sprijin în gestionarea emoțiilor și a
                      blocajelor personale. Totodată, aceasta este o
                      oportunitate unică de a interacționa direct cu Cristina
                      Zurb și de a beneficia de înțelepciunea și îndrumarea sa
                      într-un cadru privat și sigur.
                    </p>
                  </div>
                  {/* <div className="about-contact">
                    <div className="about-contact-icon">
                      <span>
                        <img src={phoneicon} alt="" />
                      </span>
                    </div>
                    <div className="about-contact-text">
                      <p>Dorești să afli mai multe?</p>
                      <h4>Contactează-ne la: +1 315 369 5943</h4>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* /About Us */}
        {/* Why Choose Us */}
        {/* <section className="why-choose-section">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <div className="section-inner-header text-center">
                  <h2>Why Choose Us</h2>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-3 col-md-6 d-flex">
                <div className="card why-choose-card w-100">
                  <div className="card-body">
                    <div className="why-choose-icon">
                      <span>
                        <img src={choose01} alt="" />
                      </span>
                    </div>
                    <div className="why-choose-content">
                      <h4>Qualified Staff of Doctors</h4>
                      <p>
                        Lorem ipsum sit amet consectetur incididunt ut labore et
                        exercitation ullamco laboris nisi dolore magna enim
                        veniam aliqua.{" "}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 d-flex">
                <div className="card why-choose-card w-100">
                  <div className="card-body">
                    <div className="why-choose-icon">
                      <span>
                        <img src={choose02} alt="" />
                      </span>
                    </div>
                    <div className="why-choose-content">
                      <h4>Qualified Staff of Doctors</h4>
                      <p>
                        Lorem ipsum sit amet consectetur incididunt ut labore et
                        exercitation ullamco laboris nisi dolore magna enim
                        veniam aliqua.{" "}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 d-flex">
                <div className="card why-choose-card w-100">
                  <div className="card-body">
                    <div className="why-choose-icon">
                      <span>
                        <img src={choose03} alt="" />
                      </span>
                    </div>
                    <div className="why-choose-content">
                      <h4>Qualified Staff of Doctors</h4>
                      <p>
                        Lorem ipsum sit amet consectetur incididunt ut labore et
                        exercitation ullamco laboris nisi dolore magna enim
                        veniam aliqua.{" "}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 d-flex">
                <div className="card why-choose-card w-100">
                  <div className="card-body">
                    <div className="why-choose-icon">
                      <span>
                        <img src={choose04} alt="" />
                      </span>
                    </div>
                    <div className="why-choose-content">
                      <h4>Qualified Staff of Doctors</h4>
                      <p>
                        Lorem ipsum sit amet consectetur incididunt ut labore et
                        exercitation ullamco laboris nisi dolore magna enim
                        veniam aliqua.{" "}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}
        {/* /Why Choose Us */}
        {/* Way Section */}
        <section className="way-section">
          <div className="container">
            <div className="way-bg">
              <div className="way-shapes-img">
                <div className="way-shapes-left">
                  <img src={shape06} alt="" />
                </div>
                <div className="way-shapes-right">
                  <img src={shape07} alt="" />
                </div>
              </div>
              <div className="row align-items-end">
                <div className="col-lg-7 col-md-12">
                  <div className="section-inner-header way-inner-header mb-0">
                    <h2>
                      Descoperă Echilibrul Interioar prin Ghidare Spirituală
                    </h2>
                    <p>
                      Programează o sesiune de consiliere spirituală și începe
                      călătoria ta către o stare de bine. Explorează calendarul
                      disponibilităților și alege momentul potrivit pentru tine.
                    </p>
                    <Link href="/calendar" className="btn btn-primary">
                      Rezervă o Sesiune
                    </Link>
                  </div>
                </div>
                <div className="col-lg-5 col-md-12">
                  <div className="way-img-cta">
                    <Image
                      src="/img/shape-07.png" // Calea relativă din folderul public
                      alt="Cristina Zurba"
                      width={312} // Lățimea originală a imaginii
                      height={372} // Înălțimea originală a imaginii
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* /Way Choose Us */}
        {/* Doctors Section */}
        {/* <section className="doctors-section professional-section">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <div className="section-inner-header text-center">
                  <h2>Best Doctors</h2>
                </div>
              </div>
            </div>
            <div className="row">
        
              <div className="col-lg-3 col-md-6 d-flex">
                <div className="doctor-profile-widget w-100">
                  <div className="doc-pro-img">
                    <Link href="/patient/doctor-profile">
                      <div className="doctor-profile-img">
                        <img src={doctor03} className="img-fluid" alt="" />
                      </div>
                    </Link>
                    <div className="doctor-amount">
                      <span>$ 200</span>
                    </div>
                  </div>
                  <div className="doc-content">
                    <div className="doc-pro-info">
                      <div className="doc-pro-name">
                        <Link href="/patient/doctor-profile">
                          Dr. Ruby Perrin
                        </Link>
                        <p>Cardiology</p>
                      </div>
                      <div className="reviews-ratings">
                        <p>
                          <span>
                            <i className="fas fa-star" /> 4.5
                          </span>{" "}
                          (35)
                        </p>
                      </div>
                    </div>
                    <div className="doc-pro-location">
                      <p>
                        <i className="feather-map-pin" /> Newyork, USA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
        
              <div className="col-lg-3 col-md-6 d-flex">
                <div className="doctor-profile-widget w-100">
                  <div className="doc-pro-img">
                    <Link href="/patient/doctor-profile">
                      <div className="doctor-profile-img">
                        <img src={doctor04} className="img-fluid" alt="" />
                      </div>
                    </Link>
                    <div className="doctor-amount">
                      <span>$ 360</span>
                    </div>
                  </div>
                  <div className="doc-content">
                    <div className="doc-pro-info">
                      <div className="doc-pro-name">
                        <Link href="/patient/doctor-profile">
                          Dr. Darren Elder
                        </Link>
                        <p>Neurology</p>
                      </div>
                      <div className="reviews-ratings">
                        <p>
                          <span>
                            <i className="fas fa-star" /> 4.0
                          </span>{" "}
                          (20)
                        </p>
                      </div>
                    </div>
                    <div className="doc-pro-location">
                      <p>
                        <i className="feather-map-pin" /> Florida, USA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
       
              <div className="col-lg-3 col-md-6 d-flex">
                <div className="doctor-profile-widget w-100">
                  <div className="doc-pro-img">
                    <Link href="/patient/doctor-profile">
                      <div className="doctor-profile-img">
                        <img src={doctor05} className="img-fluid" alt="" />
                      </div>
                    </Link>
                    <div className="doctor-amount">
                      <span>$ 450</span>
                    </div>
                  </div>
                  <div className="doc-content">
                    <div className="doc-pro-info">
                      <div className="doc-pro-name">
                        <Link href="/patient/doctor-profile">
                          Dr. Sofia Brient
                        </Link>
                        <p>Urology</p>
                      </div>
                      <div className="reviews-ratings">
                        <p>
                          <span>
                            <i className="fas fa-star" /> 4.5
                          </span>{" "}
                          (30)
                        </p>
                      </div>
                    </div>
                    <div className="doc-pro-location">
                      <p>
                        <i className="feather-map-pin" /> Georgia, USA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
             
              <div className="col-lg-3 col-md-6 d-flex">
                <div className="doctor-profile-widget w-100">
                  <div className="doc-pro-img">
                    <Link href="/patient/doctor-profile">
                      <div className="doctor-profile-img">
                        <img src={doctor02} className="img-fluid" alt="" />
                      </div>
                    </Link>
                    <div className="doctor-amount">
                      <span>$ 570</span>
                    </div>
                  </div>
                  <div className="doc-content">
                    <div className="doc-pro-info">
                      <div className="doc-pro-name">
                        <Link href="/patient/doctor-profile">
                          Dr. Paul Richard
                        </Link>
                        <p>Orthopedic</p>
                      </div>
                      <div className="reviews-ratings">
                        <p>
                          <span>
                            <i className="fas fa-star" /> 4.3
                          </span>{" "}
                          (45)
                        </p>
                      </div>
                    </div>
                    <div className="doc-pro-location">
                      <p>
                        <i className="feather-map-pin" /> Michigan, USA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
       
            </div>
          </div>
        </section> */}
        {/* /Doctors Section */}
        {/* Testimonial Section */}
        {/* <Testimonial /> */}
        {/* /Testimonial Section */}
        {/* FAQ Section */}
        {/* <section className="faq-section faq-section-inner">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <div className="section-inner-header text-center">
                  <h6>Get Your Answer</h6>
                  <h2>Frequently Asked Questions</h2>
                </div>
              </div>
            </div>
            <div className="row align-items-center">
              <div className="col-lg-6 col-md-12">
                <div className="faq-img">
                  <img src={faqimg} className="img-fluid" alt="img" />
                  <div className="faq-patients-count">
                    <div className="faq-smile-img">
                      <img src={smilingicon} alt="icon" />
                    </div>
                    <div className="faq-patients-content">
                      <h4>
                        <span className="count-digit">
                          <CountUp start={1} end={95} />
                        </span>
                        k+
                      </h4>
                      <p>Happy Patients</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 col-md-12">
                <div className="faq-info">
                  <div className="accordion" id="accordionExample">
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingOne">
                        <Link
                          href="#"
                          className="accordion-button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseOne"
                          aria-expanded="true"
                          aria-controls="collapseOne"
                        >
                          Can i make an Appointment Online with White Plains
                          Hospital Kendi?
                        </Link>
                      </h2>
                      <div
                        id="collapseOne"
                        className="accordion-collapse collapse show"
                        aria-labelledby="headingOne"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <div className="accordion-content">
                            <p>
                              Lorem ipsum dolor sit amet, consectetur adipiscing
                              elit, sed do eiusmod tempor incididunt ut labore
                              et dolore magna aliqua. Ut enim ad minim veniam,{" "}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingTwo">
                        <Link
                          href="#"
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseTwo"
                          aria-expanded="false"
                          aria-controls="collapseTwo"
                        >
                          Can i make an Appointment Online with White Plains
                          Hospital Kendi?
                        </Link>
                      </h2>
                      <div
                        id="collapseTwo"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingTwo"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <div className="accordion-content">
                            <p>
                              Lorem ipsum dolor sit amet, consectetur adipiscing
                              elit, sed do eiusmod tempor incididunt ut labore
                              et dolore magna aliqua. Ut enim ad minim veniam,{" "}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingThree">
                        <Link
                          href="#"
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseThree"
                          aria-expanded="false"
                          aria-controls="collapseThree"
                        >
                          Can i make an Appointment Online with White Plains
                          Hospital Kendi?
                        </Link>
                      </h2>
                      <div
                        id="collapseThree"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingThree"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <div className="accordion-content">
                            <p>
                              Lorem ipsum dolor sit amet, consectetur adipiscing
                              elit, sed do eiusmod tempor incididunt ut labore
                              et dolore magna aliqua. Ut enim ad minim veniam,{" "}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingFour">
                        <Link
                          href="#"
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseFour"
                          aria-expanded="false"
                          aria-controls="collapseFour"
                        >
                          Can i make an Appointment Online with White Plains
                          Hospital Kendi?
                        </Link>
                      </h2>
                      <div
                        id="collapseFour"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingFour"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <div className="accordion-content">
                            <p>
                              Lorem ipsum dolor sit amet, consectetur adipiscing
                              elit, sed do eiusmod tempor incididunt ut labore
                              et dolore magna aliqua. Ut enim ad minim veniam,{" "}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingFive">
                        <Link
                          href="#"
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseFive"
                          aria-expanded="false"
                          aria-controls="collapseFive"
                        >
                          Can i make an Appointment Online with White Plains
                          Hospital Kendi?
                        </Link>
                      </h2>
                      <div
                        id="collapseFive"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingFive"
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <div className="accordion-content">
                            <p>
                              Lorem ipsum dolor sit amet, consectetur adipiscing
                              elit, sed do eiusmod tempor incididunt ut labore
                              et dolore magna aliqua. Ut enim ad minim veniam,{" "}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}
      </>

      <Footer {...props} />
    </>
  );
};

export default Aboutus;
