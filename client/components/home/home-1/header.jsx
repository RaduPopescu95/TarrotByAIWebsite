import React, { useEffect, useState } from "react";
// import ImageWithBasePath from "../../../../core/img/imagewithbasebath";
import Link from "next/link";
import { useAuth } from "../../../../context/AuthContext";

const Home1Header = () => {
  const [searchField, setSearchField] = useState(false);
  const {
    currentUser,
    userData,
    loading,
    setLoading,
    setCurrentUser,
    setUserData,
  } = useAuth();

  const toggleSearch = () => {
    setSearchField(!searchField);
  };
  // const history = useHistory();

  // const directionPath = () => {
  //   history.push("/patient/search-doctor1");
  // };
  useEffect(() => {
    console.log("currentUser....", currentUser);
  }, []);

  return (
    <>
      <header className="header header-custom header-fixed header-one home-head-one">
        <div className="container">
          <nav className="navbar navbar-expand-lg header-nav">
            <div className="navbar-header">
              <Link
                href="#0"
                id="mobile_btn"
                onClick={() => onHandleMobileMenu()}
              >
                <span className="bar-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </Link>
              <Link href="/home-2" className="navbar-brand logo">
                {pathnames.includes("/index-5") ? (
                  <img src={logo_white} className="img-fluid" alt="Logo" />
                ) : pathnames.includes(
                    "/react/template/Pharmacy/Pharmacy-index"
                  ) ? (
                  <div className="browse-categorie">
                    <div className="dropdown categorie-dropdown">
                      <Link
                        href="#"
                        className="dropdown-toggle"
                        data-bs-toggle="dropdown"
                      >
                        <img src={Browser_categorie} alt /> Browse Categories
                      </Link>
                      <div className="dropdown-menu">
                        <Link className="dropdown-item" href="#">
                          Ayush
                        </Link>
                        <Link className="dropdown-item" href="#">
                          Covid Essentials
                        </Link>
                        <Link className="dropdown-item" href="#">
                          Devices
                        </Link>
                        <Link className="dropdown-item" href="#">
                          Glucometers
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={
                      pathnames === "/react/template/index-6" ||
                      pathnames === "/react/template/index-4"
                        ? logosvg
                        : pathnames === "/react/template/index-11"
                          ? logo_15
                          : pathnames === "/react/template/index-10"
                            ? logo_15
                            : pathnames === "/react/template/index-9"
                              ? logo_03
                              : pathnames === "/react/template/index-7"
                                ? logo_svg
                                : pathnames == "/react/template/index-13"
                                  ? logo_white
                                  : logo
                    }
                    className="img-fluid"
                    alt="Logo"
                  />
                )}
              </Link>
            </div>
            <div className="main-menu-wrapper">
              <div className="menu-header">
                {/* <Link href="/home-1" className="menu-logo">
                  <ImageWithBasePath
                    src="assets/img/logo-01.svg"
                    className="img-fluid"
                    alt="Logo"
                  />
                </Link> */}
                <Link id="menu_close" className="menu-close" href="#">
                  <i className="fas fa-times" />
                </Link>
              </div>
              <ul className="main-nav">
                <li className="has-submenu megamenu active">
                  <Link href="/consultatii">
                    {/* Acasa <i className="fas fa-chevron-down" /> */}
                    Acasa
                  </Link>
                  {/* <ul className="submenu mega-submenu">
                    <li>
                      <div className="megamenu-wrapper">
                        <div className="row">
                          <div className="col-lg-2">
                            <div className="single-demo active">
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
                                <Link href="/home-10" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-09.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-10" className="inner-demo-img">
                                  ENT
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-11" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-10.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-11" className="inner-demo-img">
                                  Cosmetics
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-12" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-11.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-12" className="inner-demo-img">
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
                                <Link href="/home-12" className="inner-demo-img">
                                  Pharmacy
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-13" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-13.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-13" className="inner-demo-img">
                                  Home Care
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-2">
                            <div className="single-demo">
                              <div className="demo-img">
                                <Link href="/home-14" className="inner-demo-img">
                                  <ImageWithBasePath
                                    src="assets/img/home/home-14.jpg"
                                    className="img-fluid "
                                    alt="img"
                                  />
                                </Link>
                              </div>
                              <div className="demo-info">
                                <Link href="/home-14" className="inner-demo-img">
                                  Dentists
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul> */}
                </li>
                <li className="has-submenu">
                  <Link href="/">
                    {/* Cristina Zurba - Tarot <i className="fas fa-chevron-down" /> */}
                    Cristina Zurba - Tarot
                  </Link>
                  {/* <ul className="submenu">
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
                      <Link href="/doctor/patient-profile">Patients Profile</Link>
                    </li>
                    <li>
                      <Link href="/doctor/chat-doctor">Chat</Link>
                    </li>
                    <li>
                      <Link href="/doctor/invoices">Invoices</Link>
                    </li>
                    <li>
                      <Link href="/doctor/profile-setting">Profile Settings</Link>
                    </li>
                    <li>
                      <Link href="/doctor/review">Reviews</Link>
                    </li>
                    <li>
                      <Link href="/doctor/doctor-register">Doctor Register</Link>
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
                  </ul> */}
                </li>
                {/* <li className="has-submenu">
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
                          <Link href="doctor-profile-2.html">
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
                      <Link href="/patient/booking-success">Booking Success</Link>
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
                      <Link href="/patient/change-password">Change Password</Link>
                    </li>
                  </ul>
                </li> */}
                {/* <li className="has-submenu">
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
                </li> */}
                <li className="has-submenu">
                  <Link href="/despre-platforma">Despre platforma</Link>
                  {/* <ul className="submenu">
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
                          <Link href="/pages/patient-signup">Patient Signup</Link>
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
                  </ul> */}
                </li>
                <li className="has-submenu">
                  <Link href="/politica-platforma">
                    Termeni si conditii
                    {/* Termeni si conditii <i className="fas fa-chevron-down" /> */}
                  </Link>
                  {/* <ul className="submenu">
                    <li>
                      <Link href="/blog/blog-list">Blog List</Link>
                    </li>
                    <li>
                      <Link href="/blog/blog-grid">Blog Grid</Link>
                    </li>
                    <li>
                      <Link href="/blog/blog-details">Blog Details</Link>
                    </li>
                  </ul> */}
                </li>
                {/* <li className="has-submenu">
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
                </li> */}
                {/* <li className="searchbar">
                  <Link href="#" onClick={toggleSearch}>
                    <i className="feather icon-search" />
                  </Link>
                  <div
                    className={
                      searchField
                        ? "togglesearch d-block"
                        : "togglesearch d-none"
                    }
                  >
                    <form>
                      <div className="input-group">
                        <input type="text" className="form-control" />
                        <button
                          type="submit"
                          className="btn"
                          onClick={directionPath}
                        >
                          Search
                        </button>
                      </div>
                    </form>
                  </div>
                </li> */}
                <li className="login-link">
                  <Link href="/login-client">Login / Signup</Link>
                </li>
              </ul>
            </div>
            {currentUser &&
            currentUser.uid != "AW8kjQIhAiaJM5q0QgGlOKpGF2j1" ? (
              <ul className="nav header-navbar-rht">
                <li className="register-btn">
                  <Link href="/cont-client" className="btn btn-primary log-btn">
                    <i className="feather icon-user" />
                    Cont
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="nav header-navbar-rht">
                <li className="register-btn">
                  <Link href="/register-client" className="btn reg-btn">
                    <i className="feather icon-user" />
                    înregistrează
                  </Link>
                </li>
                <li className="register-btn">
                  <Link
                    href="/login-client"
                    className="btn btn-primary log-btn"
                  >
                    <i className="feather icon-lock" />
                    Login
                  </Link>
                </li>
              </ul>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Home1Header;
