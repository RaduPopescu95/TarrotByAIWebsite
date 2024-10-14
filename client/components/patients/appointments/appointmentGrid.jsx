import React from "react";
import Header from "../../header";
import StickyBox from "react-sticky-box";
import DashboardSidebar from "../dashboard/sidebar/sidebar";
import Footer from "../../footer";
import Link from "next/link";
import { Filter, initialSettings } from "../../common/filter";
import DateRangePicker from "react-bootstrap-daterangepicker";
import {
  doctor_thumb_13,
  doctor_thumb_14,
  doctor_thumb_15,
  doctor_thumb_16,
  doctor_thumb_17,
  doctor_thumb_18,
  doctor_thumb_19,
  doctor_thumb_21,
} from "../../imagepath";

const AppointmentGrid = (props) => {
  return (
    <div className="main-wrapper">
      <Header {...props} />
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Patient Appointments</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Home</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Patient Appointments
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-5 col-lg-4 col-xl-3 theiaStickySidebar">
              <StickyBox offsetTop={20} offsetBottom={20}>
                <DashboardSidebar />
              </StickyBox>
            </div>

            <div className="col-lg-8 col-xl-9">
              <div className="dashboard-header">
                <h3>Appointments</h3>
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
                  <li>
                    <div className="view-icons">
                      <Link href="/patient/patient-appointments">
                        <i className="fa-solid fa-list" />
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="view-icons">
                      <Link href="/patient/appoinment-grid" className="active">
                        <i className="fa-solid fa-th" />
                      </Link>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="appointment-tab-head">
                <div className="appointment-tabs">
                  <ul
                    className="nav nav-pills inner-tab "
                    id="pills-tab"
                    role="tablist"
                  >
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link active"
                        id="pills-upcoming-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#pills-upcoming"
                        type="button"
                        role="tab"
                        aria-controls="pills-upcoming"
                        aria-selected="false"
                      >
                        Upcoming<span>21</span>
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link"
                        id="pills-cancel-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#pills-cancel"
                        type="button"
                        role="tab"
                        aria-controls="pills-cancel"
                        aria-selected="true"
                      >
                        Cancelled<span>16</span>
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link"
                        id="pills-complete-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#pills-complete"
                        type="button"
                        role="tab"
                        aria-controls="pills-complete"
                        aria-selected="true"
                      >
                        Completed<span>214</span>
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="filter-head">
                  <div className="position-relative daterange-wraper me-2">
                    <div className="input-groupicon calender-input">
                      <DateRangePicker initialSettings={initialSettings}>
                        <input
                          className="form-control  date-range bookingrange"
                          type="text"
                        />
                      </DateRangePicker>
                    </div>
                    <i className="fa-solid fa-calendar-days" />
                  </div>
                  <Filter />
                </div>
              </div>
              <div className="tab-content appointment-tab-content appoint-patient">
                <div
                  className="tab-pane fade show active"
                  id="pills-upcoming"
                  role="tabpanel"
                  aria-labelledby="pills-upcoming-tab"
                >
                  <div className="row">
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/upcoming-appointment">
                                  <img src={doctor_thumb_21} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0001</p>
                                  <h6>
                                    <Link href="/patient/upcoming-appointment">
                                      Dr Edalin Hendry
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              11 Nov 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              10.45 AM
                            </p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link href="/patient/upcoming-appointment">
                                  <i className="fa-solid fa-eye" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-comments" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-xmark" />
                                </Link>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <Link href="#" className="start-link">
                                <i className="fa-solid fa-calendar-check me-1" />
                                Attend
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/upcoming-appointment">
                                  <img src={doctor_thumb_13} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0002</p>
                                  <h6>
                                    <Link href="/patient/upcoming-appointment">
                                      Dr.Shanta Nesmith
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="hospital-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-hospital" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              05 Nov 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              11.50 AM
                            </p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link href="/patient/upcoming-appointment">
                                  <i className="fa-solid fa-eye" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-comments" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-xmark" />
                                </Link>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <Link href="#" className="start-link">
                                <i className="fa-solid fa-calendar-check me-1" />
                                Attend
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/upcoming-appointment">
                                  <img src={doctor_thumb_14} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0003</p>
                                  <h6>
                                    <Link href="/patient/upcoming-appointment">
                                      Dr.John Ewel
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="telephone-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-phone" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              27 Oct 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              09.30 AM
                            </p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link href="/patient/upcoming-appointment">
                                  <i className="fa-solid fa-eye" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-comments" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-xmark" />
                                </Link>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <Link href="#" className="start-link">
                                <i className="fa-solid fa-calendar-check me-1" />
                                Attend
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/upcoming-appointment">
                                  <img src={doctor_thumb_15} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0004</p>
                                  <h6>
                                    <Link href="/patient/upcoming-appointment">
                                      Dr.Susan Fenimore
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="hospital-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-hospital" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              18 Oct 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              12.20 PM
                            </p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link href="/patient/upcoming-appointment">
                                  <i className="fa-solid fa-eye" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-comments" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-xmark" />
                                </Link>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <Link href="#" className="start-link">
                                <i className="fa-solid fa-calendar-check me-1" />
                                Attend
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/upcoming-appointment">
                                  <img src={doctor_thumb_16} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0005</p>
                                  <h6>
                                    <Link href="/patient/upcoming-appointment">
                                      Dr.Juliet Rios
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              10 Oct 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              11.30 AM
                            </p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link href="/patient/upcoming-appointment">
                                  <i className="fa-solid fa-eye" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-comments" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-xmark" />
                                </Link>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <Link href="#" className="start-link">
                                <i className="fa-solid fa-calendar-check me-1" />
                                Attend
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/upcoming-appointment">
                                  <img src={doctor_thumb_17} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0006</p>
                                  <h6>
                                    <Link href="/patient/upcoming-appointment">
                                      Dr.Joseph Engels
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              26 Sep 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              10.20 AM
                            </p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link href="/patient/upcoming-appointment">
                                  <i className="fa-solid fa-eye" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-comments" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-xmark" />
                                </Link>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <Link href="#" className="start-link">
                                <i className="fa-solid fa-calendar-check me-1" />
                                Attend
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/upcoming-appointment">
                                  <img src={doctor_thumb_18} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0007</p>
                                  <h6>
                                    <Link href="/patient/upcoming-appointment">
                                      Dr.Victoria Selzer
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              14 Sep 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              08.10 AM
                            </p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link href="/patient/upcoming-appointment">
                                  <i className="fa-solid fa-eye" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-comments" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-xmark" />
                                </Link>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <Link href="#" className="start-link">
                                <i className="fa-solid fa-calendar-check me-1" />
                                Attend
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/upcoming-appointment">
                                  <img src={doctor_thumb_19} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0008</p>
                                  <h6>
                                    <Link href="/patient/upcoming-appointment">
                                      Dr.Benjamin Hedge
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              03 Sep 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              06.00 PM
                            </p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link href="/patient/upcoming-appointment">
                                  <i className="fa-solid fa-eye" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-comments" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-xmark" />
                                </Link>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <Link href="#" className="start-link">
                                <i className="fa-solid fa-calendar-check me-1" />
                                Attend
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/upcoming-appointment">
                                  <img src={doctor_thumb_21} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0009</p>
                                  <h6>
                                    <Link href="/patient/upcoming-appointment">
                                      Dr.Kristina Lepley
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              25 Aug 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              10.45 AM
                            </p>
                          </li>
                          <li className="appointment-action">
                            <ul>
                              <li>
                                <Link href="/patient/upcoming-appointment">
                                  <i className="fa-solid fa-eye" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-comments" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <i className="fa-solid fa-xmark" />
                                </Link>
                              </li>
                            </ul>
                            <div className="appointment-detail-btn">
                              <Link href="#" className="start-link">
                                <i className="fa-solid fa-calendar-check me-1" />
                                Attend
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    <div className="col-md-12">
                      <div className="loader-item text-center">
                        <Link href="#" className="btn btn-load">
                          Load More
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="pills-cancel"
                  role="tabpanel"
                  aria-labelledby="pills-cancel-tab"
                >
                  <div className="row">
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-cancelled-appointment">
                                  <img src={doctor_thumb_21} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0001</p>
                                  <h6>
                                    <Link href="/patient/patient-cancelled-appointment">
                                      Dr Edalin Hendry
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              11 Nov 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              10.45 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-cancelled-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-cancelled-appointment">
                                  <img src={doctor_thumb_13} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0002</p>
                                  <h6>
                                    <Link href="/patient/patient-cancelled-appointment">
                                      Dr.Shanta Nesmith
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              05 Nov 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              11.50 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-cancelled-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-cancelled-appointment">
                                  <img src={doctor_thumb_14} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0003</p>
                                  <h6>
                                    <Link href="/patient/patient-cancelled-appointment">
                                      Dr.John Ewel
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              27 Oct 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              09.30 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-cancelled-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-cancelled-appointment">
                                  <img src={doctor_thumb_15} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0004</p>
                                  <h6>
                                    <Link href="/patient/patient-cancelled-appointment">
                                      Dr.Susan Fenimore
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="hospital-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-hospital" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              18 Oct 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              12.20 PM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-cancelled-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-cancelled-appointment">
                                  <img src={doctor_thumb_16} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0005</p>
                                  <h6>
                                    <Link href="/patient/patient-cancelled-appointment">
                                      Dr.Juliet Rios
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              10 Oct 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              11.30 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-cancelled-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-cancelled-appointment">
                                  <img src={doctor_thumb_17} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0006</p>
                                  <h6>
                                    <Link href="/patient/patient-cancelled-appointment">
                                      Dr.Joseph Engels
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              26 Sep 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              10.20 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-cancelled-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    <div className="col-md-12">
                      <div className="loader-item text-center">
                        <Link href="#" className="btn btn-load">
                          Load More
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="pills-complete"
                  role="tabpanel"
                  aria-labelledby="pills-complete-tab"
                >
                  <div className="row">
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-completed-appointment">
                                  <img src={doctor_thumb_21} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0001</p>
                                  <h6>
                                    <Link href="/patient/patient-completed-appointment">
                                      Dr Edalin Hendry
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              11 Nov 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              10.45 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-completed-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-completed-appointment">
                                  <img src={doctor_thumb_13} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0002</p>
                                  <h6>
                                    <Link href="/patient/patient-completed-appointment">
                                      Dr.Shanta Nesmith
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="hospital-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-hospital" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              05 Nov 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              11.50 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-completed-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-completed-appointment">
                                  <img src={doctor_thumb_14} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0003</p>
                                  <h6>
                                    <Link href="/patient/patient-completed-appointment">
                                      Dr.John Ewel
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="telephone-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-phone" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              27 Oct 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              09.30 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-completed-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-completed-appointment">
                                  <img src={doctor_thumb_15} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0004</p>
                                  <h6>
                                    <Link href="/patient/patient-completed-appointment">
                                      Dr.Susan Fenimore
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="hospital-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-hospital" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              18 Oct 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              12.20 PM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-completed-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-completed-appointment">
                                  <img src={doctor_thumb_16} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0005</p>
                                  <h6>
                                    <Link href="/patient/patient-completed-appointment">
                                      Dr.Juliet Rios
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              10 Oct 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              11.30 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-completed-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
                    {/* Appointment Grid */}
                    <div className="col-xl-4 col-lg-6 col-md-12 d-flex">
                      <div className="appointment-wrap appointment-grid-wrap">
                        <ul>
                          <li>
                            <div className="appointment-grid-head">
                              <div className="patinet-information">
                                <Link href="/patient/patient-completed-appointment">
                                  <img src={doctor_thumb_17} alt="User Image" />
                                </Link>
                                <div className="patient-info">
                                  <p>#Apt0006</p>
                                  <h6>
                                    <Link href="/patient/patient-completed-appointment">
                                      Dr.Joseph Engels
                                    </Link>
                                  </h6>
                                  <p className="visit">General Visit</p>
                                </div>
                              </div>
                              <div className="grid-user-msg">
                                <span className="video-icon">
                                  <Link href="#">
                                    <i className="fa-solid fa-video" />
                                  </Link>
                                </span>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-calendar-check" />
                              26 Sep 2024
                            </p>
                            <p>
                              <i className="fa-solid fa-clock" />
                              10.20 AM
                            </p>
                          </li>
                          <li className="appointment-detail-btn">
                            <Link
                              href="/patient/patient-completed-appointment"
                              className="start-link w-100"
                            >
                              View Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Appointment Grid */}
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
          </div>
        </div>
      </div>

      <Footer {...props} />
    </div>
  );
};

export default AppointmentGrid;
