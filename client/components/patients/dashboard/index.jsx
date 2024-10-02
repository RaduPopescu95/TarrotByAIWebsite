/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DashboardSidebar } from "./sidebar/sidebar.jsx";
// import { Tab, Tabs } from "react-bootstrap";
// import StickyBox from "react-sticky-box";
// import {
//   IMG01,
//   IMG02,
//   IMG03,
//   IMG04,
//   IMG05,
//   IMG06,
//   IMG07,
//   IMG08,
//   IMG09,
//   IMG10,
// } from "./img";
// import Dashboard1 from "../../../../assets/images/specialities/pt-dashboard-01.png";
// import Dashboard2 from "../../../../assets/images/specialities/pt-dashboard-02.png";
// import Dashboard3 from "../../../../assets/images/specialities/pt-dashboard-03.png";
// import Dashboard4 from "../../../../assets/images/specialities/pt-dashboard-04.png";
import CristinaImage from "../../../assets/images/doctors-dashboard/profilecristina.png";
// import Graph1 from "../../../../assets/images/shapes/graph-01.png";
// import Graph2 from "../../../../assets/images/shapes/graph-02.png";
// import Graph3 from "../../../../assets/images/shapes/graph-03.png";
// import Graph4 from "../../../../assets/images/shapes/graph-04.png";

// import Footer from "../../footer";
// import Header from "../../header.jsx";
import DoctorFooter from "../../common/doctorFooter/index.jsx";
// import {
//   doctor_14,
//   doctor_15,
//   doctor_17,
//   doctor_thumb_01,
//   doctor_thumb_03,
//   doctor_thumb_05,
//   doctor_thumb_07,
//   doctor_thumb_08,
//   doctor_thumb_09,
//   doctor_thumb_13,
//   doctor_thumb_21,
//   doctordashboardprofile06,
//   doctordashboardprofile07,
//   doctordashboardprofile08,
//   doctorprofileimg,
//   doctorthumb02,
//   doctorthumb11,
//   patient20,
//   patient21,
// } from "../../imagepath.jsx";

import dynamic from "next/dynamic";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";
// import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Home1Header from "../../home/home-1/header.jsx";
import Footer from "../../footer.jsx";
import { useAuth } from "../../../../context/AuthContext.js";
import { handleQueryFirestore } from "../../../../utils/firestoreUtils.js";
const isBrowser = typeof window !== "undefined";

