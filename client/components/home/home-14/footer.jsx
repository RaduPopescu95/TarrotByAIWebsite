import React, { useEffect } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";

const Home14Footer = () => {
  AOS.init();
  useEffect(() => {
    AOS.init({
      duration: 1000,
    });
  }, []);
  const handleScroll = () => {
    AOS.refresh();
  };
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <div>
      {" "}
      {/* Footer */}
      <footer className="footer footer-eleven dentist-footer">
        <div className="footer-top aos aos-init aos-animate" data-aos="fade-up">
          <div className="container">
            <div className="row">
              <div className="col-lg-3 col-md-6">
                <div className="footer-widget footer-about">
                  <div className="footer-widget-title">
                    <h4>About </h4>
                  </div>
                  <p>
                    Dental care is essential for maintaining oral health and
                    overall well-being. It involves practices aimed at
                    preventing dental problems, treating existing issues.
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
              <div className="col-lg-2 col-md-6">
                <div className="footer-widget footer-menu">
                  <div className="footer-widget-title">
                    <h4>Useful Links</h4>
                  </div>
                  <ul>
                    <li>
                      <Link href="/home-14">Home</Link>
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
              <div className="col-xl-3 col-lg-3 col-md-6">
                <div className="footer-widget footer-menu">
                  <div className="footer-widget-title">
                    <h4>Services</h4>
                  </div>
                  <ul>
                    <li>
                      <Link href="/home-10">Cardiac Consultation</Link>
                    </li>
                    <li>
                      <Link href="#">Diagnostic Testing</Link>
                    </li>
                    <li>
                      <Link href="#">Treatments</Link>
                    </li>
                    <li>
                      <Link href="#">Interventional Procedure</Link>
                    </li>
                    <li>
                      <Link href="#">Electrophysiology</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-4 col-lg-3 col-md-6">
                <div className="footer-widget footer-menu">
                  <div className="footer-widget-title">
                    <h4>Contact Us</h4>
                  </div>
                  <ul>
                    <li>
                      <span className="icon-contact">
                        <i className="fa-solid fa-phone" />
                      </span>
                      <p>
                        <span>Looking for Consultation</span>+1 315 369 5943
                      </p>
                    </li>
                    <li>
                      <span className="icon-contact">
                        <i className="fa-regular fa-envelope" />
                      </span>
                      <p>
                        <span>Email Address</span>doccure@example.com
                      </p>
                    </li>
                    <li>
                      <span className="icon-contact">
                        <i className="fa-solid fa-location-dot" />
                      </span>
                      <p>
                        <span>Address</span>123 Street Name, City, USA
                      </p>
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
                <div className="col-xl-4">
                  <div className="copyright-text">
                    <p>Copyright © 2024 Doccure. All Rights Reserved</p>
                  </div>
                </div>
                <div className="col-xl-5">
                  {/* Copyright Menu */}
                  <div className="copyright-menu">
                    <ul className="policy-menu">
                      <li>
                        <Link href="/pages/privacy-policy">Privacy Policy</Link>
                      </li>
                      <li>
                        <Link href="/pages/terms">Terms and Conditions</Link>
                      </li>
                      <li>
                        <Link href="pr">Refund Policy</Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Copyright Menu */}
                </div>
                <div className="col-xl-3">
                  <div className="footer-bottom-logo">
                    <div className="social-icon">
                      <ul>
                        <li>
                          <Link href="#">
                            <i className="fab fa-facebook" />{" "}
                          </Link>
                        </li>
                        <li>
                          <Link href="#">
                            <i className="fab fa-instagram" />
                          </Link>
                        </li>
                        <li>
                          <Link href="#">
                            <i className="fab fa-twitter" />{" "}
                          </Link>
                        </li>
                        <li>
                          <Link href="#">
                            <i className="fab fa-linkedin-in" />
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
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

export default Home14Footer;
