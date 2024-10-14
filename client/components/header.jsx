/* eslint-disable no-unused-vars */
/* eslint-disable no-constant-condition */
import React, { useState } from "react";
import Link from "next/link";

// import Dropdown from "react-bootstrap/Dropdown";
import { useEffect } from "react";

import AOS from "aos";
import "aos/dist/aos.css";
import FeatherIcon from "feather-icons-react";

// import Chart from "./patients/dashboard/chart";
// import Notification from "./patients/dashboard/notification";
import NavLinks from "./nav";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  // const history = useHistory();
  //Aos
  // const location = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: true,
    });
  }, []);

  const config = "/react/template";

  //mobile menu
  const [change, setChange] = useState(false);
  const [isSideMenu, setSideMenu] = useState("");
  const [isSideMenuone, setSideMenuone] = useState("");
  const [isSideMenutwo, setSideMenutwo] = useState("");
  const [isSideSearch, setSideSearch] = useState("");
  const [isSidebooking, setSideBooking] = useState("");
  const [button, setButton] = useState(true);
  const [navbar, setNavbar] = useState(false);
  const [isSideMenuthree, setSideMenuthree] = useState("");
  const [isSideMenufour, setSideMenufour] = useState("");
  const [sideMenufive, setSideMenufive] = useState("");
  const [menu, setMenu] = useState(false);

  // const [menu1, setMenu1] = useState(false);
  const toggleSidebarthree = (value) => {
    setSideMenuthree(value);
  };
  const toggleSidebar = (value) => {
    setSideMenu(value);
  };
  const toggleSidebarfour = (value) => {
    setSideMenufour(value);
  };
  const toggleSidebarfive = (value) => {
    setSideMenufive(value);
  };
  const toggleSidebarone = (value) => {
    setSideMenuone(value);
  };
  const toggleSidebartwo = (value) => {
    setSideMenutwo(value);
  };
  const toggleSidebarsearch = (value) => {
    setSideSearch(value);
  };
  const toggleSidebarbooking = (value) => {
    setSideBooking(value);
  };

  // const mobilemenus = () => {
  //   setMenu(!true);
  // };

  // Rest of your code that uses pathnames

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

  //nav transparent

  const showButton = () => {
    if (window.innerWidth <= 960) {
      setButton(false);
    } else {
      setButton(true);
    }
  };

  useEffect(() => {
    showButton();
  }, []);
  window.addEventListener("resize", showButton);

  const changeBackground = () => {
    if (window.scrollY >= 95) {
      setNavbar(true);
    } else {
      setNavbar(false);
    }
  };
  window.addEventListener("scroll", changeBackground);
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <>
      {!pathnames.includes("home1") && (
        <header
          className={`header ${
            pathnames.includes("/index-11")
              ? "header-fixed header-fourteen header-sixteen"
              : "" || pathnames.includes("/index-10")
                ? "header-fixed header-fourteen header-fifteen"
                : "" || pathnames.includes("/index-9")
                  ? "header-fixed header-fourteen"
                  : "" || pathnames.includes("/index-8")
                    ? "header-fixed header-fourteen header-twelve header-thirteen"
                    : "" || pathnames.includes("/index-7")
                      ? "header-fixed header-fourteen header-twelve"
                      : "" || pathnames.includes("/index-6")
                        ? "header-trans header-eleven"
                        : "" || pathnames.includes("/index-4")
                          ? "header-trans custom"
                          : "" || pathnames.includes("/index-5")
                            ? "header header-fixed header-ten"
                            : "" || pathnames.includes("home")
                              ? "header-trans header-two"
                              : "" || pathnames.includes("/index-13")
                                ? "header header-custom header-fixed header-ten home-care-header"
                                : "" || pathnames.includes("/Pharmacy-index")
                                  ? "header header-one"
                                  : "header-fixed header-one header-space header-custom"
          } 
           ${isScrolled ? "pharmacy-header" : ""} `}
          style={
            pathnames.includes("/index-6") && navbar
              ? { background: "rgb(30, 93, 146)" }
              : { background: "" } && pathnames.includes("/index-10") && navbar
                ? { background: "rgb(255, 255, 255)" }
                : { background: "" } &&
                    pathnames.includes("/index-11") &&
                    navbar
                  ? { background: "rgb(255, 255, 255)" }
                  : { background: "" } &&
                      pathnames.includes("/index-4") &&
                      navbar
                    ? { background: "rgb(43, 108, 203)" }
                    : { background: "" } &&
                        pathnames.includes("/index-9") &&
                        navbar
                      ? { background: "rgb(43, 108, 203)" }
                      : { background: "" } &&
                          pathnames.includes("/index-2") &&
                          navbar
                        ? { background: "rgb(255, 255, 255)" }
                        : { background: "" }
          }
        >
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

                <ul
                  className={`main-nav ${
                    pathnames.includes("home4") ? "white-font" : ""
                  }`}
                >
                  <NavLinks />
                  {pathnames.includes("/index-5") ||
                  pathnames.includes("/index-11") ? (
                    <li className="searchbar">
                      <Link href="#">
                        <i>
                          {" "}
                          <FeatherIcon icon="search" />
                        </i>
                      </Link>
                      <div className="togglesearch" style={{ display: "none" }}>
                        <form action={`${config}/patient/search-doctor1`}>
                          <div className="input-group">
                            <input type="text" className="form-control" />
                            <button type="submit" className="btn">
                              Search
                            </button>
                          </div>
                        </form>
                      </div>
                    </li>
                  ) : null}
                  {(!pathnames.includes("/index-10") &&
                    pathnames.includes("index")) ||
                  pathnames.includes("/login") ||
                  pathnames.includes("/register") ||
                  pathnames.includes("blog") ||
                  pathnames.includes("/doctor/doctor-register") ||
                  pathnames.includes("pages") ||
                  pathnames.includes("/patient/search-doctor1") ||
                  (pathnames.includes("/aboutus") &&
                    !pathnames.includes("/index-6") &&
                    !pathnames.includes("/index-13") &&
                    !pathnames.includes("/index-5") &&
                    !pathnames.includes("/index-6") &&
                    !pathnames.includes("/index-7") &&
                    !pathnames.includes("/index-8") &&
                    !pathnames.includes("/index-9") &&
                    !pathnames.includes("/index-10") &&
                    !pathnames.includes("/index-11")) ? (
                    <>
                      <li className="searchbar">
                        <Link href="#" onClick={() => setChange(!change)}>
                          <i> {/* <FeatherIcon icon="search" /> */}</i>
                        </Link>
                        <div
                          className={`${
                            change === true
                              ? "togglesearch d-block"
                              : "togglesearch d-none"
                          }`}
                        >
                          <form action={`${config}/patient/search-doctor1`}>
                            <div className="input-group">
                              <input type="text" className="form-control" />
                              <button type="submit" className="btn">
                                Search
                              </button>
                            </div>
                          </form>
                        </div>
                      </li>
                      <li className="login-link">
                        <Link href="/login">Login / Signup</Link>
                      </li>
                      {!pathnames.includes("/index-13") &&
                        !pathnames.includes("/index-5") &&
                        !pathnames.includes("/index-6") &&
                        !pathnames.includes("/index-7") &&
                        !pathnames.includes("/index-8") &&
                        !pathnames.includes("/index-9") &&
                        !pathnames.includes("/index-4") &&
                        !pathnames.includes("/index-10") &&
                        !pathnames.includes("/index-2") &&
                        !pathnames.includes("/index-11") && (
                          // <div
                          //   style={{
                          //     visibility: pathnames.includes(
                          //       "/Pharmacy/Pharmacy-index"
                          //     )
                          //       ? "hidden"
                          //       : "",
                          //   }}
                          // >
                          <>
                            <li className="register-btn">
                              <Link href="/register" className="btn reg-btn">
                                <i>
                                  <FeatherIcon icon="user" />
                                </i>
                                Register
                              </Link>
                            </li>
                            <li className="register-btn">
                              <Link
                                href="/login"
                                className="btn btn-primary log-btn"
                              >
                                <i>
                                  <FeatherIcon icon="lock" />
                                </i>
                                Login
                              </Link>
                            </li>
                          </>
                          // {/* </div> */}
                        )}
                    </>
                  ) : null}
                </ul>
              </div>
              {pathnames.includes("/index-6") ? (
                <ul className="nav header-navbar-rht">
                  <li className="nav-item">
                    <Link
                      className={`nav-link header-login ${
                        pathnames.includes("home6") ? "white-bg" : ""
                      }`}
                      href="/login"
                    >
                      <i className="me-2">
                        <FeatherIcon icon="lock" />
                      </i>
                      Register
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link header-login btn-light-blue"
                      href="/login"
                    >
                      <i className="me-2">
                        <FeatherIcon icon="user" />
                      </i>
                      Login
                    </Link>
                  </li>
                </ul>
              ) : null}
              {pathnames.includes("/index-2") &&
              !pathnames.includes("/index-11") &&
              !pathnames.includes("/index-5") &&
              !pathnames.includes("/index-6") &&
              !pathnames.includes("/index-7") &&
              !pathnames.includes("/index-8") &&
              !pathnames.includes("/index-9") &&
              !pathnames.includes("/index-4") ? (
                <ul className="nav header-navbar-rht">
                  <li className="nav-item">
                    <Link
                      className={`nav-link header-login ${
                        pathnames.includes("home4") ? "white-bg" : ""
                      }`}
                      href="/login"
                    >
                      login / Signup
                    </Link>
                  </li>
                </ul>
              ) : null}

              {pathnames.includes("/index-5") ||
              pathnames.includes("/index-7") ||
              pathnames.includes("/index-9") ? (
                <ul className="nav header-navbar-rht">
                  {pathnames.includes("/index-11") ||
                  pathnames.includes("home7") ||
                  pathnames.includes("home9") ? (
                    <li className="searchbar searchbar-fourteen me-2">
                      <Link href="#">
                        <i>
                          <FeatherIcon icon="search" />
                        </i>
                      </Link>
                      <div className="togglesearch">
                        <form action={`${config}/patient/search-doctor1`}>
                          <div className="input-group">
                            <input type="text" className="form-control" />
                            <button type="submit" className="btn btn-primary">
                              Search
                            </button>
                          </div>
                        </form>
                      </div>
                    </li>
                  ) : null}

                  <li
                    className={`${
                      pathnames.includes("/index-7") || "/index-9"
                        ? "login-in-fourteen"
                        : "register-btn"
                    }`}
                  >
                    <Link
                      href="/pages/login-email"
                      className={
                        pathnames === "/index-9"
                          ? "btn reg-btn"
                          : "btn log-btn" && pathnames === "/index-7"
                            ? "btn reg-btn"
                            : "btn log-btn"
                      }
                    >
                      <i className="me-2">
                        {pathnames.includes("home7") ? (
                          <FeatherIcon icon="user" />
                        ) : (
                          <FeatherIcon icon="lock" />
                        )}
                      </i>
                      Log In
                    </Link>
                  </li>
                  <li
                    className={`${
                      pathnames.includes("/index-7") || "/index-9"
                        ? "login-in-fourteen"
                        : "register-btn"
                    }`}
                  >
                    <Link
                      href="/signup"
                      className={`${
                        pathnames.includes("/index-7") || "/index-9"
                          ? "btn btn-primary reg-btn reg-btn-fourteen"
                          : "btn reg-btn"
                      }`}
                    >
                      <i className="me-2">
                        <FeatherIcon icon="user" />
                      </i>
                      Sign Up
                    </Link>
                  </li>
                </ul>
              ) : null}
              {(!pathnames.includes("/patient/search-doctor1") &&
                pathnames.includes("patient")) ||
              (pathnames.includes("Pharmacy") &&
                !pathnames.includes("/Pharmacy/Pharmacy-index")) ? (
                <>
                  <ul className="nav header-navbar-rht">
                    <Chart />
                    <Notification />
                    <li className="nav-item dropdown has-arrow logged-item">
                      <Link
                        href="#"
                        className="dropdown-toggle nav-link"
                        data-bs-toggle="dropdown"
                      >
                        <span className="user-img">
                          <img
                            className="rounded-circle"
                            src={IMG07}
                            width="31"
                            alt="Darren Elder"
                          />
                        </span>
                      </Link>
                      <div className="dropdown-menu dropdown-menu-end">
                        <div className="user-header">
                          <div className="avatar avatar-sm">
                            <img
                              src={IMG07}
                              alt="User Image"
                              className="avatar-img rounded-circle"
                            />
                          </div>
                          <div className="user-text">
                            <h6>Richard Wilson</h6>
                            <p className="text-muted mb-0">Patient</p>
                          </div>
                        </div>
                        <Link
                          className="dropdown-item"
                          href="/patient/dashboard"
                        >
                          Dashboard
                        </Link>
                        <Link className="dropdown-item" href="/patient/profile">
                          Profile Settings
                        </Link>
                        <Link className="dropdown-item" href="/login">
                          Logout
                        </Link>
                      </div>
                    </li>
                  </ul>
                </>
              ) : pathnames.includes("doctor") &&
                !pathnames.includes("/doctor/doctor-register") &&
                !pathnames.includes("/patient/search-doctor1") &&
                !pathnames.includes("/pages/doctor-signup") &&
                !pathnames.includes("/doctor-blog") &&
                !pathnames.includes("/doctor-edit-blog") &&
                !pathnames.includes("/doctor-pending-blog") &&
                !pathnames.includes("/blog/doctor-add-blog") ? (
                <ul className="nav header-navbar-rht">
                  <Chart />
                  <Notification />
                  <li className="nav-item dropdown has-arrow logged-item">
                    <Link
                      href="#"
                      className="dropdown-toggle nav-link"
                      data-bs-toggle="dropdown"
                    >
                      <span className="user-img">
                        <img
                          className="rounded-circle"
                          src={doctorprofileimg}
                          width="31"
                          alt="Darren Elder"
                        />
                      </span>
                    </Link>
                    <div className="dropdown-menu dropdown-menu-end">
                      <div className="user-header">
                        <div className="avatar avatar-sm">
                          <img
                            src={doctorprofileimg}
                            alt="User Image"
                            className="avatar-img rounded-circle"
                          />
                        </div>
                        <div className="user-text">
                          <h6>Dr Edalin Hendry</h6>
                          <p className="text-muted mb-0">Available</p>
                        </div>
                      </div>
                      <Link
                        className="dropdown-item"
                        href="/doctor/doctor-dashboard"
                      >
                        Dashboard
                      </Link>
                      <Link
                        className="dropdown-item"
                        href="/doctor/profile-setting"
                      >
                        Profile Settings
                      </Link>
                      <Link className="dropdown-item" href="/login">
                        Logout
                      </Link>
                    </div>
                  </li>
                </ul>
              ) : null}
              {pathnames.includes("/index-8") ? (
                <ul className="nav header-navbar-rht">
                  <li className="login-link">
                    <Link href="/login">Login / Signup</Link>
                  </li>
                  <li className="login-in-fourteen">
                    <Link href="/pages/login-email" className="btn reg-btn">
                      Log In
                    </Link>
                  </li>
                  <li className="login-in-fourteen">
                    <Link href="/signup" className=" reg-btn-thirteen">
                      <span>Sign Up</span>
                      <div className="user-icon-header">
                        <i>
                          <FeatherIcon icon="user" />
                        </i>
                      </div>
                    </Link>
                  </li>
                </ul>
              ) : pathnames.includes("/index-10") ? (
                <ul className="nav header-navbar-rht">
                  <li className="login-link">
                    <Link href="/login">Login / Signup</Link>
                  </li>
                  <li className="login-in-fourteen">
                    <Link href="/pages/login-email" className="btn reg-btn">
                      <i className="me-2">
                        <FeatherIcon icon="video" />
                      </i>
                      Live Demo
                    </Link>
                  </li>
                  <li className="login-in-fourteen">
                    <Link
                      href="/signup"
                      className="btn btn-primary reg-btn reg-btn-fourteen"
                    >
                      <i className="me-2">
                        <FeatherIcon icon="shopping-cart" />
                      </i>
                      Buy Template
                    </Link>
                  </li>
                </ul>
              ) : null}
              {pathnames.includes("/index-11") ? (
                <ul className="nav header-navbar-rht">
                  <li className="login-link">
                    <Link href="/login">Login / Signup</Link>
                  </li>
                  <li className="login-in-sixteen">
                    <Link href="/pages/login-email" className="btn reg-btn">
                      <i className="me-2">
                        <FeatherIcon icon="lock" />
                      </i>
                      Login<span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </Link>
                  </li>
                  <li className="login-in-sixteen">
                    <Link
                      href="/signup"
                      className="btn btn-primary reg-btn reg-btn-sixteen"
                    >
                      <i className="me-2">
                        <FeatherIcon icon="user" />
                      </i>
                      Sign Up
                    </Link>
                  </li>
                </ul>
              ) : null}

              {pathnames.includes("/index-13") ? (
                <ul className="nav header-navbar-rht">
                  <li className="register-btn">
                    <Link href="/pages/login-email" className="btn log-btn">
                      <i className="feather-lock"></i>Login
                    </Link>
                  </li>
                  <li className="register-btn">
                    <Link href="/signup" className="btn reg-btn">
                      <i className="feather-user"></i>Sign Up
                    </Link>
                  </li>
                </ul>
              ) : null}

              {/* {pathnames == "/react/template/index-13" ? (
                <ul class="nav header-navbar-rht">
                  <li class="register-btn">
                    <Link href="/pages/login-email" class="btn log-btn">
                      <i class="feather-lock"></i>Login
                    </Link>
                  </li>
                  <li class="register-btn">
                    <Link href="/signup" class="btn reg-btn">
                      <i class="feather-user"></i>Sign Up
                    </Link>
                  </li>
                </ul>
              ) : null} */}
            </nav>
          </div>
        </header>
      )}
    </>
  );
};

export default Header;
