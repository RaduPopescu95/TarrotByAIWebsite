import React from "react";
// import { IMG01 } from "./img";
// import Nav from "react-bootstrap/Nav";
import Link from "next/link";
import { doctor_thumb_02 } from "../../../imagepath";

const InvoiceSidebar = () => {
  let pathnames = window.location.pathname;
  return (
    <div className="profile-sidebar">
      <div className="widget-profile pro-widget-content">
        <div className="profile-info-widget">
          <Link href="#" className="booking-doc-img">
            <img src={doctor_thumb_02} alt="User Image" />
          </Link>
          <div className="profile-det-info">
            <h3>Dr. Darren Elder</h3>
            <div className="patient-details">
              <h5 className="mb-0">
                BDS, MDS - Oral &amp; Maxillofacial Surgery
              </h5>
            </div>
          </div>
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
                <i className="fas fa-columns" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li
              className={
                pathnames.includes("/doctor/appointments") ? "active" : ""
              }
            >
              <Link href="/doctor/appointments">
                <i className="fas fa-calendar-check" />
                <span>Appointments</span>
              </Link>
            </li>
            <li
              className={
                pathnames.includes("/doctor/my-patients") ? "active" : ""
              }
            >
              <Link href="/doctor/my-patients">
                <i className="fas fa-user-injured" />
                <span>My Patients</span>
              </Link>
            </li>
            <li
              className={
                pathnames.includes("/doctor/schedule-timing") ? "active" : ""
              }
            >
              <Link href="/doctor/schedule-timing">
                <i className="fas fa-hourglass-start" />
                <span>Schedule Timings</span>
              </Link>
            </li>
            <li
              className={
                pathnames.includes("/doctor/available-timing") ? "active" : ""
              }
            >
              <Link href="/doctor/available-timing">
                <i className="fas fa-clock" />
                <span>Available Timings</span>
              </Link>
            </li>
            <li
              className={pathnames.includes("/pages/invoiced") ? "active" : ""}
            >
              <Link href="/pages/invoice">
                <i className="fas fa-file-invoice" />
                <span>Invoices</span>
              </Link>
            </li>
            <li
              className={pathnames.includes("/doctor/account") ? "active" : ""}
            >
              <Link href="/doctor/account">
                <i className="fas fa-file-invoice-dollar" />
                <span>Accounts</span>
              </Link>
            </li>
            <li
              className={pathnames.includes("/doctor/review") ? "active" : ""}
            >
              <Link href="/doctor/review">
                <i className="fas fa-star" />
                <span>Reviews</span>
              </Link>
            </li>
            <li
              className={
                pathnames.includes("/doctor/chat-doctor") ? "active" : ""
              }
            >
              <Link href="/doctor/chat-doctor">
                <i className="fas fa-comments" />
                <span>Message</span>
                <small className="unread-msg">23</small>
              </Link>
            </li>
            <li
              className={
                pathnames.includes("/doctor/profile-setting") ? "active" : ""
              }
            >
              <Link href="/doctor/profile-setting">
                <i className="fas fa-user-cog" />
                <span>Profile Settings</span>
              </Link>
            </li>
            <li
              className={
                pathnames.includes("/doctor/social-media") ? "active" : ""
              }
            >
              <Link href="/doctor/social-media">
                <i className="fas fa-share-alt" />
                <span>Social Media</span>
              </Link>
            </li>
            <li
              className={
                pathnames.includes("/doctor/doctor-change-passwword")
                  ? "active"
                  : ""
              }
            >
              <Link href="/doctor/doctor-change-passwword">
                <i className="fas fa-lock" />
                <span>Change Password</span>
              </Link>
            </li>
            <li>
              <Link href="/home-2">
                <i className="fas fa-sign-out-alt" />
                <span>Logout</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default InvoiceSidebar;
