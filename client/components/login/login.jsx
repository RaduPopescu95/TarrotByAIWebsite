import React, { useEffect } from "react";
// import loginBanner from "../../../assets/images/login-banner.png";
import Link from "next/link";

import Footer from "../footer";
import Home1Header from "../home/home-1/header";

const LoginContainer = (props) => {
  useEffect(() => {
    document.body.classList.add("account-page");

    return () => document.body.classList.remove("account-page");
  }, []);

  return (
    <>
      <Home1Header />

      <>
        {/* Page Content */}
        <div className="content top-space">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-8 offset-md-2">
                {/* Login Tab Content */}
                <div className="account-content">
                  <div className="row align-items-center justify-content-center">
                    {/* <div className="col-md-7 col-lg-6 login-left">
                      <img
                        src={"../../../assets/img/login-banner-cristina.png"}
                        className="img-fluid"
                        alt="Doccure Login"
                      />
                    </div> */}
                    <div className="col-md-12 col-lg-6 login-right">
                      <div className="login-header">
                        <h3>Autentificare</h3>
                      </div>
                      <form>
                        <div className="form-group form-focus">
                          <input
                            type="email"
                            className="form-control floating"
                          />
                          <label className="focus-label">Email</label>
                        </div>
                        <div className="form-group form-focus">
                          <input
                            type="password"
                            className="form-control floating"
                          />
                          <label className="focus-label">Parola</label>
                        </div>
                        {/* <div className="text-end">
                          <Link
                            className="forgot-link"
                            href="/pages/forgot-password"
                          >
                            Ai uitat parola?
                          </Link>
                        </div> */}

                        <Link
                          href="/home-1"
                          className="btn btn-primary w-100 btn-lg login-btn"
                          type="submit"
                        >
                          Autentificare
                        </Link>
                        {/* <div className="login-or">
                          <span className="or-line" />
                          <span className="span-or">or</span>
                        </div> */}
                        {/* <div className="row form-row social-login">
                          <div className="col-6">
                            <Link
                              href="/home-1"
                              className="btn btn-facebook w-100"
                            >
                              <i className="fab fa-facebook-f me-1" /> Facebook
                            </Link>
                          </div>
                          <div className="col-6">
                            <Link
                              href="/home-1"
                              className="btn btn-google w-100"
                            >
                              <i className="fab fa-google me-1" /> Google
                            </Link>
                          </div>
                        </div> */}
                        {/* <div className="text-center dont-have">
                          Nu ai cont?{" "}
                          <Link href="/register">Înregistrează-te</Link>
                        </div> */}
                      </form>
                    </div>
                  </div>
                </div>
                {/* /Login Tab Content */}
              </div>
            </div>
          </div>
        </div>
        {/* /Page Content */}
      </>

      {/* <Footer {...props} /> */}
    </>
  );
};

export default LoginContainer;
