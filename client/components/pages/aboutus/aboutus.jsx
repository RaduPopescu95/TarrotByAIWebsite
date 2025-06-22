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
      <style jsx>{`
        .about-platform {
          overflow-x: hidden;
          background: #f8f9fa;
        }
        
        .hero-section {
          background: white;
          color: #333;
          padding: 120px 0 80px;
          position: relative;
        }
        
        .feature-card {
          background: white;
          border-radius: 20px;
          padding: 2.5rem;
          height: 100%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
          position: relative;
          overflow: hidden;
        }
        
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #667eea;
        }
        
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .feature-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #667eea;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }
        
        .feature-icon i {
          font-size: 2rem;
          color: white;
        }
        
        .feature-card:hover .feature-icon {
          transform: scale(1.1);
        }
        
        .stats-section {
          background: white;
          padding: 80px 0;
        }
        
        .stat-card {
          text-align: center;
          padding: 2rem 1rem;
        }
        
        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          color: #666;
          font-weight: 500;
        }
        
        .technology-section {
          padding: 100px 0;
          background: #f8f9fa;
        }
        
        .tech-feature {
          text-align: center;
          padding: 2rem 1rem;
        }
        
        .tech-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #667eea;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .tech-icon i {
          font-size: 2.5rem;
          color: white;
        }
        
        .tech-icon:hover {
          transform: scale(1.1);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
        }
        
        .cta-section {
          background: #667eea;
          color: white;
          padding: 100px 0;
          position: relative;
        }
        
        .btn-custom {
          background: white;
          color: #667eea;
          border: 2px solid white;
          padding: 15px 30px;
          border-radius: 50px;
          font-weight: 600;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          margin: 10px;
        }
        
        .btn-custom:hover {
          background: transparent;
          color: white;
          border-color: white;
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          text-decoration: none;
        }
        
        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .section-subtitle {
          font-size: 1.1rem;
          color: #666;
          text-align: center;
          max-width: 600px;
          margin: 0 auto 3rem;
          line-height: 1.6;
        }
        
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #333;
        }
        
        .hero-subtitle {
          font-size: 1.3rem;
          margin-bottom: 2rem;
          text-align: center;
          color: #666;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.1rem;
          }
          
          .section-title {
            font-size: 2rem;
          }
          
          .stat-number {
            font-size: 2.5rem;
          }
        }
      `}</style>

      <div className="about-platform">
        <Home1Header />
        
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <h1 className="hero-title">Despre Platforma Noastră</h1>
                <p className="hero-subtitle">
                  Descoperă o platformă modernă de ghidare spirituală cu tehnologie avansată, 
                  consultații video personalizate și conferințe de grup interactive pentru 
                  dezvoltarea ta personală și spirituală.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Cristina Section */}
        <section className="py-5" style={{ padding: '100px 0' }}>
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6 mb-4 mb-lg-0">
                <div className="text-center">
                  <Image
                    src="/img/banner-image.png"
                    alt="Cristina Zurba"
                    width={400}
                    height={500}
                    className="img-fluid"
                    style={{ borderRadius: '20px' }}
                  />
                </div>
              </div>
              <div className="col-lg-6">
                <h2 className="section-title text-start">Cristina Zurba</h2>
                <h3 style={{ color: '#667eea', marginBottom: '1.5rem' }}>
                  Ghid Spiritual & Creator de Conținut
                </h3>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                  Cu peste <strong>130.000 de urmăritori</strong> pe YouTube, Cristina Zurba 
                  este o voce de încredere în domeniul dezvoltării personale și spiritualității. 
                  Prin abordarea sa autentică și profundă, ea a transformat viețile a mii de oameni.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                  Platforma sa online oferă acces direct la sesiuni de consiliere spirituală, 
                  ghidare personalizată și sprijin în gestionarea emoțiilor și blocajelor personale. 
                  Este o oportunitate unică de a beneficia de înțelepciunea și îndrumarea Cristinei 
                  într-un cadru privat și sigur.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-primary" style={{ padding: '8px 15px', fontSize: '14px' }}>
                    130K+ Urmăritori YouTube
                  </span>
                  <span className="badge bg-success" style={{ padding: '8px 15px', fontSize: '14px' }}>
                    Expert în Spiritualitate
                  </span>
                  <span className="badge bg-info" style={{ padding: '8px 15px', fontSize: '14px' }}>
                    Consilier Personal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="py-5" style={{ background: '#f8f9fa', padding: '100px 0' }}>
          <div className="container">
            <h2 className="section-title">Modalități de Consultanță</h2>
            <p className="section-subtitle">
              Alege modalitatea care ți se potrivește cel mai bine pentru călătoria ta spirituală
            </p>
            
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="feature-card">
                  <div className="feature-icon">
                    <i className="fa fa-video"></i>
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Consultații Video One-to-One
                  </h3>
                  <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    Sesiuni private individuale prin video call securizat cu Cristina Zurba. 
                    Primești atenție completă și îndrumare personalizată pentru situația ta specifică.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                    <li style={{ padding: '0.5rem 0', color: '#555' }}>
                      <i className="fa fa-check" style={{ color: '#28a745', marginRight: '0.5rem' }}></i>
                      Sesiuni private de 60 de minute
                    </li>
                    <li style={{ padding: '0.5rem 0', color: '#555' }}>
                      <i className="fa fa-check" style={{ color: '#28a745', marginRight: '0.5rem' }}></i>
                      Video HD de înaltă calitate
                    </li>
                    <li style={{ padding: '0.5rem 0', color: '#555' }}>
                      <i className="fa fa-check" style={{ color: '#28a745', marginRight: '0.5rem' }}></i>
                      Confidențialitate garantată
                    </li>
                    <li style={{ padding: '0.5rem 0', color: '#555' }}>
                      <i className="fa fa-check" style={{ color: '#28a745', marginRight: '0.5rem' }}></i>
                      Programare flexibilă
                    </li>
                    <li style={{ padding: '0.5rem 0', color: '#555' }}>
                      <i className="fa fa-check" style={{ color: '#28a745', marginRight: '0.5rem' }}></i>
                      Înregistrare disponibilă la cerere
                    </li>
                  </ul>
                  <Link href="/calendar" className="btn btn-outline-primary">
                    Programează Consultație
                  </Link>
                </div>
              </div>

                             <div className="col-lg-6">
                 <div className="feature-card">
                   <div className="feature-icon">
                     <i className="fa fa-users"></i>
                   </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Conferințe de Grup Interactive
                  </h3>
                  <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    Participă la sesiuni de grup cu persoane care împărtășesc aceleași căutări spirituale. 
                    Învață prin experiențe comune și beneficiază de energia colectivă.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
             
                    <li style={{ padding: '0.5rem 0', color: '#555' }}>
                      <i className="fa fa-check" style={{ color: '#28a745', marginRight: '0.5rem' }}></i>
                      Interacțiune în timp real
                    </li>
                    <li style={{ padding: '0.5rem 0', color: '#555' }}>
                      <i className="fa fa-check" style={{ color: '#28a745', marginRight: '0.5rem' }}></i>
                      Teme spirituale diverse
                    </li>
                    <li style={{ padding: '0.5rem 0', color: '#555' }}>
                      <i className="fa fa-check" style={{ color: '#28a745', marginRight: '0.5rem' }}></i>
                      Moderare profesională
                    </li>
                    <li style={{ padding: '0.5rem 0', color: '#555' }}>
                      <i className="fa fa-check" style={{ color: '#28a745', marginRight: '0.5rem' }}></i>
                      Prețuri accesibile
                    </li>
                  </ul>
                  <Link href="/calendar-conferinte-grup" className="btn btn-outline-secondary">
                    Alătură-te unei Conferințe
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

   
        {/* Technology Features */}
        <section className="technology-section">
          <div className="container">
            <h2 className="section-title">Tehnologie de Ultimă Generație</h2>
            <p className="section-subtitle">
              Platforma noastră folosește cele mai avansate tehnologii pentru o experiență perfectă și sigură
            </p>

            <div className="row g-4">
              <div className="col-lg-4 col-md-6">
                <div className="tech-feature">
                    <div className="tech-icon">
                    <i className="fa fa-shield-alt"></i>
                  </div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Securitate Maximă
                  </h4>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Toate sesiunile sunt criptate end-to-end folosind protocoale de securitate avansate. 
                    Confidențialitatea ta este prioritatea noastră absolută.
                  </p>
                </div>
              </div>

                             <div className="col-lg-4 col-md-6">
                 <div className="tech-feature">
                   <div className="tech-icon">
                     <i className="fa fa-mobile-alt"></i>
                   </div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Responsive & Mobile
                  </h4>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Accesează platforma de pe orice dispozitiv - desktop, tabletă sau telefon mobil. 
                    Design optimizat pentru toate ecranele.
                  </p>
                </div>
              </div>

                             <div className="col-lg-4 col-md-6">
                 <div className="tech-feature">
                   <div className="tech-icon">
                     <i className="fa fa-video"></i>
                   </div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Video HD Premium
                  </h4>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Calitate video și audio cristalină pentru o experiență de comunicare optimă. 
                    Tehnologie Agora pentru performanță superioară.
                  </p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6">
                <div className="tech-feature">
                  <div className="tech-icon">
                    <i className="fa fa-clock"></i>
                  </div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Disponibilitate 24/7
                  </h4>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Platforma este disponibilă non-stop. Programează-ți sesiunile când îți convine, 
                    cu flexibilitate maximă.
                  </p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6">
                <div className="tech-feature">
                  <div className="tech-icon">
                    <i className="fa fa-calendar-alt"></i>
                  </div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Programare Inteligentă
                  </h4>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Sistem avansat de programări cu sincronizare automată, notificări și 
                    gestionare eficientă a timpului.
                  </p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6">
                <div className="tech-feature">
                  <div className="tech-icon">
                    <i className="fa fa-headset"></i>
                  </div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Suport Tehnic
                  </h4>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Echipa noastră de suport tehnic este disponibilă pentru a te ajuta cu orice 
                    întrebări sau probleme tehnice.
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

      <Footer {...props} />
    </>
  );
};

export default Aboutus;
