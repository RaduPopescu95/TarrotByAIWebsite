import React, { useEffect, useState } from "react";
import Link from "next/link";
import ImageWithBasePath from "../../../../core/img/imagewithbasebath";
import NavLinks from "../../nav";

const Home11Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [toggleSearch, settoggleSearch] = useState(false);
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
    <div>
      {" "}
      {/* Header */}
      <header
        className={`${
          isScrolled ? "pharmacy-header" : ""
        } header header-fixed header-fourteen header-sixteen`}
      >
        <div className="container">
          <nav className="navbar navbar-expand-lg header-nav">
            <div className="navbar-header">
              <Link
                id="mobile_btn"
                href="#"
                onClick={() => onHandleMobileMenu()}
              >
                <span className="bar-icon">
                  <span />
                  <span />
                  <span />
                </span>
              </Link>
              <Link href="/home-1" className="navbar-brand logo">
                <ImageWithBasePath
                  src="assets/img/logo-15.png"
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
                <li className="searchbar">
                  <Link href="#" onClick={() => settoggleSearch(!toggleSearch)}>
                    <i className="feather icon-search" />
                  </Link>
                  <div
                    className={`togglesearch ${toggleSearch ? "d-block" : ""}`}
                  >
                    <form action="search.html">
                      <div className="input-group">
                        <input type="text" className="form-control" />
                        <button type="submit" className="btn">
                          Search
                        </button>
                      </div>
                    </form>
                  </div>
                </li>
              </ul>
            </div>
            <ul className="nav header-navbar-rht">
              <li className="login-in-sixteen">
                <Link href="/pages/login-email" className="btn reg-btn">
                  <i className="feather icon-lock me-2" />
                  Login
                  <span />
                  <span />
                  <span />
                  <span />
                </Link>
              </li>
              <li className="login-in-sixteen">
                <Link
                  href="signup.html"
                  className="btn btn-primary reg-btn reg-btn-sixteen"
                >
                  <i className="feather icon-user me-2" />
                  Sign Up
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

export default Home11Header;
