import React from "react";
import DashboardSidebar from "../sidebar/sidebar.jsx";
import IMG01 from "../../../../../assets/images/patient.jpg";
import StickyBox from "react-sticky-box";
import Link from "next/link";
import Footer from "../../../footer.jsx";
import Header from "../../../header.jsx";

const Profile = (props) => {
  return (
    <div>
      <Header {...props} />
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Profile Settings</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Home</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Profile Settings
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
                <DashboardSidebar />
              </StickyBox>
            </div>

            <div className="col-lg-8 col-xl-9">
              <form>
                <div className="setting-card">
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
                      <p className="form-text">
                        Your Image should Below 4 MB, Accepted format
                        jpg,png,svg
                      </p>
                    </div>
                  </div>
                </div>
                <div className="setting-title">
                  <h5>Information</h5>
                </div>
                <div className="setting-card">
                  <div className="row">
                    <div className="col-lg-4 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          First Name <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Last Name <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Date of Birth <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Phone Number <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Email Address <span className="text-danger">*</span>
                        </label>
                        <input type="email" className="form-control" />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Blood Group <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="setting-title">
                  <h5>Address</h5>
                </div>
                <div className="setting-card">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Address <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          City <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          State <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Country <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Pincode <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
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
            </div>
          </div>
        </div>
      </div>
      <Footer {...props} />
    </div>
  );
};

export default Profile;
