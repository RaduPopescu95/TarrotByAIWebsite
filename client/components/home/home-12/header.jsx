import React, { useEffect, useState } from "react";
import ImageWithBasePath from "../../../../core/img/imagewithbasebath";
import Link from "next/link";

const Home12Header = () => {
  const [headerClass, setHeaderClass] = useState(
    "header header-fixed header-fourteen header-twelve header-thirteen"
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        setHeaderClass(
          "header header-fixed header-fourteen header-twelve header-thirteen pharmacy-header"
        );
      } else {
        setHeaderClass(
          "header header-fixed header-fourteen header-twelve header-thirteen"
        );
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <div>
      {" "}
      {/* Header */}
      <header className={headerClass}>
        <div className="container">
          <nav className="navbar navbar-expand-lg header-nav">
            <div className="navbar-header">
              <Link id="mobile_btn" href="#">
                <span className="bar-icon">
                  <span />
                  <span />
                  <span />
                </span>
              </Link>
              <Link href="/home-1" className="navbar-brand logo">
                <ImageWithBasePath
                  src="assets/img/logo.svg"
                  className="img-fluid"
                  alt="Logo"
                />
              </Link>
            </div>
            <div className="main-menu-wrapper">
              <div className="menu-header">
                <Link href="/home-1" className="menu-logo">
                  <ImageWithBasePath
                    src="assets/img/logo.png"
                    className="img-fluid"
                    alt="Logo"
                  />
                </Link>
                <Link id="menu_close" className="menu-close" href="#">
                  <i className="fas fa-times" />
                </Link>
              </div>
              <ul className="main-nav">
                <li className="has-submenu megamenu active">
                  <Link href="#">
                    Home <i className="fas fa-chevron-down" />
                  </Link>
                  <ul className="submenu mega-submenu">
                    <li>
                      <div className="megamenu-wrapper">
                        <div className="row">
                          <div className="col-lg-2">
                            <div className="single-demo ">
                              <div className="demo-img">
                                <Link href="/home-1" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-01.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-1" className="inner-demo-img">
                                  General Home 1
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-2" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-02.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-2" className="inner-demo-img">
                                  General Home 2
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-3" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-03.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-3" className="inner-demo-img">
                                  General Home 3
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-5" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-04.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-5" className="inner-demo-img">
                                  Cardiology
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-6" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-05.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-6" className="inner-demo-img">
                                  Eyecare
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo ">
                              <div className="demo-img">
                                <Link href="/home-7" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-06.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-7" className="inner-demo-img">
                                  Veterinary
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-8" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-07.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-8" className="inner-demo-img">
                                  Pediatric
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-9" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-08.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-9" className="inner-demo-img">
                                  Fertility
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link
                                  href="/home-10"
                                  className="inner-demo-img"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/home/home-09.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link
                                  href="/home-10"
                                  className="inner-demo-img"
                                >
                                  ENT
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link
                                  href="/home-11"
                                  className="inner-demo-img"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/home/home-10.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link
                                  href="/home-11"
                                  className="inner-demo-img"
                                >
                                  Cosmetics
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo active">
                              <div className="demo-img">
                                <Link
                                  href="/home-12"
                                  className="inner-demo-img"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/home/home-11.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link
                                  href="/home-12"
                                  className="inner-demo-img"
                                >
                                  Lab Test
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link
                                  href="/Pharmacy/Pharmacy-index"
                                  className="inner-demo-img"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/home/home-12.jpg"
                                    className="img-fluid"
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link
                                  href="/home-12"
                                  className="inner-demo-img"
                                >
                                  Pharmacy
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link
                                  href="/home-13"
                                  className="inner-demo-img"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/home/home-13.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link
                                  href="/home-13"
                                  className="inner-demo-img"
                                >
                                  Home Care
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link
                                  href="/home-14"
                                  className="inner-demo-img"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/home/home-14.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link
                                  href="/home-14"
                                  className="inner-demo-img"
                                >
                                  Dentists
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </li>
                <li className="has-submenu">
                  <Link href="#">
                    Doctors <i className="fas fa-chevron-down" />
                  </Link>
                  <ul className="submenu">
                    <li>
                      <Link href="/doctor/doctor-dashboard">
                        Doctor Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/doctor/appointments">Appointments</Link>
                    </li>
                    <li>
                      <Link href="/doctor/available-timings">
                        Available Timing
                      </Link>
                    </li>
                    <li>
                      <Link href="/doctor/my-patients">Patients List</Link>
                    </li>
                    <li>
                      <Link href="/doctor/patient-profile">
                        Patients Profile
                      </Link>
                    </li>
                    <li>
                      <Link href="/doctor/chat-doctor">Chat</Link>
                    </li>
                    <li>
                      <Link href="/doctor/invoices">Invoices</Link>
                    </li>
                    <li>
                      <Link href="/doctor/profile-setting">
                        Profile Settings
                      </Link>
                    </li>
                    <li>
                      <Link href="/doctor/review">Reviews</Link>
                    </li>
                    <li>
                      <Link href="/doctor/doctor-register">
                        Doctor Register
                      </Link>
                    </li>
                    <li className="has-submenu">
                      <Link href="/doctor-blog">Blog</Link>
                      <ul className="submenu">
                        <li>
                          <Link href="/doctor-blog">Blog</Link>
                        </li>
                        <li>
                          <Link href="/blog/blog-details">Blog view</Link>
                        </li>
                        <li>
                          <Link href="/blog/doctor-add-blog">Add Blog</Link>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li className="has-submenu">
                  <Link href="#">
                    Patients <i className="fas fa-chevron-down" />
                  </Link>
                  <ul className="submenu">
                    <li>
                      <Link href="/patient/dashboard">Patient Dashboard</Link>
                    </li>
                    <li className="has-submenu">
                      <Link href="#">Doctors</Link>
                      <ul className="submenu inner-submenu">
                        <li>
                          <Link href="/patient/doctor-grid">Map Grid</Link>
                        </li>
                        <li>
                          <Link href="/patient/doctor-list">Map List</Link>
                        </li>
                      </ul>
                    </li>
                    <li className="has-submenu">
                      <Link href="#">Search Doctor</Link>
                      <ul className="submenu inner-submenu">
                        <li>
                          <Link href="/patient/search-doctor1">
                            Search Doctor 1
                          </Link>
                        </li>
                        <li>
                          <Link href="/patient/search-doctor2">
                            Search Doctor 2
                          </Link>
                        </li>
                      </ul>
                    </li>
                    <li className="has-submenu">
                      <Link href="#">Doctor Profile</Link>
                      <ul className="submenu inner-submenu">
                        <li>
                          <Link href="/patient/doctor-profile">
                            Doctor Profile 1
                          </Link>
                        </li>
                        <li>
                          <Link href="/patient/doctor-profile2">
                            Doctor Profile 2
                          </Link>
                        </li>
                      </ul>
                    </li>
                    <li className="has-submenu">
                      <Link href="#">Booking</Link>
                      <ul className="submenu inner-submenu">
                        <li>
                          <Link href="/patient/booking1">Booking 1</Link>
                        </li>
                        <li>
                          <Link href="/patient/booking2">Booking 2</Link>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <Link href="/patient/checkout">Checkout</Link>
                    </li>
                    <li>
                      <Link href="/patient/booking-success">
                        Booking Success
                      </Link>
                    </li>
                    <li>
                      <Link href="/patient/favourites">Favourites</Link>
                    </li>
                    <li>
                      <Link href="/patient/patient-chat">Chat</Link>
                    </li>
                    <li>
                      <Link href="/patient/profile">Profile Settings</Link>
                    </li>
                    <li>
                      <Link href="/patient/change-password">
                        Change Password
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className="has-submenu">
                  <Link href="#">
                    Pharmacy <i className="fas fa-chevron-down" />
                  </Link>
                  <ul className="submenu">
                    <li>
                      <Link href="/Pharmacy/Pharmacy-index">Pharmacy</Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/Pharmacy-details">
                        Pharmacy Details
                      </Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/pharmacy-search">
                        Pharmacy Search
                      </Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/product-all">Product</Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/product-description">
                        Product Description
                      </Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/cart">Cart</Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/product-checkout">
                        Product Checkout
                      </Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/payment-success">
                        Payment Success
                      </Link>
                    </li>
                    <li>
                      <Link href="/Pharmacy/pharmacy-register">
                        Pharmacy Register
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className="has-submenu">
                  <Link href="#">
                    Pages <i className="fas fa-chevron-down" />
                  </Link>
                  <ul className="submenu">
                    <li>
                      <Link href="/pages/aboutus">About Us</Link>
                    </li>
                    <li>
                      <Link href="/pages/contactus">Contact Us</Link>
                    </li>
                    <li className="has-submenu">
                      <Link href="#">Call</Link>
                      <ul className="submenu inner-submenu">
                        <li>
                          <Link href="/pages/voice-call">Voice Call</Link>
                        </li>
                        <li>
                          <Link href="/pages/video-call">Video Call</Link>
                        </li>
                      </ul>
                    </li>
                    <li className="has-submenu">
                      <Link href="#">Invoices</Link>
                      <ul className="submenu inner-submenu">
                        <li>
                          <Link href="/doctor/invoices">Invoices</Link>
                        </li>
                        <li>
                          <Link href="/pages/invoice">Invoice View</Link>
                        </li>
                      </ul>
                    </li>
                    <li className="has-submenu">
                      <Link href="#">Authentication</Link>
                      <ul className="submenu inner-submenu">
                        <li>
                          <Link href="/pages/login-email">Login Email</Link>
                        </li>
                        <li>
                          <Link href="/pages/login-phone">Login Phone</Link>
                        </li>
                        <li>
                          <Link href="/pages/doctor-signup">Doctor Signup</Link>
                        </li>
                        <li>
                          <Link href="/pages/patient-signup">
                            Patient Signup
                          </Link>
                        </li>
                        <li>
                          <Link href="/pages/forgot-password">
                            Forgot Password 1
                          </Link>
                        </li>
                        <li>
                          <Link href="/pages/forgot-password2">
                            Forgot Password 2
                          </Link>
                        </li>
                        <li>
                          <Link href="/pages/email-otp">Email OTP</Link>
                        </li>
                        <li>
                          <Link href="/pages/phone-otp">Phone OTP</Link>
                        </li>
                      </ul>
                    </li>
                    <li className="has-submenu">
                      <Link href="#">Error Pages</Link>
                      <ul className="submenu inner-submenu">
                        <li>
                          <Link href="/pages/error-404">404 Error</Link>
                        </li>
                        <li>
                          <Link href="/pages/error-500">500 Error</Link>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <Link href="/pages/blank-page">Starter Page</Link>
                    </li>
                    <li>
                      <Link href="/pages/pricing-plan">Pricing Plan</Link>
                    </li>
                    <li>
                      <Link href="/pages/faq">FAQ</Link>
                    </li>
                    <li>
                      <Link href="/pages/maintenance">Maintenance</Link>
                    </li>
                    <li>
                      <Link href="/pages/comingsoon">Coming Soon</Link>
                    </li>
                    <li>
                      <Link href="/pages/terms">Terms &amp; Condition</Link>
                    </li>
                    <li>
                      <Link href="/pages/privacy-policy">Privacy Policy</Link>
                    </li>
                    <li>
                      <Link href="/pages/component">Components</Link>
                    </li>
                  </ul>
                </li>
                <li className="has-submenu">
                  <Link href="#">
                    Blog <i className="fas fa-chevron-down" />
                  </Link>
                  <ul className="submenu">
                    <li>
                      <Link href="/blog/blog-list">Blog List</Link>
                    </li>
                    <li>
                      <Link href="/blog/blog-grid">Blog Grid</Link>
                    </li>
                    <li>
                      <Link href="/blog/blog-details">Blog Details</Link>
                    </li>
                  </ul>
                </li>
                <li className="has-submenu">
                  <Link href="#">
                    Admin <i className="fas fa-chevron-down" />
                  </Link>
                  <ul className="submenu">
                    <li>
                      <Link href="/admin" target="_blank">
                        Admin
                      </Link>
                    </li>
                    <li>
                      <Link href="/pharmacyadmin" target="_blank">
                        Pharmacy Admin
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className="login-link">
                  <Link href="/pages/login-email">Login / Signup</Link>
                </li>
              </ul>
            </div>
            <ul className="nav header-navbar-rht">
              <li className="login-in-fourteen">
                <Link
                  href="/pages/login-email"
                  className="btn reg-btn log-btn-twelve"
                >
                  Log In
                </Link>
              </li>
              <li className="login-in-fourteen">
                <Link href="/signup" className="reg-btn-thirteen regist-btn">
                  <span>Register</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      {/* /Header */}
    </div>
  );
};

export default Home12Header;
