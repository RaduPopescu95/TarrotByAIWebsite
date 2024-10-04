import React, { useState } from "react";
import Link from "next/link";
import Header from "../../header";
import DoctorFooter from "../../common/doctorFooter";
import DoctorSidebar from "../sidebar";
import SettingsHeader from "./settingsHeader";
import {
  doctordashboardclient01,
  doctordashboardclient02,
} from "../../imagepath";

const Clinic = (props) => {
  const [clinic, setClinic] = useState([]);
  const addClinic = () => {
    const newClinic = {
      id: clinic.length + 1,
      isExpanded: true, // Set to true when adding
    };
    setClinic([...clinic, newClinic]);
  };
  const deleteClinic = (id) => {
    // Check if the education being deleted is expanded (added) or not
    const isExpanded = clinic.find((clinic) => clinic.id === id)?.isExpanded;

    if (isExpanded) {
      // If the education is expanded, only delete it
      setClinic(clinic.filter((clinic) => clinic.id !== id));
    } else {
      // If the education is not expanded, toggle its expanded state to false
      setClinic(
        clinic.map((clinic) => {
          if (clinic.id === id) {
            return { ...clinic, isExpanded: false };
          }
          return clinic;
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
                <h3>Clinics</h3>
                <ul>
                  <li>
                    <Link
                      href="#"
                      className="btn btn-primary prime-btn add-clinics"
                      onClick={addClinic}
                    >
                      Add New Clinic
                    </Link>
                  </li>
                </ul>
              </div>
              <form>
                <div className="accordions clinic-infos" id="list-accord">
                  {/* Clinic Item */}
                  <div className="user-accordion-item">
                    <Link
                      href="#"
                      className="accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#clinic3"
                    >
                      Clinic<span>Delete</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse show"
                      id="clinic3"
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
                              <div className="col-md-12">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Clinic Name
                                  </label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Location
                                  </label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Addrerss
                                  </label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-md-12">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Gallery
                                  </label>
                                  <div className="drop-file">
                                    <p>Drop files or Click to upload</p>
                                    <input type="file" />
                                  </div>
                                  <div className="view-imgs">
                                    <div className="view-img">
                                      <img
                                        src={doctordashboardclient02}
                                        alt="img"
                                      />
                                      <Link href="#">Remove</Link>
                                    </div>
                                    <div className="view-img">
                                      <img
                                        src={doctordashboardclient01}
                                        alt="img"
                                      />
                                      <Link href="#">Remove</Link>
                                    </div>
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
                  {/* /Clinic Item */}
                  {/* Clinic Item */}
                  <div className="user-accordion-item">
                    <Link
                      href="#"
                      className="collapsed accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#clinic2"
                    >
                      Adrian’s Dentistry<span>Delete</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="clinic2"
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
                              <div className="col-md-12">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Clinic Name
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    defaultValue="Adrian’s Dentistry"
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Location
                                  </label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Addrerss
                                  </label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-md-12">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Gallery
                                  </label>
                                  <div className="drop-file">
                                    <p>Drop files or Click to upload</p>
                                    <input type="file" />
                                  </div>
                                  <div className="view-imgs">
                                    <div className="view-img">
                                      <img
                                        src={doctordashboardclient02}
                                        alt="img"
                                      />
                                      <Link href="#">Remove</Link>
                                    </div>
                                    <div className="view-img">
                                      <img
                                        src={doctordashboardclient01}
                                        alt="img"
                                      />
                                      <Link href="#">Remove</Link>
                                    </div>
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
                  {/* /Clinic Item */}
                  {/* Clinic Item */}
                  {clinic.map((clinic) => (
                    <div className="user-accordion-item" key={clinic.id}>
                      <Link
                        href="#"
                        className="accordion-wrap"
                        data-bs-toggle="collapse"
                        //   data-bs-target="#clinic1"
                        data-bs-target={`#clinic${clinic.id}`}
                        onClick={() => deleteClinic(clinic.id)}
                      >
                        Clinic<span>Delete</span>
                      </Link>
                      <div
                        className="accordion-collapse collapse show"
                        id="clinic1"
                        //   id={`clinic${clinic.id}`}
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
                                <div className="col-md-12">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Clinic Name
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
                                      Location
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
                                      Addrerss
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-12">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Gallery
                                    </label>
                                    <div className="drop-file">
                                      <p>Drop files or Click to upload</p>
                                      <input type="file" />
                                    </div>
                                    <div className="view-imgs">
                                      <div className="view-img">
                                        <img
                                          src={doctordashboardclient02}
                                          alt="img"
                                        />
                                        <Link href="#">Remove</Link>
                                      </div>
                                      <div className="view-img">
                                        <img
                                          src={doctordashboardclient01}
                                          alt="img"
                                        />
                                        <Link href="#">Remove</Link>
                                      </div>
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
                  ))}
                  {/* /Clinic Item */}
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

export default Clinic;
