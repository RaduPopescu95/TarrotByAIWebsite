import React, { useEffect, useState } from "react";
import Link from "next/link";
import Home1Header from "../../home/home-1/header";
import DashboardSidebar from "../dashboard/sidebar/sidebar";
import Footer from "../../footer";
import StickyBox from "react-sticky-box";
import { useAuth } from "../../../../context/AuthContext";
import { handleQueryFirestore } from "../../../../utils/firestoreUtils";
import { formatSelectedSlot } from "../../../../utils/commonUtils";

const PatientAppointments = () => {
  const { userData } = useAuth();
  const [allReservations, setAllReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming"); // Nou: stare pentru tabul activ
  const itemsPerPage = 5;

  const fetchUserReservations = async () => {
    console.log("Fetching reservations for user:", userData?.owner_uid);

    const data = await handleQueryFirestore(
      "RezervariConsultatii",
      "owner_uid",
      userData?.owner_uid
    );

    console.log("Data retrieved from Firestore:", data);

    const reservations = data
      .map((reservation) => {
        const { selectedSlot } = reservation;
        if (
          !selectedSlot ||
          !selectedSlot.day ||
          !selectedSlot.slot ||
          !selectedSlot.currentYear
        ) {
          console.warn("Missing date details for reservation:", reservation);
          return null;
        }

        const [month, day] = selectedSlot.day.split("-").map(Number);
        const reservationDate = new Date(
          parseInt(selectedSlot.currentYear, 10),
          month,
          day,
          ...selectedSlot.slot.split(":").map(Number)
        );

        console.log("Parsed reservation date:", reservationDate);

        return { ...reservation, reservationDate };
      })
      .filter((res) => res !== null);

    console.log("Reservations with valid dates:", reservations);

    reservations.sort((a, b) => a.reservationDate - b.reservationDate);
    console.log("Sorted reservations:", reservations);

    setAllReservations(reservations);
    setFilteredReservations(reservations);
  };

  useEffect(() => {
    fetchUserReservations();
  }, [userData?.owner_uid]);

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchText(searchTerm);
    const results = allReservations.filter((res) =>
      Object.values(res).some((value) =>
        String(value).toLowerCase().includes(searchTerm)
      )
    );
    setFilteredReservations(results);
    setCurrentPage(1); // Reset to the first page after search
  };

  const currentReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const generatePageNumbers = () => {
    const pageCount = Math.ceil(filteredReservations.length / itemsPerPage);
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  };

  const now = new Date();
  const upcomingReservations = currentReservations.filter(
    (res) => res.reservationDate <= now
  );
  const completedReservations = currentReservations.filter(
    (res) => res.reservationDate > now
  );

  console.log("Current page reservations:", currentReservations);
  console.log("Upcoming reservations:", upcomingReservations);
  console.log("Completed reservations:", completedReservations);

  return (
    <>
      <Home1Header />
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Rezervările Mele</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Cont</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Rezervările Mele
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-md-5 col-lg-4 col-xl-3 theiaStickySidebar">
              <StickyBox offsetTop={20} offsetBottom={20}>
                <DashboardSidebar />
              </StickyBox>
            </div>

            <div className="col-lg-8 col-xl-9">
              <div className="dashboard-header">
                <h3>Rezervări</h3>
                <div className="input-block dash-search-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Caută rezervare"
                    value={searchText}
                    onChange={handleSearch}
                  />
                  <span className="search-icon">
                    <i className="fa-solid fa-magnifying-glass" />
                  </span>
                </div>
              </div>

              <div className="appointment-tab-head">
                <div className="appointment-tabs">
                  <ul className="nav nav-pills inner-tab">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === "upcoming" ? "active" : ""}`}
                        onClick={() => setActiveTab("upcoming")}
                      >
                        Viitoare
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === "completed" ? "active" : ""}`}
                        onClick={() => setActiveTab("completed")}
                      >
                        Finalizate
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="tab-content appointment-tab-content">
                {activeTab === "upcoming" && (
                  <div className="tab-pane fade show active" id="upcoming">
                    {upcomingReservations.length === 0 && (
                      <p>Nu există rezervări viitoare.</p>
                    )}
                    {upcomingReservations.map((res) => (
                      <div key={res.documentId} className="appointment-wrap">
                        <ul>
                          <li>
                            <div className="patinet-information">
                              <Link href="#">
                                <img
                                  src={"/img/profilecristina.png"}
                                  alt="User"
                                />
                              </Link>
                              <div className="patient-info">
                                {/* <p>#{res.documentId}</p> */}
                                <h6>
                                  <Link href="#">Cristina Zurba</Link>
                                </h6>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-clock" />
                              {formatSelectedSlot(res.selectedSlot.day)}, ora{" "}
                              {res.selectedSlot.slot}
                            </p>
                          </li>
                          <li className="appointment-action">
                            <Link
                              href={`/meeting?meetingCode=${res.meetingCode}__${res.documentId}`}
                            >
                              <i className="fa-solid fa-calendar-check" />{" "}
                              Participă
                            </Link>
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "completed" && (
                  <div className="tab-pane fade show active" id="completed">
                    {completedReservations.length === 0 && (
                      <p>Nu există rezervări finalizate.</p>
                    )}
                    {completedReservations.map((res) => (
                      <div key={res.documentId} className="appointment-wrap">
                        <ul>
                          <li>
                            <div className="patinet-information">
                              <Link href="#">
                                <img
                                  src={"/img/profilecristina.png"}
                                  alt="User"
                                />
                              </Link>
                              <div className="patient-info">
                                <p>#{res.documentId}</p>
                                <h6>
                                  <Link href="#">{res.nume}</Link>
                                </h6>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-clock" />
                              {formatSelectedSlot(res.selectedSlot.day)}, ora{" "}
                              {res.selectedSlot.slot}
                            </p>
                          </li>
                          <li className="appointment-action">
                            <Link
                              href={`/meeting?meetingCode=${res.meetingCode}__${res.documentId}`}
                            >
                              <i className="fa-solid fa-calendar-check" /> Vezi
                              Detalii
                            </Link>
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pagination dashboard-pagination">
                {generatePageNumbers().map((pageNumber) => (
                  <Link
                    key={pageNumber}
                    href="#"
                    className={`page-link ${currentPage === pageNumber ? "active" : ""}`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PatientAppointments;
