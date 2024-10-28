import React, { useEffect } from "react";
import Link from "next/link";
import ImageWithBasePath from "../../../../core/img/imagewithbasebath";
import AOS from "aos";
import "aos/dist/aos.css";

const Home10Footer = () => {
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
      <footer className="footer footer-fifteen">
        <div className="footer-top footer-top-fifteen aos" data-aos="fade-up">
          <div className="container">
            <div className="row join-news-row">
              <div className="col-lg-8 col-md-6">
                <div className="join-news-foot">
                  <h4>Join Our Newsletter</h4>
                  <p>Subscribe Now for Exclusive Insights &amp; Offers</p>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="form-set">
                  <form action="index-10.html">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter your Email"
                    />
                    <button type="submit" className="btn btn-primary">
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-4 col-md-6">
                <div className="footer-widget">
                  <div className="footer-logo">
                    <ImageWithBasePath src="assets/img/logo-15.png" alt="Img" />
                  </div>
                  <p>
                    Effortlessly schedule your medical appointments with
                    Doccure. Connect with healthcare professionals, manage
                    appointments &amp; prioritize your well being
                  </p>
                  <div className="social-links">
                    <ul>
                      <li>
                        <Link href="#">
                          <i className="fa-brands fa-facebook-f" />
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
                          <i className="fa-brands fa-linkedin-in" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-sm-6">
                <div className="footer-widget">
                  <div className="footer-title">
                    <h4>Quick Links</h4>
                  </div>
                  <ul className="link-foot">
                    <li>
                      <Link href="/pages/aboutus">About</Link>
                    </li>
                    <li>
                      <Link href="#">Faciities</Link>
                    </li>
                    <li>
                      <Link href="/doctor/my-patients">Patients</Link>
                    </li>
                    <li>
                      <Link href="#">Camp</Link>
                    </li>
                    <li>
                      <Link href="/patient/doctor-profile">Doctors</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-sm-6">
                <div className="footer-widget">
                  <div className="footer-title">
                    <h4>Services</h4>
                  </div>
                  <ul className="link-foot">
                    <li>
                      <Link href="#">Hearing and Balance Disorders</Link>
                    </li>
                    <li>
                      <Link href="#">Snoring and Sleep Apnea</Link>
                    </li>
                    <li>
                      <Link href="#">Voice and Swallowing Disorders</Link>
                    </li>
                    <li>
                      <Link href="#">Sinusitis and Rhinitis</Link>
                    </li>
                    <li>
                      <Link href="#">Allergy Testing and Treatment</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-sm-6">
                <div className="footer-widget">
                  <div className="footer-title">
                    <h4>Contact</h4>
                  </div>
                  <ul className="link-foot address">
                    <li>
                      <span>
                        <i className="fa-solid fa-location-dot" />
                      </span>
                      3556 Beech Street, San Francisco, California, CA 94108
                    </li>
                    <li>
                      <span>
                        <i className="fa-solid fa-mobile-screen-button" />
                      </span>
                      +1 315 369 5943
                    </li>
                    <li>
                      <span>
                        <i className="fa-solid fa-envelope" />
                      </span>
                      doccure@example.com
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <div className="bottom-items">
              <div className="row">
                <div className="col-md-6">
                  <div className="copy-right">
                    <p>Copyright © 2024 Doccure. All Rights Reserved</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="terms-con">
                    <ul>
                      <li>
                        <Link href="/pages/terms">Terms and Conditions</Link>
                      </li>
                      <li>
                        <Link href="/pages/privacy-policy">Policy</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* /Footer */}
    </div>
  );
};

export default Home10Footer;
