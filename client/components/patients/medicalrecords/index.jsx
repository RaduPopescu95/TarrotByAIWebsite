/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import DashboardSidebar from "../dashboard/sidebar/sidebar.jsx";
import StickyBox from "react-sticky-box";
import Link from "next/link";
import { TagsInput } from "react-tag-input-component";
import Header from "../../header";
import Footer from "../../footer";
import Select from "react-select";

import {
  doctor_thumb_01,
  doctor_thumb_03,
  doctor_thumb_05,
  doctor_thumb_08,
  doctorthumb02,
  logo,
} from "../../imagepath.jsx";

const MedicalRecords = (props) => {
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  const [selectedDate, setSelectedDate] = useState(new Date());
  const patients = [
    { value: "Select Patient", label: "Select Patient" },
    { value: "Adrian Marshall", label: "Adrian Marshall" },
    { value: "Kelly Stevens", label: "Kelly Stevens" },
    { value: "Catherine Gracey", label: "Catherine Gracey" },
  ];
  const [records, setRecords] = useState(["Fever", "Headache", "Stomach Pain"]);

  return (
    <>
      <div className="main-wrapper">
        <Header {...props} />
        <div className="breadcrumb-bar-two">
          <div className="container">
            <div className="row align-items-center inner-banner">
              <div className="col-md-12 col-12 text-center">
                <h2 className="breadcrumb-title">Medical Records</h2>
                <nav aria-label="breadcrumb" className="page-breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link href="/home-1">Home</Link>
                    </li>
                    <li className="breadcrumb-item" aria-current="page">
                      Medical Records
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
        <div className="content">
          <div className="container">
            <div className="row">
              <div className="col-md-5 col-lg-4 col-xl-3 theiaStickySidebar">
                <StickyBox offsetTop={20} offsetBottom={20}>
                  <DashboardSidebar />{" "}
                </StickyBox>
              </div>
              <div className="col-lg-8 col-xl-9">
                <div className="dashboard-header">
                  <h3>Records</h3>
                  <div className="appointment-tabs">
                    <ul className="nav">
                      <li>
                        <Link
                          href="#"
                          className="nav-link active"
                          data-bs-toggle="tab"
                          data-bs-target="#medical"
                        >
                          Medical Records
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="nav-link"
                          data-bs-toggle="tab"
                          data-bs-target="#prescription"
                        >
                          Prescriptions
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="tab-content pt-0">
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
                    </div>
                    <div className="custom-table">
                      <div className="table-responsive">
                        <table className="table table-center mb-0">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Name</th>
                              <th>Created Date</th>
                              <th>Prescriped By</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="text-blue-600">#PR-123</td>
                              <td>
                                <Link
                                  href="#"
                                  className="lab-icon prescription"
                                >
                                  <span>
                                    <i className="fa-solid fa-prescription" />
                                  </span>
                                  Prescription
                                </Link>
                              </td>
                              <td>24 Mar 2024, 10:30 AM</td>
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
                              <td>
                                <div className="action-item">
                                  <Link
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#view_prescription"
                                  >
                                    <i className="fa-solid fa-link" />
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
                              <td className="text-blue-600">#PR-124</td>
                              <td>
                                <Link
                                  href="#"
                                  className="lab-icon prescription"
                                >
                                  <span>
                                    <i className="fa-solid fa-prescription" />
                                  </span>
                                  Prescription
                                </Link>
                              </td>
                              <td>27 Mar 2024, 11:15 AM</td>
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
                              <td>
                                <div className="action-item">
                                  <Link
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#view_prescription"
                                  >
                                    <i className="fa-solid fa-link" />
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
                              <td className="text-blue-600">#PR-125</td>
                              <td>
                                <Link
                                  href="#"
                                  className="lab-icon prescription"
                                >
                                  <span>
                                    <i className="fa-solid fa-prescription" />
                                  </span>
                                  Prescription
                                </Link>
                              </td>
                              <td>11 Apr 2024, 09:00 AM</td>
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
                              <td>
                                <div className="action-item">
                                  <Link
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#view_prescription"
                                  >
                                    <i className="fa-solid fa-link" />
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
                              <td className="text-blue-600">#PR-126</td>
                              <td>
                                <Link
                                  href="#"
                                  className="lab-icon prescription"
                                >
                                  <span>
                                    <i className="fa-solid fa-prescription" />
                                  </span>
                                  Prescription
                                </Link>
                              </td>
                              <td>15 Apr 2024, 02:30 PM</td>
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
                              <td>
                                <div className="action-item">
                                  <Link
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#view_prescription"
                                  >
                                    <i className="fa-solid fa-link" />
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
                              <td className="text-blue-600">#PR-127</td>
                              <td>
                                <Link
                                  href="#"
                                  className="lab-icon prescription"
                                >
                                  <span>
                                    <i className="fa-solid fa-prescription" />
                                  </span>
                                  Prescription
                                </Link>
                              </td>
                              <td>23 Apr 2024, 06:40 PM</td>
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
                              <td>
                                <div className="action-item">
                                  <Link
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#view_prescription"
                                  >
                                    <i className="fa-solid fa-link" />
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
                  {/* /Prescription Tab */}
                  {/* Medical Records Tab */}
                  <div className="tab-pane fade show active" id="medical">
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
                              <th>ID</th>
                              <th>Name</th>
                              <th>Date</th>
                              <th>Description</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="text-blue-600">#MR-123</td>
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
                              <td className="text-blue-600">#MR-124</td>
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
                              <td className="text-blue-600">#MR-125</td>
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
                              <td className="text-blue-600">#MR-126</td>
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
                              <td className="text-blue-600">#MR-127</td>
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
                              <td className="text-blue-600">#MR-128</td>
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
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer {...props} />
      </div>
      <>
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

                        <Select placeholder="Select" options={patients} />
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
                      <label className="col-form-label">
                        Symptoms <span className="text-danger">*</span>
                      </label>
                      <div className="input-block input-block-new">
                        <TagsInput
                          // className="input-tags form-control"
                          value={records}
                          onChange={setRecords}
                          placeHolder="Type"
                        />
                        <Link href="#" className="input-text save-btn">
                          Save
                        </Link>
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
                    <Link
                      href="#"
                      className="btn btn-gray"
                      data-bs-toggle="modal"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </Link>
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
                      <Link href="#" className="print-link">
                        <i className="fa-solid fa-print" />
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="btn btn-primary prime-btn">
                        Download
                      </Link>
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
                      sit amet lacinia lorem. Nullam finibus pellentesque
                      libero.
                    </p>
                  </div>
                  <div className="other-info">
                    <h4>Follow Up</h4>
                    <p className="text-muted mb-0">
                      Follow u p after 3 months, Have to come on empty stomach
                    </p>
                  </div>
                  ch
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
      </>
    </>
  );
};

export default MedicalRecords;
