import React, { useState } from "react";
import Link from "next/link";
import { handleSignIn } from "../../../utils/authUtils";
import Footer from "../footer";
import Home1Header from "../home/home-1/header";
import { useRouter } from "next/router";
import { useAuth } from "../../../context/AuthContext";

const LoginContainer = (props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Stare pentru a stoca mesaje de eroare
  const { setCurrentUser } = useAuth();
  const router = useRouter();

  // Functie pentru a gestiona trimiterea formularului
  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("🔑 [LOGIN] Attempting admin login with email:", email);

    handleSignIn(email, password)
      .then((userCredentials) => {
        console.log("✅ [LOGIN] User credentials received:", userCredentials.user.uid);
        console.log("🔐 [LOGIN] Checking if UID is in admin list...");
        
        // Import ADMIN_UIDS to check if this user is admin
        import("../../../data/constants").then((constants) => {
          if (constants.ADMIN_UIDS.includes(userCredentials.user.uid)) {
            console.log("✅ [LOGIN] User is admin, redirecting to dashboard...");
            setTimeout(() => {
              router.push("/admin-consultatii");
            }, 500);
          } else {
            console.error("❌ [LOGIN] User is not admin, UID:", userCredentials.user.uid);
            setError("Access denied. Only admins can access this area.");
          }
        });
      })
      .catch((error) => {
        console.error("❌ [LOGIN] Error during sign in:", error.message);
        setError("Failed to log in. Error message: " + error.message);
      });
  };

  return (
    <>
      <Home1Header />

      <>
        {/* Page Content */}
        <div className="content top-space" style={{ paddingTop: '120px' }}>
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-8 offset-md-2">
                {/* Login Tab Content */}
                <div className="account-content">
                  <div className="row align-items-center justify-content-center">
                    <div className="col-md-12 col-lg-6 login-right">
                      <div className="login-header">
                        <h3>Autentificare</h3>
                      </div>
                      <form onSubmit={handleSubmit}>
                        <div className="form-group form-focus">
                          <input
                            type="email"
                            className="form-control floating"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                          <label className="focus-label">Email</label>
                        </div>
                        <div className="form-group form-focus">
                          <input
                            type="password"
                            className="form-control floating"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <label className="focus-label">Parola</label>
                        </div>
                        {error && <p style={{ color: "red" }}>{error}</p>}
                        <button
                          className="btn btn-primary w-100 btn-lg login-btn"
                          type="submit"
                        >
                          Autentificare
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
                {/* /Login Tab Content */}
              </div>
            </div>
          </div>
        </div>
        {/* /Page Content */}
      </>

      {/* <Footer {...props} /> */}
    </>
  );
};

export default LoginContainer;
