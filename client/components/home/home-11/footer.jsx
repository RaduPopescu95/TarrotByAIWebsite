import React from "react";
import Link from "next/link";
import ImageWithBasePath from "../../../../core/img/imagewithbasebath";

const Home11Footer = () => {
  return (
    <div>
      {" "}
      {/* Footer */}
      <footer className="footer footer-one footer-sixteen">
        <div className="footer-top">
          <div className="container">
            <div className="row">
              <div className="col-lg-4 col-md-4">
                <div className="footer-widget footer-about">
                  <div className="footer-logo">
                    <ImageWithBasePath
                      src="assets/img/logo-dark-blue.svg"
                      alt="logo"
                    />
                  </div>
                  <div className="footer-about-content">
                    <p>
                      We can guide you through issues like Cardiac arrest, Heart
                      Failure, Peripheral Artery Disease.
                    </p>
                  </div>
                  <div className="subscribe-form">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter Email Address"
                    />
                    <button type="submit" className="btn footer-btn">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4">
                <div className="footer-widget footer-menu">
                  <h2 className="footer-title">Company</h2>
                  <ul>
                    <li>
                      <Link href="/pages/aboutus">About us</Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/cart">Careers</Link>
                    </li>
                    <li>
                      <Link href="#">News</Link>
                    </li>
                    <li>
                      <Link href="/pages/contactus">Contact</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-4">
                <div className="footer-widget footer-menu">
                  <h2 className="footer-title">Resources</h2>
                  <ul>
                    <li>
                      <Link href="#">Events</Link>
                    </li>
                    <li>
                      <Link href="#">Help Centre</Link>
                    </li>
                    <li>
                      <Link href="#">Tutorials</Link>
                    </li>
                    <li>
                      <Link href="#">Support</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-5">
                <div className="footer-widget footer-menu">
                  <h2 className="footer-title">Social</h2>
                  <ul>
                    <li>
                      <Link href="#">Twitter</Link>
                    </li>
                    <li>
                      <Link href="#">LinkedIn</Link>
                    </li>
                    <li>
                      <Link href="#">Facebook</Link>
                    </li>
                    <li>
                      <Link href="#">Dribble</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-7">
                <div className="footer-widget footer-menu">
                  <h2 className="footer-title">Legal</h2>
                  <ul>
                    <li>
                      <Link href="/pages/terms">Terms &amp; Condition</Link>
                    </li>
                    <li>
                      <Link href="/pages/privacy-policy">Privacy Policy</Link>
                    </li>
                    <li>
                      <Link href="/pages/comingsoon">Cookies</Link>
                    </li>
                    <li>
                      <Link href="#">Licenses</Link>
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
              <div className="row">
                <div className="col-md-6 col-lg-6">
                  <div className="copyright-text">
                    <p>© 2024 Doccure. All rights reserved.</p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-6">
                  {/* Copyright Menu */}
                  <div className="copyright-menu">
                    <ul>
                      <li>
                        <Link href="#">
                          <i className="fa-brands fa-facebook-f" />
                        </Link>
                      </li>
                      <li>
                        <Link href="#">
                          <i className="fab fa-twitter" />{" "}
                        </Link>
                      </li>
                      <li>
                        <Link href="#">
                          <i className="fa-brands fa-whatsapp" />
                        </Link>
                      </li>
                      <li>
                        <Link href="#">
                          <i className="fa-brands fa-youtube" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Copyright Menu */}
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

export default Home11Footer;
