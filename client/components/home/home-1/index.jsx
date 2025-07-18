"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic"; // pentru încărcare dinamică
import Home1Header from "./header";
import AOS from "aos";
import "aos/dist/aos.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
// import "../../../../styles/consultations.css"; // Disabled for build fix
import { Calendar } from "primereact/calendar";
import Image from "next/image";
import { useAuth } from "../../../../context/AuthContext";

// Încărcarea dinamică a componentelor dependente de DOM
const OwlCarousel = dynamic(() => import("react-owl-carousel"), { ssr: false });
const Slider = dynamic(() => import("react-slick"), { ssr: false });

const Home1 = () => {
  const [date1, setDate1] = useState(null);
  const { currentUser, userData, loading, setLoading } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Execută acest cod doar pe client
      AOS.init({
        duration: 1000,
      });

      const handleScroll = () => {
        AOS.refresh();
      };

      // Adaugă un event listener pentru scroll
      window.addEventListener("scroll", handleScroll);

      // Elimină event listener-ul când componenta se demontează
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  if(loading){
    return (    
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center", 
        height: "100vh"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #667eea",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .main-wrapper.home-one {
          width: 100vw !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }
        
        .main-wrapper.home-one section {
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .main-wrapper.home-one .container-fluid {
          width: 100% !important;
          max-width: 100% !important;
          padding-left: 30px !important;
          padding-right: 30px !important;
        }
        
        @media (max-width: 1199px) {
          .main-wrapper.home-one .container-fluid {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        
        @media (max-width: 767px) {
          .main-wrapper.home-one .container-fluid {
            padding-left: 15px !important;
            padding-right: 15px !important;
          }
        }
        
        /* Force full width on all sections */
        .banner-section,
        .how-it-works-section,
        .technology-section,
        .steps-section,
        .enhanced-cta-section {
          width: 100% !important;
          max-width: 100% !important;
        }
        
        /* Bootstrap Grid System */
        .row {
          display: flex;
          flex-wrap: wrap;
          margin-right: -15px;
          margin-left: -15px;
        }
        
        .col-lg-6 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
          flex: 0 0 50%;
          max-width: 50%;
        }
        
        .col-lg-4 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
          flex: 0 0 33.333333%;
          max-width: 33.333333%;
        }
        
        .col-lg-5 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
          flex: 0 0 41.666667%;
          max-width: 41.666667%;
        }
        
        .col-lg-7 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
          flex: 0 0 58.333333%;
          max-width: 58.333333%;
        }
        
        .col-lg-10 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
          flex: 0 0 83.333333%;
          max-width: 83.333333%;
        }
        
        .col-md-6 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
        }
        
        .col-md-12 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
        }
        
        .col-12 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
          flex: 0 0 100%;
          max-width: 100%;
        }
        
        .g-3 > * {
          padding-right: calc(0.75rem * 0.5);
          padding-left: calc(0.75rem * 0.5);
          margin-top: 0.75rem;
        }
        
        .g-4 > * {
          padding-right: calc(1rem * 0.5);
          padding-left: calc(1rem * 0.5);
          margin-top: 1rem;
        }
        
        .align-items-center {
          align-items: center !important;
        }
        
        .justify-content-center {
          justify-content: center !important;
        }
        
        .text-center {
          text-align: center !important;
        }
        
        .mb-5 {
          margin-bottom: 3rem !important;
        }
        
        .me-2 {
          margin-right: 0.5rem !important;
        }
        
        .w-100 {
          width: 100% !important;
        }
        
        .order-1 {
          order: 1 !important;
        }
        
        .order-2 {
          order: 2 !important;
        }
        
        .position-relative {
          position: relative !important;
        }
        
        .img-fluid {
          max-width: 100%;
          height: auto;
        }
        
        .py-5 {
          padding-top: 3rem !important;
          padding-bottom: 3rem !important;
        }
        
        .bg-light {
          background-color: #f8f9fa !important;
        }
        
        @media (max-width: 991.98px) {
          .col-lg-6 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          
          .col-lg-4 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          
          .col-lg-5 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          
          .col-lg-7 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          
          .col-lg-10 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          
          .order-lg-1 {
            order: 1 !important;
          }
          
          .order-lg-2 {
            order: 2 !important;
          }
        }
        
        @media (max-width: 767.98px) {
          .col-md-6 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          
          .col-md-12 {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }
      `}</style>
      
      <div className="main-wrapper home-one">
        <Home1Header />
        
        {/* Home Banner - Improved */}
        <section className="banner-section">
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-lg-6 order-2 order-lg-1">
                <div className="banner-content aos" data-aos="fade-up">
                  <h1>
                    Ghidare spirituală <span>personalizată</span> pentru
                    echilibrul tău.
                  </h1>
                  <p className="banner-subtitle">
                    Cristina Zurba – Îndrumare spirituală autentică pentru o viață
                    armonioasă
                  </p>
                  
                  {/* Improved Responsive Buttons */}
                  <div className="banner-buttons-container">
                    <div className="row g-3">
                      <div className="col-md-6 col-12">
                        <Link href="/calendar" className="btn btn-primary-custom w-100">
                          <i className="fa fa-user me-2"></i>
                          Ședințe individuale
                        </Link>
                      </div>
                      <div className="col-md-6 col-12">
                        <Link href="/calendar-conferinte-grup" className="btn btn-secondary-custom w-100">
                          <i className="fa fa-users me-2"></i>
                          Conferințe/cursuri
                        </Link>
                      </div>
                
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 order-1 order-lg-2">
                <div className="aos" data-aos="fade-up">
                  <Image
                    src="/img/banner-image.png"
                    alt="Cristina Zurba"
                    width={512}
                    height={672}
                    className="img-fluid"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section py-5">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 text-center mb-5">
                <h2 className="section-title aos" data-aos="fade-up">
                  Cum funcționează platforma
                </h2>
                <p className="section-subtitle aos" data-aos="fade-up" data-aos-delay="100">
                  Descoperă modalitățile prin care îți oferim îndrumare spirituală personalizată
                </p>
              </div>
            </div>
            
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="feature-card one-on-one aos" data-aos="fade-right">
                  <div className="feature-icon">
                    <i className="fa fa-video"></i>
                  </div>
                  <div className="feature-content">
                    <h3>Consultații Video Individuale</h3>
                    <p>
                      Sesiuni private one-on-one prin video call securizat. 
                      Îndrumare personalizată în timp real, adaptată nevoilor tale specifice.
                    </p>
                    <ul className="feature-list">
                      <li><i className="fa fa-check"></i> Video HD de înaltă calitate</li>
                      <li><i className="fa fa-check"></i> Sesiuni private și confidențiale</li>
                      <li><i className="fa fa-check"></i> Programare flexibilă</li>
                      <li><i className="fa fa-check"></i> Înregistrări disponibile</li>
                    </ul>
                    <Link href="/calendar" className="btn btn-outline-primary">
                      Programează o consultație
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="feature-card group-conferences aos" data-aos="fade-left">
                  <div className="feature-icon">
                    <i className="fa fa-users"></i>
                  </div>
                  <div className="feature-content">
                    <h3>Conferințe de Grup Interactive</h3>
                    <p>
                      Participă la sesiuni de grup cu persoane care împărtășesc 
                      aceleași căutări spirituale. Învață prin experiențe comune.
                    </p>
                    <ul className="feature-list">
                      <li><i className="fa fa-check"></i> Interacțiune în timp real</li>
                      <li><i className="fa fa-check"></i> Grupuri tematice</li>
                      <li><i className="fa fa-check"></i> Moderare profesională</li>
                    </ul>
                    <Link href="/calendar-conferinte-grup" className="btn btn-outline-secondary">
                      Alătură-te unei conferințe
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Features Section */}
        <section className="technology-section py-5 bg-light">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 text-center mb-5">
                <h2 className="section-title aos" data-aos="fade-up">
                  Tehnologie de ultimă generație
                </h2>
                <p className="section-subtitle aos" data-aos="fade-up" data-aos-delay="100">
                  Platforma noastră folosește cele mai avansate tehnologii pentru o experiență perfectă
                </p>
              </div>
            </div>

            <div className="row g-4 align-items-center">
              <div className="col-lg-4">
                <div className="tech-feature aos" data-aos="fade-up" data-aos-delay="0">
                  <div className="tech-icon">
                    <i className="fa fa-shield-alt"></i>
                  </div>
                  <h4>Securitate Maximă</h4>
                  <p>
                    Toate sesiunile sunt criptate end-to-end. 
                    Confidențialitatea ta este prioritatea noastră absolută.
                  </p>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="tech-feature aos" data-aos="fade-up" data-aos-delay="100">
                  <div className="tech-icon">
                    <i className="fa fa-mobile-alt"></i>
                  </div>
                  <h4>Responsive & Mobile</h4>
                  <p>
                    Accesează platforma de pe orice dispozitiv - 
                    desktop, tabletă sau telefon mobil.
                  </p>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="tech-feature aos" data-aos="fade-up" data-aos-delay="200">
                  <div className="tech-icon">
                    <i className="fa fa-clock"></i>
                  </div>
                  <h4>Disponibilitate 24/7</h4>
                  <p>
                    Platforma este disponibilă non-stop. 
                    Programează-ți sesiunile când îți convine.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="steps-section py-5">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 text-center mb-5">
                <h2 className="section-title aos" data-aos="fade-up">
                  În doar 3 pași simpli
                </h2>
                <p className="section-subtitle aos" data-aos="fade-up" data-aos-delay="100">
                  Începe-ți călătoria spirituală astăzi
                </p>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-lg-4">
                <div className="step-card aos" data-aos="fade-up" data-aos-delay="0">
                  <div className="step-number">1</div>
                  <div className="step-icon">
                    <i className="fa fa-user-plus"></i>
                  </div>
                  <h4>Înregistrează-te</h4>
                  <p>
                    Creează-ți contul în câteva secunde. 
                    Este simplu, rapid și complet gratuit.
                  </p>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="step-card aos" data-aos="fade-up" data-aos-delay="100">
                  <div className="step-number">2</div>
                  <div className="step-icon">
                    <i className="fa fa-calendar-alt"></i>
                  </div>
                  <h4>Alege și programează</h4>
                  <p>
                    Selectează tipul de consultație dorit și 
                    programează la ora care îți convine.
                  </p>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="step-card aos" data-aos="fade-up" data-aos-delay="200">
                  <div className="step-number">3</div>
                  <div className="step-icon">
                    <i className="fa fa-comments"></i>
                  </div>
                  <h4>Conectează-te și învață</h4>
                  <p>
                    Participă la sesiune prin video call securizat 
                    și începe-ți transformarea spirituală.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Call to Action Section */}
        <section className="enhanced-cta-section py-5">
          <div className="cta-background-overlay"></div>
          <div className="container-fluid position-relative">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="cta-card aos" data-aos="fade-up">
                  <div className="row align-items-center">
                    
                    {/* Left Side - Content */}
                    <div className="col-lg-7 col-md-12">
                      <div className="cta-content">
                    
                        <h2 className="cta-title aos" data-aos="fade-right" data-aos-delay="200">
                          Ești gata să-ți descoperi 
                          <span className="highlight"> potențialul spiritual</span>?
                        </h2>
                        
                        <p className="cta-description aos" data-aos="fade-right" data-aos-delay="300">
                          Alătură-te comunității noastre și beneficiază de îndrumare spirituală 
                          autentică. Cristina Zurba te va ghida către echilibrul interior pe care îl cauți.
                        </p>
                        
                   
                      </div>
                    </div>
                    
                    {/* Right Side - Action Buttons */}
                    <div className="col-lg-5 col-md-12">
                      <div className="cta-actions aos" data-aos="fade-left" data-aos-delay="500">
                        <div className="action-card">
                          <h4 className="action-title">Alege modalitatea ta preferată:</h4>
                          
                          <div className="action-buttons">
                            <Link href="/calendar" className="btn btn-cta-primary">
                              <div className="btn-content">
                            
                                <div className="btn-text">
                                  <strong>Consultație Individuală</strong>
                                  <small>Sesiune privată one-on-one</small>
                                </div>
                              </div>
                              <i className="fa fa-arrow-right btn-arrow"></i>
                            </Link>
                            
                            <Link href="/calendar-conferinte-grup" className="btn btn-cta-secondary">
                              <div className="btn-content">
                             
                                <div className="btn-text">
                                  <strong>Conferință de Grup</strong>
                                  <small>Învățare în comunitate</small>
                                </div>
                              </div>
                              <i className="fa fa-arrow-right btn-arrow"></i>
                            </Link>
                          </div>
                  
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="floating-elements">
              <div className="floating-element element-1 aos" data-aos="fade-up" data-aos-delay="600">
                <i className="fa fa-heart"></i>
              </div>
              <div className="floating-element element-2 aos" data-aos="fade-up" data-aos-delay="700">
                <i className="fa fa-leaf"></i>
              </div>
              <div className="floating-element element-3 aos" data-aos="fade-up" data-aos-delay="800">
                <i className="fa fa-sun"></i>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home1;
