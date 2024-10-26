/* eslint-disable react/jsx-no-undef */
import React, { useState } from "react";
import DashboardSidebar from "../dashboard/sidebar/sidebar.jsx";
import StickyBox from "react-sticky-box";
import Header from "../../header";
import Footer from "../../footer";
import Link from "next/link";
import { Modal } from "react-bootstrap";
import {
  doctor_thumb_01,
  doctor_thumb_02,
  doctorprofileimg,
} from "../../imagepath.jsx";

const PatientAccounts = (props) => {
  const [show, setShow] = useState(true);

  const handleClose = () => {
    setShow(false);
  };
  return (
    <>
      <div className="main-wrapper">
        <Header {...props} />
        <div className="breadcrumb-bar-two">
          <div className="container">
            <div className="row align-items-center inner-banner">
              <div className="col-md-12 col-12 text-center">
                <nav aria-label="breadcrumb" className="page-breadcrumb">
                  <h2 className="breadcrumb-title">Dashboard</h2>

                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link href="/patient/dashboard">Home</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Dashboard
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
                <div className="accunts-sec">
                  <div className="dashboard-header">
                    <div className="header-back">
                      <h3>Accounts</h3>
                    </div>
                  </div>
                  <div className="account-details-box">
                    <div className="row">
                      <div className="col-xxl-6 col-lg-7">
                        <div className="account-payment-info">
                          <h4>Statistics</h4>
                          <div className="row">
                            <div className="col-lg-5 col-md-6">
                              <div className="payment-amount">
                                <h6>
                                  <i className="fa-solid fa-file-invoice-dollar text-success" />
                                  Total Balance
                                </h6>
                                <span>$900</span>
                              </div>
                            </div>
                            <div className="col-lg-5 col-md-6">
                              <div className="payment-amount">
                                <h6>
                                  <i className="fa-solid fa-circle-question text-pink" />
                                  Requested
                                </h6>
                                <span>$50</span>
                              </div>
                            </div>
                          </div>
                          <div className="payment-request">
                            <span>Last Payment request : 24 Mar 2023</span>
                            <Link
                              href="#payment_request"
                              className="btn btn-primary prime-btn"
                              data-bs-toggle="modal"
                            >
                              Request Payment
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="col-xxl-1 d-lg-none d-xxl-block" />
                      <div className="col-lg-5">
                        <div className="bank-details-info">
                          <h3>Bank Details</h3>
                          <ul>
                            <li>
                              <h6>Bank Name</h6>
                              <h5>Citi Bank Inc</h5>
                            </li>
                            <li>
                              <h6>Account Number</h6>
                              <h5>5396 5250 1908 XXXX</h5>
                            </li>
                            <li>
                              <h6>Branch Name</h6>
                              <h5>London</h5>
                            </li>
                            <li>
                              <h6>Account Name</h6>
                              <h5>Darren</h5>
                            </li>
                          </ul>
                          <div className="edit-detail-link">
                            <Link
                              href="#account_details"
                              data-bs-toggle="modal"
                            >
                              Edit Details
                            </Link>
                            <Link href="#other_accounts" data-bs-toggle="modal">
                              Other Accounts
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-12">
                    <div className="account-detail-table">
                      {/* Tab Menu */}
                      <nav className="accounts-tab">
                        <ul className="nav nav-tabs-bottom">
                          <li className="nav-item">
                            <Link
                              className="nav-link active"
                              href="#pat_accounts"
                              data-bs-toggle="tab"
                            >
                              Accounts
                            </Link>
                          </li>
                          <li className="nav-item">
                            <Link
                              className="nav-link"
                              href="#pat_refundrequest"
                              data-bs-toggle="tab"
                            >
                              Refund Request
                            </Link>
                          </li>
                        </ul>
                      </nav>
                      {/* /Tab Menu */}
                      {/* Tab Content */}
                      <div className="tab-content pt-0">
                        {/* Accounts Tab */}
                        <div
                          id="pat_accounts"
                          className="tab-pane fade show active"
                        >
                          <ul className="header-list-btns d-inline-block mb-4">
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
                          <div className="custom-new-table">
                            <div className="table-responsive">
                              <table className="table table-hover table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Account No</th>
                                    <th>Reason</th>
                                    <th>Debited / Credited On</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>
                                      <span className="text-blue">
                                        #AC-1234
                                      </span>
                                    </td>
                                    <td>5396 5250 1908 XXXX</td>
                                    <td>Appointment</td>
                                    <td>26 Mar 2024</td>
                                    <td>$300</td>
                                    <td>
                                      <span className="badge badge-success-bg">
                                        Completed
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <span className="text-blue">
                                        #AC-1235
                                      </span>
                                    </td>
                                    <td>6372 4902 4902 XXXX</td>
                                    <td>Appointment</td>
                                    <td>28 Mar 2024</td>
                                    <td>$480</td>
                                    <td>
                                      <span className="badge badge-success-bg">
                                        Completed
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <span className="text-blue">
                                        #AC-1236
                                      </span>
                                    </td>
                                    <td>4892 0204 4924 XXXX</td>
                                    <td>Appointment</td>
                                    <td>11 Apr 2024</td>
                                    <td>$250</td>
                                    <td>
                                      <span className="badge badge-success-bg">
                                        Completed
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <span className="text-blue">
                                        #AC-1237
                                      </span>
                                    </td>
                                    <td>5730 4892 0492 XXXX</td>
                                    <td>Refund</td>
                                    <td>18 Apr 2024</td>
                                    <td>$220</td>
                                    <td>
                                      <span className="badge badge-warning-bg">
                                        Pending
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <span className="text-blue">
                                        #AC-1238
                                      </span>
                                    </td>
                                    <td>7922 9024 5824 XXXX</td>
                                    <td>Appointment</td>
                                    <td>29 Apr 2024</td>
                                    <td>$350</td>
                                    <td>
                                      <span className="badge badge-success-bg">
                                        Completed
                                      </span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          {/* Pagination */}
                          <div className="pagination dashboard-pagination">
                            <ul>
                              <li>
                                <Link href="#" className="page-link">
                                  <i className="fa-solid fa-chevron-left" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  1
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link active">
                                  2
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  3
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  4
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  ...
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  <i className="fa-solid fa-chevron-right" />
                                </Link>
                              </li>
                            </ul>
                          </div>
                          {/* /Pagination */}
                        </div>
                        {/* /Accounts Tab */}
                        {/* Refund Request Tab */}
                        <div className="tab-pane fade" id="pat_refundrequest">
                          <ul className="header-list-btns d-inline-block mb-4">
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
                          <div className="custom-new-table">
                            <div className="table-responsive">
                              <table className="table table-hover table-center mb-0">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Doctor</th>
                                    <th>Appointment Date</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                    <th />
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>
                                      <span className="text-blue">
                                        #AC-1234
                                      </span>
                                    </td>
                                    <td>
                                      <div className="table-avtatar">
                                        <Link href="/patient/doctor-profile">
                                          <img
                                            src={doctorprofileimg}
                                            alt="Img"
                                          />
                                          Edalin Hendry
                                        </Link>
                                      </div>
                                    </td>
                                    <td>24 Mar 2024 - 10:30 AM</td>
                                    <td>$300</td>
                                    <td>
                                      <span className="badge badge-warning-bg">
                                        Pending
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <Link
                                          href="#"
                                          className="account-action"
                                        >
                                          <i className="fa-solid fa-link" />
                                        </Link>
                                      </div>
                                    </td>
                                    <td>
                                      <span>
                                        <Link
                                          href="#refund-request"
                                          data-bs-toggle="modal"
                                          className="text-blue"
                                        >
                                          Initiate Payment
                                        </Link>
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <span className="text-blue">
                                        #AC-1235
                                      </span>
                                    </td>
                                    <td>
                                      <div className="table-avtatar">
                                        <Link href="/patient/doctor-profile">
                                          <img
                                            src={doctor_thumb_01}
                                            alt="Img"
                                          />
                                          Shanta Neill
                                        </Link>
                                      </div>
                                    </td>
                                    <td>28 Mar 2024 - 11:15 AM</td>
                                    <td>$250</td>
                                    <td>
                                      <span className="badge badge-success-bg">
                                        Completed
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <Link
                                          href="#request_details_modal"
                                          className="account-action"
                                          data-bs-toggle="modal"
                                        >
                                          <i className="fa-solid fa-link" />
                                        </Link>
                                      </div>
                                    </td>
                                    <td />
                                  </tr>
                                  <tr>
                                    <td>
                                      <span className="text-blue">
                                        #AC-1236
                                      </span>
                                    </td>
                                    <td>
                                      <div className="table-avtatar">
                                        <Link href="/patient/doctor-profile">
                                          <img
                                            src={doctor_thumb_02}
                                            alt="Img"
                                          />
                                          Anthony Tran
                                        </Link>
                                      </div>
                                    </td>
                                    <td>02 Apr 2024 - 04:15 PM</td>
                                    <td>$380</td>
                                    <td>
                                      <span className="badge badge-danger-bg">
                                        Cancelled
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <Link
                                          href="#request_cancel_modal"
                                          className="account-action"
                                          data-bs-toggle="modal"
                                        >
                                          <i className="fa-solid fa-link" />
                                        </Link>
                                      </div>
                                    </td>
                                    <td />
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          {/* Pagination */}
                          <div className="pagination dashboard-pagination">
                            <ul>
                              <li>
                                <Link href="#" className="page-link">
                                  <i className="fa-solid fa-chevron-left" />
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  1
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link active">
                                  2
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  3
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  4
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  ...
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="page-link">
                                  <i className="fa-solid fa-chevron-right" />
                                </Link>
                              </li>
                            </ul>
                          </div>
                          {/* /Pagination */}
                        </div>
                        {/* /Refund Request Tab */}
                      </div>
                      {/* Tab Content */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer {...props} />
      </div>
      <>
        {/* Payment Request Moodal */}
        <div
          className="modal fade custom-modal custom-modal-two modal-lg"
          id="payment_request"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Payment Request{" "}
                  <span className="text-danger request-id">
                    Request ID : #RQ-1323
                  </span>
                </h5>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span>
                    <i className="fa-solid fa-x" />
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="input-block input-block-new">
                    <label className="form-label">Request Amount</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="input-block input-block-new">
                    <label className="form-label">Description</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      defaultValue={""}
                    />
                  </div>
                  <div className="form-set-button">
                    <button className="btn btn-light" type="button">
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* /Payment Request Moodal */}
        {/* Account Details Modal*/}
        <div
          className="modal fade custom-modal custom-modal-two modal-lg"
          id="account_details"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Account Details</h5>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span>
                    <i className="fa-solid fa-x" />
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="input-block input-block-new">
                    <label className="form-label">Bank Name</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="input-block input-block-new">
                    <label className="form-label">Branch Name</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="input-block input-block-new">
                    <label className="form-label">Account Number</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="input-block input-block-new">
                    <label className="form-label">Account Name</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="form-set-button">
                    <button className="btn btn-light" type="button">
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* /Account Details Modal*/}
        {/* Other Accounts Modal*/}
        <div
          className="modal fade custom-modal custom-modal-two modal-lg"
          id="other_accounts"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Other Accounts</h5>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span>
                    <i className="fa-solid fa-x" />
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div className="other-accounts-info">
                  <ul>
                    <li>
                      <ul className="other-bank-info">
                        <li>
                          <h6>Name</h6>
                          <span>Citi Bank Inc</span>
                        </li>
                        <li>
                          <h6>Account No</h6>
                          <span>5396 5250 1908 XXXX</span>
                        </li>
                        <li>
                          <h6>Branch</h6>
                          <span>London</span>
                        </li>
                        <li>
                          <h6>Name on Bank Account</h6>
                          <span>Edalin Hendry</span>
                        </li>
                        <li>
                          <Link href="#">Current</Link>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <ul className="other-bank-info">
                        <li>
                          <h6>Name</h6>
                          <span>HDFC Bank Inc</span>
                        </li>
                        <li>
                          <h6>Account No</h6>
                          <span>7382 4924 4924 XXXX</span>
                        </li>
                        <li>
                          <h6>Branch</h6>
                          <span>New York</span>
                        </li>
                        <li>
                          <h6>Name on Bank Account</h6>
                          <span>Edalin Hendry</span>
                        </li>
                        <li>
                          <Link href="#">Change to default</Link>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <ul className="other-bank-info">
                        <li>
                          <h6>Name</h6>
                          <span>Union Bank Inc</span>
                        </li>
                        <li>
                          <h6>Account No</h6>
                          <span>8934 4902 9024 XXXX</span>
                        </li>
                        <li>
                          <h6>Branch</h6>
                          <span>Chicago</span>
                        </li>
                        <li>
                          <h6>Name on Bank Account</h6>
                          <span>Edalin Hendry</span>
                        </li>
                        <li>
                          <Link href="#">Change to default</Link>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <ul className="other-bank-info">
                        <li>
                          <h6>Name</h6>
                          <span>KVB Bank Inc</span>
                        </li>
                        <li>
                          <h6>Account No</h6>
                          <span>5892 4920 4829 XXXX</span>
                        </li>
                        <li>
                          <h6>Branch</h6>
                          <span>Austin</span>
                        </li>
                        <li>
                          <h6>Name on Bank Account</h6>
                          <span>Edalin Hendry</span>
                        </li>
                        <li>
                          <Link href="#">Change to default</Link>
                        </li>
                      </ul>
                    </li>
                  </ul>
                  <Link
                    href="#"
                    className="btn btn-primary prime-btn w-100 mt-2"
                    data-bs-dismiss="modal"
                  >
                    Close
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Other Accounts Modal*/}
        {/* Request Completed Modal*/}
        <div
          className="modal fade custom-modal custom-modal-two"
          id="request_details_modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Request Details{" "}
                  <span className="badge badge-success-bg">Completed</span>
                </h5>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span>
                    <i className="fa-solid fa-x" />
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div className="completed-request">
                  <ul>
                    <li>
                      <h6>ID</h6>
                      <span>#AC-1234</span>
                    </li>
                    <li>
                      <h6>Requested on</h6>
                      <span>24 Mar 2024</span>
                    </li>
                    <li>
                      <h6>Credited Date</h6>
                      <span>24 Mar 2024</span>
                    </li>
                    <li>
                      <h6>Amount</h6>
                      <span className="text-blue">$300</span>
                    </li>
                  </ul>
                  <div className="bank-detail">
                    <h4>Bank Details</h4>
                    <div className="accont-information">
                      <h6>Name</h6>
                      <span>Citi Bank Inc</span>
                    </div>
                    <div className="accont-information">
                      <h6>Account No</h6>
                      <span>5396 5250 1908 XXXX</span>
                    </div>
                    <div className="accont-information">
                      <h6>Branch</h6>
                      <span>London</span>
                    </div>
                  </div>
                  <div className="request-des">
                    <h4>Reqeust Description</h4>
                    <p>
                      I recently completed a series of dental treatments with
                      Dr.Edalin Hendry, and I couldn't be more pleased with the
                      results. From my very first appointment.
                    </p>
                  </div>
                  <Link
                    href="#"
                    className="btn btn-primary prime-btn w-100"
                    data-bs-dismiss="modal"
                  >
                    Close
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Request Completed Modal*/}
        {/* Request Cancel Modal*/}
        <div
          className="modal fade custom-modal custom-modal-two"
          id="request_cancel_modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Request Details{" "}
                  <span className="badge badge-danger-bg">Cancelled</span>
                </h5>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span>
                    <i className="fa-solid fa-x" />
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div className="cancelled-request">
                  <div className="canceled-user-info d-flex align-items-center">
                    <div className="patinet-information">
                      <Link href="/doctor/doctor-upcoming-appointment">
                        <img
                          src="assets/img/doctors-dashboard/profile-01.jpg"
                          alt="User Image"
                        />
                      </Link>
                      <div className="patient-info">
                        <p>#Apt0001</p>
                        <h6>
                          <Link href="/doctor/doctor-upcoming-appointment">
                            Adrian
                          </Link>
                        </h6>
                      </div>
                    </div>
                    <div className="email-info">
                      <ul>
                        <li>
                          <i className="fa-solid fa-envelope" />
                          adran@example.com
                        </li>
                        <li>
                          <i className="fa-solid fa-phone" />
                          +1 504 368 6874
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="cancellation-fees">
                    <h6>Consultation Fees : $200</h6>
                    <div className="cancellation-info">
                      <div className="appointment-type">
                        <p className="md-text">Type of Appointment</p>
                        <p>
                          <i className="fa-solid fa-building text-green" />
                          Direct Visit
                        </p>
                      </div>
                      <div className="appointment-type">
                        <p className="md-text">Clinic Location</p>
                        <p>Adrian’s Dentistry</p>
                      </div>
                    </div>
                  </div>
                  <div className="cancel-reason">
                    <h5>Reason</h5>
                    <p>
                      I have an urgent surgery, while our Appointment so i am
                      rejecting appointment{" "}
                    </p>
                    <span className="text-danger">
                      Cancelled By You on 23 Mar 2024
                    </span>
                  </div>
                  <div className="refund-status">
                    <span className="text-blue refund">
                      Status : Initiate Now
                    </span>
                    <span className="text-blue refund">Status : Initiated</span>
                    <span className="text-blue refund">Status : Completed</span>
                    <span className="text-blue refund">Status : Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Request Cancel Modal*/}
        {/* Refund Request Modal*/}
        <div className="modal fade info-modal" id="refund-request">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body">
                <div className="success-wrap text-center">
                  <span className="icon-success">
                    <i className="fa-solid fa-calendar-check" />
                  </span>
                  <h3>Refund initiated Successfully</h3>
                  <p>
                    Your Payment will be credited in your bank account in 3
                    working days
                  </p>
                  <Link
                    href="#"
                    className="btn btn-primary prime-btn"
                    data-bs-dismiss="modal"
                  >
                    Okay
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Refund Request Modal*/}
      </>
    </>
  );
};

export default PatientAccounts;
