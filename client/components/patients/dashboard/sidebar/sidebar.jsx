import React, { useEffect } from "react";
import Link from "next/link";
import { doctordashboardprofile06 } from "../../../imagepath";
import userImage from "../../../../assets/images/doctors-dashboard/userprofile.png";
import { useRouter } from "next/router";
import { useAuth } from "../../../../../context/AuthContext";
import { authentication } from "../../../../../firebase";
import { handleLogout } from "../../../../../utils/authUtils";
import { onAuthStateChanged } from "firebase/auth";

export const DashboardSidebar = () => {
  const router = useRouter();
  const {
    currentUser,
    userData,
    loading,
    setLoading,
    setCurrentUser,
    setUserData,
  } = useAuth();
  useEffect(() => {
    setLoading(true);
    const authenticated = authentication;
    onAuthStateChanged(authenticated, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        console.log("is user.......");
        setLoading(false);
        // ...
      } else {
        console.log("is user......no.");
        router.push("/login-client");
        setLoading(false);
        // User is signed out
        // ...
      }
    });
  }, []);

  return (
    <>
      {/* Profile Sidebar */}
      <div className="profile-sidebar patient-sidebar profile-sidebar-new">
        <div className="widget-profile pro-widget-content">
          <div className="profile-info-widget">
            <Link href="/patient/profile" className="booking-doc-img">
              <img src={"/img/userprofile.png"} alt="User Image" />
            </Link>
            <div className="profile-det-info">
              <h3>
                <Link href="/patient/profile">
                  {" "}
                  {userData?.first_name.length > 0 && userData.first_name}
                  {userData?.last_name.length > 0 && userData.last_name}
                </Link>
              </h3>
              {/* <div className="patient-details">
                <h5 className="mb-0">Patient ID : PT254654</h5>
              </div> */}
              {/* <span>
                Female <i className="fa-solid fa-circle" /> 32 years 03 Months
              </span> */}
            </div>
          </div>
        </div>
        <div className="dashboard-widget">
          <nav className="dashboard-menu">
            <ul>
              <li className={false ? "active" : ""}>
                <Link href="/cont-client">
                  <i className="fa-solid fa-shapes me-2" />
                  <span>Panou principal</span>
                </Link>
              </li>
              {/* <li className={false ? "active" : ""}>
                <Link href="/patient/patient-appointments">
                  <i className="fa-solid fa-calendar-days me-2" />
                  <span>Rezervarile mele</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/patient/favourites") ? "active" : ""
                }
              >
                <Link href="/patient/favourites">
                  <i className="fa-solid fa-user-doctor me-2" />
                  <span>Favourites</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/patient/dependent") ? "active" : ""
                }
              >
                <Link href="/patient/dependent">
                  <i className="fa-solid fa-user-plus me-2" />
                  <span>Dependants</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/patient/medicalrecords") ? "active" : ""
                }
              >
                <Link href="/patient/medicalrecords">
                  <i className="fa-solid fa-money-bill-1 me-2" />
                  <span>Add Medical Records</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/patient/accounts") ? "active" : ""
                }
              >
                <Link href="/patient/accounts">
                  <i className="fa-solid fa-file-contract me-2" />
                  <span>Accounts</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/patient/patient-invoice") ? "active" : ""
                }
              >
                <Link href="/patient/patient-invoice">
                  <i className="fa-solid fa-file-lines me-2" />
                  <span>Invoices</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/patient/patient-chat") ? "active" : ""
                }
              >
                <Link href="/patient/patient-chat">
                  <i className="fa-solid fa-comments me-2" />
                  <span>Message</span>
                  <small className="unread-msg">7</small>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/patient/profile") ? "active" : ""
                }
              >
                <Link href="/patient/profile">
                  <i className="fa-solid fa-user-pen me-2" />
                  <span>Profile Settings</span>
                </Link>
              </li> */}
              {/* <li
                className={
                  pathnames.includes("/patient/medicaldetail") ? "active" : ""
                }
              >
                <Link href="/patient/medicaldetails">
                  <i className="fa-solid fa-shield-halved me-2" />
                  <span>Medical Details</span>
                </Link>
              </li> */}
              {/* <li className={false ? "active" : ""}>
                <Link href="/patient/change-password">
                  <i className="fa-solid fa-key me-2" />
                  <span>Schimba parola</span>
                </Link>
              </li> */}
              <li>
                <Link
                  href="/login-client"
                  onClick={async (e) => {
                    // Prevenim comportamentul default al link-ului dacă este necesar
                    e.preventDefault();
                    await handleLogout().then(() => {
                      setCurrentUser(null);
                      setUserData(null);
                      router.push("/consultatii");
                    });
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
export default DashboardSidebar;
