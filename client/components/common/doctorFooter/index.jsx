import React from "react";
import {
  app_icon_store,
  google_icon_play,
  logo,
  payment_icon_01,
  payment_icon_02,
  payment_icon_03,
  payment_icon_04,
} from "../../imagepath";
import Link from "next/link";
const DoctorFooter = () => {
  return (
    <>
      {/* Footer Section */}
      <div className="footer pharmacy-footer">
        <div className="container">
          <div className="top-footer">
            <div className="footer-logo">
              <Link href="/home-1">
                <img src={logo} alt="logo" />
              </Link>
            </div>
            <div className="doccure-info">
              <p>
                Doccure is one of India’s most trusted pharmacies, dispensing
                quality medicines at reasonable prices to over 9 million happy
                customers
              </p>
            </div>
          </div>
          <div className="mid-footer">
            <div className="row">
              <div className="col-xl-2 col-lg-3 col-md-4">
                <div className="footer-links">
                  <h4>Company</h4>
                  <ul className="pages-links">
                    <li>
                      <Link href="/pages/aboutus">About Doccure</Link>
                    </li>
                    <li>
                      <Link href="#">Customers Speak</Link>
                    </li>
                    <li>
                      <Link href="#">In the News</Link>
                    </li>
                    <li>
                      <Link href="#">Career</Link>
                    </li>
                    <li>
                      <Link href="/pages/contactus">Contact</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-lg-3 col-md-4">
                <div className="footer-links">
                  <h4>Shopping</h4>
                  <ul className="pages-links">
                    <li>
                      <Link href="#">Browse by A-Z</Link>
                    </li>
                    <li>
                      <Link href="#">Browse by Manufacturers</Link>
                    </li>
                    <li>
                      <Link href="#">Health Articles</Link>
                    </li>
                    <li>
                      <Link href="#">Offers / Coupons</Link>
                    </li>
                    <li>
                      <Link href="/pages/faq">FAQs</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-lg-3 col-md-4">
                <div className="footer-links">
                  <h4>Our Policies</h4>
                  <ul className="pages-links">
                    <li>
                      <Link href="/pages/terms">Terms and Conditions</Link>
                    </li>
                    <li>
                      <Link href="/pages/privacy-policy">Privacy Policy</Link>
                    </li>
                    <li>
                      <Link href="#">Fees and Payments</Link>
                    </li>
                    <li>
                      <Link href="#">Shipping and Delivery</Link>
                    </li>
                    <li>
                      <Link href="#">Return, Refund </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-lg-3 col-md-4">
                <div className="footer-links">
                  <h4>Our Services</h4>
                  <ul className="pages-links">
                    <li>
                      <Link href="#">Order Medicines</Link>
                    </li>
                    <li>
                      <Link href="#">Book Lab Tests</Link>
                    </li>
                    <li>
                      <Link href="#">Consult a Doctor</Link>
                    </li>
                    <li>
                      <Link href="#">Ayurveda Articles</Link>
                    </li>
                    <li>
                      <Link href="#">Careers</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-4 col-lg-6 col-md-8">
                <div className="footer-links">
                  <h4>Subscribe to Newsletter</h4>
                  <form action="#">
                    <div className="input-block">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter Email Address"
                      />
                      <Link href="submit" className="submit-btn">
                        Submit
                      </Link>
                    </div>
                  </form>
                  <div className="app-store-links">
                    <Link href="#">
                      <img src={app_icon_store} alt="Img" />
                    </Link>
                    <Link href="#">
                      <img src={google_icon_play} alt="Img" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mid-foot-two">
            <div className="row align-items-center">
              <div className="col-md-6">
                <ul className="payment-methods d-flex align-items-center">
                  <li>
                    <Link href="#">
                      <img src={payment_icon_01} alt="Img" />
                    </Link>
                  </li>
                  <li>
                    <Link href="#">
                      <img src={payment_icon_02} alt="Img" />
                    </Link>
                  </li>
                  <li>
                    <Link href="#">
                      <img src={payment_icon_03} alt="Img" />
                    </Link>
                  </li>
                  <li>
                    <Link href="#">
                      <img src={payment_icon_04} alt="Img" />
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <ul className="social-icons d-flex align-items-center">
                  <li>
                    <Link href="#">
                      <i className="fa-brands fa-facebook-f" />
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
                  <li>
                    <Link href="#">
                      <i className="fa-brands fa-instagram" />
                    </Link>
                  </li>
                  <li>
                    <Link href="#">
                      <i className="fa-brands fa-dribbble" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="copy-right text-center">
            <p>Copyright © 2024 Doccure. All Rights Reserved</p>
          </div>
        </div>
      </div>
      {/* /Footer Section */}
    </>
  );
};

export default DoctorFooter;
