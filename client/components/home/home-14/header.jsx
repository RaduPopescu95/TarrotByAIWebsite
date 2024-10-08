import React, { useEffect, useState } from "react";
import Link from "next/link";
import ImageWithBasePath from "../../../../core/img/imagewithbasebath";
import NavLinks from "../../nav";
import { Dropdown } from "primereact/dropdown";

const Home14Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [toggleSearch, settoggleSearch] = useState(false);
  const cities = [
    { name: "English", code: "AU" },
    { name: "Japanese", code: "BR" },
  ];
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const onHandleMobileMenu = () => {
    var root = document.getElementsByTagName("html")[0];
    root.classList.add("menu-opened");
  };
  const onhandleCloseMenu = () => {
    var root = document.getElementsByTagName("html")[0];
    root.classList.remove("menu-opened");
  };
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
    <header
      className={`header header-custom  header-fixed header-ten home-care-header dentist-header ${
        isScrolled ? "pharmacy-header header-space" : ""
      }`}
    >
      <div className="header-top-wrap">
        <div className="container">
          <div className="header-top-bar">
            <ul className="header-contact m-0">
              <li>
                <span className="question-mark-icon">
                  <i className="fa-solid fa-question" />
                </span>
                Have any Questions?
              </li>
              <li>
                <i className="fa-solid fa-envelope" />
                info@example.com
              </li>
              <li>
                <i className="fa-solid fa-phone" />
                +1 123 456 8891
              </li>
            </ul>
            <ul className="social-icon m-0 p-0">
              <li>
                <Dropdown
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.value)}
                  options={cities}
                  optionLabel="name"
                  placeholder="Select Language"
                  className="select icon-select"
                />
              </li>
              <li>
                <Link href="#">
                  <i className="fa-brands fa-instagram" />
                </Link>
                <Link href="#">
                  <i className="fa-brands fa-twitter" />
                </Link>
                <Link href="#">
                  <i className="fa-brands fa-facebook" />
                </Link>
                <Link href="#">
                  <i className="fa-brands fa-linkedin" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container">
        <nav className="navbar navbar-expand-lg header-nav">
          <div className="navbar-header">
            <Link id="mobile_btn" href="#" onClick={() => onHandleMobileMenu()}>
              <span className="bar-icon">
                <span />
                <span />
                <span />
              </span>
            </Link>
            <Link href="/home-1" className="navbar-brand logo">
              <ImageWithBasePath
                src="assets/img/logo-01.svg"
                className="img-fluid"
                alt="Logo"
              />
            </Link>
          </div>
          <div className="main-menu-wrapper">
            <div className="menu-header">
              <Link href="/home-1" className="menu-logo">
                <ImageWithBasePath
                  src="assets/img/logo-01.svg"
                  className="img-fluid"
                  alt="Logo"
                />
              </Link>
              <Link
                id="menu_close"
                className="menu-close"
                href="#"
                onClick={() => onhandleCloseMenu()}
              >
                <i className="fas fa-times" />
              </Link>
            </div>
            <ul className="main-nav">
              <NavLinks />
              <li className="login-link">
                <Link href="/pages/login-email">Login / Signup</Link>
              </li>
            </ul>
          </div>
          <ul className="nav header-navbar-rht">
            <li className="searchbar">
              <Link href="#" onClick={() => settoggleSearch(!toggleSearch)}>
                <i className="feather icon-search" />
              </Link>
              <div className={`togglesearch ${toggleSearch ? "d-block" : ""}`}>
                <form action="/patient/search-doctor1">
                  <div className="input-group">
                    <input type="text" className="form-control" />
                    <button type="submit" className="btn btn-primary">
                      Search
                    </button>
                  </div>
                </form>
              </div>
            </li>
            <li className="register-btn">
              <Link href="/pages/login-email" className="btn log-btn">
                <i className="feather icon-lock" />
                Login
              </Link>
            </li>
            <li className="register-btn">
              <Link href="signup.html" className="btn reg-btn">
                <i className="feather icon-user" />
                Sign Up
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Home14Header;
