import React from "react";
import Header from "../../header";
import DashboardSidebar from "../dashboard/sidebar/sidebar";
import Footer from "../../footer";
import StickyBox from "react-sticky-box";
import Link from "next/link";
import {
  doctor_thumb_13,
  doctor_thumb_14,
  doctor_thumb_15,
  doctor_thumb_16,
  doctor_thumb_17,
  doctor_thumb_18,
  doctor_thumb_19,
} from "../../imagepath";
import { Filter, initialSettings } from "../../common/filter";
import CristinaImage from "../../../../assets/images/doctors-dashboard/profilecristina.png";

import DateRangePicker from "react-bootstrap-daterangepicker";
import Home1Header from "../../home/home-1/header";

const PatientAppointments = (props) => {
  return (
    <>
      <Home1Header />
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Rezervarile mele</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Cont</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Rezervarile mele
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
                <h3>Rezervari</h3>
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
                      <Link
                        href="/patient/patient-appointments"
                        className="active"
                      >
                        <i className="fa-solid fa-list" />
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="view-icons">
                      <Link href="/patient/appoinment-grid">
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
                        Viitoare<span>21</span>
                      </button>
                    </li>
                    {/* <li className="nav-item" role="presentation">
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
                    </li> */}
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
                        Finalizate<span>214</span>
                      </button>
                    </li>
                  </ul>
                </div>
                {/* <div className="filter-head">
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
                </div> */}
              </div>
              <div className="tab-content appointment-tab-content">
                <div
                  className="tab-pane fade show active"
                  id="pills-upcoming"
                  role="tabpanel"
                  aria-labelledby="pills-upcoming-tab"
                >
                  {/* Appointment List */}
                  <div className="appointment-wrap">
                    <ul>
                      <li>
                        <div className="patinet-information">
                          <Link href="/patient/upcoming-appointment">
                            <img src={CristinaImage} alt="User Image" />
                          </Link>
                          <div className="patient-info">
                            <p>#Rez0001</p>
                            <h6>
                              <Link href="/patient/upcoming-appointment">
                                Cristina Zurba
                              </Link>
                            </h6>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p>
                          <i className="fa-solid fa-clock" />
                          11 09 2024 10.45
                        </p>
                      </li>
                      <li className="mail-info-patient">
                        <ul>
                          <li>
                            <i className="fa-solid fa-phone" />
                            Consultatie Video
                          </li>
                        </ul>
                      </li>
                      <li className="appointment-action">
                        <ul>
                          <li>
                            <Link href="/patient/upcoming-appointment">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </li>
                          {/* <li>
                            <Link href="#">
                              <i className="fa-solid fa-comments" />
                            </Link>
                          </li>
                          <li>
                            <Link href="#">
                              <i className="fa-solid fa-xmark" />
                            </Link>
                          </li> */}
                        </ul>
                      </li>
                      <li className="appointment-detail-btn">
                        <Link href="/pages/video-call" className="start-link">
                          <i className="fa-solid fa-calendar-check me-1" />
                          Participa
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Appointment List */}
                  {/* Appointment List */}
                  <div className="appointment-wrap">
                    <ul>
                      <li>
                        <div className="patinet-information">
                          <Link href="/patient/upcoming-appointment">
                            <img src={CristinaImage} alt="User Image" />
                          </Link>
                          <div className="patient-info">
                            <p>#Rez0002</p>
                            <h6>
                              <Link href="/patient/upcoming-appointment">
                                Cristina Zurba
                              </Link>
                            </h6>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p>
                          <i className="fa-solid fa-clock" />
                          11 09 2024 10.45
                        </p>
                      </li>
                      <li className="mail-info-patient">
                        <ul>
                          <li>
                            <i className="fa-solid fa-phone" />
                            Consultatie Video
                          </li>
                        </ul>
                      </li>
                      <li className="appointment-action">
                        <ul>
                          <li>
                            <Link href="/patient/upcoming-appointment">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </li>
                          {/* <li>
                            <Link href="#">
                              <i className="fa-solid fa-comments" />
                            </Link>
                          </li>
                          <li>
                            <Link href="#">
                              <i className="fa-solid fa-xmark" />
                            </Link>
                          </li> */}
                        </ul>
                      </li>
                      <li className="appointment-detail-btn">
                        <Link href="/pages/video-call" className="start-link">
                          <i className="fa-solid fa-calendar-check me-1" />
                          Participa
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Appointment List */}
                  {/* Pagination */}
                  <div className="pagination dashboard-pagination">
                    <ul>
                      <li>
                        <Link href="#" className="page-link">
                          <i className="fa-solid fa-chevron-left" />
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          1
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link active">
                          2
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          3
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          4
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          ...
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          <i className="fa-solid fa-chevron-right" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Pagination */}
                </div>
                <div
                  className="tab-pane fade"
                  id="pills-cancel"
                  role="tabpanel"
                  aria-labelledby="pills-cancel-tab"
                >
                  {/* Appointment List */}
                  <div className="appointment-wrap">
                    <ul>
                      <li>
                        <div className="patinet-information">
                          <Link href="/patient/patient-cancelled-appointment">
                            <img src={CristinaImage} alt="User Image" />
                          </Link>
                          <div className="patient-info">
                            <p>#Apt00011</p>
                            <h6>
                              <Link href="/patient/patient-cancelled-appointment">
                                Dr Edalin
                              </Link>
                            </h6>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p>
                          <i className="fa-solid fa-clock" />
                          11 Nov 2024 10.45 AM
                        </p>
                        <ul className="d-flex apponitment-types">
                          <li>General Visit</li>
                          <li>Video Call</li>
                        </ul>
                      </li>
                      <li className="appointment-detail-btn">
                        <Link
                          href="/patient/patient-cancelled-appointment"
                          className="start-link"
                        >
                          View Details
                          <i className="fa-regular fa-circle-right ms-1" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Appointment List */}
                  {/* Appointment List */}
                  <div className="appointment-wrap">
                    <ul>
                      <li>
                        <div className="patinet-information">
                          <Link href="/patient/patient-cancelled-appointment">
                            <img src={doctor_thumb_13} alt="User Image" />
                          </Link>
                          <div className="patient-info">
                            <p>#Apt0002</p>
                            <h6>
                              <Link href="/patient/patient-cancelled-appointment">
                                Dr.Shanta
                              </Link>
                              <span className="badge new-tag">New</span>
                            </h6>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p>
                          <i className="fa-solid fa-clock" />
                          05 Nov 2024 11.50 AM
                        </p>
                        <ul className="d-flex apponitment-types">
                          <li>General Visit</li>
                          <li>Audio Call</li>
                        </ul>
                      </li>
                      <li className="appointment-detail-btn">
                        <Link
                          href="/patient/patient-cancelled-appointment"
                          className="start-link"
                        >
                          View Details
                          <i className="fa-regular fa-circle-right ms-1" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Appointment List */}
                  {/* Appointment List */}

                  {/* Pagination */}
                  <div className="pagination dashboard-pagination">
                    <ul>
                      <li>
                        <Link href="#" className="page-link">
                          <i className="fa-solid fa-chevron-left" />
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          1
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link active">
                          2
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          3
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          4
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          ...
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="page-link">
                          <i className="fa-solid fa-chevron-right" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Pagination */}
                </div>
                <div
                  className="tab-pane fade"
                  id="pills-complete"
                  role="tabpanel"
                  aria-labelledby="pills-complete-tab"
                >
                  {/* Appointment List */}
                  <div className="appointment-wrap">
                    <ul>
                      <li>
                        <div className="patinet-information">
                          <Link href="/patient/patient-completed-appointment">
                            <img src={CristinaImage} alt="User Image" />
                          </Link>
                          <div className="patient-info">
                            <p>#Rez023</p>
                            <h6>
                              <Link href="/patient/patient-completed-appointment">
                                Cristina Zurba
                              </Link>
                            </h6>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p>
                          <i className="fa-solid fa-clock" />
                          11 09 2024 10.45
                        </p>
                        <ul className="d-flex apponitment-types">
                          <li>Consultatie Video</li>
                        </ul>
                      </li>
                      <li className="appointment-detail-btn">
                        <Link
                          href="/patient/patient-completed-appointment"
                          className="start-link"
                        >
                          Vezi detalii
                          <i className="fa-regular fa-circle-right ms-1" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Appointment List */}

                  {/* /Pagination */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer {...props} />
    </>
  );
};

export default PatientAppointments;
