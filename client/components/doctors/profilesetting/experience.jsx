import React, { useState } from "react";
import Link from "next/link";
import DoctorSidebar from "../sidebar";
import DoctorFooter from "../../common/doctorFooter";
import SettingsHeader from "./settingsHeader";
import DatePicker from "react-datepicker";
import Select from "react-select";
import Header from "../../header";
const Experience = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  const [selectedDate1, setSelectedDate1] = useState(new Date());
  const handleDateChange1 = (date) => {
    setSelectedDate1(date);
  };
  const [selectedDate2, setSelectedDate2] = useState(new Date());
  const handleDateChange2 = (date) => {
    setSelectedDate2(date);
  };
  const employment = [
    { label: "Full Time", value: "Full Time" },
    { label: "Part Time", value: "Part Time" },
  ];

  const [experience, setExperience] = useState([]);
  const addExperience = () => {
    const newAwards = {
      id: experience.length + 1,
      isExpanded: true, // Set to true when adding
    };
    setExperience([...experience, newAwards]);
  };
  const deleteExperience = (id) => {
    // Check if the education being deleted is expanded (added) or not
    const isExpanded = experience.find(
      (experience) => experience.id === id
    )?.isExpanded;

    if (isExpanded) {
      // If the education is expanded, only delete it
      setExperience(experience.filter((experience) => experience.id !== id));
    } else {
      // If the education is not expanded, toggle its expanded state to false
      setExperience(
        experience.map((experience) => {
          if (experience.id === id) {
            return { ...experience, isExpanded: false };
          }
          return experience;
        })
      );
    }
  };

  return (
    <div>
      <Header />
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
                <h3>Experience</h3>
                <ul>
                  <li>
                    <Link
                      href="#"
                      className="btn btn-primary prime-btn add-experiences"
                      onClick={addExperience}
                    >
                      Add New Experience
                    </Link>
                  </li>
                </ul>
              </div>
              <form>
                {/* Experience1 Item */}
                <div className="user-accordion-item">
                  <a
                    href="#"
                    className="accordion-wrap"
                    data-bs-toggle="collapse"
                    data-bs-target="#experience1"
                  >
                    Experience<span>Delete</span>
                  </a>
                  <div
                    className="accordion-collapse collapse show"
                    id="experience1"
                    data-bs-parent="#list-accord"
                  >
                    <div className="content-collapse">
                      <div className="add-service-info">
                        <div className="add-info">
                          <div className="row align-items-center">
                            <div className="col-md-12">
                              <div className="form-wrap mb-2">
                                <div className="change-avatar img-upload">
                                  <div className="profile-img">
                                    <i className="fa-solid fa-file-image" />
                                  </div>
                                  <div className="upload-img">
                                    <h5>Hospital Logo</h5>
                                    <div className="imgs-load d-flex align-items-center">
                                      <div className="change-photo">
                                        Upload New
                                        <input type="file" className="upload" />
                                      </div>
                                      <a href="#" className="upload-remove">
                                        Remove
                                      </a>
                                    </div>
                                    <p className="form-text">
                                      Your Image should Below 4 MB, Accepted
                                      format jpg,png,svg
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Title</label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Hospital{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Year of Experience{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Location{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Employement{" "}
                                </label>
                                <Select
                                  className="select"
                                  options={employment}
                                  placeholder="Part Time"
                                />
                              </div>
                            </div>
                            <div className="col-lg-12">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Job Description{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  defaultValue={""}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Start Date{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <div className="form-icon">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    selected={selectedDate}
                                    onChange={handleDateChange}
                                    dateFormat="dd/MM/yyyy"
                                    showDayMonthYearPicker
                                  />
                                  <span className="icon">
                                    <i className="fa-regular fa-calendar-days" />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  End Date{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <div className="form-icon">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    selected={selectedDate1}
                                    onChange={handleDateChange1}
                                    dateFormat="dd/MM/yyyy"
                                    showDayMonthYearPicker
                                  />
                                  <span className="icon">
                                    <i className="fa-regular fa-calendar-days" />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">&nbsp;</label>
                                <div className="form-check">
                                  <label className="form-check-label">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />{" "}
                                    I Currently Working Here
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <a href="#" className="reset more-item">
                            Reset
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Experience1 Item */}
                {/* Experience1 Item */}
                <div className="user-accordion-item">
                  <a
                    href="#"
                    className="collapsed accordion-wrap"
                    data-bs-toggle="collapse"
                    data-bs-target="#experience2"
                  >
                    Hill Medical Hospital, Newcastle (15 Mar 2021 - 24 Jan 2023
                    )<span>Delete</span>
                  </a>
                  <div
                    className="accordion-collapse collapse"
                    id="experience2"
                    data-bs-parent="#list-accord"
                  >
                    <div className="content-collapse">
                      <div className="add-service-info">
                        <div className="add-info">
                          <div className="row align-items-center">
                            <div className="col-md-12">
                              <div className="form-wrap mb-2">
                                <div className="change-avatar img-upload">
                                  <div className="profile-img">
                                    <i className="fa-solid fa-file-image" />
                                  </div>
                                  <div className="upload-img">
                                    <h5>Hospital Logo</h5>
                                    <div className="imgs-load d-flex align-items-center">
                                      <div className="change-photo">
                                        Upload New
                                        <input type="file" className="upload" />
                                      </div>
                                      <a href="#" className="upload-remove">
                                        Remove
                                      </a>
                                    </div>
                                    <p className="form-text">
                                      Your Image should Below 4 MB, Accepted
                                      format jpg,png,svg
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Title</label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Hospital{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Year of Experience{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Location{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Employement{" "}
                                </label>
                                <Select
                                  className="select"
                                  options={employment}
                                  placeholder="Part Time"
                                />
                              </div>
                            </div>
                            <div className="col-lg-12">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Job Description{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  defaultValue={""}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Start Date{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <div className="form-icon">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    selected={selectedDate}
                                    onChange={handleDateChange}
                                    dateFormat="dd/MM/yyyy"
                                    showDayMonthYearPicker
                                  />
                                  <span className="icon">
                                    <i className="fa-regular fa-calendar-days" />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  End Date{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <div className="form-icon">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    selected={selectedDate1}
                                    onChange={handleDateChange1}
                                    dateFormat="dd/MM/yyyy"
                                    showDayMonthYearPicker
                                  />
                                  <span className="icon">
                                    <i className="fa-regular fa-calendar-days" />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">&nbsp;</label>
                                <div className="form-check">
                                  <label className="form-check-label">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />{" "}
                                    I Currently Working Here
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <a href="#" className="reset more-item">
                            Reset
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Experience1 Item */}
                {experience.map((experience) => (
                  <div
                    className="accordions experience-infos"
                    key={experience.id}
                  >
                    {/* Experience1 Item */}
                    <div className="user-accordion-item">
                      <Link
                        href="#"
                        className="accordion-wrap"
                        data-bs-toggle="collapse"
                        aria-expanded="false"
                        data-bs-target={`#experience-${experience.id}`}
                        onClick={() => deleteExperience(experience.id)}
                      >
                        Experience
                        <span>Delete</span>{" "}
                      </Link>
                      <div
                        className="accordion-collapse collapse show"
                        id={`experience-${experience.id}`}
                        data-bs-parent="#list-accord"
                      >
                        <div className="content-collapse">
                          <div className="add-service-info">
                            <div className="add-info">
                              <div className="row align-items-center">
                                <div className="col-md-12">
                                  <div className="form-wrap mb-2">
                                    <div className="change-avatar img-upload">
                                      <div className="profile-img">
                                        <i className="fa-solid fa-file-image" />
                                      </div>
                                      <div className="upload-img">
                                        <h5>Hospital Logo</h5>
                                        <div className="imgs-load d-flex align-items-center">
                                          <div className="change-photo">
                                            Upload New
                                            <input
                                              type="file"
                                              className="upload"
                                            />
                                          </div>
                                          <Link
                                            href="#"
                                            className="upload-remove"
                                          >
                                            Remove
                                          </Link>
                                        </div>
                                        <p className="form-text">
                                          Your Image should Below 4 MB, Accepted
                                          format Jpg,Png,Svg
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-lg-4 col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Title
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                    />
                                  </div>
                                </div>
                                <div className="col-lg-4 col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Hospital{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                    />
                                  </div>
                                </div>
                                <div className="col-lg-4 col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Year of Experience{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Location{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Employement{" "}
                                    </label>

                                    <Select
                                      className="select"
                                      options={employment}
                                      placeholder="Part Time"
                                    />
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Job Description{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                      className="form-control"
                                      rows={3}
                                      defaultValue={""}
                                    />
                                  </div>
                                </div>
                                <div className="col-lg-4 col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Start Date{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <div className="form-icon">
                                      <DatePicker
                                        className="form-control datetimepicker"
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        dateFormat="dd/MM/yyyy"
                                        showDayMonthYearPicker
                                      />
                                      <span className="icon">
                                        <i className="fa-regular fa-calendar-days" />
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-lg-4 col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      End Date{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <div className="form-icon">
                                      <DatePicker
                                        className="form-control datetimepicker"
                                        selected={selectedDate1}
                                        onChange={handleDateChange1}
                                        dateFormat="dd/MM/yyyy"
                                        showDayMonthYearPicker
                                      />
                                      <span className="icon">
                                        <i className="fa-regular fa-calendar-days" />
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-lg-4 col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      &nbsp;
                                    </label>
                                    <div className="form-check">
                                      <label className="form-check-label">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                        />{" "}
                                        I Currently Working Here
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-end">
                              <Link href="#" className="reset more-item">
                                Reset
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /Experience1 Item */}
                  </div>
                ))}
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

export default Experience;
