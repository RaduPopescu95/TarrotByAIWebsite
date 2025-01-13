/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import DashboardSidebar from "../dashboard/sidebar/sidebar.jsx";
import Link from "next/link";
import { Modal } from "react-bootstrap";
import StickyBox from "react-sticky-box";
import Footer from "../../footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Header from "../../header.jsx";

import {
  dependent1,
  dependent2,
  dependent3,
  dependent4,
} from "../../imagepath.jsx";
import Select from "react-select";

const Dependent = (props) => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(false);
  const handleChange = (date) => {
    setDate(date);
  };
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const [selectedDate, setSelectedDate] = useState(new Date());
  const gender = [
    { value: "Select", label: "Select" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];
  const gender1 = [
    { value: "Select", label: "Select" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  return (
    <>
      <div className="main-wrapper">
        <Header {...props} />
        <div className="breadcrumb-bar-two">
          <div className="container">
            <div className="row align-items-center inner-banner">
              <div className="col-md-12 col-12 text-center">
                <nav aria-label="breadcrumb" className="page-breadcrumb">
                  <h2 className="breadcrumb-title">Dependent</h2>
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link href="/home-2">Home</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Dependent
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
                  <h3>Dependants</h3>
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
                <div className="dashboard-header border-0 m-0">
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
                  <Link
                    href="#"
                    className="btn btn-primary prime-btn"
                    data-bs-toggle="modal"
                    data-bs-target="#add_dependent"
                  >
                    Add Dependants
                  </Link>
                </div>
                {/* Depeendent Item */}
                <div className="dependent-wrap">
                  <div className="dependent-info">
                    <div className="patinet-information">
                      <Link href="/doctor/patient-profile">
                        <img src={dependent1} alt="User Image" />
                      </Link>
                      <div className="patient-info">
                        <h5>Laura</h5>
                        <ul>
                          <li>Mother</li>
                          <li>Female</li>
                          <li>58 years 20 days</li>
                        </ul>
                      </div>
                    </div>
                    <div className="blood-info">
                      <p>Blood Group</p>
                      <h6>AB+ve</h6>
                    </div>
                  </div>
                  <div className="dependent-status">
                    <div className="status-toggle">
                      <span className="deactive">Deactivate</span>
                      <input
                        type="checkbox"
                        id="status_1"
                        className="check"
                        defaultChecked=""
                      />
                      <label htmlFor="status_1" className="checktoggle">
                        checkbox
                      </label>
                      <span className="active">Activate</span>
                    </div>
                    <Link
                      href="#"
                      className="edit-icon"
                      data-bs-toggle="modal"
                      data-bs-target="#edit_dependent"
                    >
                      <i className="fa-solid fa-pen-to-square" />
                    </Link>
                  </div>
                </div>
                {/* /Depeendent Item */}
                {/* Depeendent Item */}
                <div className="dependent-wrap">
                  <div className="dependent-info">
                    <div className="patinet-information">
                      <Link href="/doctor/patient-profile">
                        <img src={dependent2} alt="User Image" />
                      </Link>
                      <div className="patient-info">
                        <h5>Mathew</h5>
                        <ul>
                          <li>Father</li>
                          <li>Male</li>
                          <li>59 years 15 days</li>
                        </ul>
                      </div>
                    </div>
                    <div className="blood-info">
                      <p>Blood Group</p>
                      <h6>AB+ve</h6>
                    </div>
                  </div>
                  <div className="dependent-status">
                    <div className="status-toggle">
                      <span className="deactive">Deactivate</span>
                      <input
                        type="checkbox"
                        id="status_2"
                        className="check"
                        defaultChecked=""
                      />
                      <label htmlFor="status_2" className="checktoggle">
                        checkbox
                      </label>
                      <span className="active">Activate</span>
                    </div>
                    <Link
                      href="#"
                      className="edit-icon"
                      data-bs-toggle="modal"
                      data-bs-target="#edit_dependent"
                    >
                      <i className="fa-solid fa-pen-to-square" />
                    </Link>
                  </div>
                </div>
                {/* /Depeendent Item */}
                {/* Depeendent Item */}
                <div className="dependent-wrap">
                  <div className="dependent-info">
                    <div className="patinet-information">
                      <Link href="/doctor/patient-profile">
                        <img src={dependent3} alt="User Image" />
                      </Link>
                      <div className="patient-info">
                        <h5>Christopher</h5>
                        <ul>
                          <li>Brother</li>
                          <li>Male</li>
                          <li>32 years 6 Months</li>
                        </ul>
                      </div>
                    </div>
                    <div className="blood-info">
                      <p>Blood Group</p>
                      <h6>A+ve</h6>
                    </div>
                  </div>
                  <div className="dependent-status">
                    <div className="status-toggle">
                      <span className="deactive">Deactivate</span>
                      <input
                        type="checkbox"
                        id="status_3"
                        className="check"
                        defaultChecked=""
                      />
                      <label htmlFor="status_3" className="checktoggle">
                        checkbox
                      </label>
                      <span className="active">Activate</span>
                    </div>
                    <Link
                      href="#"
                      className="edit-icon"
                      data-bs-toggle="modal"
                      data-bs-target="#edit_dependent"
                    >
                      <i className="fa-solid fa-pen-to-square" />
                    </Link>
                  </div>
                </div>
                {/* /Depeendent Item */}
                {/* Depeendent Item */}
                <div className="dependent-wrap">
                  <div className="dependent-info">
                    <div className="patinet-information">
                      <Link href="/doctor/patient-profile">
                        <img src={dependent4} alt="User Image" />
                      </Link>
                      <div className="patient-info">
                        <h5>Elisa</h5>
                        <ul>
                          <li>Sister</li>
                          <li>Female</li>
                          <li>28 years 4 Months</li>
                        </ul>
                      </div>
                    </div>
                    <div className="blood-info">
                      <p>Blood Group</p>
                      <h6>B+ve</h6>
                    </div>
                  </div>
                  <div className="dependent-status">
                    <div className="status-toggle">
                      <span className="deactive">Deactivate</span>
                      <input type="checkbox" id="status_4" className="check" />
                      <label htmlFor="status_4" className="checktoggle">
                        checkbox
                      </label>
                      <span className="active">Activate</span>
                    </div>
                    <Link
                      href="#"
                      className="edit-icon"
                      data-bs-toggle="modal"
                      data-bs-target="#edit_dependent"
                    >
                      <i className="fa-solid fa-pen-to-square" />
                    </Link>
                  </div>
                </div>
                {/* /Depeendent Item */}
              </div>
            </div>
          </div>
        </div>

        <Footer {...props} />
      </div>
      <>
        {/* Add Dependent Modal*/}
        <div className="modal fade custom-modals" id="add_dependent">
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            role="document"
          >
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Add Dependant</h3>
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
                <div className="add-dependent">
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-wrap pb-0">
                          <div className="change-avatar img-upload">
                            <div className="profile-img">
                              <i className="fa-solid fa-file-image" />
                            </div>
                            <div className="upload-img">
                              <h5>Profile Image</h5>
                              <div className="imgs-load d-flex align-items-center">
                                <div className="change-photo">
                                  Upload New
                                  <input type="file" className="upload" />
                                </div>
                                <Link href="#" className="upload-remove">
                                  Remove
                                </Link>
                              </div>
                              <p>
                                Your Image should Below 4 MB, Accepted format
                                Jpg,Png,Svg
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">Name</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">Relationship</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            DOB <span className="text-danger">*</span>
                          </label>
                          <div className="form-icon">
                            <DatePicker
                              className="form-control datetimepicker"
                              selected={selectedDate}
                              onChange={handleDateChange}
                              dateFormat="17/04/2024"
                              showDayMonthYearPicker
                            />
                            <span className="icon">
                              <i className="fa-regular fa-calendar-days" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            Select Gender
                          </label>

                          <Select
                            // className="select form-control"
                            placeholder="Select"
                            options={gender}
                          />
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
        {/* /Add Dependent Modal*/}
        {/* Edit Dependent Modal*/}
        <div className="modal fade custom-modals" id="edit_dependent">
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            role="document"
          >
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Edit Dependant</h3>
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
                <div className="add-dependent">
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-wrap pb-0">
                          <div className="change-avatar img-upload">
                            <div className="profile-img">
                              <i className="fa-solid fa-file-image" />
                            </div>
                            <div className="upload-img">
                              <h5>Profile Image</h5>
                              <div className="imgs-load d-flex align-items-center">
                                <div className="change-photo">
                                  Upload New
                                  <input type="file" className="upload" />
                                </div>
                                <Link href="#" className="upload-remove">
                                  Remove
                                </Link>
                              </div>
                              <p>
                                Your Image should Below 4 MB, Accepted format
                                jpg,png,svg
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">Name</label>
                          <input
                            type="text"
                            className="form-control"
                            defaultValue="Laura"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">Relationship</label>
                          <input
                            type="text"
                            className="form-control"
                            defaultValue="Mother"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            DOB <span className="text-danger">*</span>
                          </label>
                          <div className="form-icon">
                            <DatePicker
                              className="form-control datetimepicker"
                              selected={selectedDate}
                              onChange={handleDateChange}
                              dateFormat="17/04/2024"
                              showDayMonthYearPicker
                            />
                            <span className="icon">
                              <i className="fa-regular fa-calendar-days" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            Select Gender
                          </label>
                          <Select
                            // className="select form-control"
                            placeholder="Select"
                            options={gender1}
                          />
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
        {/* /Edit Dependent Modal*/}
      </>
    </>
  );
};

export default Dependent;