const OwlCarousel = dynamic(() => import("react-owl-carousel"), { ssr: false });
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ContClient = (props) => {
  const TextContent = () => <p>Last Visit 25 Mar 2024</p>;
  const { setCurrentUser, currentUser, userData, setUserData } = useAuth();
  const [closestReservation, setClosestReservation] = useState({});
  const [count, setCount] = useState(1, 2, 3, 4);

  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     key: 1,
  //   };
  //   this.handleSelect = this.handleSelect.bind(this);
  // }
  const chartRef = useRef(null);

  const handleGetUserReservations = async () => {
    const data = await handleQueryFirestore(
      "RezervariConsultatii",
      "owner_uid",
      userData?.owner_uid
    );
    console.log("data...", data[0]);
    setClosestReservation(data[0]);
  };

  useEffect(() => {
    handleGetUserReservations();
    if (chartRef.current) {
      const options = {
        series: [
          {
            data: [140, 100, 180, 130, 100, 130],
          },
        ],
        chart: {
          height: 300,
          type: "bar",
          events: {
            click: function (chart, w, e) {
              // Handle click event
            },
          },
        },
        fill: {
          colors: ["#E8F1FF"],
        },
        plotOptions: {
          bar: {
            columnWidth: "45%",
          },
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: false,
        },
        xaxis: {
          categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        },
        crosshairs: {
          show: false,
        },
      };

      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      // Cleanup function
      return () => {
        chart.destroy();
      };
    }
  }, []);

  const [options1, setOptions1] = useState(null); // Initialize options1 as null

  const chartContainerRef = useRef(null);

  useEffect(() => {
    const options = {
      series: [
        { data: [90, 60, 30, 60, 90, 70, 70] },
        { data: [110, 90, 40, 120, 130, 130, 130] },
      ],
      chart: {
        type: "bar",
        height: 350,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          endingShape: "rounded",
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      fill: {
        opacity: 1,
        colors: ["#F1F5F9"],
      },
      states: {
        hover: {
          color: "#00008B",
        },
      },
    };

    setOptions1(options); // Set options1 state

    if (chartContainerRef.current) {
      const chart = new ApexCharts(chartContainerRef.current, options);
      chart.render();
    }

    return () => {
      // Cleanup code if needed
    };
  }, []);

  const specialitysettings = {
    items: 3,
    loop: true,
    margin: 15,
    dots: false,
    nav: true,
    navContainer: ".slide-nav-patient",
    navText: [
      '<i class="fas fa-chevron-left"></i>',
      '<i class="fas fa-chevron-right"></i>',
    ],

    autoplay: false,
    infinite: "true",

    slidestoscroll: 1,
    rtl: "true",
    rows: 1,
    responsive: {
      0: {
        items: 1,
      },
      500: {
        items: 1,
      },
      575: {
        items: 2,
      },
      768: {
        items: 2,
      },
      1000: {
        items: 3,
      },
      1300: {
        items: 5,
      },
    },
  };
  const specialitysettings1 = {
    items: 1,
    loop: true,
    margin: 25,
    dots: false,
    nav: true,
    navContainer: ".slide-nav-1",
    navText: [
      '<i class="fas fa-chevron-left custom-arrow"></i>',
      '<i class="fas fa-chevron-right custom-arrow"></i>',
    ],

    autoplay: false,
    infinite: "true",

    slidestoscroll: 1,
    rtl: "true",
    rows: 1,
    responsive: {
      0: {
        items: 1,
      },
      500: {
        items: 1,
      },
      575: {
        items: 1,
      },
      768: {
        items: 1,
      },
      1000: {
        items: 1,
      },
      1300: {
        items: 1,
      },
    },
  };

  const [animate, setAnimate] = useState(false);
  const circleRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (circleRef.current) {
        const elementPos = circleRef.current.getBoundingClientRect().top;
        const topOfWindow = window.scrollY;
        const percent = parseFloat(
          circleRef.current.getAttribute("data-percent")
        );
        const animate = circleRef.current.dataset.animate === "true";

        if (elementPos < topOfWindow + window.innerHeight - 30 && !animate) {
          circleRef.current.dataset.animate = "true";
          setAnimate(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Trigger on initial load

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <Home1Header />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Informatii cont</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Cont</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    {userData?.first_name.length > 0 && userData?.first_name}
                    {userData?.last_name.length > 0 && userData?.last_name}
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* /Breadcrumb */}
      {/* Page Content */}
      <div className="content">
        <div className="container">
          <div className="row">
            {/* Profile Sidebar */}
            <div className="col-lg-4 col-xl-3 theiaStickySidebar">
              <div className="stickybar">
                {/* Profile Sidebar */}
                <DashboardSidebar />
                {/* /Profile Sidebar */}
              </div>
            </div>
            {/* / Profile Sidebar */}
            <div className="col-lg-8 col-xl-9">
              <div className="dashboard-header">
                <h3>Informatii cont</h3>
              </div>
              <div className="row">
                {/* <div className="col-xl-8 d-flex">
                  <div className="dashboard-card w-100">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5>Health Records</h5>
                      </div>
                      <div className="dropdown header-dropdown">
                        <Link
                          className="dropdown-toggle"
                          data-bs-toggle="dropdown"
                          href="#"
                        >
                          <img
                            src={doctordashboardprofile06}
                            className="avatar dropdown-avatar"
                            alt="Img"
                          />
                          Hendrita
                        </Link>
                        <div className="dropdown-menu dropdown-menu-end">
                          <Link href="#" className="dropdown-item">
                            <img
                              src={doctordashboardprofile06}
                              className="avatar dropdown-avatar"
                              alt="Img"
                            />
                            Hendrita
                          </Link>
                          <Link href="#" className="dropdown-item">
                            <img
                              src={doctordashboardprofile08}
                              className="avatar dropdown-avatar"
                              alt="Img"
                            />
                            Laura
                          </Link>
                          <Link href="#" className="dropdown-item">
                            <img
                              src={doctordashboardprofile07}
                              className="avatar dropdown-avatar"
                              alt="Img"
                            />
                            Mathew
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      <div className="row">
                        <div className="col-sm-7">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="health-records icon-orange">
                                <span>
                                  <i className="fa-solid fa-heart" />
                                  Heart Rate
                                </span>
                                <h3>
                                  140 Bpm <sup> 2%</sup>
                                </h3>
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="health-records icon-amber">
                                <span>
                                  <i className="fa-solid fa-temperature-high" />
                                  Body Temprature
                                </span>
                                <h3>37.5 C</h3>
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="health-records icon-dark-blue">
                                <span>
                                  <i className="fa-solid fa-notes-medical" />
                                  Glucose Level
                                </span>
                                <h3>
                                  70 - 90<sup> 6%</sup>
                                </h3>
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="health-records icon-blue">
                                <span>
                                  <i className="fa-solid fa-highlighter" />
                                  SPo2
                                </span>
                                <h3>96%</h3>
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="health-records icon-red">
                                <span>
                                  <i className="fa-solid fa-syringe" />
                                  Blood Pressure
                                </span>
                                <h3>
                                  100 mg/dl<sup> 2%</sup>
                                </h3>
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="health-records icon-purple">
                                <span>
                                  <i className="fa-solid fa-user-pen" />
                                  BMI{" "}
                                </span>
                                <h3>20.1 kg/m2</h3>
                              </div>
                            </div>
                            <div className="col-md-12">
                              <div className="report-gen-date">
                                <p>
                                  Report generated on last visit : 25 Mar 2024{" "}
                                  <span>
                                    <i className="fa-solid fa-copy" />
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-sm-5">
                          <div className="chart-over-all-report">
                            <h5>Overall Report</h5>
                            <div className="circle-bar circle-bar3 report-chart">
                              <div
                                className="circle-bar3"
                                ref={circleRef}
                                data-animate="false"
                                data-percent="50"
                              >
                                {animate && (
                                  <CircularProgressbar
                                    value={parseFloat(
                                      circleRef.current.getAttribute(
                                        "data-percent"
                                      )
                                    )}
                                    text="Last Visit 25 Mar 2024"
                                    strokeWidth={7}
                                    styles={buildStyles({
                                      textColor: "#000000", // Black color
                                      pathColor: "#65A30D",
                                      textSize: "7px", // Adjust font size here
                                    })}
                                    className="health-percentage" // Add the class name here
                                  />
                                )}
                              </div>
                            </div>
                            <span className="health-percentage">
                              Your health is 95% Normal
                            </span>
                            <Link
                              href="/patient/medicaldetails"
                              className="btn btn-dark w-100"
                            >
                              View Details
                              <i className="fa-solid fa-chevron-right ms-2" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}
                <div className="col-xl-8 d-flex">
                  <div className="dashboard-main-col w-100">
                    <div className="dashboard-card w-100">
                      <div className="dashboard-card-head">
                        <div className="header-title">
                          <h5>
                            <span className="card-head-icon">
                              <i className="fa-solid fa-calendar-days" />
                            </span>
                            Urmatoarea rezervare
                          </h5>
                        </div>
                        <div className="card-view-link">
                          <div className="owl-nav slide-nav-patient text-end nav-control" />
                        </div>
                      </div>
                      {closestReservation?.owner_uid ? (
                        <div cl assName="dashboard-card-body">
                          <div className="apponiment-dates">
                            {/* <ul className="appointment-calender-slider">
                            <OwlCarousel {...specialitysettings}>
                              <li>
                                <Link href="#">
                                  <h5>
                                    19 <span>Mon</span>
                                  </h5>
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <h5>
                                    20 <span>Mon</span>
                                  </h5>
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="available-date">
                                  <h5>
                                    21 <span>Tue</span>
                                  </h5>
                                </Link>
                              </li>
                              <li>
                                <Link href="#" className="available-date">
                                  <h5>
                                    22 <span>Wed</span>
                                  </h5>
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <h5>
                                    23 <span>Thu</span>
                                  </h5>
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <h5>
                                    24 <span>Fri</span>
                                  </h5>
                                </Link>
                              </li>
                              <li>
                                <Link href="#">
                                  <h5>
                                    25 <span>Sat</span>
                                  </h5>
                                </Link>
                              </li>
                            </OwlCarousel>
                          </ul> */}

                            <div className="appointment-dash-card">
                              <div className="doctor-fav-list">
                                <div className="doctor-info-profile">
                                  <Link href="#" className="table-avatar">
                                    <img
                                      src={"/img/profilecristina.png"}
                                      alt="Cristina Zurba"
                                    />
                                  </Link>
                                  <div className="doctor-name-info">
                                    <h5>
                                      <Link href="#">Cristina Zurba</Link>
                                    </h5>
                                    {/* <span>Dentist</span> */}
                                  </div>
                                </div>
                                {/* <Link href="#" className="cal-plus-icon">
                                <i className="fa-solid fa-hospital" />
                              </Link> */}
                              </div>
                              <div className="date-time">
                                <p>
                                  <i className="fa-solid fa-clock" />
                                  {closestReservation?.selectedSlot?.day}-
                                  {
                                    closestReservation?.selectedSlot
                                      ?.currentYear
                                  }{" "}
                                  ora {closestReservation?.selectedSlot?.slot}
                                </p>
                              </div>
                              <div className="card-btns">
                                {/* <Link
                                href="/patient/patient-chat"
                                className="btn btn-gray"
                              >
                                <i className="fa-solid fa-comment-dots" />
                                Chat Now
                              </Link> */}
                                <Link
                                  href={`/meeting?meetingCode=${closestReservation?.meetingCode}__${closestReservation?.documentId}`}
                                  className="btn btn-outline-primary"
                                >
                                  <i className="fa-solid fa-calendar-check" />
                                  Începe consultul
                                </Link>
                              </div>
                            </div>
                            {/* <div className="appointment-dash-card">
                            <div className="doctor-fav-list">
                              <div className="doctor-info-profile">
                                <Link href="#" className="table-avatar">
                                  <img src={doctor_17} alt="Img" />
                                </Link>
                                <div className="doctor-name-info">
                                  <h5>
                                    <Link href="#">Dr.Juliet Gabriel</Link>
                                  </h5>
                                  <span>Cardiologist</span>
                                </div>
                              </div>
                              <Link href="#" className="cal-plus-icon">
                                <i className="fa-solid fa-video" />
                              </Link>
                            </div>
                            <div className="date-time">
                              <p>
                                <i className="fa-solid fa-clock" />
                                22 Mar 2024 - 10:30 PM
                              </p>
                            </div>
                            <div className="card-btns">
                              <Link
                                href="/patient/patient-chat"
                                className="btn btn-gray"
                              >
                                <i className="fa-solid fa-comment-dots" />
                                Chat Now
                              </Link>
                              <Link
                                href="/patient/patient-appointments"
                                className="btn btn-outline-primary"
                              >
                                <i className="fa-solid fa-calendar-check" />
                                Attend
                              </Link>
                            </div>
                          </div> */}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      )}
                    </div>
                    {/* <div className="dashboard-card w-100">
                      <div className="dashboard-card-head">
                        <div className="header-title">
                          <h5>Notifications</h5>
                        </div>
                        <div className="card-view-link">
                          <Link href="#">View All</Link>
                        </div>
                      </div>
                      <div className="dashboard-card-body">
                        <div className="table-responsive">
                          <table className="table dashboard-table">
                            <tbody>
                              <tr>
                                <td>
                                  <div className="table-noti-info">
                                    <div className="table-noti-icon color-violet">
                                      <i className="fa-solid fa-bell" />
                                    </div>
                                    <div className="table-noti-message">
                                      <h6>
                                        <Link href="#">
                                          Booking Confirmed on{" "}
                                          <span> 21 Mar 2024 </span> 10:30 AM
                                        </Link>
                                      </h6>
                                      <span className="message-time">
                                        Just Now
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="table-noti-info">
                                    <div className="table-noti-icon color-blue">
                                      <i className="fa-solid fa-star" />
                                    </div>
                                    <div className="table-noti-message">
                                      <h6>
                                        <Link href="#">
                                          You have a <span> New </span> Review
                                          for your Appointment{" "}
                                        </Link>
                                      </h6>
                                      <span className="message-time">
                                        5 Days ago
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="table-noti-info">
                                    <div className="table-noti-icon color-red">
                                      <i className="fa-solid fa-calendar-check" />
                                    </div>
                                    <div className="table-noti-message">
                                      <h6>
                                        <Link href="#">
                                          You have Appointment with{" "}
                                          <span> Ahmed </span> by 01:20 PM{" "}
                                        </Link>
                                      </h6>
                                      <span className="message-time">
                                        12:55 PM
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="table-noti-info">
                                    <div className="table-noti-icon color-yellow">
                                      <i className="fa-solid fa-money-bill-1-wave" />
                                    </div>
                                    <div className="table-noti-message">
                                      <h6>
                                        <Link href="#">
                                          Sent an amount of <span> $200 </span>{" "}
                                          for an Appointment by 01:20 PM{" "}
                                        </Link>
                                      </h6>
                                      <span className="message-time">
                                        2 Days ago
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="table-noti-info">
                                    <div className="table-noti-icon color-blue">
                                      <i className="fa-solid fa-star" />
                                    </div>
                                    <div className="table-noti-message">
                                      <h6>
                                        <Link href="#">
                                          You have a <span> New </span> Review
                                          for your Appointment{" "}
                                        </Link>
                                      </h6>
                                      <span className="message-time">
                                        5 Days ago
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </div>
                <div className="col-xl-4 d-flex">
                  <div className="favourites-dashboard w-100">
                    <div className="book-appointment-head">
                      <h3>
                        Fa o noua <span>REZERVARE</span>
                      </h3>
                      <span className="add-icon">
                        <Link href="/calendar">
                          <i className="fa-solid fa-circle-plus" />
                        </Link>
                      </span>
                    </div>
                    {/* <div className="dashboard-card w-100">
                      <div className="dashboard-card-head">
                        <div className="header-title">
                          <h5>Favourites</h5>
                        </div>
                        <div className="card-view-link">
                          <Link href="/patient/favourites">View All</Link>
                        </div>
                      </div>
                      <div className="dashboard-card-body">
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <Link href="#" className="table-avatar">
                              <img src={doctorprofileimg} alt="Img" />
                            </Link>
                            <div className="doctor-name-info">
                              <h5>
                                <Link href="#">Dr. Edalin</Link>
                              </h5>
                              <span>Endodontists</span>
                            </div>
                          </div>
                          <Link href="#" className="cal-plus-icon">
                            <i className="fa-solid fa-calendar-plus" />
                          </Link>
                        </div>
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <Link href="#" className="table-avatar">
                              <img src={doctorthumb11} alt="Img" />
                            </Link>
                            <div className="doctor-name-info">
                              <h5>
                                <Link href="#">Dr. Maloney</Link>
                              </h5>
                              <span>Cardiologist</span>
                            </div>
                          </div>
                          <Link href="#" className="cal-plus-icon">
                            <i className="fa-solid fa-calendar-plus" />
                          </Link>
                        </div>
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <Link href="#" className="table-avatar">
                              <img src={doctor_14} alt="Img" />
                            </Link>
                            <div className="doctor-name-info">
                              <h5>
                                <Link href="#">Dr. Wayne&nbsp;</Link>
                              </h5>
                              <span>Dental Specialist</span>
                            </div>
                          </div>
                          <Link href="#" className="cal-plus-icon">
                            <i className="fa-solid fa-calendar-plus" />
                          </Link>
                        </div>
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <Link href="#" className="table-avatar">
                              <img src={doctor_15} alt="Img" />
                            </Link>
                            <div className="doctor-name-info">
                              <h5>
                                <Link href="#">Dr. Marla</Link>
                              </h5>
                              <span>Endodontists</span>
                            </div>
                          </div>
                          <Link href="#" className="cal-plus-icon">
                            <i className="fa-solid fa-calendar-plus" />
                          </Link>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </div>

                <div className="col-xl-8 d-flex">
                  <div className="dashboard-main-col w-100">
                    {/* <div className="dashboard-card w-100">
                      <div className="dashboard-card-head">
                        <div className="header-title">
                          <h5>Analytics</h5>
                        </div>
                        <div className="dropdown-links d-flex align-items-center flex-wrap">
                          <div className="dropdown header-dropdown">
                            <Link
                              className="dropdown-toggle"
                              data-bs-toggle="dropdown"
                              href="#"
                            >
                              <img
                                src={doctordashboardprofile06}
                                className="avatar dropdown-avatar"
                                alt="Img"
                              />
                              Hendrita
                            </Link>
                            <div className="dropdown-menu dropdown-menu-end">
                              <Link href="#" className="dropdown-item">
                                <img
                                  src={doctordashboardprofile06}
                                  className="avatar dropdown-avatar"
                                  alt="Img"
                                />
                                Hendrita
                              </Link>
                              <Link href="#" className="dropdown-item">
                                <img
                                  src={doctordashboardprofile08}
                                  className="avatar dropdown-avatar"
                                  alt="Img"
                                />
                                Laura
                              </Link>
                              <Link href="#" className="dropdown-item">
                                <img
                                  src={doctordashboardprofile07}
                                  className="avatar dropdown-avatar"
                                  alt="Img"
                                />
                                Mathew
                              </Link>
                            </div>
                          </div>
                          <div className="dropdown header-dropdown header-dropdown-two">
                            <Link
                              className="dropdown-toggle border-0"
                              data-bs-toggle="dropdown"
                              href="#"
                            >
                              This Week
                            </Link>
                            <div className="dropdown-menu dropdown-menu-end">
                              <Link href="#" className="dropdown-item">
                                This Week
                              </Link>
                              <Link href="#" className="dropdown-item">
                                This Month
                              </Link>
                              <Link href="#" className="dropdown-item">
                                This Year
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="dashboard-card-body">
                        <div className="chart-tabs patient-dash-tab">
                          <ul className="nav" role="tablist">
                            <li className="nav-item" role="presentation">
                              <Link
                                className="nav-link active"
                                href="#"
                                data-bs-toggle="tab"
                                data-bs-target="#heart-rate"
                                aria-selected="false"
                                role="tab"
                                tabIndex={-1}
                              >
                                Heart Rate
                              </Link>
                            </li>
                            <li className="nav-item" role="presentation">
                              <Link
                                className="nav-link "
                                href="#"
                                data-bs-toggle="tab"
                                data-bs-target="#blood-pressure"
                                aria-selected="true"
                                role="tab"
                              >
                                Blood Pressure
                              </Link>
                            </li>
                          </ul>
                        </div>
                        <div className="tab-content pt-0">
                      
                          <div
                            className="tab-pane fade active show"
                            id="heart-rate"
                            role="tabpanel"
                          >
                            <div ref={chartRef} id="heart-rate-chart" />
                          </div>
                       
                          <div
                            className="tab-pane fade"
                            id="blood-pressure"
                            role="tabpanel"
                          >
                            <div
                              id="blood-pressure-chart"
                              ref={chartContainerRef}
                            >
                              {options1 && (
                                <Chart
                                  options={options1}
                                  series={options1.series}
                                  type="bar"
                                  height={350}
                                />
                              )}
                            </div>
                          </div>
                   
                        </div>
                      </div>
                    </div> */}
                    {/* <div className="dashboard-card w-100">
                      <div className="dashboard-card-head">
                        <div className="header-title">
                          <h5>Rezervari trecut</h5>
                        </div>

                        <div className="card-view-link">
                          <div className="owl-nav slide-nav2 text-end nav-control" />
                        </div>
                      </div>

                      <div className="dashboard-card-body">
                        <div className="past-appointments-slider">
                          <div className="appointment-dash-card past-appointment">
                            <div className="appointment-date-info">
                              <h4>12 09 2024</h4>
                              <ul>
                                <li>
                                  <span>
                                    <i className="fa-solid fa-clock" />
                                  </span>
                                  Ora : 14:00
                                </li>
                              </ul>
                            </div>
                            <div className="doctor-fav-list">
                              <div className="doctor-info-profile">
                                <Link href="#" className="table-avatar">
                                  <img src={"/img/profilecristina.png"} alt="Img" />
                                </Link>
                                <div className="doctor-name-info">
                                  <h5>
                                    <Link href="#">Cristina Zurba</Link>
                                  </h5>
                                  <span>Tip Consultatie</span>
                                </div>
                              </div>
                            </div>
                            <div className="card-btns">
                              <Link
                                href="/patient/booking1"
                                className="btn btn-outline-primary ms-0 me-3"
                              >
                                Rezerva din nou
                              </Link>
                              <Link
                                  href="patient-appointment-details.html"
                                  className="btn btn-primary prime-btn"
                                >
                                  Vezi detalii
                                </Link>
                            </div>
                          </div>
                          <div className="appointment-dash-card past-appointment">
                              <div className="appointment-date-info">
                                <h4>Friday, Mar 2024</h4>
                                <ul>
                                  <li>
                                    <span>
                                      <i className="fa-solid fa-clock" />
                                    </span>
                                    Time : 03:00 PM - 03:30 PM (30 Min)
                                  </li>
                                  <li>
                                    <span>
                                      <i className="fa-solid fa-location-dot" />
                                    </span>
                                    Newyork, United States
                                  </li>
                                </ul>
                              </div>
                              <div className="doctor-fav-list">
                                <div className="doctor-info-profile">
                                  <Link href="#" className="table-avatar">
                                    <img src={doctor_17} alt="Img" />
                                  </Link>
                                  <div className="doctor-name-info">
                                    <h5>
                                      <Link href="#">Dr.Juliet Gabriel</Link>
                                    </h5>
                                    <span>Cardiologist</span>
                                  </div>
                                </div>
                              </div>
                              <div className="card-btns">
                                <Link
                                  href="patient-appointments.html"
                                  className="btn btn-outline-primary ms-0 me-3"
                                >
                                  Reschedule
                                </Link>
                                <Link
                                  href="medical-details.html"
                                  className="btn btn-primary prime-btn"
                                >
                                  View Details
                                </Link>
                              </div>
                            </div>
                        </div>
                      </div>
                    </div> */}
                    {/* <div className="dashboard-card w-100">
                      <div className="dashboard-card-head">
                        <div className="header-title">
                          <h5>Dependant</h5>
                        </div>
                        <div className="card-view-link">
                          <Link
                            href="#"
                            className="add-new"
                            data-bs-toggle="modal"
                            data-bs-target="#add_dependent"
                          >
                            <i className="fa-solid fa-circle-plus me-2" />
                            Add New
                          </Link>
                          <Link href="dependent.html">View All</Link>
                        </div>
                      </div>
                      <div className="dashboard-card-body">
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <Link href="#" className="table-avatar">
                              <img src={patient20} alt="Img" />
                            </Link>
                            <div className="doctor-name-info">
                              <h5>
                                <Link href="#">Laura</Link>
                              </h5>
                              <span>Mother - 58 years 20 days</span>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <Link href="#" className="cal-plus-icon me-2">
                              <i className="fa-solid fa-calendar-plus" />
                            </Link>
                            <Link href="dependent.html" className="cal-plus-icon">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </div>
                        </div>
                        <div className="doctor-fav-list">
                          <div className="doctor-info-profile">
                            <Link href="#" className="table-avatar">
                              <img src={patient21} alt="Img" />
                            </Link>
                            <div className="doctor-name-info">
                              <h5>
                                <Link href="#">Mathew</Link>
                              </h5>
                              <span>Father - 59 years 15 days</span>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <Link href="#" className="cal-plus-icon me-2">
                              <i className="fa-solid fa-calendar-plus" />
                            </Link>
                            <Link href="dependent.html" className="cal-plus-icon">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </div>
                {/* <div className="col-xl-12 d-flex">
                  <div className="dashboard-card w-100">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5>Reports</h5>
                      </div>
                      <div className="dropdown header-dropdown">
                        <Link
                          className="dropdown-toggle"
                          data-bs-toggle="dropdown"
                          href="#"
                        >
                          <img
                            src={doctordashboardprofile06}
                            className="avatar dropdown-avatar"
                            alt="Img"
                          />
                          Hendrita
                        </Link>
                        <div className="dropdown-menu dropdown-menu-end">
                          <Link href="#" className="dropdown-item">
                            <img
                              src={doctordashboardprofile06}
                              className="avatar dropdown-avatar"
                              alt="Img"
                            />
                            Hendrita
                          </Link>
                          <Link href="#" className="dropdown-item">
                            <img
                              src={doctordashboardprofile08}
                              className="avatar dropdown-avatar"
                              alt="Img"
                            />
                            Laura
                          </Link>
                          <Link href="#" className="dropdown-item">
                            <img
                              src={doctordashboardprofile07}
                              className="avatar dropdown-avatar"
                              alt="Img"
                            />
                            Mathew
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      <div className="account-detail-table">
                        <nav className="patient-dash-tab border-0 pb-0 mb-3 mt-3">
                          <ul className="nav nav-tabs-bottom">
                            <li className="nav-item">
                              <Link
                                className="nav-link active"
                                href="#appoint-tab"
                                data-bs-toggle="tab"
                              >
                                Appointments
                              </Link>
                            </li>
                            <li className="nav-item">
                              <Link
                                className="nav-link"
                                href="#medical-tab"
                                data-bs-toggle="tab"
                              >
                                Medical Records
                              </Link>
                            </li>
                            <li className="nav-item">
                              <Link
                                className="nav-link"
                                href="#prsc-tab"
                                data-bs-toggle="tab"
                              >
                                Prescriptions
                              </Link>
                            </li>
                            <li className="nav-item">
                              <Link
                                className="nav-link"
                                href="#invoice-tab"
                                data-bs-toggle="tab"
                              >
                                Invoices
                              </Link>
                            </li>
                          </ul>
                        </nav>

                        <div className="tab-content pt-0">
                          <div
                            id="appoint-tab"
                            className="tab-pane fade show active"
                          >
                            <div className="custom-new-table">
                              <div className="table-responsive">
                                <table className="table table-hover table-center mb-0">
                                  <thead>
                                    <tr>
                                      <th>ID</th>
                                      <th>Test Name</th>
                                      <th>Date</th>
                                      <th>Referred By</th>
                                      <th>Amount</th>
                                      <th>Comments</th>
                                      <th>Status</th>
                                      <th />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td>
                                        <Link href="#">
                                          <span className="text-blue">
                                            RE124343
                                          </span>
                                        </Link>
                                      </td>
                                      <td>Electro cardiography</td>
                                      <td>21 Mar 2024</td>
                                      <td>Edalin Hendry</td>
                                      <td>$300</td>
                                      <td>Good take rest</td>
                                      <td>
                                        <span className="badge badge-success-bg">
                                          Normal
                                        </span>
                                      </td>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <Link
                                            href="#"
                                            className="account-action me-2"
                                          >
                                            <i className="fa-solid fa-prescription" />
                                          </Link>
                                          <Link
                                            href="#"
                                            className="account-action"
                                          >
                                            <i className="fa-solid fa-file-invoice-dollar" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <Link href="#">
                                          <span className="text-blue">
                                            RE124342
                                          </span>
                                        </Link>
                                      </td>
                                      <td>Complete Blood Count</td>
                                      <td>28 Mar 2024</td>
                                      <td>Shanta Nesmith</td>
                                      <td>$400</td>
                                      <td>Stable, no change</td>
                                      <td>
                                        <span className="badge badge-success-bg">
                                          Normal
                                        </span>
                                      </td>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <Link
                                            href="#"
                                            className="account-action me-2"
                                          >
                                            <i className="fa-solid fa-prescription" />
                                          </Link>
                                          <Link
                                            href="#"
                                            className="account-action"
                                          >
                                            <i className="fa-solid fa-file-invoice-dollar" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <Link href="#">
                                          <span className="text-blue">
                                            RE124341
                                          </span>
                                        </Link>
                                      </td>
                                      <td>Blood Glucose Test</td>
                                      <td>02 Apr 2024</td>
                                      <td>John Ewel</td>
                                      <td>$350</td>
                                      <td>All Clear</td>
                                      <td>
                                        <span className="badge badge-success-bg">
                                          Normal
                                        </span>
                                      </td>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <Link
                                            href="#"
                                            className="account-action me-2"
                                          >
                                            <i className="fa-solid fa-prescription" />
                                          </Link>
                                          <Link
                                            href="#"
                                            className="account-action"
                                          >
                                            <i className="fa-solid fa-file-invoice-dollar" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <Link href="#">
                                          <span className="text-blue">
                                            RE124340
                                          </span>
                                        </Link>
                                      </td>
                                      <td>Liver Function Tests</td>
                                      <td>15 Apr 2024</td>
                                      <td>Joseph Engels</td>
                                      <td>$480</td>
                                      <td>Stable, no change</td>
                                      <td>
                                        <span className="badge badge-success-bg">
                                          Normal
                                        </span>
                                      </td>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <Link
                                            href="#"
                                            className="account-action me-2"
                                          >
                                            <i className="fa-solid fa-prescription" />
                                          </Link>
                                          <Link
                                            href="#"
                                            className="account-action"
                                          >
                                            <i className="fa-solid fa-file-invoice-dollar" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <Link href="#">
                                          <span className="text-blue">
                                            RE124339
                                          </span>
                                        </Link>
                                      </td>
                                      <td>Lipid Profile</td>
                                      <td>27 Apr 2024</td>
                                      <td>Victoria Selzer</td>
                                      <td>$250</td>
                                      <td>Good take rest</td>
                                      <td>
                                        <span className="badge badge-success-bg">
                                          Normal
                                        </span>
                                      </td>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <Link
                                            href="#"
                                            className="account-action me-2"
                                          >
                                            <i className="fa-solid fa-prescription" />
                                          </Link>
                                          <Link
                                            href="#"
                                            className="account-action"
                                          >
                                            <i className="fa-solid fa-file-invoice-dollar" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <Link href="#">
                                          <span className="text-blue">
                                            RE124338
                                          </span>
                                        </Link>
                                      </td>
                                      <td>Blood Cultures</td>
                                      <td>10 May 2024</td>
                                      <td>Juliet Gabriel</td>
                                      <td>$320</td>
                                      <td>Good take rest</td>
                                      <td>
                                        <span className="badge badge-success-bg">
                                          Normal
                                        </span>
                                      </td>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <Link
                                            href="#"
                                            className="account-action me-2"
                                          >
                                            <i className="fa-solid fa-prescription" />
                                          </Link>
                                          <Link
                                            href="#"
                                            className="account-action"
                                          >
                                            <i className="fa-solid fa-file-invoice-dollar" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          <div className="tab-pane fade" id="medical-tab">
                            <div className="custom-table">
                              <div className="table-responsive">
                                <table className="table table-center mb-0">
                                  <thead>
                                    <tr>
                                      <th>ID</th>
                                      <th>Name</th>
                                      <th>Date</th>
                                      <th>Description</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link href="#">#MR-123</Link>
                                      </td>
                                      <td>
                                        <Link href="#" className="lab-icon">
                                          <span>
                                            <i className="fa-solid fa-paperclip" />
                                          </span>
                                          Lab Report
                                        </Link>
                                      </td>
                                      <td>24 Mar 2024</td>
                                      <td>Glucose Test V12</td>
                                      <td>
                                        <div className="action-item">
                                          <Link href="#">
                                            <i className="fa-solid fa-pen-to-square" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link href="#">#MR-124</Link>
                                      </td>
                                      <td>
                                        <Link href="#" className="lab-icon">
                                          <span>
                                            <i className="fa-solid fa-paperclip" />
                                          </span>
                                          Lab Report
                                        </Link>
                                      </td>
                                      <td>27 Mar 2024</td>
                                      <td>Complete Blood Count(CBC)</td>
                                      <td>
                                        <div className="action-item">
                                          <Link href="#">
                                            <i className="fa-solid fa-pen-to-square" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link href="#">#MR-125</Link>
                                      </td>
                                      <td>
                                        <Link href="#" className="lab-icon">
                                          <span>
                                            <i className="fa-solid fa-paperclip" />
                                          </span>
                                          Lab Report
                                        </Link>
                                      </td>
                                      <td>10 Apr 2024</td>
                                      <td>Echocardiogram</td>
                                      <td>
                                        <div className="action-item">
                                          <Link href="#">
                                            <i className="fa-solid fa-pen-to-square" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link href="#">#MR-126</Link>
                                      </td>
                                      <td>
                                        <Link href="#" className="lab-icon">
                                          <span>
                                            <i className="fa-solid fa-paperclip" />
                                          </span>
                                          Lab Report
                                        </Link>
                                      </td>
                                      <td>19 Apr 2024</td>
                                      <td>COVID-19 Test</td>
                                      <td>
                                        <div className="action-item">
                                          <Link href="#">
                                            <i className="fa-solid fa-pen-to-square" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link href="#">#MR-127</Link>
                                      </td>
                                      <td>
                                        <Link href="#" className="lab-icon">
                                          <span>
                                            <i className="fa-solid fa-paperclip" />
                                          </span>
                                          Lab Report
                                        </Link>
                                      </td>
                                      <td>27 Apr 2024</td>
                                      <td>Allergy Tests</td>
                                      <td>
                                        <div className="action-item">
                                          <Link href="#">
                                            <i className="fa-solid fa-pen-to-square" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link href="#">#MR-128</Link>
                                      </td>
                                      <td>
                                        <Link href="#" className="lab-icon">
                                          <span>
                                            <i className="fa-solid fa-paperclip" />
                                          </span>
                                          Lab Report
                                        </Link>
                                      </td>
                                      <td>02 May 2024</td>
                                      <td>Lipid Panel </td>
                                      <td>
                                        <div className="action-item">
                                          <Link href="#">
                                            <i className="fa-solid fa-pen-to-square" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          <div className="tab-pane fade" id="prsc-tab">
                            <div className="custom-table">
                              <div className="table-responsive">
                                <table className="table table-center mb-0">
                                  <thead>
                                    <tr>
                                      <th>ID</th>
                                      <th>Name</th>
                                      <th>Created Date</th>
                                      <th>Prescriped By</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#view_prescription"
                                        >
                                          #PR-123
                                        </Link>
                                      </td>
                                      <td>
                                        <Link
                                          href="#"
                                          className="lab-icon prescription"
                                        >
                                          <span>
                                            <i className="fa-solid fa-prescription" />
                                          </span>
                                          Prescription
                                        </Link>
                                      </td>
                                      <td>24 Mar 2024, 10:30 AM</td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctorthumb02}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Edalin Hendry
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#view_prescription"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#view_prescription"
                                        >
                                          #PR-124
                                        </Link>
                                      </td>
                                      <td>
                                        <Link
                                          href="#"
                                          className="lab-icon prescription"
                                        >
                                          <span>
                                            <i className="fa-solid fa-prescription" />
                                          </span>
                                          Prescription
                                        </Link>
                                      </td>
                                      <td>27 Mar 2024, 11:15 AM</td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_05}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            John Homes
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#view_prescription"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#view_prescription"
                                        >
                                          #PR-125
                                        </Link>
                                      </td>
                                      <td>
                                        <Link
                                          href="#"
                                          className="lab-icon prescription"
                                        >
                                          <span>
                                            <i className="fa-solid fa-prescription" />
                                          </span>
                                          Prescription
                                        </Link>
                                      </td>
                                      <td>11 Apr 2024, 09:00 AM</td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_03}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Shanta Neill
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#view_prescription"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#view_prescription"
                                        >
                                          #PR-126
                                        </Link>
                                      </td>
                                      <td>
                                        <Link
                                          href="#"
                                          className="lab-icon prescription"
                                        >
                                          <span>
                                            <i className="fa-solid fa-prescription" />
                                          </span>
                                          Prescription
                                        </Link>
                                      </td>
                                      <td>15 Apr 2024, 02:30 PM</td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_08}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Anthony Tran
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#view_prescription"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#view_prescription"
                                        >
                                          #PR-127
                                        </Link>
                                      </td>
                                      <td>
                                        <Link
                                          href="#"
                                          className="lab-icon prescription"
                                        >
                                          <span>
                                            <i className="fa-solid fa-prescription" />
                                          </span>
                                          Prescription
                                        </Link>
                                      </td>
                                      <td>23 Apr 2024, 06:40 PM</td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_01}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Susan Lingo
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#view_prescription"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-download" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-trash-can" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          <div className="tab-pane fade" id="invoice-tab">
                            <div className="custom-table">
                              <div className="table-responsive">
                                <table className="table table-center mb-0">
                                  <thead>
                                    <tr>
                                      <th>ID</th>
                                      <th>Doctor</th>
                                      <th>Appointment Date</th>
                                      <th>Booked on</th>
                                      <th>Amount</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#invoice_view"
                                        >
                                          #Inv-2021
                                        </Link>
                                      </td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_21}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Edalin Hendry
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>24 Mar 2024</td>
                                      <td>21 Mar 2024</td>
                                      <td>$300</td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#invoice_view"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-print" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#invoice_view"
                                        >
                                          #Inv-2021
                                        </Link>
                                      </td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_13}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            John Homes
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>17 Mar 2024</td>
                                      <td>14 Mar 2024</td>
                                      <td>$450</td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#invoice_view"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-print" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#invoice_view"
                                        >
                                          #Inv-2021
                                        </Link>
                                      </td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_03}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Shanta Neill
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>11 Mar 2024</td>
                                      <td>07 Mar 2024</td>
                                      <td>$250</td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#invoice_view"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-print" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#invoice_view"
                                        >
                                          #Inv-2021
                                        </Link>
                                      </td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_08}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Anthony Tran
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>26 Feb 2024</td>
                                      <td>23 Feb 2024</td>
                                      <td>$320</td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#invoice_view"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-print" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#invoice_view"
                                        >
                                          #Inv-2021
                                        </Link>
                                      </td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_01}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Susan Lingo
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>18 Feb 2024</td>
                                      <td>15 Feb 2024</td>
                                      <td>$480</td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#invoice_view"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-print" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#invoice_view"
                                        >
                                          #Inv-2021
                                        </Link>
                                      </td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_09}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Joseph Boyd
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>10 Feb 2024</td>
                                      <td>07 Feb 2024</td>
                                      <td>$260</td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#invoice_view"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-print" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-blue-600">
                                        <Link
                                          href="#"
                                          data-bs-toggle="modal"
                                          data-bs-target="#invoice_view"
                                        >
                                          #Inv-2021
                                        </Link>
                                      </td>
                                      <td>
                                        <h2 className="table-avatar">
                                          <Link
                                            href="/patient/doctor-profile"
                                            className="avatar avatar-sm me-2"
                                          >
                                            <img
                                              className="avatar-img rounded-3"
                                              src={doctor_thumb_07}
                                              alt="User Image"
                                            />
                                          </Link>
                                          <Link href="/patient/doctor-profile">
                                            Juliet Gabriel
                                          </Link>
                                        </h2>
                                      </td>
                                      <td>28 Jan 2024</td>
                                      <td>25 Jan 2024</td>
                                      <td>$350</td>
                                      <td>
                                        <div className="action-item">
                                          <Link
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#invoice_view"
                                          >
                                            <i className="fa-solid fa-link" />
                                          </Link>
                                          <Link href="#">
                                            <i className="fa-solid fa-print" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Content */}
      <Footer {...props} />
    </>
  );
};

export default ContClient;
