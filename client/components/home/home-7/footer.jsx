import React from "react";
import Link from "next/link";
import ImageWithBasePath from "../../../../core/img/imagewithbasebath";

const Home7Footer = () => {
  return (
    <div>
      {/* Footer */}
      <footer className="footer-fourteen footer-twelve">
        <div className="footer-top">
          <div className="floating-bg">
            <ImageWithBasePath
              src="assets/img/bg/small-paw-2.png"
              alt="paw-image"
            />
            <ImageWithBasePath
              src="assets/img/bg/small-paw-3.png"
              alt="paw-image"
            />
            <ImageWithBasePath
              src="assets/img/bg/footer-round-bg.png"
              alt="paw-image"
            />
          </div>
          <div className="container">
            <div className="row">
              <div className="col-lg-4 col-md-6">
                <div className="footer-widget footer-about">
                  <div className="footer-widget-title">
                    <h4>About Doccure </h4>
                  </div>
                  <p>
                    We can guide you through issues like Cardiac arrest, Heart
                    Failure, Peripheral Artery Disease, Arrhythmia, Atrial
                    Fibrillation, Cholesterol and High BP.
                  </p>
                  <div className="subscribe-form">
                    <form action="#">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email Address"
                      />
                      <button type="submit" className="btn">
                        Subscribe
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-3">
                <div className="footer-widget footer-menu">
                  <div className="footer-widget-title">
                    <h4>Useful Links</h4>
                  </div>
                  <ul>
                    <li>
                      <Link href="/home-7">Home</Link>
                    </li>
                    <li>
                      <Link href="/doctor/doctor-dashboard">Doctors</Link>
                    </li>
                    <li>
                      <Link href="/patient/dashboard">Patients</Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/Pharmacy-index">Pharmacy</Link>
                    </li>
                    <li>
                      <Link href="#">Pages</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-3">
                <div className="footer-widget footer-menu">
                  <div className="footer-widget-title">
                    <h4>Services</h4>
                  </div>
                  <ul>
                    <li>
                      <Link href="/home-10">Obstetric care</Link>
                    </li>
                    <li>
                      <Link href="#">Prenatal care</Link>
                    </li>
                    <li>
                      <Link href="#">Ultrasound imaging</Link>
                    </li>
                    <li>
                      <Link href="#">Maternity and baby supplies</Link>
                    </li>
                    <li>
                      <Link href="#">Counseling &amp; Education</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-3">
                <div className="footer-widget footer-menu">
                  <div className="footer-widget-title">
                    <h4>Quick Links</h4>
                  </div>
                  <ul>
                    <li>
                      <Link href="/pages/privacy-policy">Privacy Policy</Link>
                    </li>
                    <li>
                      <Link href="/pages/terms">Terms &amp; Conditions</Link>
                    </li>
                    <li>
                      <Link href="/pages/privacy-policy">Refund Policy</Link>
                    </li>
                    <li>
                      <Link href="/pages/faq">FAQ</Link>
                    </li>
                    <li>
                      <Link href="/blog/blog-grid">Blogs</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-3">
                <div className="footer-widget footer-menu">
                  <div className="footer-widget-title">
                    <h4>Get In Touch</h4>
                  </div>
                  <ul>
                    <li>
                      <span>
                        <i className="fa-solid fa-location-dot" />
                        Address
                      </span>
                      <p>123 Street Name, City, USA</p>
                    </li>
                    <li>
                      <span>
                        <i className="fa-solid fa-phone" />
                        Phone Number
                      </span>
                      <p>+1 315 369 5943</p>
                    </li>
                    <li>
                      <span>
                        <i className="fa-regular fa-envelope" />
                        Email Address
                      </span>
                      <p>doccure@example.com</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            {/* Copyright */}
            <div className="copyright">
              <div className="row align-items-center">
                <div className="col-md-6 col-lg-6">
                  <div className="copyright-text">
                    <p className="mb-0">
                      {" "}
                      Copyright © 2024 Doccure. All Rights Reserved
                    </p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-6">
                  {/* Social Links */}
                  <ul className="social-links">
                    <li>
                      <Link href="#">
                        <i className="fa-brands fa-facebook" />
                      </Link>
                    </li>
                    <li>
                      <Link href="#">
                        <i className="fa-brands fa-instagram" />
                      </Link>
                    </li>
                    <li>
                      <Link href="#">
                        <i className="fa-brands fa-twitter" />
                      </Link>
                    </li>
                    <li>
                      <Link href="#">
                        <i className="fa-brands fa-linkedin" />
                      </Link>
                    </li>
                  </ul>
                  {/* /Social Links */}
                </div>
              </div>
            </div>
            {/* /Copyright */}
          </div>
        </div>
      </footer>
      {/* /Footer */}
    </div>
  );
};

export default Home7Footer;
