import React, { useEffect, useState } from "react";
import Link from "next/link";
import DoctorFooter from "../../../common/doctorFooter/index.jsx";
import DoctorSidebar from "../../../doctors/sidebar/index.jsx";
import Home1Header from "../../../home/home-1/header.jsx";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(""); // Stare pentru luna selectată
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/get-invoices");
      const data = await response.json();
      setInvoices(data.invoices);
    } catch (error) {
      console.error("Eroare la preluarea facturilor:", error);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await fetch(
        `/api/get-invoice-pdf?invoiceId=${invoiceId}`
      );
      const data = await response.json();
      const pdfUrl = data.pdfUrl;
      if (pdfUrl) {
        window.open(pdfUrl, "_blank");
      } else {
        console.error("Nu am reușit să obțin link-ul PDF al facturii.");
      }
    } catch (error) {
      console.error("Eroare la descărcarea facturii:", error);
    }
  };

  // Funcția pentru descărcarea tuturor facturilor din luna selectată ca arhivă ZIP
  const handleDownloadAllInvoicesAsZip = async () => {
    try {
      // Filtrare facturi pe baza lunii selectate
      const filteredInvoices = invoices.filter((invoice) => {
        const invoiceMonth = new Date(invoice.created * 1000).getMonth() + 1; // Obține luna facturii
        return invoiceMonth === parseInt(selectedMonth);
      });

      // Extrage ID-urile facturilor filtrate
      const invoiceIds = filteredInvoices.map((invoice) => invoice.id);

      if (invoiceIds.length === 0) {
        alert("Nu există facturi pentru luna selectată.");
        return;
      }

      // Creează un element <a> temporar pentru a descărca fișierul ZIP
      const response = await fetch("/api/download-archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceIds }),
      });

      if (response.ok) {
        // Creează un blob din răspuns
        const blob = await response.blob();

        // Creează un link temporar pentru descărcarea fișierului ZIP
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `facturi_${new Date().toISOString()}.zip`;
        document.body.appendChild(a);
        a.click();

        // Curăță resursele temporare
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error(
          "Eroare la descărcarea arhivei ZIP:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Eroare la descărcarea arhivei ZIP:", error);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  // Filtrare facturi pe baza textului de căutare și lunii selectate
  const filteredInvoices = invoices
    .filter((invoice) =>
      Object.values(invoice).some((value) =>
        value?.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    )
    .filter((invoice) => {
      if (!selectedMonth) return true;
      const invoiceMonth = new Date(invoice.created * 1000).getMonth() + 1;
      return invoiceMonth === parseInt(selectedMonth);
    });

  const currentInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage < maxPageButtons - 1) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (startPage > 1) {
      pageNumbers.unshift("...");
      pageNumbers.unshift(1);
    }

    if (endPage < totalPages) {
      pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div>
      <Home1Header />
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Facturi Clienți</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Admin</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Facturi Clienți
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
                <h3>Facturi</h3>
              </div>
              <div className="search-header">
                <div className="search-field">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Caută factură"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)} // Actualizează textul de căutare
                  />
                  <span className="search-icon">
                    <i className="fa-solid fa-magnifying-glass" />
                  </span>
                </div>

                {/* Selectare lună */}
                <div className="search-field">
                  <select
                    className="form-control custom-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{
                      height: "auto",
                      lineHeight: "normal",
                      padding: "8px 12px",
                    }} // Stiluri inline pentru a regla vizualizarea
                  >
                    <option value="">Toate facturile</option>
                    <option value="1">Ianuarie</option>
                    <option value="2">Februarie</option>
                    <option value="3">Martie</option>
                    <option value="4">Aprilie</option>
                    <option value="5">Mai</option>
                    <option value="6">Iunie</option>
                    <option value="7">Iulie</option>
                    <option value="8">August</option>
                    <option value="9">Septembrie</option>
                    <option value="10">Octombrie</option>
                    <option value="11">Noiembrie</option>
                    <option value="12">Decembrie</option>
                  </select>
                </div>
              </div>

              {/* Buton descărcare facturi */}
              {selectedMonth ? (
                <div className="download-all-button">
                  <button
                    className="btn btn-primary"
                    onClick={handleDownloadAllInvoicesAsZip}
                  >
                    Descarcă toate facturile din luna selectată (ZIP)
                  </button>
                </div>
              ) : null}

              <div className="custom-table">
                <div className="table-responsive">
                  <table className="table table-center mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Client</th>
                        <th>Email</th>
                        <th>Data emiterii</th>
                        <th>Suma totală</th>
                        <th>Acțiune</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>
                            <Link
                              href="#"
                              className="text-blue-600"
                              data-bs-toggle="modal"
                              data-bs-target="#invoice_view"
                            >
                              {invoice.number || invoice.id}
                            </Link>
                          </td>
                          <td>
                            <h2 className="table-avatar">
                              <Link href="/patient/doctor-profile">
                                {invoice.customer_name}
                              </Link>
                            </h2>
                          </td>
                          <td>
                            <h2 className="table-avatar">
                              <Link href="/patient/doctor-profile">
                                {invoice.customer_email}
                              </Link>
                            </h2>
                          </td>
                          <td>
                            {new Date(
                              invoice.created * 1000
                            ).toLocaleDateString()}
                          </td>

                          <td>
                            {(invoice.total / 100).toFixed(2)}{" "}
                            {invoice.currency.toUpperCase()}
                          </td>
                          <td>
                            <div className="action-item">
                              <Link
                                href="#"
                                onClick={() =>
                                  handleDownloadInvoice(invoice.id)
                                }
                              >
                                <i className="fa-solid fa-download" />{" "}
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="pagination dashboard-pagination">
                <ul>
                  <li>
                    <Link
                      href="#"
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="fa-solid fa-chevron-left" />
                    </Link>
                  </li>
                  {generatePageNumbers().map((pageNumber, index) => (
                    <li key={index}>
                      {pageNumber === "..." ? (
                        <span className="page-link">...</span>
                      ) : (
                        <Link
                          href="#"
                          className={`page-link ${
                            pageNumber === currentPage ? "active" : ""
                          }`}
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </Link>
                      )}
                    </li>
                  ))}
                  <li>
                    <Link
                      href="#"
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fa-solid fa-chevron-right" />
                    </Link>
                  </li>
                </ul>
              </div>
              {/* /Pagination */}
            </div>
          </div>
        </div>
      </div>
      <DoctorFooter />
    </div>
  );
};

export default Invoices;
