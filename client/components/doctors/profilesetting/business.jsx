import React, { useState } from "react";
import Header from "../../header";
import DoctorFooter from "../../common/doctorFooter";
import DoctorSidebar from "../sidebar";
import SettingsHeader from "./settingsHeader";
import { TimePicker } from "antd";
import Link from "next/link";
const BusinessSettings = (props) => {
  const [activeTabs, setActiveTabs] = useState([
    "day-monday",
    "day-tuesday",
    "day-wednesday",
    "day-thursday",
    "day-friday",
  ]);

  const handleTabClick = (tab) => {
    setActiveTabs([tab]);
  };
  const [selectedTime, setSelectedTime] = useState();
  const handleTimeChange = (value) => {
    setSelectedTime(value);
  };
  const [selectedTime1, setSelectedTime1] = useState();
  const handleTimeChange1 = (value) => {
    setSelectedTime1(value);
  };
  return (
    <div>
      <Header {...props} />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Doctor Profile</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Home</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Doctor Profile
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
              {/* Profile Settings */}
              <div className="dashboard-header">
                <h3>Profile Settings</h3>
              </div>
              {/* Settings List */}
              <SettingsHeader />
              {/* /Settings List */}
              <div className="dashboard-header border-0 mb-0">
                <h3>Business Hours</h3>
              </div>
              <form>
                <div className="business-wrap">
                  <h4>Select Business days</h4>
                  <ul className="business-nav">
                    <li>
                      <Link
                        className={`tab-link ${
                          activeTabs.includes("day-monday") ? "active" : ""
                        }`}
                        data-tab="day-monday"
                        onClick={() => handleTabClick("day-monday")}
                      >
                        Monday
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`tab-link ${
                          activeTabs.includes("day-tuesday") ? "active" : ""
                        }`}
                        data-tab="day-tuesday"
                        onClick={() => handleTabClick("day-tuesday")}
                      >
                        Tuesday
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`tab-link ${
                          activeTabs.includes("day-wednesday") ? "active" : ""
                        }`}
                        data-tab="day-wednesday"
                        onClick={() => handleTabClick("day-wednesday")}
                      >
                        Wednesday
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`tab-link ${
                          activeTabs.includes("day-thursday") ? "active" : ""
                        }`}
                        data-tab="day-thursday"
                        onClick={() => handleTabClick("day-thursday")}
                      >
                        Thrusday
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`tab-link ${
                          activeTabs.includes("day-friday") ? "active" : ""
                        }`}
                        data-tab="day-friday"
                        onClick={() => handleTabClick("day-friday")}
                      >
                        Friday
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`tab-link ${
                          activeTabs.includes("day-saturday") ? "active" : ""
                        }`}
                        data-tab="day-saturday"
                        onClick={() => handleTabClick("day-saturday")}
                      >
                        Saturday
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`tab-link ${
                          activeTabs.includes("day-sunday") ? "active" : ""
                        }`}
                        data-tab="day-sunday"
                        onClick={() => handleTabClick("day-sunday")}
                      >
                        Sunday
                      </Link>
                    </li>
                    {/* Include other days here */}
                  </ul>
                </div>
                <div className="accordions business-info" id="list-accord">
                  {/* Business Hours */}
                  <div
                    className="user-accordion-item tab-items active"
                    id="day-monday"
                  >
                    <Link
                      href="#"
                      className="accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#monday"
                    >
                      Monday<span className="edit">Edit</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse show"
                      id="monday"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse pb-0">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                From <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime}
                                  onChange={handleTimeChange}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                To <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime1}
                                  onChange={handleTimeChange1}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Business Hours */}
                  {/* Business Hours */}
                  <div
                    className="user-accordion-item tab-items active"
                    id="day-tuesday"
                  >
                    <Link
                      href="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#tuesday"
                    >
                      Tuesday<span className="edit">Edit</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="tuesday"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse pb-0">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                From <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime}
                                  onChange={handleTimeChange}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                To <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime1}
                                  onChange={handleTimeChange1}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Business Hours */}
                  {/* Business Hours */}
                  <div
                    className="user-accordion-item tab-items active"
                    id="day-wednesday"
                  >
                    <Link
                      href="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#wednesday"
                    >
                      Wednesday<span className="edit">Edit</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="wednesday"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse pb-0">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                From <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime}
                                  onChange={handleTimeChange}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                To <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime1}
                                  onChange={handleTimeChange1}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Business Hours */}
                  {/* Business Hours */}
                  <div
                    className="user-accordion-item tab-items active"
                    id="day-thursday"
                  >
                    <Link
                      href="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#thursday"
                    >
                      Thursday<span className="edit">Edit</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="thursday"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse pb-0">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                From <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime}
                                  onChange={handleTimeChange}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                To <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime1}
                                  onChange={handleTimeChange1}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Business Hours */}
                  {/* Business Hours */}
                  <div
                    className="user-accordion-item tab-items active"
                    id="day-friday"
                  >
                    <Link
                      href="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#friday"
                    >
                      Friday<span className="edit">Edit</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="friday"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse pb-0">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                From <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime}
                                  onChange={handleTimeChange}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                To <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime1}
                                  onChange={handleTimeChange1}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Business Hours */}
                  {/* Business Hours */}
                  <div
                    className="user-accordion-item tab-items"
                    id="day-saturday"
                  >
                    <Link
                      href="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#saturday"
                    >
                      Saturday<span className="edit">Edit</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="saturday"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse pb-0">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                From <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime}
                                  onChange={handleTimeChange}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                To <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime1}
                                  onChange={handleTimeChange1}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Business Hours */}
                  {/* Business Hours */}
                  <div
                    className="user-accordion-item tab-items"
                    id="day-sunday"
                  >
                    <Link
                      href="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#sunday"
                    >
                      Sunday<span className="edit">Edit</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="sunday"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse pb-0">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                From <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime}
                                  onChange={handleTimeChange}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                To <span className="text-danger">*</span>
                              </label>
                              <div className="form-icon">
                                <TimePicker
                                  value={selectedTime1}
                                  onChange={handleTimeChange1}
                                  className="form-control timepicker1 business"
                                  placeholder="Time"
                                />
                                <span className="icon">
                                  <i className="fa-solid fa-clock" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Business Hours */}
                </div>
                <div className="modal-btn text-end">
                  <Link href="#" className="btn btn-gray">
                    Cancel
                  </Link>
                  <Link href="#" className="btn btn-primary prime-btn">
                    Save Changes
                  </Link>
                </div>
              </form>
              {/* /Profile Settings */}
            </div>
          </div>
        </div>
      </div>
      {/* /Page Content */}
      <DoctorFooter />
    </div>
  );
};

export default BusinessSettings;
