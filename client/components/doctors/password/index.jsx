import React, { useState } from "react";
import Header from "../../header";
import DoctorSidebar from "../sidebar/index";
import DoctorFooter from "../../common/doctorFooter";
import Link from "next/link";
import Home1Header from "../../home/home-1/header";

const Password = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const [showConfirmPassword, setConfirmPassword] = useState(false);
  const toggleConfirmPassword = () => {
    setConfirmPassword(!showConfirmPassword);
  };
  return (
    <div>
      <Home1Header />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Change Password</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Home</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Change Password
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
              <div className="dashboard-header">
                <h3>Schimba parola</h3>
              </div>
              <form>
                <div className="card pass-card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="input-block input-block-new">
                          <label className="form-label">Parola actuala</label>
                          <input type="password" className="form-control" />
                        </div>
                        <div className="input-block input-block-new">
                          <label className="form-label">Parola noua</label>
                          <div className="pass-group">
                            <input
                              type={showPassword ? "text" : "password"}
                              className="form-control pass-input"
                            />
                            <span
                              className={`feather-eye${
                                showPassword ? "" : "-off"
                              } toggle-password`}
                              onClick={togglePasswordVisibility}
                            />
                          </div>
                        </div>
                        <div className="input-block input-block-new mb-0">
                          <label className="form-label">Confirma parola</label>
                          <div className="pass-group">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              className="form-control pass-input-sub"
                            />

                            <span
                              className={`feather-eye${
                                showConfirmPassword ? "" : "-off"
                              } toggle-password`}
                              onClick={toggleConfirmPassword}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-set-button">
                  <button className="btn btn-light" type="button">
                    Anuleaza
                  </button>
                  <Link className="btn btn-primary" href="#">
                    Salveaza
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Content */}
      <DoctorFooter />
    </div>
  );
};

export default Password;
