import React, { useEffect, useState } from "react";
import Link from "next/link";
import { doctorprofileimg } from "../../imagepath";
import { handleSignIn, handleLogout } from "../../../../utils/authUtils";
import Select from "react-select";
import { useRouter } from "next/router";
// REMOVED: import { useAuth } from "../../../../context/AuthContext";
// REMOVED: import { onAuthStateChanged } from "firebase/auth";
// REMOVED: import { authentication } from "../../../../firebase";
import { Box, CircularProgress } from "@mui/material";
// REMOVED: import { ADMIN_UIDS } from "../../../../data/constants";

const DoctorSidebar = () => {
  const router = useRouter();
  // REMOVED: const { currentUser, userData, loading, setLoading, setCurrentUser, setUserData } = useAuth();
  
  // 🔐 SIMPLE AUTH STATE
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const AUTH_STORAGE_KEY = "adminConsultatiiAuth";

  const availablity = [
    { value: "Online acum", label: "Online acum" },
    { value: "Offline", label: "Offline" },
  ];

  // 🔐 CHECK SIMPLE AUTH INSTEAD OF FIREBASE
  useEffect(() => {
    console.log("🔄 [DOCTOR SIDEBAR] Checking simple auth...");
    
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      const storedTime = localStorage.getItem(AUTH_STORAGE_KEY + "_time");
      
      if (storedAuth && storedTime) {
        const authTime = parseInt(storedTime);
        const currentTime = Date.now();
        const hoursPassed = (currentTime - authTime) / (1000 * 60 * 60);
        
        // Auth expires after 1 week (168 hours)
        if (hoursPassed < 168) {
          console.log("✅ [DOCTOR SIDEBAR] Valid simple auth found");
          setIsAuthenticated(true);
          setLoading(false);
          return;
        } else {
          console.log("⏰ [DOCTOR SIDEBAR] Simple auth expired, clearing...");
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(AUTH_STORAGE_KEY + "_time");
        }
      }
      
      console.log("❌ [DOCTOR SIDEBAR] No valid auth, redirecting to login");
      router.push("/login-admin-consultatii");
      setLoading(false);
      
    } catch (error) {
      console.error("💥 [DOCTOR SIDEBAR] Error checking auth:", error);
      router.push("/login-admin-consultatii");
      setLoading(false);
    }
  }, [router]);

  // 🔐 SIMPLE LOGOUT FUNCTION
  const handleSimpleLogout = () => {
    console.log("🔐 [DOCTOR SIDEBAR] Simple logout triggered");
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY + "_time");
      console.log("✅ [DOCTOR SIDEBAR] Auth cleared, redirecting to login");
      router.push("/login-admin-consultatii");
    } catch (error) {
      console.error("💥 [DOCTOR SIDEBAR] Error during logout:", error);
      router.push("/login-admin-consultatii");
    }
  };

  return (
    <>
      {/* Profile Sidebar */}
      <div className="profile-sidebar doctor-sidebar profile-sidebar-new">
        <div className="widget-profile pro-widget-content">
          <div className="profile-info-widget">
            <Link href="#" className="booking-doc-img">
              <img src={"/img/profilecristina.png"} alt="User Image" />
            </Link>
            <div className="profile-det-info">
              <h3>
                <Link href="#">Cristina Zurba</Link>
              </h3>
              {/* <div className="patient-details">
                <h5 className="mb-0">
                  BDS, MDS - Oral &amp; Maxillofacial Surgery
                </h5>
              </div> */}
              {/* <span className="badge doctor-role-badge">
                <i className="fa-solid fa-circle" />
                Dentist
              </span> */}
            </div>
          </div>
        </div>
        {/* <div className="doctor-available-head">
          <div className="input-block input-block-new">
            <label className="form-label">
              Vizibilitate <span className="text-danger">*</span>
            </label>

            <Select
              className="select"
              options={availablity}
              defaultValue={availablity[0]}
            />
          </div>
        </div> */}
        <div className="dashboard-widget">
          <nav className="dashboard-menu">
            <ul>
              <li className={false ? "active" : ""}>
                <Link href="/admin-consultatii">
                  <i className="fa-solid fa-shapes me-2" />
                  <span>Panou principal</span>
                </Link>
              </li>
              {/* <li
                className={
                  pathnames.includes("/doctor/doctor-request") ? "active" : ""
                }
              >
                <Link href="/doctor/doctor-request">
                  <i className="fa-solid fa-calendar-check me-2" />
                  <span>Requests</span>
                  <small className="unread-msg">2</small>
                </Link>
              </li> */}
              <li
              // className={
              //   pathnames.includes("/doctor/doctor-appointments-grid") ||
              //   pathnames.includes("/doctor/appointments") ||
              //   pathnames.includes("/doctor/doctor-appointment-start") ||
              //   pathnames.includes("/doctor/doctor-upcoming-appointment") ||
              //   pathnames.includes(
              //     "/doctor/doctor-cancelled-appointment-2"
              //   ) ||
              //   pathnames.includes("/doctor/doctor-cancelled-appointment")
              //     ? "active"
              //     : ""
              // }
              >
                <Link href="/rezervari">
                  <i className="fa-solid fa-calendar-days me-2" />
                  <span>Rezervari</span>
                </Link>
              </li>

              <li className={false ? "active" : ""}>
                <Link href="/calendar-admin">
                  <i className="fa-solid fa-calendar-day me-2" />
                  <span>Calendar</span>
                </Link>
              </li>
              <li
              // className={
              //   pathnames.includes("/doctor/my-patients") ||
              //   pathnames.includes("/doctor/patient-profile")
              //     ? "active"
              //     : ""
              // }
              >
                <Link href="/clienti">
                  <i className="fa-solid fa-user me-2" />
                  <span>Clienti</span>
                </Link>
              </li>
              <li className={false ? "active" : ""}>
                <Link href="/categorii-consultatii">
                  <i className="fa-solid fa-clock me-2" />
                  <span>Categorii Consultatii</span>
                </Link>
              </li>
              <li className={false ? "active" : ""}>
                <Link href="/admin-conferinte-grup">
                  <i className="fa-solid fa-users me-2" />
                  <span>Conferințe de Grup</span>
                </Link>
              </li>
              <li className={false ? "active" : ""}>
                <Link href="/admin-recordings">
                  <i className="fa-solid fa-video me-2" />
                  <span>Înregistrări Video</span>
                </Link>
              </li>
              {/* <li
                className={pathnames.includes("/doctor/review") ? "active" : ""}
              >
                <Link href="/doctor/review">
                  <i className="fas fa-star me-2" />
                  <span>Reviews</span>
                </Link>
              </li> */}
              {/* <li
              // className={
              //   pathnames.includes("/doctor/account") ? "active" : ""
              // }
              >
                <Link href="/rezervari">
                  <i className="fa-solid fa-file-contract me-2" />
                  <span>Rezervari</span>
                </Link>
              </li> */}
              <li className={false ? "active" : ""}>
                <Link href="/facturi-clienti">
                  <i className="fa-solid fa-file-lines me-2" />
                  <span>Facturi</span>
                </Link>
              </li>
              {/* <li
                className={
                  pathnames.includes("/doctor/doctor-payment") ? "active" : ""
                }
              >
                <Link href="/doctor/doctor-payment">
                  <i className="fa-solid fa-money-bill-1 me-2" />
                  <span>Payout Settings</span>
                </Link>
              </li> */}
              {/* <li>
                <Link href="/doctor/chat-doctor">
                  <i className="fa-solid fa-comments me-2" />
                  <span>Message</span>
                  <small className="unread-msg">7</small>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/doctor/profile-setting") ||
                  pathnames.includes("/doctor/doctor-experience") ||
                  pathnames.includes("/doctor/doctor-awards-settings") ||
                  pathnames.includes("/doctor/doctor-insurance-settings") ||
                  pathnames.includes("/doctor/doctor-clinics-settings") ||
                  pathnames.includes("/doctor/doctor-business-setting")
                    ? "active"
                    : ""
                }
              >
                <Link href="/doctor/profile-setting">
                  <i className="fa-solid fa-user-pen me-2" />
                  <span>Setari profil</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/doctor/social-media") ? "active" : ""
                }
              >
                <Link href="/doctor/social-media">
                  <i className="fa-solid fa-shield me-2" />
                  <span>Social Media</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/doctor/doctor-change-password")
                    ? "active"
                    : ""
                }
              >
                <Link href="/doctor/doctor-change-password">
                  <i className="fa-solid fa-key me-2" />
                  <span>Change Password</span>
                </Link>
              </li> */}
              <li className={false ? "active" : ""}>
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSimpleLogout();
                  }}
                >
                  <i className="fa-solid fa-calendar-check me-2" />
                  <span>Deconectare</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      {/* /Profile Sidebar */}
    </>
  );
};

export default DoctorSidebar;
