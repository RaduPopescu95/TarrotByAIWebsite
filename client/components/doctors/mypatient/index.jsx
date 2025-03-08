import React, { useEffect, useState } from "react";
import Link from "next/link";
import Home1Header from "../../home/home-1/header";
import DoctorFooter from "../../common/doctorFooter";
import DoctorSidebar from "../sidebar";
import { handleGetFirestore } from "../../../../utils/firestoreUtils";
import Footer from "../../footer";

const MyPatient = (props) => {
  const [uniqueClients, setUniqueClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const handleGetUserReservations = async () => {
    const data = await handleGetFirestore("RezervariConsultatii");
    const uniqueClientsMap = new Map();

    data.forEach((reservation) => {
      const { owner_uid, telefon } = reservation;
      const clientIdentifier = owner_uid || telefon;

      if (uniqueClientsMap.has(clientIdentifier)) {
        // Dacă clientul există deja, incrementăm contorul rezervărilor
        const existingClient = uniqueClientsMap.get(clientIdentifier);
        existingClient.reservationCount += 1;
      } else {
        // Dacă clientul este nou, adăugăm un nou obiect cu reservationCount setat la 1
        uniqueClientsMap.set(clientIdentifier, {
          ...reservation,
          reservationCount: 1,
        });
      }
    });

    const uniqueClientsArray = Array.from(uniqueClientsMap.values());
    setUniqueClients(uniqueClientsArray);
    setFilteredClients(uniqueClientsArray);
  };

  useEffect(() => {
    handleGetUserReservations();
  }, []);

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchText(searchTerm);
    const results = uniqueClients.filter((client) =>
      client.nume.toLowerCase().includes(searchTerm)
    );
    setFilteredClients(results);
    setCurrentPage(1);
  };

  const currentClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pageCount = Math.ceil(filteredClients.length / itemsPerPage);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <div>
      <Home1Header />
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Clientii mei</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/consultatii">Consultatii</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Clientii mei
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
            <div className="col-lg-4 col-xl-3 theiaStickySidebar">
              <DoctorSidebar />
            </div>
            <div className="col-lg-8 col-xl-9">
              <div className="dashboard-header">
                <h3>Clientii mei</h3>
                <ul className="header-list-btns">
                  <li>
                    <div className="input-block dash-search-input">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Cauta dupa nume"
                        value={searchText}
                        onChange={handleSearch}
                      />
                      <span className="search-icon">
                        <i className="fa-solid fa-magnifying-glass" />
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
              {/* <div className="appointment-tab-head">
                <div className="appointment-tabs">
                  <ul
                    className="nav nav-pills inner-tab "
                    id="pills-tab"
                    role="tablist"
                  >
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link active"
                        id="pills-upcoming-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#pills-upcoming"
                        type="button"
                        role="tab"
                        aria-controls="pills-upcoming"
                        aria-selected="false"
                      >
                        Active<span>200</span>
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link"
                        id="pills-cancel-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#pills-cancel"
                        type="button"
                        role="tab"
                        aria-controls="pills-cancel"
                        aria-selected="true"
                      >
                        InActive<span>22</span>
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="filter-head">
                  <div className="position-relative daterange-wraper me-2">
                    <div className="input-groupicon calender-input">
                      <DateRangePicker initialSettings={initialSettings}>
                        <input
                          className="form-control  date-range bookingrange"
                          type="text"
                        />
                      </DateRangePicker>
                    </div>
                    <i className="fa-solid fa-calendar-days me-1" />
                  </div>
                  <div className="form-sorts dropdown">
                    <Link
                      href="#"
                      className="dropdown-toggle"
                      id="table-filter"
                    >
                      <i className="fa-solid fa-filter me-2" />
                      Filter By
                    </Link>
                    <div className="filter-dropdown-menu">
                      <div className="filter-set-view">
                        <div className="accordion" id="accordionExample">
                          <div className="filter-set-content">
                            <div className="filter-set-content-head">
                              <Link
                                href="#"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseTwo"
                                aria-expanded="false"
                                aria-controls="collapseTwo"
                              >
                                Name
                                <i className="fa-solid fa-chevron-right" />
                              </Link>
                            </div>
                            <div
                              className="filter-set-contents accordion-collapse collapse show"
                              id="collapseTwo"
                              data-bs-parent="#accordionExample"
                            >
                              <ul>
                                <li>
                                  <div className="input-block dash-search-input w-100">
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
                            </div>
                          </div>
                          <div className="filter-set-content">
                            <div className="filter-set-content-head">
                              <Link
                                href="#"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseOne"
                                aria-expanded="true"
                                aria-controls="collapseOne"
                              >
                                Appointment Type
                                <i className="fa-solid fa-chevron-right" />
                              </Link>
                            </div>
                            <div
                              className="filter-set-contents accordion-collapse collapse show"
                              id="collapseOne"
                              data-bs-parent="#accordionExample"
                            >
                              <ul>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input
                                        type="checkbox"
                                        defaultChecked=""
                                      />
                                      <span className="checkmarks" />
                                      <span className="check-title">
                                        All Type
                                      </span>
                                    </label>
                                  </div>
                                </li>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                      <span className="check-title">
                                        Video Call
                                      </span>
                                    </label>
                                  </div>
                                </li>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                      <span className="check-title">
                                        Audio Call
                                      </span>
                                    </label>
                                  </div>
                                </li>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                      <span className="check-title">Chat</span>
                                    </label>
                                  </div>
                                </li>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                      <span className="check-title">
                                        Direct Visit
                                      </span>
                                    </label>
                                  </div>
                                </li>
                              </ul>
                            </div>
                          </div>
                          <div className="filter-set-content">
                            <div className="filter-set-content-head">
                              <Link
                                href="#"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseThree"
                                aria-expanded="false"
                                aria-controls="collapseThree"
                              >
                                Visit Type
                                <i className="fa-solid fa-chevron-right" />
                              </Link>
                            </div>
                            <div
                              className="filter-set-contents accordion-collapse collapse show"
                              id="collapseThree"
                              data-bs-parent="#accordionExample"
                            >
                              <ul>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input
                                        type="checkbox"
                                        defaultChecked=""
                                      />
                                      <span className="checkmarks" />
                                      <span className="check-title">
                                        All Visit
                                      </span>
                                    </label>
                                  </div>
                                </li>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                      <span className="check-title">
                                        General
                                      </span>
                                    </label>
                                  </div>
                                </li>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                      <span className="check-title">
                                        Consultation
                                      </span>
                                    </label>
                                  </div>
                                </li>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                      <span className="check-title">
                                        Follow-up
                                      </span>
                                    </label>
                                  </div>
                                </li>
                                <li>
                                  <div className="filter-checks">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                      <span className="check-title">
                                        Direct Visit
                                      </span>
                                    </label>
                                  </div>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="filter-reset-btns">
                          <Link href="#" className="btn btn-light">
                            Reset
                          </Link>
                          <Link href="#" className="btn btn-primary">
                            Filter Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
              <div className="tab-content appointment-tab-content grid-patient">
                <div className="row">
                  {currentClients.length > 0 ? (
                    currentClients.map((client) => (
                      <div
                        className="col-xl-4 col-lg-6 col-md-6 d-flex"
                        key={client.documentId}
                      >
                        <div className="appointment-wrap appointment-grid-wrap">
                          <ul>
                            <li>
                              <div className="appointment-grid-head">
                                <div className="patinet-information">
                                  <Link
                                    href={`/doctor/patient-profile/${client.documentId}`}
                                  >
                                    <img
                                      src={"/img/userprofile.png"}
                                      alt="User Image"
                                    />
                                  </Link>
                                  <div className="patient-info">
                                    <h6>{client.nume}</h6>
                                    <ul>
                                      <li>
                                        Email: {client.email.toLowerCase()}
                                      </li>
                                      <li>Telefon: {client.telefon}</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </li>
                            <li>
                              <div className="loader-item text-left">
                                <Link href="#" className="btn btn-load">
                                  Adauga informatii
                                </Link>
                              </div>
                            </li>
                            {/* <li className="appointment-info">
                              <p>
                                <i className="fa-solid fa-clock" />
                                {client.firstUploadDate}{" "}
                                {client.firstUploadTime}
                              </p>
                            </li> */}
                            <li className="appointment-action">
                              <div className="patient-book">
                                <p>
                                  <i className="fa-solid fa-calendar-days" />
                                  Rezervari efectuate: {client.reservationCount}
                                </p>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>Nu există clienti care să corespundă căutării.</p>
                  )}
                </div>
              </div>

              {/* Pagination */}
              <div className="pagination dashboard-pagination">
                {pages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`page-link ${
                      currentPage === pageNumber ? "active" : ""
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyPatient;
