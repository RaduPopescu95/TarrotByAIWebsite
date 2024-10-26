/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DashboardSidebar } from "./sidebar/sidebar.jsx";
import CristinaImage from "../../../assets/images/doctors-dashboard/profilecristina.png";

import DoctorFooter from "../../common/doctorFooter/index.jsx";

import dynamic from "next/dynamic";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";
// import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Home1Header from "../../home/home-1/header.jsx";
import Footer from "../../footer.jsx";
import { useAuth } from "../../../../context/AuthContext.js";
import { handleQueryFirestore } from "../../../../utils/firestoreUtils.js";
import { formatSelectedSlot } from "../../../../utils/commonUtils.js";
const isBrowser = typeof window !== "undefined";

const OwlCarousel = dynamic(() => import("react-owl-carousel"), { ssr: false });
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ContClient = (props) => {
  const TextContent = () => <p>Last Visit 25 Mar 2024</p>;
  const { setCurrentUser, currentUser, userData, setUserData } = useAuth();
  const [closestReservation, setClosestReservation] = useState({});
  const [loading, setLoading] = useState({});
  const [rezervariSaptAsta, setRezervariSaptAsta] = useState([]);

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
    setLoading(true);
    try {
      const data = await handleQueryFirestore(
        "RezervariConsultatii",
        "owner_uid",
        userData?.owner_uid
      );
      const reservations = data
        .map((reservation) => {
          const { selectedSlot } = reservation;
          if (
            !selectedSlot ||
            !selectedSlot.day ||
            !selectedSlot.slot ||
            !selectedSlot.currentYear
          )
            return null;

          const [month, day] = selectedSlot.day.split("-").map(Number);
          const adjustedDay = day;
          const reservationDate = new Date(
            selectedSlot.currentYear,
            month,
            adjustedDay,
            ...selectedSlot.slot.split(":").map(Number)
          );

          return { ...reservation, reservationDate };
        })
        .filter((res) => res !== null);

      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);

      const rezervariSaptAsta = reservations
        .filter((res) => {
          return (
            res.reservationDate >= now && res.reservationDate <= weekFromNow
          );
        })
        .sort((a, b) => a.reservationDate - b.reservationDate);

      setRezervariSaptAsta(rezervariSaptAsta);
      setClosestReservation(rezervariSaptAsta[0] || null);
    } catch (error) {
      console.error("Error getting user reservations:", error);
    } finally {
      setLoading(false);
    }
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
                    <Link href="/consultatii">Consultatii</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    {userData?.first_name.length > 0 && userData?.first_name}{" "}
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
                      {!loading && closestReservation?.owner_uid ? (
                        <div cl assName="dashboard-card-body">
                          <div className="apponiment-dates">
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
                                  {formatSelectedSlot(
                                    closestReservation?.selectedSlot?.day
                                  )}{" "}
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
                          </div>
                        </div>
                      ) : loading ? (
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      ) : (
                        <h4>Nu aveti rezervari efectuate!</h4>
                      )}
                    </div>
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
                  </div>
                </div>

                <div className="col-xl-8 d-flex">
                  <div className="dashboard-card w-100">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5>Rezervari Saptamana asta</h5>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      <div className="table-responsive">
                        {rezervariSaptAsta.length != 0 ? (
                          <table className="table dashboard-table">
                            <tbody>
                              {rezervariSaptAsta.map((r, i) => (
                                <tr>
                                  <td>
                                    <div className="patient-info-profile">
                                      <Link
                                        href="#"
                                        className="table-avatar"
                                        onClick={(e) => e.preventDefault}
                                      >
                                        <img
                                          src={"/img/profilecristina.png"}
                                          alt="Img"
                                        />
                                      </Link>
                                      <div className="patient-name-info">
                                        {/* <span>#Rez{r.documentId}</span> */}
                                        <h5>
                                          <Link href="#">Cristina Zurba</Link>
                                        </h5>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="appointment-date-created">
                                      <h6>
                                        {formatSelectedSlot(
                                          r?.selectedSlot?.day
                                        )}
                                        , ora {r?.selectedSlot?.slot}
                                      </h6>
                                      <span className="badge table-badge">
                                        {r.tipConsultatie}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="appointment-date-created">
                                      <Link
                                        href={`/meeting?meetingCode=${r?.meetingCode}__${r?.documentId}`}
                                        className="btn"
                                        style={{
                                          backgroundColor: "#0e82fd",
                                          color: "white",
                                        }}
                                      >
                                        Începe consultatia
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p>Nu aveti rezervari saptamana aceasta</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-8 d-flex">
                  <div className="dashboard-main-col w-100"></div>
                </div>
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
