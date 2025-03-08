import React from "react";
import Link from "next/link";
import ImageWithBasePath from "../../../../core/img/imagewithbasebath";

const Home12Footer = () => {
  return (
    <div>
      {" "}
      {/* Footer */}
      <footer className="footer-twelve">
        <div className="footer-top-sec">
          <div className="container">
            <div className="footer-top">
              <div className="logo-footer">
                <ImageWithBasePath
                  src="assets/img/icons/footer-logo-.svg"
                  alt="Img"
                />
              </div>
              <div className="footer-buy-btn">
                <h6>Ready to get started with Doccure?</h6>
                <Link href="/patient/booking2" className="btn btn-primary">
                  Book Now
                </Link>
              </div>
            </div>
            <div className="footer-middle">
              <div className="row">
                <div className="col-lg-3 col-md-5 col-sm-6">
                  <div className="footer-links-middle">
                    <h4>Contact Us</h4>
                    <ul>
                      <li>
                        <span>
                          <i className="feather icon-map-pin" />
                        </span>
                        3556 Beech Street, USA
                      </li>
                      <li>
                        <span>
                          <i className="feather icon-phone" />
                        </span>
                        +1 315 369 5943
                      </li>
                      <li>
                        <span>
                          <i className="feather icon-mail" />
                        </span>
                        info@example.com
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-2 col-md-3 col-sm-6">
                  <div className="footer-links-middle">
                    <h4>Company</h4>
                    <ul>
                      <li>
                        <Link href="/pages/aboutus">About Us</Link>
                      </li>
                      <li>
                        <Link href="/blog/blog-grid">Blogs</Link>
                      </li>
                      <li>
                        <Link href="#">Careers</Link>
                      </li>
                      <li>
                        <Link href="#">Success Stories</Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <div className="footer-links-middle">
                    <h4>Specialities</h4>
                    <ul>
                      <li>
                        <Link href="#">Pregnancy Test</Link>
                      </li>
                      <li>
                        <Link href="#">Vitamin D &amp; B12 Combo</Link>
                      </li>
                      <li>
                        <Link href="#">Cancer Screening - Male</Link>
                      </li>
                      <li>
                        <Link href="#">Advanced Renal Package</Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-4 col-sm-6">
                  <div className="footer-links-middle">
                    <h4>Join Our Newsletter</h4>
                    <form action="/home-12">
                      <div className="input-block">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Enter Email Address"
                        />
                        <button className="submit-btn">Submit</button>
                      </div>
                    </form>
                    <p>* Will send you weekly updates for your better</p>
                    <ul className="social-icons">
                      <li>
                        <Link href="#" className="fb">
                          <i className="fa-brands fa-facebook-f" />
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="insta">
                          <i className="fa-brands fa-instagram" />
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="linked-in">
                          <i className="fa-brands fa-linkedin-in" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fooeter-bottom">
          <div className="container">
            <div className="copy-right-footer">
              <h5>Copyright © 2024 Doccure. All Rights Reserved</h5>
              <ul className="privacy-policy">
                <li>
                  <Link href="/pages/privacy-policy">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/pages/terms">Terms &amp; Conditions</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
      {/* /Footer */}
    </div>
  );
};

export default Home12Footer;
