import React, { useState, useEffect } from "react";
import Footer from "../footer";
import Home1Header from "../home/home-1/header";
import { useRouter } from "next/router";

const LoginContainer = (props) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁️ Password visibility toggle
  const router = useRouter();
  
  // 🔐 SIMPLE ADMIN PASSWORD SYSTEM
  const ADMIN_PASSWORD = "Cristina1994!";
  const AUTH_STORAGE_KEY = "adminConsultatiiAuth";
  
  console.log("🔐 [ADMIN LOGIN] Simple password login initialized");

  // 🔐 CHECK IF ALREADY AUTHENTICATED ON COMPONENT MOUNT
  useEffect(() => {
    console.log("🔐 [ADMIN LOGIN] Checking stored authentication...");
    
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      const storedTime = localStorage.getItem(AUTH_STORAGE_KEY + "_time");
      
      if (storedAuth && storedTime) {
        const authTime = parseInt(storedTime);
        const currentTime = Date.now();
        const hoursPassed = (currentTime - authTime) / (1000 * 60 * 60);
        
        // Auth expires after 1 week (168 hours)
        if (hoursPassed < 168) {
          console.log("🔐 [ADMIN LOGIN] Valid stored auth found, redirecting...");
          router.push("/admin-consultatii");
          return;
        } else {
          console.log("🔐 [ADMIN LOGIN] Stored auth expired, clearing...");
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(AUTH_STORAGE_KEY + "_time");
        }
      }
      
      console.log("🔐 [ADMIN LOGIN] No valid auth, staying on login page");
      
    } catch (error) {
      console.error("🔐 [ADMIN LOGIN] Error checking stored auth:", error);
    }
  }, [router]);

  // 🔐 HANDLE PASSWORD SUBMISSION
  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    console.log("🔐 [ADMIN LOGIN] Password submitted");

    if (password === ADMIN_PASSWORD) {
      console.log("🔐 [ADMIN LOGIN] Password correct, storing auth");
      
      try {
        // Store authentication
        localStorage.setItem(AUTH_STORAGE_KEY, "authenticated");
        localStorage.setItem(AUTH_STORAGE_KEY + "_time", Date.now().toString());
        
        console.log("🔐 [ADMIN LOGIN] Authentication successful, redirecting...");
        
        setTimeout(() => {
          router.push("/admin-consultatii");
        }, 500);
        
      } catch (storageError) {
        console.error("🔐 [ADMIN LOGIN] Error storing auth:", storageError);
        setError("Eroare la salvarea autentificării");
        setLoading(false);
      }
    } else {
      console.log("🔐 [ADMIN LOGIN] Password incorrect");
      setError("Parolă incorectă!");
      setLoading(false);
    }
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
                        <h3>
                          <i className="fa fa-lock me-2"></i>
                          Acces Admin Consultatii
                        </h3>
                        <p className="text-muted">Introduceți parola de administrator</p>
                      </div>
                      <form onSubmit={handleSubmit}>
                        <div className="form-group form-focus position-relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control floating pe-5"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Parolă Administrator"
                            required
                            autoFocus
                            disabled={loading}
                          />
                          <label className="focus-label">Parolă Administrator</label>
                          
                          {/* 👁️ Password visibility toggle button */}
                          <button
                            type="button"
                            className="btn btn-link position-absolute"
                            style={{
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              border: 'none',
                              background: 'none',
                              color: '#6c757d',
                              padding: '0',
                              zIndex: 10
                            }}
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                            title={showPassword ? "Ascunde parola" : "Arată parola"}
                          >
                            <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                        
                        {error && (
                          <div className="alert alert-danger" role="alert">
                            <i className="fa fa-exclamation-triangle me-2"></i>
                            {error}
                          </div>
                        )}
                        
                        <button
                          className="btn btn-primary w-100 btn-lg login-btn"
                          type="submit"
                          disabled={loading || !password.trim()}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Se autentifică...
                            </>
                          ) : (
                            <>
                              <i className="fa fa-sign-in-alt me-2"></i>
                              Autentificare
                            </>
                          )}
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
