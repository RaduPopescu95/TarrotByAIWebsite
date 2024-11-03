import React from "react";
import DoctorSidebar from "../sidebar";
import Link from "next/link";
import {
  doctordashboardprofile01,
  doctordashboardprofile02,
  doctordashboardprofile06,
  doctordashboardprofile3,
} from "../../imagepath";
import Header from "../../header";
import DoctorFooter from "../../common/doctorFooter";

const DoctorRequest = (props) => {
  return (
    <div>
      <Header {...props} />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Requests</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Home</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Requests
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* /Breadcrumb */}
      {/* Page Content */}
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-xl-3 theiaStickySidebar">
              {/* Profile Sidebar */}
              <DoctorSidebar />
              {/* /Profile Sidebar */}
            </div>
            <div className="col-lg-8 col-xl-9">
              <div className="dashboard-header">
                <h3>Requests</h3>
                <ul>
                  <li>
                    <div className="dropdown header-dropdown">
                      <Link
                        className="dropdown-toggle nav-tog"
                        data-bs-toggle="dropdown"
                        href="#"
                      >
                        Last 7 Days
                      </Link>
                      <div className="dropdown-menu dropdown-menu-end">
                        <Link href="#" className="dropdown-item">
                          Today
                        </Link>
                        <Link href="#" className="dropdown-item">
                          This Month
                        </Link>
                        <Link href="#" className="dropdown-item">
                          Last 7 Days
                        </Link>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              {/* Request List */}
              <div className="appointment-wrap">
                <ul>
                  <li>
                    <div className="patinet-information">
                      <Link href="/doctor/patient-profile">
                        <img src={doctordashboardprofile01} alt="User Image" />
                      </Link>
                      <div className="patient-info">
                        <p>#Apt0001</p>
                        <h6>
                          <Link href="/doctor/patient-profile">Adrian</Link>
                          <span className="badge new-tag">New</span>
                        </h6>
                      </div>
                    </div>
                  </li>
                  <li className="appointment-info">
                    <p>
                      <i className="fa-solid fa-clock" />
                      11 Nov 2024 10.45 AM
                    </p>
                    <p className="md-text">Consultation for Dental</p>
                  </li>
                  <li className="appointment-type">
                    <p className="md-text">Type of Appointment</p>
                    <p>
                      <i className="fa-solid fa-video text-blue" />
                      Video Call
                    </p>
                  </li>
                  <li>
                    <ul className="request-action">
                      <li>
                        <Link
                          href="#"
                          className="accept-link"
                          data-bs-toggle="modal"
                          data-bs-target="#accept_appointment"
                        >
                          <i className="fa-solid fa-check" />
                          Accept
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="reject-link"
                          data-bs-toggle="modal"
                          data-bs-target="#cancel_appointment"
                        >
                          <i className="fa-solid fa-xmark" />
                          Reject
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              {/* /Request List */}
              {/* Request List */}
              <div className="appointment-wrap">
                <ul>
                  <li>
                    <div className="patinet-information">
                      <Link href="/doctor/patient-profile">
                        <img src={doctordashboardprofile02} alt="User Image" />
                      </Link>
                      <div className="patient-info">
                        <p>#Apt0002</p>
                        <h6>
                          <Link href="/doctor/patient-profile">Kelly</Link>
                        </h6>
                      </div>
                    </div>
                  </li>
                  <li className="appointment-info">
                    <p>
                      <i className="fa-solid fa-clock" />
                      10 Nov 2024 02.00 PM
                    </p>
                    <p className="md-text">Consultation for Dental</p>
                  </li>
                  <li className="appointment-type">
                    <p className="md-text">Type of Appointment</p>
                    <p>
                      <i className="fa-solid fa-building text-green" />
                      Direct Visit{" "}
                      <i
                        className="fa-solid fa-circle-info"
                        data-bs-toggle="tooltip"
                        title="Clinic Location Sofia’s Clinic"
                      />
                    </p>
                  </li>
                  <li>
                    <ul className="request-action">
                      <li>
                        <Link
                          href="#"
                          className="accept-link"
                          data-bs-toggle="modal"
                          data-bs-target="#accept_appointment"
                        >
                          <i className="fa-solid fa-check" />
                          Accept
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="reject-link"
                          data-bs-toggle="modal"
                          data-bs-target="#cancel_appointment"
                        >
                          <i className="fa-solid fa-xmark" />
                          Reject
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              {/* /Request List */}
              {/* Request List */}
              <div className="appointment-wrap">
                <ul>
                  <li>
                    <div className="patinet-information">
                      <Link href="/doctor/patient-profile">
                        <img src={doctordashboardprofile3} alt="User Image" />
                      </Link>
                      <div className="patient-info">
                        <p>#Apt0001</p>
                        <h6>
                          <Link href="/doctor/patient-profile">Samuel</Link>
                        </h6>
                      </div>
                    </div>
                  </li>
                  <li className="appointment-info">
                    <p>
                      <i className="fa-solid fa-clock" />
                      08 Nov 2024 08.30 AM
                    </p>
                    <p className="md-text">Consultation for Dental</p>
                  </li>
                  <li className="appointment-type">
                    <p className="md-text">Type of Appointment</p>
                    <p>
                      <i className="fa-solid fa-phone text-indigo" />
                      Audio Call
                    </p>
                  </li>
                  <li>
                    <ul className="request-action">
                      <li>
                        <Link
                          href="#"
                          className="accept-link"
                          data-bs-toggle="modal"
                          data-bs-target="#accept_appointment"
                        >
                          <i className="fa-solid fa-check" />
                          Accept
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="reject-link"
                          data-bs-toggle="modal"
                          data-bs-target="#cancel_appointment"
                        >
                          <i className="fa-solid fa-xmark" />
                          Reject
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              {/* /Request List */}
              {/* Request List */}
              <div className="appointment-wrap">
                <ul>
                  <li>
                    <div className="patinet-information">
                      <Link href="/doctor/patient-profile">
                        <img src={doctordashboardprofile06} alt="User Image" />
                      </Link>
                      <div className="patient-info">
                        <p>#Apt0001</p>
                        <h6>
                          <Link href="/doctor/patient-profile">Anderea</Link>
                        </h6>
                      </div>
                    </div>
                  </li>
                  <li className="appointment-info">
                    <p>
                      <i className="fa-solid fa-clock" />
                      05 Nov 2024 11.00 AM
                    </p>
                    <p className="md-text">Consultation for Dental</p>
                  </li>
                  <li className="appointment-type">
                    <p className="md-text">Type of Appointment</p>
                    <p>
                      <i className="fa-solid fa-phone text-indigo" />
                      Audio Call
                    </p>
                  </li>
                  <li>
                    <ul className="request-action">
                      <li>
                        <Link
                          href="#"
                          className="accept-link"
                          data-bs-toggle="modal"
                          data-bs-target="#accept_appointment"
                        >
                          <i className="fa-solid fa-check" />
                          Accept
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="reject-link"
                          data-bs-toggle="modal"
                          data-bs-target="#cancel_appointment"
                        >
                          <i className="fa-solid fa-xmark" />
                          Reject
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              {/* /Request List */}
              <div className="row">
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
      {/* /Page Content */}
      <DoctorFooter {...props} />
      {/* Appointment Accepted Modal */}
      <div className="modal fade info-modal" id="accept_appointment">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body">
              <div className="success-wrap text-center">
                <span className="icon-success">
                  <i className="fa-solid fa-calendar-check" />
                </span>
                <h3>Appointment Accepted</h3>
                <p>Your Appointment has been scheduled on 23 Mar 2023</p>
                <Link
                  href="#"
                  className="btn btn-primary prime-btn"
                  data-bs-dismiss="modal"
                >
                  Go to Appointments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Appointment Accepted Modal */}
      {/* Appointment Cancel Modal */}
      <div className="modal fade info-modal" id="cancel_appointment">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body">
              <div className="success-wrap">
                <div className="success-info">
                  <div className="text-center">
                    <span className="icon-success bg-red">
                      <i className="fa-solid fa-xmark" />
                    </span>
                    <h3>Are you Sure</h3>
                    <p>Do you want to Cancel Appointment</p>
                  </div>
                  <div className="form-wrap">
                    <label className="col-form-label">
                      Cancel Reason <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      defaultValue={""}
                    />
                  </div>
                  <div className="form-wrap">
                    <div className="custom-control form-check custom-control-inline">
                      <input
                        type="radio"
                        id="reshedule"
                        name="rating_option"
                        className="form-check-input"
                        defaultValue="price_free"
                        defaultChecked=""
                      />
                      <label className="form-check-label" htmlFor="reshedule">
                        Cancel with Reschedule
                      </label>
                    </div>
                  </div>
                  <div className="form-wrap">
                    <div className="custom-control form-check custom-control-inline">
                      <input
                        type="radio"
                        id="refund"
                        name="rating_option"
                        className="form-check-input"
                        defaultValue="price_free"
                        defaultChecked=""
                      />
                      <label className="form-check-label" htmlFor="refund">
                        Cancel with Request Refund Description text
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-button">
                  <div className="row gx-3">
                    <div className="col-sm-6">
                      <Link
                        href="#"
                        className="btn btn-gray w-100"
                        data-bs-dismiss="modal"
                      >
                        No, I change my mind
                      </Link>
                    </div>
                    <div className="col-sm-6">
                      <Link
                        href="#"
                        className="btn btn-primary prime-btn w-100"
                        data-bs-dismiss="modal"
                      >
                        Go to Appointments
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Appointment Cancel Modal */}
    </div>
  );
};

export default DoctorRequest;
