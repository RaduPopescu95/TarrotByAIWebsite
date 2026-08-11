import React, { useEffect, useState } from "react";
import DoctorSidebar from "../sidebar";
import Header from "../../header";
import DoctorFooter from "../../common/doctorFooter";
import {
  doctordashboardprofile01,
  doctordashboardprofile02,
  doctordashboardprofile3,
} from "../../imagepath";
import Link from "next/link";
import Footer from "../../footer";
import Home1Header from "../../home/home-1/header";
import { useRouter } from "next/router";
import { handleQueryFirestore, handleUpdateFirestore } from "../../../../utils/firestoreUtils";
import { formatSelectedSlot } from "../../../../utils/commonUtils";
import {
  formatCurrencyAmount,
  formatGross,
  useVatPercentage,
} from "../../../../utils/vatDisplay";
const DoctorUpcomingAppointment = (props) => {
  const router = useRouter();
  const vatPercentage = useVatPercentage();
  const { meetingId } = router.query;
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [editing, setEditing] = useState(false);
  const [slotDraft, setSlotDraft] = useState({ dateISO: '', timeHHmm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (meetingId) {
        try {
          // Aici se preiau datele din Firestore pe baza `meetingId`
          const data = await handleQueryFirestore(
            "RezervariConsultatii",
            "documentId",
            meetingId
          );
          if (data) {
            console.log("data...here.", data);
            setAppointmentDetails(data[0]);
          }
        } catch (error) {
          console.error("Failed to fetch appointment details:", error);
        }
      }
    };

    fetchAppointmentDetails();
  }, [meetingId]);

  const handleBackClick = (e) => {
    e.preventDefault(); // Previi comportamentul implicit al link-ului

    if (window.history.length > 1) {
      // Verifici dacă există o pagină anterioară în istoric
      router.back();
    } else {
      // Dacă nu, redirecționezi la "/rezervari"
      router.push("/rezervari");
    }
  };

  if (!appointmentDetails) {
    return <p>Se incarca informatiile....</p>;
  }

  return (
    <div>
      <Home1Header />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Detalii rezervare</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/consultatii">Consultatii</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Detalii rezervare
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
              {/* Profile Sidebar */}
              <DoctorSidebar />
              {/* /Profile Sidebar */}
            </div>
            <div className="col-lg-8 col-xl-9">
              <div className="dashboard-header">
                <div className="header-back">
                  <Link
                    href="/rezervari"
                    onClick={handleBackClick}
                    className="back-arrow"
                  >
                    <i className="fa-solid fa-arrow-left" />
                  </Link>
                  <h3>Detalii rezervare</h3>
                </div>
              </div>
              <div className="appointment-details-wrap">
                {/* Appointment Detail Card */}
                <div className="appointment-wrap appointment-detail-card">
                  <ul>
                    <li>
                      <div className="patinet-information">
                        <Link href="#">
                          <img src="/img/userprofile.png" alt="User Image" />
                        </Link>
                        <div className="patient-info">
                          <p>{appointmentDetails?.documentId}</p>
                          <h6>
                            <Link href="#">{appointmentDetails?.nume}</Link>
                          </h6>
                          <div className="mail-info-patient">
                            <ul>
                              <li>
                                <i className="fa-solid fa-envelope" />
                                {appointmentDetails?.email}
                              </li>
                              <li>
                                <i className="fa-solid fa-phone" />
                                {appointmentDetails?.telefon}
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li className="appointment-info">
                      <div className="person-info">
                        <p style={{ color: "#1d7ed8" }}>Alte informatii</p>
                        <ul className="d-flex apponitment-types">
                          <li>
                            {/* <i className="fa-solid fa-hospital text-green" /> */}
                            {appointmentDetails?.alteInformatii ||
                              "Nu au fost adaugate alte informatii la rezervare"}
                          </li>
                        </ul>
                      </div>
                    </li>
                    {/* <li className="appointment-info">
                      <div className="person-info">
                        <p>Timp</p>
                        <ul className="d-flex apponitment-types">
                          <li style={{ color: "#1d7ed8" }}>
                            <i className="fa-solid fa-hospital text-green" />
                            {appointmentDetails?.categorie?.about}
                          </li>
                        </ul>
                      </div>
                    </li> */}
                    {/* <li className="appointment-info">
                      <div className="person-info">
                        <p>Pret</p>
                        <ul className="d-flex apponitment-types">
                          <li style={{ color: "#1d7ed8" }}>
                            <i className="fa-solid fa-hospital text-green" />
                            {appointmentDetails?.categorie?.price} RON
                          </li>
                        </ul>
                      </div>
                    </li> */}
                    {/* <li className="appointment-action">
                      <div className="detail-badge-info">
                        <span className="badge bg-grey me-2">New Patient</span>
                        <span className="badge bg-yellow">Upcoming</span>
                      </div>
                      <div className="consult-fees">
                        <h6>
                          Pret: {appointmentDetails?.categorie?.price} RON
                        </h6>
                      </div>
                      <ul>
                        <li>
                          <Link href="#">
                            <i className="fa-solid fa-comments" />
                          </Link>
                        </li>
                        <li>
                          <Link href="#">
                            <i className="fa-solid fa-xmark" />
                          </Link>
                        </li>
                      </ul>
                    </li> */}
                  </ul>
                  <ul className="detail-card-bottom-info">
                    <li>
                      <h6>Data &amp; Ora</h6>
                      {!editing ? (
                        <span>
                          {formatSelectedSlot(
                            appointmentDetails?.selectedSlot?.day,
                            appointmentDetails?.selectedSlot?.currentYear
                          )}
                          ; {appointmentDetails?.selectedSlot?.slot}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="date"
                            value={slotDraft.dateISO}
                            onChange={(e) => setSlotDraft({ ...slotDraft, dateISO: e.target.value })}
                            className="form-control"
                            style={{ maxWidth: 180 }}
                          />
                          <input
                            type="time"
                            value={slotDraft.timeHHmm}
                            onChange={(e) => setSlotDraft({ ...slotDraft, timeHHmm: e.target.value })}
                            className="form-control"
                            style={{ maxWidth: 140 }}
                          />
                        </div>
                      )}
                    </li>
                    <li>
                      <h6>Tip Consultatie</h6>
                      <span> {appointmentDetails?.tipConsultatie}</span>
                    </li>
                    <li>
                      <h6>Timp</h6>
                      <span> {appointmentDetails?.categorie?.about}</span>
                    </li>
                    <li>
                      <h6>Pret (TVA inclus)</h6>
                      <span>
                        {" "}
                        {appointmentDetails?.costConsultatie
                          ? formatCurrencyAmount(appointmentDetails.costConsultatie, {
                              currency: "RON",
                            })
                          : formatGross(appointmentDetails?.categorie?.price, {
                              vatPercentage,
                              currency: "RON",
                            })}
                      </span>
                    </li>
                    <li>
                      <div className="start-btn" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {!editing ? (
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              setEditing(true);
                              const original = appointmentDetails.selectedSlot || {};
                              const year = original.currentYear || new Date().getFullYear();
                              let mm = '';
                              let dd = '';
                              if (original.day && typeof original.day === 'string') {
                                const parts = original.day.split('-');
                                if (parts.length === 2) {
                                  const m = parseInt(parts[0], 10) || 0;
                                  const d = parseInt(parts[1], 10) || 0;
                                  mm = String(m).padStart(2, '0');
                                  dd = String(d).padStart(2, '0');
                                }
                              }
                              const dateISO = mm && dd ? `${year}-${mm}-${dd}` : '';
                              const timeHHmm = original.slot || '';
                              setSlotDraft({ dateISO, timeHHmm });
                            }}
                          >
                            Editează data
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-success"
                              disabled={saving || !slotDraft.dateISO || !slotDraft.timeHHmm}
                              onClick={async () => {
                                try {
                                  setSaving(true);
                                  // Detect change vs original
                                  const original = appointmentDetails.selectedSlot || {};
                                  const originalYear = original.currentYear || new Date().getFullYear();
                                  const [origMStr, origDStr] = (original.day || '').split('-');
                                  const origM = parseInt(origMStr || '0', 10) || 0;
                                  const origD = parseInt(origDStr || '0', 10) || 0;

                                  const d = new Date(slotDraft.dateISO);
                                  const year = d.getFullYear();
                                  const month = d.getMonth() + 1; // 1-based
                                  const day = d.getDate();
                                  const newDayField = `${month}-${day}`; // store as M-D (no zero padding)
                                  const newSlot = {
                                    day: newDayField,
                                    slot: slotDraft.timeHHmm,
                                    currentYear: year,
                                  };

                                  const changed = (
                                    year !== originalYear ||
                                    month !== origM ||
                                    day !== origD ||
                                    (slotDraft.timeHHmm !== (original.slot || ''))
                                  );

                                  await handleUpdateFirestore(`RezervariConsultatii/${appointmentDetails.documentId}`, {
                                    selectedSlot: newSlot
                                  });
                                  setAppointmentDetails(prev => ({ ...prev, selectedSlot: newSlot }));

                                  if (changed) {
                                    const confirmNotify = window.confirm('Doriți să trimiteți email de înștiințare privind modificarea datei?');
                                    if (confirmNotify) {
                                      const resp = await fetch('/api/consultation/send-update-email', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ documentId: appointmentDetails.documentId })
                                      });
                                      const result = await resp.json();
                                      if (resp.ok && result.success) {
                                        alert('✅ Email de reprogramare trimis către client.');
                                      } else {
                                        alert('⚠️ Emailul nu a putut fi trimis.');
                                      }
                                    }
                                  }
                                } catch (e) {
                                  console.error('Save slot error', e);
                                  alert('Eroare la salvare.');
                                } finally {
                                  setSaving(false);
                                  setEditing(false);
                                }
                              }}
                            >
                              {saving ? '⏳ Salvare...' : '💾 Salvează'}
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              disabled={saving}
                              onClick={() => {
                                setEditing(false);
                                setSlotDraft({ dateISO: '', timeHHmm: '' });
                              }}
                            >
                              Anulează
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            const link = `${window.location.origin}/meeting?meetingCode=${appointmentDetails.meetingCode}__${appointmentDetails.documentId}`;
                            navigator.clipboard
                              .writeText(link)
                              .then(() => alert("Link copiat în clipboard!"))
                              .catch((err) => console.error("Eroare la copierea link-ului:", err));
                          }}
                        >
                          Link întâlnire
                        </button>
                      </div>
                    </li>

                    <li>
                      <div className="start-btn">
                        <Link
                          href={`/meeting-admin?meetingCode=${appointmentDetails.meetingCode}__${appointmentDetails.documentId}`}
                          className="btn btn-secondary"
                        >
                          Începe sedinta
                        </Link>
                      </div>
                    </li>
                  </ul>
                </div>
                {/* /Appointment Detail Card */}
                {/* <div className="recent-appointments">
                  <h5 className="head-text">Recent Appointments</h5>

                  <div className="appointment-wrap">
                    <ul>
                      <li>
                        <div className="patinet-information">
                          <Link href="#">
                            <img
                              src={doctordashboardprofile01}
                              alt="User Image"
                            />
                          </Link>
                          <div className="patient-info">
                            <p>#Apt0001</p>
                            <h6>
                              <Link href="#">Adrian</Link>
                            </h6>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p>
                          <i className="fa-solid fa-clock" />
                          11 Nov 2024 10.45 AM
                        </p>
                        <ul className="d-flex apponitment-types">
                          <li>General Visit</li>
                          <li>Chat</li>
                        </ul>
                      </li>
                      <li className="mail-info-patient">
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
                      </li>
                      <li className="appointment-action">
                        <ul>
                          <li>
                            <Link href="#">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="appointment-wrap">
                    <ul>
                      <li>
                        <div className="patinet-information">
                          <Link href="#">
                            <img
                              src={doctordashboardprofile3}
                              alt="User Image"
                            />
                          </Link>
                          <div className="patient-info">
                            <p>#Apt0003</p>
                            <h6>
                              <Link href="#">Samuel</Link>
                            </h6>
                          </div>
                        </div>
                      </li>
                      <li className="appointment-info">
                        <p>
                          <i className="fa-solid fa-clock" />
                          27 Oct 2024 09.30 AM
                        </p>
                        <ul className="d-flex apponitment-types">
                          <li>General Visit</li>
                          <li>Video Call</li>
                        </ul>
                      </li>
                      <li className="mail-info-patient">
                        <ul>
                          <li>
                            <i className="fa-solid fa-envelope" />
                            samuel@example.com
                          </li>
                          <li>
                            <i className="fa-solid fa-phone" />
                            &nbsp;+1 749 104 6291
                          </li>
                        </ul>
                      </li>
                      <li className="appointment-action">
                        <ul>
                          <li>
                            <Link href="#">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DoctorUpcomingAppointment;
