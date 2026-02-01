import React, { useEffect, useState } from "react";
import Link from "next/link";
import Home1Header from "../../home/home-1/header";
import DashboardSidebar from "../dashboard/sidebar/sidebar";
import Footer from "../../footer";
import StickyBox from "react-sticky-box";
import { useAuth } from "../../../../context/AuthContext";
import { handleQueryFirestore } from "../../../../utils/firestoreUtils";
import { formatSelectedSlot } from "../../../../utils/commonUtils";
import DoctorSidebar from "../../doctors/sidebar";
import moment from "moment";

const AppointmentsAdmin = () => {
  const { userData } = useAuth();
  const [allReservations, setAllReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming"); // Nou: stare pentru tabul activ
  const itemsPerPage = 5;

  const fetchUserReservations = async () => {
    console.log("Fetching all reservations for admin view");

    const data = await handleQueryFirestore("RezervariConsultatii");

    console.log("Data retrieved from Firestore:", data);

    // Restul codului rămâne neschimbat pentru a parsa și sorta rezervările
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
  console.log("currentReservations....", filteredReservations);
  console.log("currentReservations....", currentReservations);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const now = moment(); // Include ziua și ora curentă
  console.log("Current time (now):", now.format("YYYY-MM-DD HH:mm:ss"));

  const totalUpcomingPages = Math.ceil(
    filteredReservations.filter((res) =>
      moment(res.reservationDate).isSameOrAfter(now, "day")
    ).length / itemsPerPage
  );

  const totalCompletedPages = Math.ceil(
    filteredReservations.filter((res) =>
      moment(res.reservationDate).isSameOrBefore(now)
    ).length / itemsPerPage
  );

  const getPageCount = () =>
    activeTab === "upcoming" ? totalUpcomingPages : totalCompletedPages;

  const generatePageItems = () => {
    const pageCount = Math.max(1, getPageCount());
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }
    // Smart pagination:
    // - near start: 1 2 3 4 … last
    // - near end:   1 … last-3 last-2 last-1 last
    // - middle:     1 … current-1 current current+1 … last
    if (currentPage <= 4) {
      return [1, 2, 3, 4, "ellipsis", pageCount];
    }
    if (currentPage >= pageCount - 3) {
      return [1, "ellipsis", pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
    }
    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", pageCount];
  };

  const upcomingReservations = filteredReservations
    .filter((res) => {
      const isSameOrAfterNow = moment(res.reservationDate).isSameOrAfter(
        now,
        "day"
      );
      return isSameOrAfterNow;
    })
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const completedReservations = filteredReservations
    .filter((res) => {
      const isBeforeOrSameNow = moment(res.reservationDate).isSameOrBefore(now);
      return isBeforeOrSameNow;
    })
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                <DoctorSidebar />
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
                        onClick={() => {
                          setActiveTab("upcoming");
                          setCurrentPage(1);
                        }}
                      >
                        Viitoare
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === "completed" ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab("completed");
                          setCurrentPage(1);
                        }}
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
                                <img src="/img/userprofile.png" alt="User" />
                              </Link>
                              <div className="patient-info">
                                {/* <p>#{res.documentId}</p> */}
                                <h6>
                                  <Link href="#">{res.nume}</Link>
                                </h6>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-clock" />
                              {res.categorie.timp} minute
                            </p>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-clock" />
                              {formatSelectedSlot(
                                res.selectedSlot.day,
                                res.selectedSlot.currentYear
                              )}
                              , ora {res.selectedSlot.slot}
                            </p>
                          </li>
                          <li className="appointment-action">
                            <Link
                              href={`/meeting-admin?meetingCode=${res.meetingCode}__${res.documentId}`}
                            >
                              <i className="fa-solid fa-calendar-check" />{" "}
                              Începe sedinta
                            </Link>
                          </li>
                          <li>
                            <Link
                              href={`/detalii-rezervare?meetingId=${res.documentId}`}
                            >
                              <i className="fa-solid fa-eye" />
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
                                <img src="/img/userprofile.png" alt="User" />
                              </Link>
                              <div className="patient-info">
                                {/* <p>#{res.documentId}</p> */}
                                <h6>
                                  <Link href="#">{res.nume}</Link>
                                </h6>
                              </div>
                            </div>
                          </li>
                          <li className="appointment-info">
                            <p>
                              <i className="fa-solid fa-clock" />
                              {formatSelectedSlot(
                                res.selectedSlot.day,
                                res.selectedSlot.currentYear
                              )}
                              , ora {res.selectedSlot.slot}
                            </p>
                          </li>
                          <li className="appointment-action">
                            <li>
                              <Link
                                href={`/detalii-rezervare?meetingId=${res.documentId}`}
                              >
                                <i className="fa-solid fa-eye" />
                              </Link>
                            </li>
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="pagination dashboard-pagination"
                style={{ flexWrap: "wrap", gap: 8, justifyContent: "center" }}
              >
                <button
                  type="button"
                  className="page-link"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                >
                  «
                </button>
                {generatePageItems().map((item, idx) => {
                  if (item === "ellipsis") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="page-link"
                        style={{ pointerEvents: "none", opacity: 0.6 }}
                      >
                        …
                      </span>
                    );
                  }
                  const pageNumber = item;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`page-link ${currentPage === pageNumber ? "active" : ""}`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="page-link"
                  disabled={currentPage >= getPageCount()}
                  onClick={() => handlePageChange(Math.min(getPageCount(), currentPage + 1))}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AppointmentsAdmin;
