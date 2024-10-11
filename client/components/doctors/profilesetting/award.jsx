import React, { useState } from "react";
import Header from "../../header";
import DoctorFooter from "../../common/doctorFooter";
import DoctorSidebar from "../sidebar";
import SettingsHeader from "./settingsHeader";
import DatePicker from "react-datepicker";
import Link from "next/link";
const Awards = (props) => {
  const [awards, setAwards] = useState([]);
  const addAwards = () => {
    const newAwards = {
      id: awards.length + 1,
      isExpanded: true, // Set to true when adding
    };
    setAwards([...awards, newAwards]);
  };
  const deleteAwards = (id) => {
    // Check if the education being deleted is expanded (added) or not
    const isExpanded = awards.find((awards) => awards.id === id)?.isExpanded;

    if (isExpanded) {
      // If the education is expanded, only delete it
      setAwards(awards.filter((education) => education.id !== id));
    } else {
      // If the education is not expanded, toggle its expanded state to false
      setAwards(
        awards.map((awards) => {
          if (awards.id === id) {
            return { ...awards, isExpanded: false };
          }
          return awards;
        })
      );
    }
  };

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
      <div className="content  doctor-content">
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
                <h3>Awards</h3>
                <ul>
                  <li>
                    <Link
                      href="#"
                      className="btn btn-primary prime-btn add-awrads"
                      onClick={addAwards}
                    >
                      Add New Award
                    </Link>
                  </li>
                </ul>
              </div>
              <form>
                <div className="accordions awrad-infos" id="list-accord">
                  {/* Awards Item */}
                  <div className="user-accordion-item">
                    <Link
                      href="#"
                      className="accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#award1"
                    >
                      Awards<span>Delete</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse show"
                      id="award1"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse">
                        <div className="add-service-info">
                          <div className="add-info">
                            <div className="row align-items-center">
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Award Name
                                  </label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Year <span className="text-danger">*</span>
                                  </label>
                                  <div className="form-icon">
                                    <DatePicker
                                      className="form-control datetimepicker w-100"
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
                  {/* /Awards Item */}
                  {/* Awards Item */}
                  <div className="user-accordion-item">
                    <Link
                      href="#"
                      className="collapsed accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#award2"
                    >
                      Best Surgeon<span>Delete</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="award2"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse">
                        <div className="add-service-info">
                          <div className="add-info">
                            <div className="row align-items-center">
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Award Name
                                  </label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Year <span className="text-danger">*</span>
                                  </label>
                                  <div className="form-icon">
                                    <DatePicker
                                      className="form-control datetimepicker w-100"
                                      selected={selectedDate2}
                                      onChange={handleDateChange2}
                                      dateFormat="dd-MM-yyyy"
                                    />
                                    <span className="icon">
                                      <i className="fa-regular fa-calendar-days" />
                                    </span>
                                  </div>
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
                  {/* /Awards Item */}
                  {awards.map((awards) => (
                    <div className="user-accordion-item" key={awards.id}>
                      <Link
                        href="#"
                        className="accordion-wrap"
                        data-bs-toggle="collapse"
                        // data-bs-target="#award1"
                        data-bs-target={`#awards${awards.id}`}
                        onClick={() => deleteAwards(awards.id)}
                      >
                        Awards<span>Delete</span>
                      </Link>
                      <div
                        className="accordion-collapse collapse show"
                        id={`award${awards.id}`}
                        data-bs-parent="#list-accord"
                      >
                        <div className="content-collapse">
                          <div className="add-service-info">
                            <div className="add-info">
                              <div className="row align-items-center">
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Award Name
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
                                      Year{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <div className="form-icon">
                                      <DatePicker
                                        className="form-control datetimepicker w-100"
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
                </div>
                <div className="modal-btn text-end">
                  <Link href="#" className="btn btn-gray">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary prime-btn">
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

export default Awards;
