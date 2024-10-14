import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../../context/AuthContext";

const Home1Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="header header-custom header-fixed header-one home-head-one">
        <div className="container">
          <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="navbar-header">
              {/* Butonul pentru deschiderea meniului pe mobil */}
              <button
                className="navbar-toggler"
                type="button"
                onClick={toggleMenu}
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            </div>

            {/* Meniul pentru desktop */}
            <div
              className={`collapse navbar-collapse ${isMenuOpen ? "show" : ""}`}
              id="navbarNav"
            >
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link href="/consultatii" className="nav-link">
                    Acasa
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/despre-platforma" className="nav-link">
                    Despre platforma
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/politica-platforma" className="nav-link">
                    Termeni și condiții
                  </Link>
                </li>
              </ul>
            </div>

            {/* Meniul pentru utilizatori logați */}
            {currentUser ? (
              <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                  <Link
                    href="/cont-client"
                    className="nav-link btn btn-primary"
                  >
                    Cont
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                  <Link
                    href="/register-client"
                    className="nav-link btn btn-outline-primary"
                  >
                    Înregistrează-te
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    href="/login-client"
                    className="nav-link btn btn-primary"
                  >
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
