import React, { useState } from "react";
import Link from "next/link";
import DoctorSidebar from "../sidebar";
import SettingsHeader from "./settingsHeader";
import Header from "../../header";
import DoctorFooter from "../../common/doctorFooter";

const InsuranceSettings = (props) => {
  const [insurance, setInsurance] = useState([]);

  const addInsurance = () => {
    const newInsurance = {
      id: insurance.length + 1,
      isExpanded: true, // Set to true when adding
    };
    setInsurance([...insurance, newInsurance]);
  };
  const deleteAwards = (id) => {
    // Check if the education being deleted is expanded (added) or not
    const isExpanded = insurance.find(
      (insurance) => insurance.id === id
    )?.isExpanded;

    if (isExpanded) {
      // If the education is expanded, only delete it
      setInsurance(insurance.filter((insurance) => insurance.id !== id));
    } else {
      // If the education is not expanded, toggle its expanded state to false
      setInsurance(
        insurance.map((insurance) => {
          if (insurance.id === id) {
            return { ...insurance, isExpanded: false };
          }
          return insurance;
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
                <h3>Insurance</h3>
                <ul>
                  <li>
                    <Link
                      href="#"
                      className="btn btn-primary prime-btn add-insurance"
                      onClick={addInsurance}
                    >
                      Add New Insurance
                    </Link>
                  </li>
                </ul>
              </div>
              <form>
                <div className="accordions insurance-infos" id="list-accord">
                  {/* Insurance Item */}
                  <div className="user-accordion-item">
                    <Link
                      href="#"
                      className="accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#insurance1"
                    >
                      Insurance<span>Delete</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse show"
                      id="insurance1"
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
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Insurance Name
                                  </label>
                                  <input type="text" className="form-control" />
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
                  {/* /Insurance Item */}
                  {/* Insurance Item */}
                  <div className="user-accordion-item">
                    <Link
                      href="#"
                      className="collapsed accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#insurance2"
                    >
                      Star health<span>Delete</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="insurance2"
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
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Insurance Name
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    defaultValue="Star health"
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
                  {/* /Insurance Item */}
                  {/* Insurance Item */}
                  {insurance.map((insurance) => (
                    <div className="user-accordion-item" key={insurance.id}>
                      <Link
                        href="#"
                        className="accordion-wrap"
                        data-bs-toggle="collapse"
                        data-bs-target={`insurance${insurance.id}`}
                      >
                        Insurance
                        <span onClick={() => deleteAwards(insurance.id)}>
                          Delete
                        </span>
                      </Link>
                      <div
                        className="accordion-collapse collapse show"
                        id="insurance1"
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
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Insurance Name
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
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
                  {/* /Insurance Item */}
                </div>
                <div className="modal-btn text-end">
                  <Link href="#" className="btn btn-gray">
                    Cancel
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
      <DoctorFooter {...props} />
    </div>
  );
};

export default InsuranceSettings;
