import React, { useState } from "react";
import Footer from "../../../footer";
import Header from "../../../header.jsx";
import {
  doctor_thumb_13,
  doctor_thumb_14,
  doctor_thumb_15,
  doctor_thumb_16,
  doctor_thumb_17,
  doctor_thumb_18,
  doctor_thumb_19,
  doctor_thumb_20,
  doctor_thumb_21,
} from "../../../imagepath.jsx";
import DashboardSidebar from "../sidebar/sidebar.jsx";
import Link from "next/link";
import StickyBox from "react-sticky-box";

const Favourites = (props) => {
  const [isFavourite, setIsFavourite] = useState([
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
  const toggleFavourite = (index) => {
    setIsFavourite((prevState) => {
      const updatedState = [...prevState];
      updatedState[index] = !updatedState[index];
      return updatedState;
    });
  };

  return (
    <div>
      <Header {...props} />
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Favourites</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Home</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Favourites
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-md-5 col-lg-4 col-xl-3 theiaStickySidebar">
              <StickyBox offsetTop={20} offsetBottom={20}>
                <DashboardSidebar />
              </StickyBox>
            </div>
            <div className="col-lg-8 col-xl-9">
              <div className="dashboard-header">
                <h3>Favourites</h3>
                <ul className="header-list-btns">
                  <li>
                    <div className="input-block dash-search-input">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search"
                      />
                      <span className="search-icon">
                        <i className="fa-solid fa-magnifying-glass" />
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
              {/* Favourites */}
              <div className="row">
                <div className="col-md-6 col-lg-4">
                  <div className="profile-widget patient-favour">
                    <div className="fav-head">
                      <Link
                        href="#"
                        className="fav-btn favourite-btn"
                        onClick={() => toggleFavourite(1)}
                      >
                        <span
                          className={`favourite-icon ${
                            isFavourite[1] ? "favourite" : ""
                          }`}
                        >
                          <i className="fa-solid fa-heart"></i>
                        </span>
                      </Link>
                      <div className="doc-img">
                        <Link href="/patient/doctor-profile">
                          <img
                            className="img-fluid"
                            alt="User Image"
                            src={doctor_thumb_21}
                          />
                        </Link>
                      </div>
                      <div className="pro-content">
                        <h3 className="title">
                          <Link href="/patient/doctor-profile">
                            Dr.Edalin Hendry
                          </Link>
                          <i className="fas fa-check-circle verified" />
                        </h3>
                        <p className="speciality">
                          MDS - Periodontology and Oral Implantology, BDS
                        </p>
                        <div className="rating">
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <span className="d-inline-block average-rating">
                            5.0
                          </span>
                        </div>
                        <ul className="available-info">
                          <li>
                            <span>
                              <i className="fa-solid fa-calendar-day" />
                            </span>
                            Next Availability : 23 Mar 2024
                          </li>
                          <li>
                            <span>
                              <i className="fas fa-map-marker-alt" />
                            </span>
                            Location : Newyork, USA
                          </li>
                        </ul>
                        <div className="last-book">
                          <p>Last Book on 21 Jan 2023</p>
                        </div>
                      </div>
                    </div>
                    <div className="fav-footer">
                      <div className="row row-sm">
                        <div className="col-6">
                          <Link
                            href="/patient/doctor-profile"
                            className="btn view-btn"
                          >
                            View Details
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            href="/patient/booking1"
                            className="btn book-btn"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="profile-widget patient-favour">
                    <div className="fav-head">
                      <Link
                        href="#"
                        className="fav-btn favourite-btn"
                        onClick={() => toggleFavourite(2)}
                      >
                        <span
                          className={`favourite-icon ${
                            isFavourite[2] ? "favourite" : ""
                          }`}
                        >
                          <i className="fa-solid fa-heart"></i>
                        </span>
                      </Link>
                      <div className="doc-img">
                        <Link href="/patient/doctor-profile">
                          <img
                            className="img-fluid"
                            alt="User Image"
                            src={doctor_thumb_13}
                          />
                        </Link>
                      </div>
                      <div className="pro-content">
                        <h3 className="title">
                          <Link href="/patient/doctor-profile">
                            Dr.Shanta Nesmith
                          </Link>
                          <i className="fas fa-check-circle verified" />
                        </h3>
                        <p className="speciality">
                          DO - Doctor of Osteopathic Medicine
                        </p>
                        <div className="rating">
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star" />
                          <span className="d-inline-block average-rating">
                            (35)
                          </span>
                        </div>
                        <ul className="available-info">
                          <li>
                            <span>
                              <i className="fa-solid fa-calendar-day" />
                            </span>
                            Next Availability : 27 Mar 2024
                          </li>
                          <li>
                            <span>
                              <i className="fas fa-map-marker-alt" />
                            </span>
                            Location : Los Angeles, USA
                          </li>
                        </ul>
                        <div className="last-book">
                          <p>Last Book on 18 Jan 2023</p>
                        </div>
                      </div>
                    </div>
                    <div className="fav-footer">
                      <div className="row row-sm">
                        <div className="col-6">
                          <Link
                            href="/patient/doctor-profile"
                            className="btn view-btn"
                          >
                            View Profile
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            href="/patient/booking1"
                            className="btn book-btn"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="profile-widget patient-favour">
                    <div className="fav-head">
                      <Link
                        href="#"
                        className="fav-btn favourite-btn"
                        onClick={() => toggleFavourite(3)}
                      >
                        <span
                          className={`favourite-icon ${
                            isFavourite[3] ? "favourite" : ""
                          }`}
                        >
                          <i className="fa-solid fa-heart"></i>
                        </span>
                      </Link>
                      <div className="doc-img">
                        <Link href="/patient/doctor-profile">
                          <img
                            className="img-fluid"
                            alt="User Image"
                            src={doctor_thumb_14}
                          />
                        </Link>
                      </div>
                      <div className="pro-content">
                        <h3 className="title">
                          <Link href="/patient/doctor-profile">
                            Dr.John Ewel
                          </Link>
                          <i className="fas fa-check-circle verified" />
                        </h3>
                        <p className="speciality">
                          DPM - Doctor of Podiatric Medicine
                        </p>
                        <div className="rating">
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star" />
                          <span className="d-inline-block average-rating">
                            5.0
                          </span>
                        </div>
                        <ul className="available-info">
                          <li>
                            <span>
                              <i className="fa-solid fa-calendar-day" />
                            </span>
                            Next Availability : 02 Apr 2024
                          </li>
                          <li>
                            <span>
                              <i className="fas fa-map-marker-alt" />
                            </span>
                            Location : Dallas, USA
                          </li>
                        </ul>
                        <div className="last-book">
                          <p>Last Book on 28 Jan 2023</p>
                        </div>
                      </div>
                    </div>
                    <div className="fav-footer">
                      <div className="row row-sm">
                        <div className="col-6">
                          <Link
                            href="/patient/doctor-profile"
                            className="btn view-btn"
                          >
                            View Profile
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            href="/patient/booking1"
                            className="btn book-btn"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="profile-widget patient-favour">
                    <div className="fav-head">
                      <Link
                        href="#"
                        className="fav-btn favourite-btn"
                        onClick={() => toggleFavourite(4)}
                      >
                        <span
                          className={`favourite-icon ${
                            isFavourite[4] ? "favourite" : ""
                          }`}
                        >
                          <i className="fa-solid fa-heart"></i>
                        </span>
                      </Link>
                      <div className="doc-img">
                        <Link href="/patient/doctor-profile">
                          <img
                            className="img-fluid"
                            alt="User Image"
                            src={doctor_thumb_15}
                          />
                        </Link>
                      </div>
                      <div className="pro-content">
                        <h3 className="title">
                          <Link href="/patient/doctor-profile">
                            Dr.Susan Fenimore
                          </Link>
                          <i className="fas fa-check-circle verified" />
                        </h3>
                        <p className="speciality">
                          BSG - Bachelor of Science in Genetic Counseling
                        </p>
                        <div className="rating">
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star" />
                          <span className="d-inline-block average-rating">
                            4.0
                          </span>
                        </div>
                        <ul className="available-info">
                          <li>
                            <span>
                              <i className="fa-solid fa-calendar-day" />
                            </span>
                            Next Availability : 11 Apr 2024
                          </li>
                          <li>
                            <span>
                              <i className="fas fa-map-marker-alt" />
                            </span>
                            Location : Chicago, USA
                          </li>
                        </ul>
                        <div className="last-book">
                          <p>Last Book on 08 Feb 2023</p>
                        </div>
                      </div>
                    </div>
                    <div className="fav-footer">
                      <div className="row row-sm">
                        <div className="col-6">
                          <Link
                            href="/patient/doctor-profile"
                            className="btn view-btn"
                          >
                            View Profile
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            href="/patient/booking1"
                            className="btn book-btn"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="profile-widget patient-favour">
                    <div className="fav-head">
                      <Link
                        href="#"
                        className="fav-btn favourite-btn"
                        onClick={() => toggleFavourite(5)}
                      >
                        <span
                          className={`favourite-icon ${
                            isFavourite[5] ? "favourite" : ""
                          }`}
                        >
                          <i className="fa-solid fa-heart"></i>
                        </span>
                      </Link>
                      <div className="doc-img">
                        <Link href="/patient/doctor-profile">
                          <img
                            className="img-fluid"
                            alt="User Image"
                            src={doctor_thumb_16}
                          />
                        </Link>
                      </div>
                      <div className="pro-content">
                        <h3 className="title">
                          <Link href="/patient/doctor-profile">
                            Dr.Juliet Rios
                          </Link>
                          <i className="fas fa-check-circle verified" />
                        </h3>
                        <p className="speciality">
                          ND - Doctor of Naturopathic Medicine
                        </p>
                        <div className="rating">
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star" />
                          <span className="d-inline-block average-rating">
                            5.0
                          </span>
                        </div>
                        <ul className="available-info">
                          <li>
                            <span>
                              <i className="fa-solid fa-calendar-day" />
                            </span>
                            Next Availability :18 Apr 2024
                          </li>
                          <li>
                            <span>
                              <i className="fas fa-map-marker-alt" />
                            </span>
                            Location : Detroit, USA
                          </li>
                        </ul>
                        <div className="last-book">
                          <p>Last Book on 16 Feb 2023</p>
                        </div>
                      </div>
                    </div>
                    <div className="fav-footer">
                      <div className="row row-sm">
                        <div className="col-6">
                          <Link
                            href="/patient/doctor-profile"
                            className="btn view-btn"
                          >
                            View Profile
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            href="/patient/booking1"
                            className="btn book-btn"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="profile-widget patient-favour">
                    <div className="fav-head">
                      <Link
                        href="#"
                        className="fav-btn favourite-btn"
                        onClick={() => toggleFavourite(6)}
                      >
                        <span
                          className={`favourite-icon ${
                            isFavourite[6] ? "favourite" : ""
                          }`}
                        >
                          <i className="fa-solid fa-heart"></i>
                        </span>
                      </Link>
                      <div className="doc-img">
                        <Link href="/patient/doctor-profile">
                          <img
                            className="img-fluid"
                            alt="User Image"
                            src={doctor_thumb_17}
                          />
                        </Link>
                      </div>
                      <div className="pro-content">
                        <h3 className="title">
                          <Link href="/patient/doctor-profile">
                            Dr.Joseph Engels
                          </Link>
                          <i className="fas fa-check-circle verified" />
                        </h3>
                        <p className="speciality">
                          BSPT - Bachelor of Science in Physical Therapy
                        </p>
                        <div className="rating">
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star" />
                          <span className="d-inline-block average-rating">
                            4.0
                          </span>
                        </div>
                        <ul className="available-info">
                          <li>
                            <span>
                              <i className="fa-solid fa-calendar-day" />
                            </span>
                            Next Availability : 10 May 2024
                          </li>
                          <li>
                            <span>
                              <i className="fas fa-map-marker-alt" />
                            </span>
                            Location : Las Vegas, USA
                          </li>
                        </ul>
                        <div className="last-book">
                          <p>Last Book on 08 Mar 2023</p>
                        </div>
                      </div>
                    </div>
                    <div className="fav-footer">
                      <div className="row row-sm">
                        <div className="col-6">
                          <Link
                            href="/patient/doctor-profile"
                            className="btn view-btn"
                          >
                            View Profile
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            href="/patient/booking1"
                            className="btn book-btn"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="profile-widget patient-favour">
                    <div className="fav-head">
                      <Link
                        href="#"
                        className="fav-btn favourite-btn"
                        onClick={() => toggleFavourite(7)}
                      >
                        <span
                          className={`favourite-icon ${
                            isFavourite[7] ? "favourite" : ""
                          }`}
                        >
                          <i className="fa-solid fa-heart"></i>
                        </span>
                      </Link>
                      <div className="doc-img">
                        <Link href="/patient/doctor-profile">
                          <img
                            className="img-fluid"
                            alt="User Image"
                            src={doctor_thumb_18}
                          />
                        </Link>
                      </div>
                      <div className="pro-content">
                        <h3 className="title">
                          <Link href="/patient/doctor-profile">
                            Dr.Victoria Selzer
                          </Link>
                          <i className="fas fa-check-circle verified" />
                        </h3>
                        <p className="speciality">
                          MDS - Periodontology and Oral Implantology, BDS
                        </p>
                        <div className="rating">
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star" />
                          <span className="d-inline-block average-rating">
                            5.0
                          </span>
                        </div>
                        <ul className="available-info">
                          <li>
                            <span>
                              <i className="fa-solid fa-calendar-day" />
                            </span>
                            Next Availability : 20 May 2024
                          </li>
                          <li>
                            <span>
                              <i className="fas fa-map-marker-alt" />
                            </span>
                            Location : Denver, USA
                          </li>
                        </ul>
                        <div className="last-book">
                          <p>Last Book on 18 Mar 2023</p>
                        </div>
                      </div>
                    </div>
                    <div className="fav-footer">
                      <div className="row row-sm">
                        <div className="col-6">
                          <Link
                            href="/patient/doctor-profile"
                            className="btn view-btn"
                          >
                            View Profile
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            href="/patient/booking1"
                            className="btn book-btn"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="profile-widget patient-favour">
                    <div className="fav-head">
                      <Link
                        href="#"
                        className="fav-btn favourite-btn"
                        onClick={() => toggleFavourite(8)}
                      >
                        <span
                          className={`favourite-icon ${
                            isFavourite[8] ? "favourite" : ""
                          }`}
                        >
                          <i className="fa-solid fa-heart"></i>
                        </span>
                      </Link>
                      <div className="doc-img">
                        <Link href="/patient/doctor-profile">
                          <img
                            className="img-fluid"
                            alt="User Image"
                            src={doctor_thumb_19}
                          />
                        </Link>
                      </div>
                      <div className="pro-content">
                        <h3 className="title">
                          <Link href="/patient/doctor-profile">
                            Dr.Benjamin Hedge
                          </Link>
                          <i className="fas fa-check-circle verified" />
                        </h3>
                        <p className="speciality">
                          BSND - Bachelor of Science in Nutrition and
                          Dieteticsantology, BDS
                        </p>
                        <div className="rating">
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star" />
                          <span className="d-inline-block average-rating">
                            4.0
                          </span>
                        </div>
                        <ul className="available-info">
                          <li>
                            <span>
                              <i className="fa-solid fa-calendar-day" />
                            </span>
                            Next Availability : 24 May 2024
                          </li>
                          <li>
                            <span>
                              <i className="fas fa-map-marker-alt" />
                            </span>
                            Location : Miami, USA
                          </li>
                        </ul>
                        <div className="last-book">
                          <p>Last Book on 21 Mar 2023</p>
                        </div>
                      </div>
                    </div>
                    <div className="fav-footer">
                      <div className="row row-sm">
                        <div className="col-6">
                          <Link
                            href="/patient/doctor-profile"
                            className="btn view-btn"
                          >
                            View Profile
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            href="/patient/booking1"
                            className="btn book-btn"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="profile-widget patient-favour">
                    <div className="fav-head">
                      <Link
                        href="#"
                        className="fav-btn favourite-btn"
                        onClick={() => toggleFavourite(9)}
                      >
                        <span
                          className={`favourite-icon ${
                            isFavourite[9] ? "favourite" : ""
                          }`}
                        >
                          <i className="fa-solid fa-heart"></i>
                        </span>
                      </Link>
                      <div className="doc-img">
                        <Link href="/patient/doctor-profile">
                          <img
                            className="img-fluid"
                            alt="User Image"
                            src={doctor_thumb_20}
                          />
                        </Link>
                      </div>
                      <div className="pro-content">
                        <h3 className="title">
                          <Link href="/patient/doctor-profile">
                            Dr.Kristina Lepley
                          </Link>
                          <i className="fas fa-check-circle verified" />
                        </h3>
                        <p className="speciality">
                          MDS - Bachelor of Science in Health Informaticsc
                        </p>
                        <div className="rating">
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star filled" />
                          <i className="fas fa-star" />
                          <span className="d-inline-block average-rating">
                            5.0
                          </span>
                        </div>
                        <ul className="available-info">
                          <li>
                            <span>
                              <i className="fa-solid fa-calendar-day" />
                            </span>
                            Next Availability : 13 Jun 2024
                          </li>
                          <li>
                            <span>
                              <i className="fas fa-map-marker-alt" />
                            </span>
                            Location : San Jose, USA
                          </li>
                        </ul>
                        <div className="last-book">
                          <p>Last Book on 10 Apr 2023</p>
                        </div>
                      </div>
                    </div>
                    <div className="fav-footer">
                      <div className="row row-sm">
                        <div className="col-6">
                          <Link
                            href="/patient/doctor-profile"
                            className="btn view-btn"
                          >
                            View Profile
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            href="/patient/booking1"
                            className="btn book-btn"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Favourites */}
              <div className="col-md-12">
                <div className="loader-item text-center">
                  <Link href="#" className="btn btn-load">
                    Load More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer {...props} />
    </div>
  );
};

export default Favourites;
