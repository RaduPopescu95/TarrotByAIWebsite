import React from "react";
import Link from "next/link";
import Header from "../../header";
import "react-datepicker/dist/react-datepicker.css";
import DoctorFooter from "../../common/doctorFooter";
import DoctorSidebar from "../sidebar";
import {
  doctor_thumb_01,
  doctor_thumb_02,
  doctor_thumb_03,
  doctor_thumb_05,
  doctor_thumb_07,
  doctor_thumb_08,
  doctor_thumb_09,
  doctordashboardprofile01,
  doctorthumb02,
  logo,
} from "../../imagepath";
import Select from "react-select";

const PatientProfile = (props) => {
  const options = [
    { value: "", label: "Select Patient" },
    { value: "adrian_marshall", label: "Adrian Marshall" },
    { value: "kelly_stevens", label: "Kelly Stevens" },
    { value: "catherine_gracey", label: "Catherine Gracey" },
  ];
  const options2 = [
    { value: "", label: "Select Patient" },
    { value: "adrian_marshall", label: "Adrian Marshall" },
    { value: "kelly_stevens", label: "Kelly Stevens" },
    { value: "catherine_gracey", label: "Catherine Gracey" },
  ];
  const options3 = [
    { value: "", label: "Select" },
    { value: "Visit", label: "Visit" },
    { value: "Online", label: "Online" },
  ];
  const options4 = [
    { value: "", label: "Select" },
    { value: "1 Month", label: "1 Month" },
    { value: "1 Day", label: "1 Day" },
  ];

  return (
    <>
      <div className="main-wrapper">
        <Header {...props} />
        {/* Breadcrumb */}
        <div className="breadcrumb-bar-two">
          <div className="container">
            <div className="row align-items-center inner-banner">
              <div className="col-md-12 col-12 text-center">
                <h2 className="breadcrumb-title">My Patient</h2>
                <nav aria-label="breadcrumb" className="page-breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link href="/home-1">Home</Link>
                    </li>
                    <li className="breadcrumb-item" aria-current="page">
                      My Patient
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
              {/* Patient Details */}
              <div className="col-lg-8 col-xl-9">
                <div className="appointment-patient">
                  <div className="dashboard-header">
                    <h3>
                      <Link href="/doctor/my-patients">
                        <i className="fa-solid fa-arrow-left" /> Patient Details
                      </Link>
                    </h3>
                  </div>
                  <div className="patient-wrap">
                    <div className="patient-info">
                      <img src={doctordashboardprofile01} alt="img" />
                      <div className="user-patient">
                        <h6>#P0016</h6>
                        <h5>Adrian Marshall</h5>
                        <ul>
                          <li>Age : 42</li>
                          <li>Male</li>
                          <li>AB+ve</li>
                        </ul>
                      </div>
                    </div>
                    <div className="patient-book">
                      <p>
                        <i className="fa-solid fa-calendar-days" />
                        Last Booking
                      </p>
                      <p>24 Mar 2024</p>
                    </div>
                  </div>
                  {/* Appoitment Tabs */}
                  <div className="appointment-tabs user-tab">
                    <ul className="nav">
                      <li className="nav-item">
                        <Link
                          className="nav-link active"
                          href="#pat_appointments"
                          data-bs-toggle="tab"
                        >
                          Appointments
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          className="nav-link"
                          href="#prescription"
                          data-bs-toggle="tab"
                        >
                          Prescription
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          className="nav-link"
                          href="#medical"
                          data-bs-toggle="tab"
                        >
                          Medical Records
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          className="nav-link"
                          href="#billing"
                          data-bs-toggle="tab"
                        >
                          Billing
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {/* /Appoitment Tabs */}
                  <div className="tab-content pt-0">
                    {/* Appointment Tab */}
                    <div
                      id="pat_appointments"
                      className="tab-pane fade show active"
                    >
                      <div className="search-header">
                        <div className="search-field">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search"
                          />
                          <span className="search-icon">
                            <i className="fa-solid fa-magnifying-glass" />
                          </span>
                        </div>
                      </div>
                      <div className="custom-table">
                        <div className="table-responsive">
                          <table className="table table-center mb-0">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Doctor</th>
                                <th>Appt Date</th>
                                <th>Booking Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt123
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctorthumb02}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Edalin Hendry
                                    </Link>
                                  </h2>
                                </td>
                                <td>24 Mar 2024</td>
                                <td>21 Mar 2024</td>
                                <td>$300</td>
                                <td>
                                  <span className="badge badge-yellow status-badge">
                                    Upcoming
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link href="/patient/upcoming-appointment">
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt124
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_05}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      John Homes
                                    </Link>
                                  </h2>
                                </td>
                                <td>17 Mar 2024</td>
                                <td>14 Mar 2024</td>
                                <td>$450</td>
                                <td>
                                  <span className="badge badge-yellow status-badge">
                                    Upcoming
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link href="/patient/upcoming-appointment">
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt125
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_03}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Shanta Neill
                                    </Link>
                                  </h2>
                                </td>
                                <td>11 Mar 2024</td>
                                <td>07 Mar 2024</td>
                                <td>$250</td>
                                <td>
                                  <span className="badge badge-yellow status-badge">
                                    Upcoming
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link href="/patient/upcoming-appointment">
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt126
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_08}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Anthony Tran
                                    </Link>
                                  </h2>
                                </td>
                                <td>26 Feb 2024</td>
                                <td>23 Feb 2024</td>
                                <td>$320</td>
                                <td>
                                  <span className="badge badge-yellow status-badge">
                                    Upcoming
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link href="/patient/upcoming-appointment">
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt127
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_01}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Susan Lingo
                                    </Link>
                                  </h2>
                                </td>
                                <td>18 Feb 2024</td>
                                <td>15 Feb 2024</td>
                                <td>$480</td>
                                <td>
                                  <span className="badge badge-yellow status-badge">
                                    Upcoming
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link href="/patient/upcoming-appointment">
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt128
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_09}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Joseph Boyd
                                    </Link>
                                  </h2>
                                </td>
                                <td>10 Feb 2024</td>
                                <td>07 Feb 2024</td>
                                <td>$260</td>
                                <td>
                                  <span className="badge badge-danger status-badge">
                                    Cancelled
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link href="/patient/upcoming-appointment">
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt129
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_07}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Juliet Gabriel
                                    </Link>
                                  </h2>
                                </td>
                                <td>28 Jan 2024</td>
                                <td>25 Jan 2024</td>
                                <td>$350</td>
                                <td>
                                  <span className="badge badge-green status-badge">
                                    Completed
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link href="/patient/upcoming-appointment">
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
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
                    {/* /Appointment Tab */}
                    {/* Prescription Tab */}
                    <div className="tab-pane fade" id="prescription">
                      <div className="search-header">
                        <div className="search-field">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search"
                          />
                          <span className="search-icon">
                            <i className="fa-solid fa-magnifying-glass" />
                          </span>
                        </div>
                        <div>
                          <Link
                            href="#"
                            className="btn btn-primary prime-btn"
                            data-bs-toggle="modal"
                            data-bs-target="#add_prescription"
                          >
                            Add New Prescription
                          </Link>
                        </div>
                      </div>
                      <div className="custom-table">
                        <div className="table-responsive">
                          <table className="table table-center mb-0">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Prescriped By</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt123
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_02}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Edalin Hendry
                                    </Link>
                                  </h2>
                                </td>
                                <td>Visit</td>
                                <td>25 Jan 2024</td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_prescription"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt124
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_05}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      John Homes
                                    </Link>
                                  </h2>
                                </td>
                                <td>Visit</td>
                                <td>28 Jan 2024</td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_prescription"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt125
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_03}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Shanta Neill
                                    </Link>
                                  </h2>
                                </td>
                                <td>Visit</td>
                                <td>11 Feb 2024</td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_prescription"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt126
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_08}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Anthony Tran
                                    </Link>
                                  </h2>
                                </td>
                                <td>Visit</td>
                                <td>19 Feb 2024</td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_prescription"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link
                                    href="/patient/upcoming-appointment"
                                    className="text-blue-600"
                                  >
                                    #Apt127
                                  </Link>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <Link
                                      href="/patient/doctor-profile"
                                      className="avatar avatar-sm me-2"
                                    >
                                      <img
                                        className="avatar-img rounded-3"
                                        src={doctor_thumb_01}
                                        alt="User Image"
                                      />
                                    </Link>
                                    <Link href="/patient/doctor-profile">
                                      Susan Lingo
                                    </Link>
                                  </h2>
                                </td>
                                <td>Visit</td>
                                <td>27 Feb 2024</td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_prescription"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
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
                    {/* /Prescription Tab */}
                    {/* Medical Records Tab */}
                    <div className="tab-pane fade" id="medical">
                      <div className="search-header">
                        <div className="search-field">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search"
                          />
                          <span className="search-icon">
                            <i className="fa-solid fa-magnifying-glass" />
                          </span>
                        </div>
                        <div>
                          <Link
                            href="#"
                            data-bs-toggle="modal"
                            data-bs-target="#add_medical_records"
                            className="btn btn-primary prime-btn"
                          >
                            Add Medical Record
                          </Link>
                        </div>
                      </div>
                      <div className="custom-table">
                        <div className="table-responsive">
                          <table className="table table-center mb-0">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <Link href="#" className="lab-icon">
                                    <span>
                                      <i className="fa-solid fa-paperclip" />
                                    </span>
                                    Lab Report
                                  </Link>
                                </td>
                                <td>24 Mar 2024</td>
                                <td>Glucose Test V12</td>
                                <td>
                                  <div className="action-item">
                                    <Link href="#">
                                      <i className="fa-solid fa-pen-to-square" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-download" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-trash-can" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link href="#" className="lab-icon">
                                    <span>
                                      <i className="fa-solid fa-paperclip" />
                                    </span>
                                    Lab Report
                                  </Link>
                                </td>
                                <td>27 Mar 2024</td>
                                <td>Complete Blood Count(CBC)</td>
                                <td>
                                  <div className="action-item">
                                    <Link href="#">
                                      <i className="fa-solid fa-pen-to-square" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-download" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-trash-can" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link href="#" className="lab-icon">
                                    <span>
                                      <i className="fa-solid fa-paperclip" />
                                    </span>
                                    Lab Report
                                  </Link>
                                </td>
                                <td>10 Apr 2024</td>
                                <td>Echocardiogram</td>
                                <td>
                                  <div className="action-item">
                                    <Link href="#">
                                      <i className="fa-solid fa-pen-to-square" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-download" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-trash-can" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link href="#" className="lab-icon">
                                    <span>
                                      <i className="fa-solid fa-paperclip" />
                                    </span>
                                    Lab Report
                                  </Link>
                                </td>
                                <td>19 Apr 2024</td>
                                <td>COVID-19 Test</td>
                                <td>
                                  <div className="action-item">
                                    <Link href="#">
                                      <i className="fa-solid fa-pen-to-square" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-download" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-trash-can" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link href="#" className="lab-icon">
                                    <span>
                                      <i className="fa-solid fa-paperclip" />
                                    </span>
                                    Lab Report
                                  </Link>
                                </td>
                                <td>27 Apr 2024</td>
                                <td>Allergy Tests</td>
                                <td>
                                  <div className="action-item">
                                    <Link href="#">
                                      <i className="fa-solid fa-pen-to-square" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-download" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-trash-can" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <Link href="#" className="lab-icon">
                                    <span>
                                      <i className="fa-solid fa-paperclip" />
                                    </span>
                                    Lab Report
                                  </Link>
                                </td>
                                <td>02 May 2024</td>
                                <td>Lipid Panel </td>
                                <td>
                                  <div className="action-item">
                                    <Link href="#">
                                      <i className="fa-solid fa-pen-to-square" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-download" />
                                    </Link>
                                    <Link href="#">
                                      <i className="fa-solid fa-trash-can" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
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
                    {/* /Medical Records Tab */}
                    {/* Billing Tab */}
                    <div className="tab-pane" id="billing">
                      <div className="search-header">
                        <div className="search-field">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search"
                          />
                          <span className="search-icon">
                            <i className="fa-solid fa-magnifying-glass" />
                          </span>
                        </div>
                        <div>
                          <Link
                            href="#"
                            className="btn btn-primary prime-btn"
                            data-bs-toggle="modal"
                            data-bs-target="#add_billing"
                          >
                            Add New Billing
                          </Link>
                        </div>
                      </div>
                      <div className="custom-table">
                        <div className="table-responsive">
                          <table className="table table-center mb-0">
                            <thead>
                              <tr>
                                <th>Billing Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>24 Mar 2024</td>
                                <td>$300</td>
                                <td>
                                  <span className="badge badge-green status-badge">
                                    Paid
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_bill"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>28 Mar 2024</td>
                                <td>$350</td>
                                <td>
                                  <span className="badge badge-green status-badge">
                                    Paid
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_bill"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>10 Apr 2024</td>
                                <td>$400</td>
                                <td>
                                  <span className="badge badge-green status-badge">
                                    Paid
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_bill"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>19 Apr 2024</td>
                                <td>$250</td>
                                <td>
                                  <span className="badge badge-green status-badge">
                                    Paid
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_bill"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>22 Apr 2024</td>
                                <td>$320</td>
                                <td>
                                  <span className="badge badge-green status-badge">
                                    Paid
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_bill"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>02 May 2024</td>
                                <td>$480</td>
                                <td>
                                  <span className="badge badge-danger status-badge">
                                    Unpaid
                                  </span>
                                </td>
                                <td>
                                  <div className="action-item">
                                    <Link
                                      href="#"
                                      data-bs-toggle="modal"
                                      data-bs-target="#view_bill"
                                    >
                                      <i className="fa-solid fa-link" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
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
                    {/* Billing Tab */}
                  </div>
                </div>
              </div>
              {/* /Patient Details */}
            </div>
          </div>
        </div>
        {/* /Page Content */}
        <DoctorFooter />
      </div>
      {/*View Prescription */}
      <div className="modal fade custom-modals" id="view_prescription">
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">View Prescription</h3>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body pb-0">
              <div className="prescribe-download">
                <h5>21 Mar 2024</h5>
                <ul>
                  <li>
                    <a href="#" className="print-link">
                      <i className="fa-solid fa-print" />
                    </a>
                  </li>
                  <li>
                    <a href="#" className="btn btn-primary prime-btn">
                      Download
                    </a>
                  </li>
                </ul>
              </div>
              <div className="view-prescribe invoice-content">
                <div className="invoice-item">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="invoice-logo">
                        <img src={logo} alt="logo" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <p className="invoice-details">
                        <strong>Prescription ID :</strong> #PR-123 <br />
                        <strong>Issued:</strong> 21 Mar 2024
                      </p>
                    </div>
                  </div>
                </div>
                {/* Invoice Item */}
                <div className="invoice-item">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="invoice-info">
                        <h6 className="customer-text">Doctor Details</h6>
                        <p className="invoice-details invoice-details-two">
                          Edalin Hendry <br />
                          806 Twin Willow Lane, <br />
                          Newyork, USA <br />
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="invoice-info invoice-info2">
                        <h6 className="customer-text">Patient Details</h6>
                        <p className="invoice-details">
                          Adrian Marshall <br />
                          299 Star Trek Drive,
                          <br />
                          Florida, 32405, USA <br />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Invoice Item */}
                {/* Invoice Item */}
                <div className="invoice-item invoice-table-wrap">
                  <div className="row">
                    <div className="col-md-12">
                      <h6>Prescription Details</h6>
                      <div className="table-responsive">
                        <table className="invoice-table table table-bordered">
                          <thead>
                            <tr>
                              <th>Medicine Name</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                              <th>Timings</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Ecosprin 75MG [Asprin 75 MG Oral Tab]</td>
                              <td>
                                75 mg <span>Oral Tab</span>
                              </td>
                              <td>1-0-0-1</td>
                              <td>1 month</td>
                              <td>Before Meal</td>
                            </tr>
                            <tr>
                              <td>Alexer 90MG Tab</td>
                              <td>
                                90 mg <span>Oral Tab</span>
                              </td>
                              <td>1-0-0-1</td>
                              <td>1 month</td>
                              <td>Before Meal</td>
                            </tr>
                            <tr>
                              <td>Ramistar XL2.5</td>
                              <td>
                                60 mg <span>Oral Tab</span>
                              </td>
                              <td>1-0-0-0</td>
                              <td>1 month</td>
                              <td>After Meal</td>
                            </tr>
                            <tr>
                              <td>Metscore</td>
                              <td>
                                90 mg <span>Oral Tab</span>
                              </td>
                              <td>1-0-0-1</td>
                              <td>1 month</td>
                              <td>After Meal</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Invoice Item */}
                {/* Invoice Information */}
                <div className="other-info">
                  <h4>Other information</h4>
                  <p className="text-muted mb-0">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Vivamus sed dictum ligula, cursus blandit risus. Maecenas
                    eget metus non tellus dignissim aliquam ut a ex. Maecenas
                    sed vehicula dui, ac suscipit lacus. Sed finibus leo vitae
                    lorem interdum, eu scelerisque tellus fermentum. Curabitur
                    sit amet lacinia lorem. Nullam finibus pellentesque libero.
                  </p>
                </div>
                <div className="other-info">
                  <h4>Follow Up</h4>
                  <p className="text-muted mb-0">
                    Follow u p after 3 months, Have to come on empty stomach
                  </p>
                </div>
                <div className="prescriber-info">
                  <h6>Dr. Edalin Hendry</h6>
                  <p>Dept of Cardiology</p>
                </div>
                {/* /Invoice Information */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /View Prescription */}
      {/*View Prescription */}
      <div className="modal fade custom-modals" id="view_bill">
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header justify-content-end">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body pb-0">
              <div className="prescribe-download">
                <h5>View Billing</h5>
                <ul>
                  <li>
                    <a href="#" className="print-link">
                      <i className="fa-solid fa-print" />
                    </a>
                  </li>
                  <li>
                    <a href="#" className="btn btn-primary prime-btn">
                      Download
                    </a>
                  </li>
                </ul>
              </div>
              <div className="view-prescribe invoice-content">
                <div className="invoice-item">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="invoice-logo">
                        <img src={logo} alt="logo" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <p className="invoice-details">
                        <strong>Invoice No : </strong> #INV005
                        <br />
                        <strong>Issued:</strong> 21 Mar 2024
                      </p>
                    </div>
                  </div>
                </div>
                {/* Invoice Item */}
                <div className="invoice-item">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="invoice-info">
                        <h6 className="customer-text">Billing From</h6>
                        <p className="invoice-details invoice-details-two">
                          Edalin Hendry <br />
                          806 Twin Willow Lane, <br />
                          Newyork, USA <br />
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="invoice-info">
                        <h6 className="customer-text">Billing To</h6>
                        <p className="invoice-details invoice-details-two">
                          Richard Wilson <br />
                          299 Star Trek Drive
                          <br />
                          Florida, 32405, USA
                          <br />
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="invoice-info invoice-info2">
                        <h6 className="customer-text">Payment Method</h6>
                        <p className="invoice-details">
                          Debit Card <br />
                          XXXXXXXXXXXX-2541
                          <br />
                          HDFC Bank
                          <br />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Invoice Item */}
                {/* Invoice Item */}
                <div className="invoice-item invoice-table-wrap">
                  <div className="row">
                    <div className="col-md-12">
                      <h6>Invoice Details</h6>
                      <div className="table-responsive">
                        <table className="invoice-table table table-bordered">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Quatity</th>
                              <th>VAT</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>General Consultation</td>
                              <td>1</td>
                              <td>$0</td>
                              <td>$150</td>
                            </tr>
                            <tr>
                              <td>Video Call</td>
                              <td>1</td>
                              <td>$0</td>
                              <td>$100</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="col-md-6 col-xl-4 ms-auto">
                      <div className="table-responsive">
                        <table className="invoice-table-two table">
                          <tbody>
                            <tr>
                              <th>Subtotal:</th>
                              <td>
                                <span>$350</span>
                              </td>
                            </tr>
                            <tr>
                              <th>Discount:</th>
                              <td>
                                <span>-10%</span>
                              </td>
                            </tr>
                            <tr>
                              <th>Total Amount:</th>
                              <td>
                                <span>$315</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Invoice Item */}
                {/* Invoice Information */}
                <div className="other-info mb-0">
                  <h4>Other information</h4>
                  <p className="text-muted mb-0">
                    An account of the present illness, which includes the
                    circumstances surrounding the onset of recent health changes
                    and the chronology of subsequent events that have led the
                    patient to seek medicine
                  </p>
                </div>
                {/* /Invoice Information */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /View Prescription */}
      {/* Add Medical Records Modal */}
      <div className="modal fade custom-modals" id="add_medical_records">
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Medical Record</h3>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">Title</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">Select Patient</label>
                      <Select
                        className="select"
                        options={options}
                        placeholder="Select Patient"
                        isClearable={true}
                        isSearchable={true}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Start Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control datetimepicker"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">Hospital Name</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Symptoms <span className="text-danger">*</span>
                      </label>
                      <div className="input-block input-block-new mb-0">
                        <input
                          className="input-tags form-control"
                          id="inputBox3"
                          type="text"
                          data-role="tagsinput"
                          placeholder="Type New"
                          name="Label"
                          defaultValue="Fever, Headache"
                        />
                        <a href="#" className="input-text save-btn">
                          Save
                        </a>
                      </div>
                    </div>
                    <div className="form-wrap mb-0">
                      <label className="col-form-label">Report</label>
                      <div className="upload-file">
                        <input type="file" />
                        <p>Drop files or Click to upload</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="modal-btn text-end">
                  <a
                    href="#"
                    className="btn btn-gray"
                    data-bs-toggle="modal"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </a>
                  <button type="submit" className="btn btn-primary prime-btn">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Medical Records Modal */}
      {/* Add Medical Records Modal */}
      <div className="modal fade custom-modals" id="edit_medical_records">
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Medical Record</h3>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="Echocardiogram	"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">Select Patient</label>
                      <Select
                        className="select"
                        options={options2}
                        placeholder="Select"
                        isClearable={true}
                        isSearchable={true}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Start Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control datetimepicker"
                        defaultValue="17/03/2024"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">Hospital Name</label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="ENT Hospital"
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Symptoms <span className="text-danger">*</span>
                      </label>
                      <div className="input-block input-block-new mb-0">
                        <input
                          className="input-tags form-control"
                          id="inputBox3"
                          type="text"
                          data-role="tagsinput"
                          placeholder="Type New"
                          name="Label"
                          defaultValue="Fever, Headache"
                        />
                        <a href="#" className="input-text save-btn">
                          Save
                        </a>
                      </div>
                    </div>
                    <div className="form-wrap mb-0">
                      <label className="col-form-label">Report</label>
                      <div className="upload-file">
                        <input type="file" />
                        <p>Drop files or Click to upload</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="modal-btn text-end">
                  <a
                    href="#"
                    className="btn btn-gray"
                    data-bs-toggle="modal"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </a>
                  <button type="submit" className="btn btn-primary prime-btn">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Medical Records Modal */}
      {/* Add Prescription */}
      <div className="modal fade custom-modals" id="add_prescription">
        <div
          className="modal-dialog modal-dialog-centered modal-xl"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Prescription</h3>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form action="patient-profile.html">
              <div className="modal-body">
                <div className="patient-wrap">
                  <div className="patient-info mt-0">
                    <img src={doctordashboardprofile01} alt="img" />
                    <div className="user-patient">
                      <h6>#P0016</h6>
                      <h5>Adrian Marshall</h5>
                      <ul>
                        <li>299 Star Trek Drive, Florida, 32405, USA</li>
                      </ul>
                    </div>
                  </div>
                  <div className="patient-book patien-inv">
                    <h6>#INV0001</h6>
                    <p>1 November 2023</p>
                  </div>
                </div>
                <div className="add-prescripe-info">
                  <div className="row prescripe-cont">
                    <div className="col-xl-2 xol-lg-3 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">Name</label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-xl-2 xol-lg-3 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">Type</label>
                        <Select
                          className="select"
                          options={options3}
                          placeholder="Select"
                          isClearable={true}
                          isSearchable={true}
                        />
                      </div>
                    </div>
                    <div className="col-xl-2 xol-lg-3 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">Dosage</label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-xl-2 xol-lg-3 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">Frequency</label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-xl-2 xol-lg-3 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">Duration</label>
                        <Select
                          className="select"
                          options={options4}
                          placeholder="Select"
                          isClearable={true}
                          isSearchable={true}
                        />
                      </div>
                    </div>
                    <div className="col-xl-2 xol-lg-3 col-md-6">
                      <div className="d-flex align-items-center">
                        <div className="form-wrap w-100">
                          <label className="col-form-label">Instruction</label>
                          <input type="text" className="form-control" />
                        </div>
                        <div className="form-wrap ms-2">
                          <label className="col-form-label d-block">
                            &nbsp;
                          </label>
                          <a href="#" className="trash">
                            <i className="fa-solid fa-trash-can" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <a href="#" className="add-prescribe">
                    Add More
                  </a>
                </div>
                <div className="wrap-sign">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="sign-wrapper">
                        <div className="upload-sign">
                          <p>Click here to sign</p>
                        </div>
                        <div className="info-name">
                          <h6>( Dr. Darren Elder )</h6>
                          <p>Signature</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="modal-btn text-end">
                  <a
                    href="#"
                    className="btn btn-gray"
                    data-bs-toggle="modal"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </a>
                  <button type="submit" className="btn btn-primary prime-btn">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Prescription */}
      {/* Add Billing */}
      <div className="modal fade custom-modals" id="add_billing">
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Billing</h3>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form action="#">
              <div className="modal-body">
                <div className="patient-wrap">
                  <div className="patient-info">
                    <img src={doctordashboardprofile01} alt="img" />
                    <div className="user-patient">
                      <h6>#P0016</h6>
                      <h5>Adrian Marshall</h5>
                      <ul>
                        <li>Age : 42</li>
                        <li>Male</li>
                        <li>AB+ve</li>
                      </ul>
                    </div>
                  </div>
                  <div className="patient-book patien-inv">
                    <h6>#INV0001</h6>
                    <p>1 November 2023</p>
                  </div>
                </div>
                <div className="add-billing-info">
                  <div className="row bill-cont">
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Title <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <div className="form-wrap w-100">
                          <label className="col-form-label">Amount</label>
                          <input type="text" className="form-control" />
                        </div>
                        <div className="form-wrap ms-2">
                          <label className="col-form-label d-block">
                            &nbsp;
                          </label>
                          <a href="#" className="trash">
                            Delete
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <a href="#" className="add-bill">
                    Add More
                  </a>
                </div>
                <div className="wrap-sign">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="sign-wrapper">
                        <div className="upload-sign">
                          <p>Click here to sign</p>
                        </div>
                        <div className="info-name">
                          <h6>( Dr. Darren Elder )</h6>
                          <p>Signature</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="modal-btn text-end">
                  <a
                    href="#"
                    className="btn btn-gray"
                    data-bs-toggle="modal"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </a>
                  <button type="submit" className="btn btn-primary prime-btn">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Billing */}
    </>
  );
};

export default PatientProfile;
