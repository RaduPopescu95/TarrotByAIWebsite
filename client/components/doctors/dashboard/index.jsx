/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-keys */
import React, { useEffect, useRef, useState } from "react";
import DoctorSidebar from "../sidebar";

import {
  doctordashboardclient01,
  doctordashboardclient02,
  doctordashboardprofile01,
  doctordashboardprofile02,
  doctordashboardprofile04,
  doctordashboardprofile05,
  doctordashboardprofile3,
} from "../../imagepath";

import DoctorFooter from "../../common/doctorFooter";

import Link from "next/link";
import Home1Header from "../../home/home-1/header";
import Footer from "../../footer";
import { handleGetFirestore } from "../../../../utils/firestoreUtils";
import moment from "moment";
import { useAuth } from "../../../../context/AuthContext";
import { formatSelectedSlot } from "../../../../utils/commonUtils";
const DoctorDashboard = (props) => {
  const [rezervariTotal, setRezervari] = useState([]);
  const [rezervariSapt, setRezervariSapt] = useState([]);
  const [rezervariZilnic, setRezervariZilnic] = useState([]);
  const [numberOfUniqueClientsSum, setNumberOfUniqueClientsSum] = useState([]);
  const [nextReservation, setNextReservation] = useState(null);
  
  // Statistici pentru conferințele de grup
  const [conferinteGrup, setConferinteGrup] = useState([]);
  const [conferinteGrupAzi, setConferinteGrupAzi] = useState([]);
  const [conferinteGrupSaptamana, setConferinteGrupSaptamana] = useState([]);
  const [totalParticipantiGrup, setTotalParticipantiGrup] = useState(0);
  const [nextConferenceGrup, setNextConferenceGrup] = useState(null);
  
  const { loading } = useAuth();

  const handleGetUserReservations = async () => {
    // Fetch the reservations data from Firestore
    const data = await handleGetFirestore("RezervariConsultatii");
    console.log("rezervari....data...", data);

    // Crearea array-urilor separate pentru rezervările din ziua curentă și săptămâna curentă
    const todayReservations = [];
    const weekReservations = [];

    // Data curentă
    const currentDate = moment();

    // Crearea unui Set pentru a reține identificatorii unici (uid sau telefon)
    const uniqueClients = new Set();

    // Iterează prin fiecare rezervare
    data.forEach((reservation) => {
      const { selectedSlot, owner_uid, telefon } = reservation;

      // Creează un obiect moment pentru data și ora rezervării
      const reservationDate = moment(
        `${selectedSlot?.currentYear}-${
          parseInt(selectedSlot?.day?.split("-")[0]) + 1
        }-${selectedSlot?.day?.split("-")[1]} ${selectedSlot?.slot}`,
        "YYYY-MM-DD HH:mm"
      );

      // Verifică dacă rezervarea este pentru ziua curentă
      if (reservationDate.isSame(currentDate, "day")) {
        todayReservations.push(reservation);
      }

      // Verifică dacă rezervarea este pentru săptămâna curentă
      if (reservationDate.isSame(currentDate, "week")) {
        weekReservations.push(reservation);
      }

      // Adăugăm clientul în set-ul de identificatori unici
      if (owner_uid) {
        uniqueClients.add(owner_uid);
      } else if (telefon) {
        uniqueClients.add(telefon);
      }
    });

    // Sortează rezervările din ziua curentă și săptămâna curentă după timp
    todayReservations.sort((a, b) => {
      const timeA = moment(
        `${a.selectedSlot?.currentYear}-${
          parseInt(a.selectedSlot?.day?.split("-")[0]) + 1
        }-${a.selectedSlot?.day?.split("-")[1]} ${a.selectedSlot?.slot}`,
        "YYYY-MM-DD HH:mm"
      );
      const timeB = moment(
        `${b.selectedSlot?.currentYear}-${
          parseInt(b.selectedSlot?.day?.split("-")[0]) + 1
        }-${b.selectedSlot?.day?.split("-")[1]} ${b.selectedSlot?.slot}`,
        "YYYY-MM-DD HH:mm"
      );
      return timeA - timeB;
    });

    weekReservations.sort((a, b) => {
      const timeA = moment(
        `${a.selectedSlot?.currentYear}-${
          parseInt(a.selectedSlot?.day?.split("-")[0]) + 1
        }-${a.selectedSlot?.day?.split("-")[1]} ${a.selectedSlot?.slot}`,
        "YYYY-MM-DD HH:mm"
      );
      const timeB = moment(
        `${b.selectedSlot?.currentYear}-${
          parseInt(b.selectedSlot?.day?.split("-")[0]) + 1
        }-${b.selectedSlot?.day?.split("-")[1]} ${b.selectedSlot?.slot}`,
        "YYYY-MM-DD HH:mm"
      );
      return timeA - timeB;
    });

    // Setarea rezervărilor filtrate și sortate în state-uri separate sau returnarea lor, după caz
    console.log("Rezervari azi:", todayReservations);
    console.log("Rezervari saptamana:", weekReservations);

    setRezervariZilnic(todayReservations);
    setRezervariSapt(weekReservations);

    // Determină numărul de clienți unici
    const numberOfUniqueClients = uniqueClients.size;
    console.log("Numărul de clienți unici:", numberOfUniqueClients);
    setNumberOfUniqueClientsSum(numberOfUniqueClients);

    // Setarea numărului de clienți unici în state (dacă este necesar)
    // setNumberOfUniqueClients(numberOfUniqueClients);
  };

  // Funție pentru a găsi următoarea rezervare în funcție de ora și ziua curentă
  const handleGetNextReservation = async () => {
    const data = await handleGetFirestore("RezervariConsultatii");
    const now = moment();

    // Filtrăm doar rezervările viitoare în funcție de data și ora curente
    const futureReservations = data
      .map((reservation) => {
        const { selectedSlot } = reservation;

        if (!selectedSlot) return null;

        const reservationDate = moment(
          `${selectedSlot?.currentYear}-${
            parseInt(selectedSlot?.day?.split("-")[0]) + 1
          }-${selectedSlot?.day?.split("-")[1]} ${selectedSlot?.slot}`,
          "YYYY-MM-DD HH:mm"
        );

        // Returnăm doar rezervările viitoare
        if (reservationDate.isAfter(now)) {
          return { ...reservation, reservationDate };
        }
        return null;
      })
      .filter((res) => res !== null)
      .sort((a, b) => a.reservationDate - b.reservationDate);

    // Setăm cea mai apropiată rezervare în state-ul `nextReservation`
    setNextReservation(futureReservations[0] || null);
  };

  // Funcții pentru conferințele de grup
  const handleGetGroupConferences = async () => {
    try {
      console.log("Fetching group conferences...");
      const conferenceData = await handleGetFirestore("ConferinteGrup");
      const paymentData = await handleGetFirestore("PlatiConferinteGrup");
      
      console.log("Conference data:", conferenceData);
      console.log("Payment data:", paymentData);

      // Filtrarea conferințelor și calculul participanților
      const todayConferences = [];
      const weekConferences = [];
      const currentDate = moment();
      let totalParticipants = 0;

      conferenceData.forEach((conference) => {
        const { dataIncepere, oraIncepere } = conference;
        
        if (!dataIncepere || !oraIncepere) return;

        // Creează data completă a conferinței
        const conferenceDateTime = moment(`${dataIncepere} ${oraIncepere}`, "YYYY-MM-DD HH:mm");

        // Calculează participanții pentru această conferință
        const participants = paymentData.filter(payment => 
          payment.conferintaId === conference.documentId && payment.status === "succeeded"
        );
        
        // Adaugă participanții la obiectul conferinței
        const conferenceWithParticipants = {
          ...conference,
          participants: participants
        };

        // Verifică dacă conferința este azi
        if (conferenceDateTime.isSame(currentDate, "day")) {
          todayConferences.push(conferenceWithParticipants);
        }

        // Verifică dacă conferința este în săptămâna curentă
        if (conferenceDateTime.isSame(currentDate, "week")) {
          weekConferences.push(conferenceWithParticipants);
        }

        totalParticipants += participants.length;
      });

      console.log("Today conferences:", todayConferences);
      console.log("Week conferences:", weekConferences);
      console.log("Total participants:", totalParticipants);

      setConferinteGrup(conferenceData);
      setConferinteGrupAzi(todayConferences);
      setConferinteGrupSaptamana(weekConferences);
      setTotalParticipantiGrup(totalParticipants);
      
    } catch (error) {
      console.error("Error fetching group conferences:", error);
    }
  };

  // Funcție pentru următoarea conferință de grup
  const handleGetNextGroupConference = async () => {
    try {
      const data = await handleGetFirestore("ConferinteGrup");
      const now = moment();

      // Filtrăm doar conferințele viitoare
      const futureConferences = data
        .map((conference) => {
          const { dataIncepere, oraIncepere } = conference;

          if (!dataIncepere || !oraIncepere) return null;

          const conferenceDateTime = moment(`${dataIncepere} ${oraIncepere}`, "YYYY-MM-DD HH:mm");

          // Returnăm doar conferințele viitoare
          if (conferenceDateTime.isAfter(now)) {
            return { ...conference, conferenceDateTime };
          }
          return null;
        })
        .filter((conf) => conf !== null)
        .sort((a, b) => a.conferenceDateTime - b.conferenceDateTime);

      console.log("Next group conference:", futureConferences[0]);
      setNextConferenceGrup(futureConferences[0] || null);
      
    } catch (error) {
      console.error("Error fetching next group conference:", error);
    }
  };

  // revenue chart
  const chartRef1 = useRef(null);
  useEffect(() => {
    handleGetNextReservation();
    handleGetUserReservations();
    handleGetGroupConferences();
    handleGetNextGroupConference();
    if (chartRef1.current) {
      const sCol = {
        chart: {
          height: 220,
          type: "bar",
          stacked: true,
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "50%",
            endingShape: "rounded",
            borderRadius: "5",
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          show: true,
          width: 1,
        },
        series: [
          {
            name: "High",
            color: "#0E82FD",
            data: [50, 40, 15, 45, 35, 48, 65],
          },
        ],
        xaxis: {
          categories: ["M", "T", "W", "T", "F", "S", "S"],
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return "$ " + val + "k";
            },
          },
        },
      };

      const chart = new ApexCharts(chartRef1.current, sCol);
      chart.render();
    }
  }, []);

  //appoinment chart
  const chartRef = useRef(null);
  useEffect(() => {
    const sCol = {
      chart: {
        height: 220,
        type: "bar",
        stacked: true,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "50%",
          endingShape: "rounded",
          borderRadius: "5",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 1,
      },
      series: [
        {
          name: "High",
          color: "#0E82FD",
          data: [40, 20, 30, 60, 90, 40, 110],
        },
      ],
      xaxis: {
        categories: ["M", "T", "W", "T", "F", "S", "S"],
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return "$ " + val + "k";
          },
        },
      },
    };

    if (chartRef.current) {
      const chart = new ApexCharts(chartRef.current, sCol);
      chart.render();
    }
  }, []);

  if (loading) {
    {
      return (
        <div className="spinner-container">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>

          <style jsx>{`
            .spinner-container {
              position: absolute; /* Asigură poziționarea relativă la pagina curentă */
              top: 50%;
              left: 50%;
              transform: translate(
                -50%,
                -50%
              ); /* Centrează spinner-ul orizontal și vertical */
              z-index: 9999; /* Se asigură că spinner-ul este deasupra altor elemente */
            }
          `}</style>
        </div>
      );
    }
  }

  return (
    <div>
      <Home1Header />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Dashboard</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/consultatii">Consultatii</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Cont Administrator
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
            <div className="col-lg-4 col-xl-3 theiaStickySidebar">
              <div className="stickybar">
                {/* Profile Sidebar */}
                <DoctorSidebar />
                {/* /Profile Sidebar */}
              </div>
            </div>
            <div className="col-lg-8 col-xl-9">
              <div className="row">
                
                {/* Statistici - Card-urile mici sus */}
                <div className="col-xl-12 d-flex">
                  <div className="dashboard-box-col w-100">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="dashboard-widget-box">
                          <div className="dashboard-content-info">
                            <h6>Total Clienți</h6>
                            <h4>{numberOfUniqueClientsSum}</h4>
                          </div>
                          <div className="dashboard-widget-icon">
                            <span className="dash-icon-box">
                              <i className="fa-solid fa-user" style={{ color: '#667eea' }} />
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-4">
                        <div className="dashboard-widget-box">
                          <div className="dashboard-content-info">
                            <h6>Rezervări Azi</h6>
                            <h4>{rezervariZilnic.length}</h4>
                          </div>
                          <div className="dashboard-widget-icon">
                            <span className="dash-icon-box">
                              <i className="fa-solid fa-user-clock" style={{ color: '#667eea' }} />
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-4">
                        <div className="dashboard-widget-box">
                          <div className="dashboard-content-info">
                            <h6>Rezervări Săptămâna</h6>
                            <h4>{rezervariSapt.length}</h4>
                          </div>
                          <div className="dashboard-widget-icon">
                            <span className="dash-icon-box">
                              <i className="fa-solid fa-calendar-days" style={{ color: '#667eea' }} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="row" style={{ marginTop: '30px' }}>
                      <div className="col-md-4">
                        <div className="dashboard-widget-box">
                          <div className="dashboard-content-info">
                            <h6>Total Participanți Grup</h6>
                            <h4>{totalParticipantiGrup}</h4>
                          </div>
                          <div className="dashboard-widget-icon">
                            <span className="dash-icon-box">
                              <i className="fa-solid fa-users" style={{ color: '#667eea' }} />
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-4">
                        <div className="dashboard-widget-box">
                          <div className="dashboard-content-info">
                            <h6>Conferințe Grup Azi</h6>
                            <h4>{conferinteGrupAzi.length}</h4>
                          </div>
                          <div className="dashboard-widget-icon">
                            <span className="dash-icon-box">
                              <i className="fa-solid fa-video" style={{ color: '#667eea' }} />
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-4">
                        <div className="dashboard-widget-box">
                          <div className="dashboard-content-info">
                            <h6>Conferințe Grup Săptămâna</h6>
                            <h4>{conferinteGrupSaptamana.length}</h4>
                          </div>
                          <div className="dashboard-widget-icon">
                            <span className="dash-icon-box">
                              <i className="fa-solid fa-calendar-week" style={{ color: '#667eea' }} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card-uri pentru următoarele evenimente */}
                {(nextReservation?.nume || nextConferenceGrup?.titlu) && (
                  <div className="col-xl-12 d-flex">
                    <div className="dashboard-main-col w-100">
                      {nextReservation?.nume && (
                        <div className="upcoming-appointment-card" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', marginBottom: '20px' }}>
                          <div className="title-card" style={{ backgroundColor: '#667eea', borderRadius: '10px 10px 0 0', padding: '15px' }}>
                            <h5 style={{ color: 'white', margin: 0 }}>Următoarea rezervare</h5>
                          </div>
                          <div className="upcoming-patient-info" style={{ padding: '20px' }}>
                            <div className="info-details">
                              <span className="img-avatar">
                                <img src="/img/userprofile.png" alt="Img" />
                              </span>
                              <div className="name-info">
                                <h6 style={{ color: '#333' }}>{nextReservation?.nume}</h6>
                              </div>
                            </div>
                            <div className="date-details">
                              <span style={{ color: '#666' }}>
                                Categorie: {nextReservation?.categorie.about}
                              </span>
                              <h6 style={{ color: '#333' }}>
                                {formatSelectedSlot(
                                  nextReservation?.selectedSlot?.day,
                                  nextReservation?.selectedSlot?.currentYear
                                )}
                                , ora {nextReservation?.selectedSlot?.slot}
                              </h6>
                            </div>
                          </div>
                          <div className="appointment-card-footer" style={{ padding: '20px', borderTop: '1px solid #e9ecef' }}>
                            <h5 style={{ color: '#333', marginBottom: '15px' }}>
                              {nextReservation?.tipConsultatie === "Video" ? (
                                <i className="fa-solid fa-video" style={{ color: '#667eea', marginRight: '8px' }} />
                              ) : (
                                <i className="fa-solid fa-volume-up" style={{ color: '#667eea', marginRight: '8px' }} />
                              )}
                              Consultație {nextReservation?.tipConsultatie}
                            </h5>
                            <div className="btn-appointments">
                              <Link
                                href={`/meeting-admin?meetingCode=${nextReservation?.meetingCode}__${nextReservation?.documentId}`}
                                className="btn"
                                style={{ 
                                  backgroundColor: '#667eea', 
                                  color: 'white', 
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                  textDecoration: 'none',
                                  marginRight: '10px'
                                }}
                              >
                                Începe ședința
                              </Link>
                              <Link
                                href={`/detalii-rezervare?meetingId=${nextReservation?.documentId}`}
                                className="btn"
                                style={{ 
                                  backgroundColor: 'white', 
                                  color: '#667eea', 
                                  border: '2px solid #667eea',
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                  textDecoration: 'none'
                                }}
                              >
                                Vezi detalii
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}

                      {nextConferenceGrup?.titlu && (
                        <div className="upcoming-appointment-card" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', marginBottom: '20px' }}>
                          <div className="title-card" style={{ backgroundColor: '#667eea', borderRadius: '10px 10px 0 0', padding: '15px' }}>
                            <h5 style={{ color: 'white', margin: 0 }}>Următoarea conferință de grup</h5>
                          </div>
                          <div className="upcoming-patient-info" style={{ padding: '20px' }}>
                            <div className="info-details">
                              <span className="img-avatar">
                                <img src="/img/conferinta-grup-icon.png" alt="Img" />
                              </span>
                              <div className="name-info">
                                <h6 style={{ color: '#333' }}>{nextConferenceGrup?.titlu}</h6>
                              </div>
                            </div>
                            <div className="date-details">
                              <span style={{ color: '#666' }}>
                                Tip: {nextConferenceGrup?.tipConferinta}
                              </span>
                              <h6 style={{ color: '#333' }}>
                                {moment(nextConferenceGrup?.dataIncepere).format('DD MMMM YYYY')}
                                , ora {nextConferenceGrup?.oraIncepere}
                              </h6>
                            </div>
                          </div>
                          <div className="appointment-card-footer" style={{ padding: '20px', borderTop: '1px solid #e9ecef' }}>
                            <h5 style={{ color: '#333', marginBottom: '15px' }}>
                              <i className="fa-solid fa-users" style={{ color: '#667eea', marginRight: '8px' }} />
                              Conferință de grup
                            </h5>
                            <div className="btn-appointments">
                              <Link
                                href={`/conferinta-grup/${nextConferenceGrup?.accessLink}`}
                                className="btn"
                                style={{ 
                                  backgroundColor: '#667eea', 
                                  color: 'white', 
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                  textDecoration: 'none',
                                  marginRight: '10px'
                                }}
                              >
                                Începe conferința
                              </Link>
                              <Link
                                href={`/admin-conferinte-grup`}
                                className="btn"
                                style={{ 
                                  backgroundColor: 'white', 
                                  color: '#667eea', 
                                  border: '2px solid #667eea',
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                  textDecoration: 'none'
                                }}
                              >
                                Administrează
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Secțiunile mari cu tabelele - după statistici */}
                <div className="col-xl-12 d-flex" style={{ marginBottom: '20px' }}>
                  <div className="dashboard-card w-100">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5>Rezervări azi</h5>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      <div className="table-responsive">
                        {rezervariZilnic.length != 0 ? (
                          <table className="table dashboard-table">
                            <tbody>
                              {rezervariZilnic.map((r, i) => (
                                <tr key={i}>
                                  <td>
                                    <div className="patient-info-profile">
                                      <Link
                                        href="#"
                                        className="table-avatar"
                                        onClick={(e) => e.preventDefault()}
                                      >
                                        <img
                                          src="/img/userprofile.png"
                                          alt="Img"
                                        />
                                      </Link>
                                      <div className="patient-name-info">
                                        <h5>
                                          <Link href="#">{r.nume}</Link>
                                        </h5>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="appointment-date-created">
                                      <h6>{r.selectedSlot?.slot}</h6>
                                      <span className="badge table-badge">
                                        {r.tipConsultatie}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="appointment-date-created">
                                      <Link
                                        href={`/meeting-admin?meetingCode=${r?.meetingCode}__${r?.documentId}`}
                                        className="btn"
                                        style={{
                                          backgroundColor: "#0e82fd",
                                          color: "white",
                                        }}
                                      >
                                        Începe ședința
                                      </Link>
                                      <Link
                                        href={`/detalii-rezervare?meetingId=${r?.documentId}`}
                                        className="btn"
                                      >
                                        Vezi detalii
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p>Nu aveți rezervări astăzi</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Secțiunea pentru conferințele de grup de azi */}
                <div className="col-xl-12 d-flex">
                  <div className="dashboard-card w-100">
                    <div className="dashboard-card-head">
                      <div className="header-title">
                        <h5>Conferințe de grup azi</h5>
                      </div>
                    </div>
                    <div className="dashboard-card-body">
                      <div className="table-responsive">
                        {conferinteGrupAzi.length != 0 ? (
                          <table className="table dashboard-table">
                            <tbody>
                              {conferinteGrupAzi.map((conference, i) => {
                                // Calculăm participanții pentru această conferință
                                const participants = conference.participants || [];
                                return (
                                  <tr key={i}>
                                    <td>
                                      <div className="patient-info-profile">
                                        <Link
                                          href="#"
                                          className="table-avatar"
                                          onClick={(e) => e.preventDefault()}
                                        >
                                          <img
                                            src="/img/conferinta-grup-icon.png"
                                            alt="Conferință"
                                            onError={(e) => {
                                              e.target.src = "/img/userprofile.png";
                                            }}
                                          />
                                        </Link>
                                        <div className="patient-name-info">
                                          <h5>
                                            <Link href="#">{conference.titlu}</Link>
                                          </h5>
                                          <span>Tip: {conference.tipConferinta}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="appointment-date-created">
                                        <h6>{conference.oraIncepere}</h6>
                                        <span className="badge table-badge">
                                          {participants.length} participanți
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="appointment-date-created">
                                        <Link
                                          href={`/conferinta-grup/${conference.accessLink}`}
                                          className="btn"
                                          style={{
                                            backgroundColor: "#0e82fd",
                                            color: "white",
                                          }}
                                        >
                                          Începe conferința
                                        </Link>
                                        <Link
                                          href={`/admin-conferinta-grup-video?conferenceId=${conference.documentId}`}
                                          className="btn"
                                        >
                                          Vezi participanți
                                        </Link>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <p>Nu aveți conferințe de grup astăzi</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Content */}
      <Footer {...props} />
    </div>
  );
};

export default DoctorDashboard;
