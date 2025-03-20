/* eslint-disable react/prop-types */
import React, { useState } from "react";
import Link from "next/link";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//icon
// import patient from "../../../../assets/images/patients/patient.jpg";
// import { faHospital } from "@fortawesome/free-regular-svg-icons";
import logo from "../../../../assets/images/logo.png";
import IMG01 from "../../../../assets/images/doctors/doctor-thumb-02.jpg";
import Dropdown from "react-bootstrap/Dropdown";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
// import { LinkOff } from "@material-ui/icons";
import {
  home_01,
  home_02,
  home_03,
  home_04,
  home_05,
  home_06,
  home_07,
  home_08,
  home_09,
  home_10,
  home_11,
} from "../../imagepath";
import { IMG02 } from "./img";
import Notification from "./notification";
import Chart from "./chart";

const Header = (props) => {
  const config = "/react/template";
  //Aos

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: true,
    });
  }, []);

  //mobile menu
  const [isSideMenu, setSideMenu] = useState("");
  const [isSideMenuone, setSideMenuone] = useState("");
  const [isSideMenutwo, setSideMenutwo] = useState("");
  const toggleSidebar = (value) => {
    setSideMenu(value);
  };
  const toggleSidebarone = (value) => {
    setSideMenuone(value);
  };
  const toggleSidebartwo = (value) => {
    setSideMenutwo(value);
  };

  let pathnames = window.location.pathname;

  // const [active, setActive] = useState(false);
  const url = pathnames.split("/").slice(0, -1).join("/");

  const onHandleMobileMenu = () => {
    var root = document.getElementsByTagName("html")[0];
    root.classList.add("menu-opened");
  };

  const onhandleCloseMenu = () => {
    var root = document.getElementsByTagName("html")[0];
    root.classList.remove("menu-opened");
  };

  return (
    <>
      {pathnames.includes("homeslider1") && (
        <div className="header-top">
          <div className="left-top ">
            <ul>
              <li>
                <i className="fas fa-map-marker-alt top-icon" />
                123, washington street, uk
              </li>
              <li>
                <i className="fas fa-phone-volume top-icon" />
                +19 123-456-7890
              </li>
              <li>
                <i className="fas fa-envelope top-icon" />
                mail@yourdomain.com
              </li>
            </ul>
          </div>
          <div className="right-top ">
            <ul>
              <li>
                <i className="fab fa-facebook-f top-icons" />
              </li>
              <li>
                <i className="fab fa-instagram top-icons" />
              </li>
              <li>
                <i className="fab fa-linkedin-in top-icons" />
              </li>
              <li>
                <i className="fab fa-twitter top-icons" />
              </li>
            </ul>
          </div>
        </div>
      )}
      {!pathnames.includes("home1") &&
        !pathnames.includes("home4") &&
        !pathnames.includes("home6") &&
        !pathnames.includes("home7") &&
        !pathnames.includes("paediatrichome") && (
          <header className="header header-fixed header-one">
            <div className="container">
              <nav
                className={`navbar navbar-expand-lg header-nav ${
                  pathnames.includes("home1") ? "nav-transparent" : ""
                }`}
              >
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
                    <img src={logo} className="img-fluid" alt="Logo" />
                  </Link>
                </div>
                <div className="main-menu-wrapper">
                  <div className="menu-header">
                    <Link href="/home-2" className="menu-logo">
                      <img src={logo} className="img-fluid" alt="Logo" />
                    </Link>
                    <Link
                      href="#0"
                      id="menu_close"
                      className="menu-close"
                      onClick={() => onhandleCloseMenu()}
                    >
                      <i className="fas fa-times"></i>
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
                                <div className="single-demo active">
                                  <div className="demo-img">
                                    <Link
                                      href="/home-1"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_11}
                                        className="img-fluid "
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home-1"
                                      className="inner-demo-img"
                                    >
                                      General Home
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo ">
                                  <div className="demo-img">
                                    <Link
                                      href="/home-2"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_10}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home-2"
                                      className="inner-demo-img"
                                    >
                                      General Home 2
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo">
                                  <div className="demo-img">
                                    <Link
                                      href="/home-3"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_09}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home-3"
                                      className="inner-demo-img"
                                    >
                                      General Home 3
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo">
                                  <div className="demo-img">
                                    <Link
                                      href="/home-4"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_08}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home-4"
                                      className="inner-demo-img"
                                    >
                                      General Home 4
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo">
                                  <div className="demo-img">
                                    <Link
                                      href="/home-1"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_07}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home-5"
                                      className="inner-demo-img"
                                    >
                                      Cardiology Home
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo">
                                  <div className="demo-img">
                                    <Link
                                      href="/homeslider2"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_06}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                      heade
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/homeslider2"
                                      className="inner-demo-img"
                                    >
                                      Eye Care Home
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo">
                                  <div className="demo-img">
                                    <Link
                                      href="/home-7"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_05}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home-7"
                                      className="inner-demo-img"
                                    >
                                      Veterinary Home
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo">
                                  <div className="demo-img">
                                    <Link
                                      href="/home-8"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_04}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home-8"
                                      className="inner-demo-img"
                                    >
                                      Paediatric Home
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo">
                                  <div className="demo-img">
                                    <Link
                                      href="/home-9"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_03}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home-9"
                                      className="inner-demo-img"
                                    >
                                      Fertility Home
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo">
                                  <div className="demo-img">
                                    <Link
                                      href="/home10"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_02}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home10"
                                      className="inner-demo-img"
                                    >
                                      ENT Hospital Home
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-2">
                                <div className="single-demo">
                                  <div className="demo-img">
                                    <Link
                                      href="/home11"
                                      className="inner-demo-img"
                                    >
                                      <img
                                        src={home_01}
                                        className="img-fluid"
                                        alt="img"
                                      />
                                    </Link>
                                  </div>
                                  <div className="demo-info">
                                    <Link
                                      href="/home11"
                                      className="inner-demo-img"
                                    >
                                      Cosmetics Home
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </li>
                    <li
                      className={`has-submenu ${
                        url.includes("/doctor") ? "active" : ""
                      }`}
                    >
                      <Link
                        className={isSideMenu == "doctors" ? "subdrop" : ""}
                        onMouseEnter={() =>
                          toggleSidebar(
                            isSideMenu == "doctors" ? "" : "doctors"
                          )
                        }
                      >
                        Doctors <i className="fas fa-chevron-down" />
                      </Link>
                      {isSideMenu == "doctors" ? (
                        <ul className={`submenu`}>
                          <li
                            className={
                              pathnames.includes("doctor-dashboard")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/doctor/doctor-dashboard"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Doctor Dashboard
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("appointments") ? "active" : ""
                            }
                          >
                            <Link
                              href="/doctor/appointments"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Appointments
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("schedule-timing")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/doctor/schedule-timing"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Schedule Timing
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("my-patients") ? "active" : ""
                            }
                          >
                            <Link
                              href="/doctor/my-patients"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Patients List
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("patient-profile")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/doctor/patient-profile"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Patients Profile
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("chat-doctor") ? "active" : ""
                            }
                          >
                            <Link
                              href="/doctor/chat-doctor"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Chat
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("invoice") ? "active" : ""
                            }
                          >
                            <Link
                              href="/pages/invoice"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Invoices
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("profile-setting")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/doctor/profile-setting"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Profile Settings
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("review") ? "active" : ""
                            }
                          >
                            <Link
                              href="/doctor/review"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Reviews
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("doctor-register")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/doctor/doctor-register"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Doctor Register
                            </Link>
                          </li>
                          <li
                            className={`has-submenu ${
                              pathnames.includes("doctor-blog") ? "active" : ""
                            }`}
                          >
                            <Link
                              href="/doctor-blog"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Blog
                            </Link>
                            <ul className="submenu">
                              <li>
                                <Link
                                  href="/doctor-blog"
                                  onClick={() => onhandleCloseMenu()}
                                >
                                  Blog
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/blog/blog-details"
                                  onClick={() => onhandleCloseMenu()}
                                >
                                  Blog view
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/blog/doctor-add-blog"
                                  onClick={() => onhandleCloseMenu()}
                                >
                                  Add Blog
                                </Link>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      ) : (
                        ""
                      )}
                    </li>
                    <li
                      className={`has-submenu ${
                        url.includes("/patient") ? "active" : ""
                      }`}
                    >
                      <Link
                        className={isSideMenu == "patients" ? "subdrop" : ""}
                        onMouseEnter={() =>
                          toggleSidebar(
                            isSideMenu == "patients" ? "" : "patients"
                          )
                        }
                      >
                        Patients <i className="fas fa-chevron-down" />
                      </Link>
                      {isSideMenu == "patients" ? (
                        <ul className={`submenu`}>
                          <li
                            className={`has-submenu ${
                              pathnames.includes("doctor") &&
                              !pathnames.includes("doctor-profile") &&
                              !pathnames.includes("search-doctor")
                                ? "active"
                                : ""
                            }`}
                          >
                            <Link
                              className={
                                isSideMenutwo == "doctor" ? "subdrop" : ""
                              }
                              onMouseEnter={() =>
                                toggleSidebartwo(
                                  isSideMenutwo == "doctor" ? "" : "doctor"
                                )
                              }
                            >
                              Doctors{" "}
                            </Link>
                            {isSideMenutwo == "doctor" ? (
                              <ul className="submenu">
                                <li
                                  className={
                                    pathnames.includes("doctor-grid")
                                      ? "active"
                                      : ""
                                  }
                                >
                                  <Link
                                    href="/patient/doctor-grid"
                                    onClick={() => onhandleCloseMenu()}
                                  >
                                    Map Grid
                                  </Link>
                                </li>
                                <li
                                  className={
                                    pathnames.includes("doctor-list")
                                      ? "active"
                                      : ""
                                  }
                                >
                                  <Link
                                    href="/patient/doctor-list"
                                    onClick={() => onhandleCloseMenu()}
                                  >
                                    Map List
                                  </Link>
                                </li>
                                {/* <li className={pathnames.includes("map-list") ? "active" : ""}>
                                <Link href="/patient/map-list" onClick={() => onhandleCloseMenu()}>Map List 1</Link>
                              </li> */}
                              </ul>
                            ) : (
                              ""
                            )}
                          </li>

                          {/* <li className={`has-submenu ${pathnames.includes("search-doctor") ? "active" : ""}`}>
                          <Link href="/search-doctor" onClick={() => onhandleCloseMenu()}>Search Doctor</Link>
                          <ul className="submenu">
                            <li><Link href="/search-doctor2" onClick={() => onhandleCloseMenu()}>Search Doctor1</Link></li>
                            <li><Link href="/search-doctor2" onClick={() => onhandleCloseMenu()}>Search Doctor2</Link></li>
                          </ul>
                        </li> */}
                          {/* <li className={pathnames.includes("search-doctor") ? "active" : ""}>
                          <Link href="/patient/search-doctor1" onClick={() => onhandleCloseMenu()}>Search Doctor</Link>
                        </li> */}
                          <li
                            className={
                              pathnames.includes("doctor-profile")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/patient/doctor-profile"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Doctor Profile
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("booking") &&
                              !pathnames.includes("booking-success")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/patient/booking1"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Booking
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("checkout") ? "active" : ""
                            }
                          >
                            <Link
                              href="/patient/checkout"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Checkout
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("booking-success")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/patient/booking-success"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Booking Success
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("dashboard") ? "active" : ""
                            }
                          >
                            <Link
                              href="/patient/dashboard"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Patient Dashboard
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("favourites") ? "active" : ""
                            }
                          >
                            <Link
                              href="/patient/favourites"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Favourites
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("patient-chat") ? "active" : ""
                            }
                          >
                            <Link
                              href="/patient/patient-chat"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Chat
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("profile") &&
                              !pathnames.includes("doctor-profile")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/patient/profile"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Profile Settings
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("change-password")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/patient/change-password"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Change Password
                            </Link>
                          </li>
                        </ul>
                      ) : (
                        ""
                      )}
                    </li>
                    <li
                      className={`has-submenu ${
                        url.includes("/Pharmacy") ? "active" : ""
                      }`}
                    >
                      <Link
                        className={isSideMenu == "pharmacy" ? "subdrop" : ""}
                        onMouseEnter={() =>
                          toggleSidebar(
                            isSideMenu == "pharmacy" ? "" : "pharmacy"
                          )
                        }
                      >
                        Pharmacy <i className="fas fa-chevron-down" />
                      </Link>
                      {isSideMenu == "pharmacy" ? (
                        <ul className="submenu">
                          <li
                            className={
                              pathnames.includes("Pharmacy-index")
                                ? "active"
                                : ""
                            }
                          >
                            <Link href="/Pharmacy/Pharmacy-index">
                              Pharmacy
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("Pharmacy-details")
                                ? "active"
                                : ""
                            }
                          >
                            <Link href="/Pharmacy/Pharmacy-details">
                              Pharmacy Details
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("pharmacy-search")
                                ? "active"
                                : ""
                            }
                          >
                            <Link href="/Pharmacy/pharmacy-search">
                              Pharmacy Search
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("product-all") ? "active" : ""
                            }
                          >
                            <Link href="/Pharmacy/product-all">Product</Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("product-description")
                                ? "active"
                                : ""
                            }
                          >
                            <Link href="/Pharmacy/product-description">
                              Product Description
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("cart") ? "active" : ""
                            }
                          >
                            <Link href="/Pharmacy/cart">Cart</Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("product-checkout")
                                ? "active"
                                : ""
                            }
                          >
                            <Link href="/Pharmacy/product-checkout">
                              Product Checkout
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("payment-success")
                                ? "active"
                                : ""
                            }
                          >
                            <Link href="/Pharmacy/payment-success">
                              Payment Success
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("pharmacy-register")
                                ? "active"
                                : ""
                            }
                          >
                            <Link href="/Pharmacy/pharmacy-register">
                              Pharmacy Register
                            </Link>
                          </li>
                        </ul>
                      ) : (
                        ""
                      )}
                    </li>
                    <li
                      className={`has-submenu ${
                        url.includes("/pages") ? "active" : ""
                      }`}
                    >
                      <Link
                        className={isSideMenu == "pages" ? "subdrop" : ""}
                        onMouseEnter={() =>
                          toggleSidebar(isSideMenu == "pages" ? "" : "pages")
                        }
                      >
                        Pages <i className="fas fa-chevron-down" />
                      </Link>
                      {isSideMenu == "pages" ? (
                        <ul className={`submenu`}>
                          <li
                            className={`${
                              pathnames.includes("/voice-call") ? "active" : ""
                            }`}
                          >
                            <Link
                              href="/pages/voice-call"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Voice Call
                            </Link>
                          </li>
                          <li
                            className={`${
                              pathnames.includes("/video-call") ? "active" : ""
                            }`}
                          >
                            <Link
                              href="/pages/video-call"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Video Call
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("search-doctor")
                                ? "active"
                                : ""
                            }
                          >
                            <Link
                              href="/patient/search-doctor1"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Search Doctor
                            </Link>
                          </li>

                          <li
                            className={`${
                              pathnames.includes("/calendar") ? "active" : ""
                            }`}
                          >
                            <Link
                              href="/pages/calendar"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Calendar
                            </Link>
                          </li>
                          <li
                            className={`${
                              pathnames.includes("/onboarding-email")
                                ? "active"
                                : ""
                            }`}
                          >
                            <Link href="/pages/onboarding-email">
                              Doctor Onboarding
                            </Link>
                          </li>
                          <li
                            className={`${
                              pathnames.includes("/patient-email")
                                ? "active"
                                : ""
                            }`}
                          >
                            <Link href="/pages/patient-email">
                              Patient Onboarding
                            </Link>
                          </li>
                          <li
                            className={`${
                              pathnames.includes("/component") ? "active" : ""
                            }`}
                          >
                            <Link
                              href="/pages/component"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Components
                            </Link>
                          </li>

                          <li
                            className={`has-submenu ${
                              pathnames.includes("/invoice-view")
                                ? "active"
                                : ""
                            }`}
                          >
                            <Link
                              href="0#"
                              className={
                                isSideMenuone == "invoices" ? "subdrop" : ""
                              }
                              onMouseEnter={() =>
                                toggleSidebarone(
                                  isSideMenuone == "invoices" ? "" : "invoices"
                                )
                              }
                            >
                              Invoices{" "}
                            </Link>
                            {isSideMenuone == "invoices" ? (
                              <ul className="submenu">
                                <li
                                  className={
                                    pathnames.includes("invoice")
                                      ? "active"
                                      : ""
                                  }
                                >
                                  <Link
                                    href="/pages/invoice"
                                    onClick={() => onhandleCloseMenu()}
                                  >
                                    Invoices
                                  </Link>
                                </li>
                                <li
                                  className={
                                    pathnames.includes("-view") ? "active" : ""
                                  }
                                >
                                  <Link
                                    href="/pages/invoice-view"
                                    onClick={() => onhandleCloseMenu()}
                                  >
                                    Invoice View
                                  </Link>
                                </li>
                              </ul>
                            ) : (
                              ""
                            )}
                          </li>
                          <li
                            className={`${
                              pathnames.includes("/blank-page") ? "active" : ""
                            }`}
                          >
                            <Link
                              href="/pages/blank-page"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Starter Page
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("/aboutus") ? "active" : ""
                            }
                          >
                            <Link
                              href="/aboutus"
                              onClick={() => onhandleCloseMenu()}
                            >
                              About Us
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("/contactus") ? "active" : ""
                            }
                          >
                            <Link
                              href="/contactus"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Contact Us
                            </Link>
                          </li>

                          <li
                            className={
                              pathnames.includes("login") ? "active" : ""
                            }
                          >
                            <Link
                              href="/login"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Login
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("/register") ? "active" : ""
                            }
                          >
                            <Link
                              href="/register"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Register
                            </Link>
                          </li>
                          <li
                            className={`${
                              pathnames === "/forgot-password" ? "active" : ""
                            }`}
                          >
                            <Link
                              href="/forgot-password"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Forgot Password
                            </Link>
                          </li>
                        </ul>
                      ) : (
                        ""
                      )}
                    </li>
                    <li
                      className={`has-submenu ${
                        url.includes("/blog") ? "active" : ""
                      }`}
                    >
                      <Link
                        className={isSideMenu == "blog" ? "subdrop" : ""}
                        onMouseEnter={() =>
                          toggleSidebar(isSideMenu == "blog" ? "" : "blog")
                        }
                      >
                        Blog <i className="fas fa-chevron-down" />
                      </Link>
                      {isSideMenu == "blog" ? (
                        <ul className="submenu">
                          <li
                            className={
                              pathnames.includes("blog-list") ? "active" : ""
                            }
                          >
                            <Link
                              href="/blog/blog-list"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Blog List
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("blog-grid") ? "active" : ""
                            }
                          >
                            <Link
                              href="/blog/blog-grid"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Blog Grid
                            </Link>
                          </li>
                          <li
                            className={
                              pathnames.includes("blog-details") ? "active" : ""
                            }
                          >
                            <Link
                              href="/blog/blog-details"
                              onClick={() => onhandleCloseMenu()}
                            >
                              Blog Details
                            </Link>
                          </li>
                        </ul>
                      ) : (
                        ""
                      )}
                    </li>
                    <li className="has-submenu">
                      <Link
                        target="_blank"
                        className={isSideMenu == "admin" ? "subdrop" : ""}
                        onMouseEnter={() =>
                          toggleSidebar(isSideMenu == "admin" ? "" : "admin")
                        }
                      >
                        Admin
                        <i className="fas fa-chevron-down" />
                      </Link>
                      {isSideMenu == "admin" ? (
                        <ul className="submenu">
                          <li>
                            <Link href={`${config}admin/login`} target="_blank">
                              Admin
                            </Link>
                          </li>
                          <li>
                            <Link
                              href={`${config}pharmacyadmin`}
                              target="_blank"
                            >
                              Pharmacy Admin
                            </Link>
                          </li>
                        </ul>
                      ) : (
                        ""
                      )}
                    </li>
                    <li
                      className="login-link"
                      onClick={() => onhandleCloseMenu()}
                    >
                      <Link href="/home-1">Login / Signup</Link>
                    </li>
                  </ul>
                </div>
                <ul className="nav header-navbar-rht">
                  {props.location.pathname === "/pages/voice-call" ||
                  props.location.pathname === "/pages/video-call" ? (
                    <>
                      <Dropdown className="user-drop nav-item dropdown has-arrow logged-item">
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                          <img
                            className="rounded-circle"
                            src={IMG01}
                            width="31"
                            alt="Darren Elder"
                          />
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <div className="user-header">
                            <div className="avatar avatar-sm">
                              <img
                                src={IMG01}
                                alt="User"
                                className="avatar-img rounded-circle"
                              />
                            </div>
                            <div className="user-text">
                              <h6>Darren Elder</h6>
                              <p className="text-muted mb-0">Doctor</p>
                            </div>
                          </div>
                          <Dropdown.Item
                            href={`${config}doctor/doctor-dashboard`}
                          >
                            Dashboard
                          </Dropdown.Item>
                          <Dropdown.Item
                            href={`${config}doctor/profile-setting`}
                          >
                            Profile Settings
                          </Dropdown.Item>
                          <Dropdown.Item href={`${config}login`}>
                            Logout
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </>
                  ) : (
                    <>
                      <Chart />
                      <Notification />
                      {/* <!-- User Menu --> */}

                      <li className="nav-item dropdown has-arrow logged-item">
                        <Link
                          href="#"
                          className="dropdown-toggle nav-link"
                          data-bs-toggle="dropdown"
                        >
                          <span className="user-img">
                            <img
                              className="rounded-circle"
                              src={IMG02}
                              width="31"
                              alt="Darren Elder"
                            />
                          </span>
                        </Link>
                        <div className="dropdown-menu dropdown-menu-end">
                          <div className="user-header">
                            <div className="avatar avatar-sm">
                              <img
                                src={IMG02}
                                alt="User Image"
                                className="avatar-img rounded-circle"
                              />
                            </div>
                            <div className="user-text">
                              <h6>Darren Elder</h6>
                              <p className="text-muted mb-0">Doctor</p>
                            </div>
                          </div>
                          <Link
                            className="dropdown-item"
                            href="/patient/dashboard"
                          >
                            Dashboard
                          </Link>
                          <Link
                            className="dropdown-item"
                            href="/patient/profile"
                          >
                            Profile Settings
                          </Link>
                          <Link className="dropdown-item" href="/login">
                            Logout
                          </Link>
                        </div>
                      </li>
                      {/* <!-- /User Menu --> */}
                    </>
                  )}
                </ul>
              </nav>
            </div>
          </header>
        )}
    </>
  );
};

export default Header;
