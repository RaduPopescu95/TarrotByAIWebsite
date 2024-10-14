import React, { useState } from "react";
import Header from "../../header";
import DoctorFooter from "../../common/doctorFooter";
import DoctorSidebar from "../sidebar";
import SettingsHeader from "./settingsHeader";
import DatePicker from "react-datepicker";
import Link from "next/link";
const Education = (props) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  const [selectedDate1, setSelectedDate1] = useState(new Date());
  const handleDateChange1 = (date) => {
    setSelectedDate1(date);
  };
  const [selectedDate3, setSelectedDate3] = useState(new Date());
  const handleDateChange3 = (date) => {
    setSelectedDate3(date);
  };
  const [selectedDate4, setSelectedDate4] = useState(new Date());
  const handleDateChange4 = (date) => {
    setSelectedDate4(date);
  };
  const [selectedDate5, setSelectedDate5] = useState(new Date());
  const handleDateChange5 = (date) => {
    setSelectedDate5(date);
  };
  const [selectedDate6, setSelectedDate6] = useState(new Date());
  const handleDateChange6 = (date) => {
    setSelectedDate6(date);
  };

  const [educations, setEducations] = useState([]);

  const addEducation = () => {
    const newEducation = {
      id: educations.length + 1,
      isExpanded: true, // Set to true when adding
    };

    setEducations([...educations, newEducation]);
  };
  const deleteEducation = (id) => {
    const isExpanded = educations.find(
      (education) => education.id === id
    )?.isExpanded;
    if (isExpanded) {
      setEducations(educations.filter((education) => education.id !== id));
    } else {
      setEducations(
        educations.map((education) => {
          if (education.id === id) {
            return { ...education, isExpanded: false };
          }
          return education;
        })
      );
    }
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
                <h3>Education</h3>
                <ul>
                  <li>
                    <Link
                      href="#"
                      className="btn btn-primary prime-btn add-educations"
                      onClick={addEducation}
                    >
                      Add New Education
                    </Link>
                  </li>
                </ul>
              </div>
              <form>
                <div className="accordions education-infos" id="list-accord">
                  {/* Education Item */}
                  <div className="user-accordion-item">
                    <Link
                      href="#"
                      className="accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#education5"
                    >
                      Education<span>Delete</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse show"
                      id="education5"
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
                                      <h5>Logo</h5>
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
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Name of the institution
                                  </label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Course
                                  </label>
                                  <input type="text" className="form-control" />
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
                                      dateFormat="dd-MM-yyyy"
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
                                      dateFormat="dd-MM-yyyy"
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
                                    No of Years{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-lg-12">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Description{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <textarea
                                    className="form-control"
                                    rows={3}
                                    defaultValue={""}
                                  />
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
                  {/* /Education Item */}
                  <div className="user-accordion-item">
                    <Link
                      href="#"
                      className="collapsed accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#education2"
                    >
                      Cambridge (MBBS)<span>Delete</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="education2"
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
                                      <h5>Logo</h5>
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
                                        format jpg,png,svg
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Name of the institution
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    defaultValue="Cambridge"
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Course
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    defaultValue="MBBS"
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
                                      selected={selectedDate3}
                                      onChange={handleDateChange3}
                                      dateFormat="dd-MM-yyyy"
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
                                      selected={selectedDate4}
                                      onChange={handleDateChange4}
                                      dateFormat="dd-MM-yyyy"
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
                                    No of Years{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    defaultValue={5}
                                  />
                                </div>
                              </div>
                              <div className="col-lg-12">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Description{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <textarea
                                    className="form-control"
                                    rows={3}
                                    defaultValue={""}
                                  />
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
                  {educations.map((education) => (
                    <div className="user-accordion-item" key={education.id}>
                      <Link
                        href="#"
                        className="accordion-wrap"
                        data-bs-toggle="collapse"
                        data-bs-target={`#education${education.id}`}
                        onClick={() => deleteEducation(education.id)}
                      >
                        Education<span>Delete</span>
                      </Link>
                      <div
                        // className="accordion-collapse collapse show"
                        className={`accordion-collapse collapse ${
                          education.isExpanded ? "show" : ""
                        }`}
                        id={`education${education.id}`}
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
                                        <h5>Logo</h5>
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
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Name of the institution
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
                                      Course
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
                                      Start Date{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <div className="form-icon">
                                      <DatePicker
                                        className="form-control datetimepicker"
                                        selected={selectedDate5}
                                        onChange={handleDateChange5}
                                        dateFormat="dd-MM-yyyy"
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
                                        selected={selectedDate6}
                                        onChange={handleDateChange6}
                                        dateFormat="dd-MM-yyyy"
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
                                      No of Years{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                    />
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Description{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                      className="form-control"
                                      rows={3}
                                      defaultValue={""}
                                    />
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
                  ))}
                  {/* /Education Item */}
                </div>
                <div className="modal-btn text-end">
                  <Link href="#" className="btn btn-gray">
                    Cancelnpm
                  </Link>
                  <button className="btn btn-primary prime-btn">
                    Save Changes
                  </button>
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

export default Education;
