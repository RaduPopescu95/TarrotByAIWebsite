import React from "react";
import Header from "../../header";
import DashboardSidebar from "../dashboard/sidebar/sidebar";
import DoctorFooter from "../../common/doctorFooter";
import { doctor_15, doctor_thumb_02, doctorprofileimg } from "../../imagepath";
import CristinaImage from "../../../../assets/images/doctors-dashboard/profilecristina.png";

const CompletedAppoinments = (props) => {
  return (
    <>
      <Header {...props} />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Detalii Rezervare</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="/index">Acasa</a>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Detalii Rezervare
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* /Breadcrumb */}
      {/* Page Content */}
      <div className="content">
        <div className="container">
          <div className="row">
            {/* Profile Sidebar */}
            <div className="col-lg-4 col-xl-3 theiaStickySidebar">
              {/* Profile Sidebar */}
              <DashboardSidebar />
              {/* /Profile Sidebar */}
            </div>
            {/* / Profile Sidebar */}
            <div className="col-lg-8 col-xl-9">
              <div className="dashboard-header">
                <div className="header-back">
                  <a
                    href="/patient/patient-appointments"
                    className="back-arrow"
                  >
                    <i className="fa-solid fa-arrow-left" />
                  </a>
                  <h3>Detalii rezervare</h3>
                </div>
              </div>
              <div className="appointment-details-wrap">
                {/* Appointment Detail Card */}
                <div className="appointment-wrap appointment-detail-card">
                  <ul>
                    <li>
                      <div className="patinet-information">
                        <a href="#">
                          <img src={CristinaImage} alt="User Image" />
                        </a>
                        <div className="patient-info">
                          <p>#Rez0001</p>
                          <h6>
                            <a href="#">Cristina Zurba </a>
                          </h6>
                          {/* <div className="mail-info-patient">
                            <ul>
                              <li>
                                <i className="fa-solid fa-envelope" />
                                edalin@example.com
                              </li>
                              <li>
                                <i className="fa-solid fa-phone" />
                                &nbsp;+1 504 368 6874
                              </li>
                            </ul>
                          </div> */}
                        </div>
                      </div>
                    </li>
                    <li className="appointment-info">
                      {/* <div className="person-info">
                        <p>Person with patient</p>
                        <ul className="d-flex apponitment-types">
                          <li>Andrew</li>
                        </ul>
                      </div> */}
                      <div className="person-info">
                        <p>Tip Consultatie</p>
                        <ul className="d-flex apponitment-types">
                          <li>
                            <i className="fa-solid fa-video text-indigo" />
                            Video
                          </li>
                        </ul>
                      </div>
                    </li>
                    <li className="appointment-action">
                      <div className="detail-badge-info">
                        <span className="badge bg-green">Finalizata</span>
                      </div>
                      <div className="consult-fees">
                        <h6>Taxa consultaie : 100 RON</h6>
                      </div>
                      {/* <ul>
                        <li>
                          <a href="#">
                            <i className="fa-solid fa-comments" />
                          </a>
                        </li>
                      </ul> */}
                    </li>
                  </ul>
                  <ul className="detail-card-bottom-info">
                    <li>
                      <h6>Data &amp; Ora</h6>
                      <span>22 09 2024 - 12:00</span>
                    </li>
                    <li>
                      <h6>Categorie Consultatie</h6>
                      <span>Generala</span>
                    </li>
                    <li className="detail-badge-info">
                      {/* <a
                        href="#view_prescription"
                        data-bs-toggle="modal"
                        className="btn btn-primary prime-btn me-3"
                      >
                        Download Prescription
                      </a> */}
                      <a
                        href="#"
                        className="btn reschedule-btn btn-primary-border"
                      >
                        Rezerva alta consultatie
                      </a>
                    </li>
                  </ul>
                </div>
                {/* /Appointment Detail Card */}
                {/* <div className="recent-appointments">
                  <h5 className="head-text">Recent Appointments</h5>

                  <div className="appointment-wrap">
                    <ul>
                      <li>
                        <div className="patinet-information">
                          <a href="#">
                            <img src={doctor_15} alt="User Image" />
                          </a>
                          <div className="patient-info">
                            <p>#Apt0002</p>
                            <h6>
                              <a href="#">Dr.Shanta Nesmith</a>
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
                          <li>Chat</li>
                        </ul>
                      </li>
                      <li className="mail-info-patient">
                        <ul>
                          <li>
                            <i className="fa-solid fa-envelope" />
                            shanta@example.com
                          </li>
                          <li>
                            <i className="fa-solid fa-phone" />
                            &nbsp;+1 504 368 6874
                          </li>
                        </ul>
                      </li>
                      <li className="appointment-action">
                        <ul>
                          <li>
                            <a href="#">
                              <i className="fa-solid fa-eye" />
                            </a>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="appointment-wrap">
                    <ul>
                      <li>
                        <div className="patinet-information">
                          <a href="#">
                            <img src={doctor_thumb_02} alt="User Image" />
                          </a>
                          <div className="patient-info">
                            <p>#Apt0003</p>
                            <h6>
                              <a href="#">Dr.John Ewel</a>
                            </h6>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p>
                          <i className="fa-solid fa-clock" />
                          27 Oct 2024 09.30 AM
                        </p>
                        <ul className="d-flex apponitment-types">
                          <li>General Visit</li>
                          <li>Video Call</li>
                        </ul>
                      </li>
                      <li className="mail-info-patient">
                        <ul>
                          <li>
                            <i className="fa-solid fa-envelope" />
                            john@example.com
                          </li>
                          <li>
                            <i className="fa-solid fa-phone" />
                            &nbsp;+1 749 104 6291
                          </li>
                        </ul>
                      </li>
                      <li className="appointment-action">
                        <ul>
                          <li>
                            <a href="#">
                              <i className="fa-solid fa-eye" />
                            </a>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DoctorFooter {...props} />
      {/* /Page Content */}
    </>
  );
};

export default CompletedAppoinments;
