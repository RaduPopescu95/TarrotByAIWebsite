import React from "react";
import Link from "next/link";
import { doctorprofileimg } from "../../imagepath";
import profilecristina from "../../../../assets/images/doctors-dashboard/profilecristina.png";

import Select from "react-select";
const DoctorSidebar = () => {
  let pathnames = window.location.pathname;

  const availablity = [
    { value: "Online acum", label: "Online acum" },
    { value: "Offline", label: "Offline" },
  ];

  return (
    <>
      {/* Profile Sidebar */}
      <div className="profile-sidebar doctor-sidebar profile-sidebar-new">
        <div className="widget-profile pro-widget-content">
          <div className="profile-info-widget">
            <Link href="#" className="booking-doc-img">
              <img src={profilecristina} alt="User Image" />
            </Link>
            <div className="profile-det-info">
              <h3>
                <Link href="#">Cristina Zurba</Link>
              </h3>
              {/* <div className="patient-details">
                <h5 className="mb-0">
                  BDS, MDS - Oral &amp; Maxillofacial Surgery
                </h5>
              </div> */}
              {/* <span className="badge doctor-role-badge">
                <i className="fa-solid fa-circle" />
                Dentist
              </span> */}
            </div>
          </div>
        </div>
        <div className="doctor-available-head">
          <div className="input-block input-block-new">
            <label className="form-label">
              Vizibilitate <span className="text-danger">*</span>
            </label>

            <Select
              className="select"
              options={availablity}
              defaultValue={availablity[0]}
            />
          </div>
        </div>
        <div className="dashboard-widget">
          <nav className="dashboard-menu">
            <ul>
              <li
                className={
                  pathnames.includes("/doctor/doctor-dashboard") ? "active" : ""
                }
              >
                <Link href="/doctor/doctor-dashboard">
                  <i className="fa-solid fa-shapes me-2" />
                  <span>Panou principal</span>
                </Link>
              </li>
              {/* <li
                className={
                  pathnames.includes("/doctor/doctor-request") ? "active" : ""
                }
              >
                <Link href="/doctor/doctor-request">
                  <i className="fa-solid fa-calendar-check me-2" />
                  <span>Requests</span>
                  <small className="unread-msg">2</small>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/doctor/doctor-appointments-grid") ||
                  pathnames.includes("/doctor/appointments") ||
                  pathnames.includes("/doctor/doctor-appointment-start") ||
                  pathnames.includes("/doctor/doctor-upcoming-appointment") ||
                  pathnames.includes(
                    "/doctor/doctor-cancelled-appointment-2"
                  ) ||
                  pathnames.includes("/doctor/doctor-cancelled-appointment")
                    ? "active"
                    : ""
                }
              >
                <Link href="/doctor/appointments">
                  <i className="fa-solid fa-calendar-days me-2" />
                  <span>Appointments</span>
                </Link>
              </li> */}

              <li
                className={
                  pathnames.includes("/doctor/available-timings")
                    ? "active"
                    : ""
                }
              >
                <Link href="/doctor/available-timings">
                  <i className="fa-solid fa-calendar-day me-2" />
                  <span>Calendar</span>
                </Link>
              </li>
              {/* <li
                className={
                  pathnames.includes("/doctor/my-patients") ||
                  pathnames.includes("/doctor/patient-profile")
                    ? "active"
                    : ""
                }
              >
                <Link href="/doctor/my-patients">
                  <i className="fa-solid fa-user-injured me-2" />
                  <span>My Patients</span>
                </Link>
              </li> */}
              <li
                className={
                  pathnames.includes("/doctor/doctor-specialities")
                    ? "active"
                    : ""
                }
              >
                <Link href="/doctor/doctor-specialities">
                  <i className="fa-solid fa-clock me-2" />
                  <span>Categorii Consultatii</span>
                </Link>
              </li>
              {/* <li
                className={pathnames.includes("/doctor/review") ? "active" : ""}
              >
                <Link href="/doctor/review">
                  <i className="fas fa-star me-2" />
                  <span>Reviews</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/doctor/account") ? "active" : ""
                }
              >
                <Link href="/doctor/account">
                  <i className="fa-solid fa-file-contract me-2" />
                  <span>Accounts</span>
                </Link>
              </li> */}
              <li
                className={
                  pathnames.includes("/doctor/invoices") ? "active" : ""
                }
              >
                <Link href="/doctor/invoices">
                  <i className="fa-solid fa-file-lines me-2" />
                  <span>Facturi</span>
                </Link>
              </li>
              {/* <li
                className={
                  pathnames.includes("/doctor/doctor-payment") ? "active" : ""
                }
              >
                <Link href="/doctor/doctor-payment">
                  <i className="fa-solid fa-money-bill-1 me-2" />
                  <span>Payout Settings</span>
                </Link>
              </li> */}
              {/* <li>
                <Link href="/doctor/chat-doctor">
                  <i className="fa-solid fa-comments me-2" />
                  <span>Message</span>
                  <small className="unread-msg">7</small>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/doctor/profile-setting") ||
                  pathnames.includes("/doctor/doctor-experience") ||
                  pathnames.includes("/doctor/doctor-awards-settings") ||
                  pathnames.includes("/doctor/doctor-insurance-settings") ||
                  pathnames.includes("/doctor/doctor-clinics-settings") ||
                  pathnames.includes("/doctor/doctor-business-setting")
                    ? "active"
                    : ""
                }
              >
                <Link href="/doctor/profile-setting">
                  <i className="fa-solid fa-user-pen me-2" />
                  <span>Setari profil</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/doctor/social-media") ? "active" : ""
                }
              >
                <Link href="/doctor/social-media">
                  <i className="fa-solid fa-shield me-2" />
                  <span>Social Media</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/doctor/doctor-change-password")
                    ? "active"
                    : ""
                }
              >
                <Link href="/doctor/doctor-change-password">
                  <i className="fa-solid fa-key me-2" />
                  <span>Change Password</span>
                </Link>
              </li> */}
              <li className={pathnames.includes("/login") ? "active" : ""}>
                <Link href="/login">
                  <i className="fa-solid fa-calendar-check me-2" />
                  <span>Deconectare</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      {/* /Profile Sidebar */}
    </>
  );
};

export default DoctorSidebar;
