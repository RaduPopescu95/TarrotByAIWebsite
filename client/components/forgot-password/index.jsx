import React, { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase"; // Asumând că auth este configurat în Firebase
import Footer from "../footer";
import Home1Header from "../home/home-1/header";
import { authentication } from "../../../firebase";
import { useRouter } from "next/router";

const ForgotPassword = (props) => {
  const [email, setEmail] = useState(""); // Stare pentru email
  const [successMessage, setSuccessMessage] = useState(""); // Mesaj pentru succes
  const [error, setError] = useState(""); // Mesaj pentru erori
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(""); // Resetare erori anterioare
    setSuccessMessage(""); // Resetare mesaje de succes

    sendPasswordResetEmail(authentication, email)
      .then(() => {
        setSuccessMessage(
          "Un email pentru resetarea parolei a fost trimis cu succes. Vei fi redirecționat în curând."
        );

        // După 3 secunde, redirecționează utilizatorul
        setTimeout(() => {
          router.push("/login-client");
        }, 3000);
      })
      .catch((error) => {
        console.error("Error during password reset:", error.message);
        setError(
          "Resetarea parolei a eșuat. Mesaj de eroare: " + error.message
        );
      });
  };

  return (
    <>
      <Home1Header />

      <div className="content top-space">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-8 offset-md-2">
              <div className="account-content">
                <div className="row align-items-center justify-content-center">
                  <div className="col-md-7 col-lg-6 login-left">
                    <img
                      src={"/img/banner-image.png"}
                      className="img-fluid"
                      alt="Cristina Zurba password reset"
                    />
                  </div>
                  <div className="col-md-12 col-lg-6 login-right">
                    <div className="login-header">
                      <h3>Resetare Parolă</h3>
                    </div>
                    <form onSubmit={handleSubmit}>
                      <div className="form-group form-focus">
                        <input
                          type="email"
                          className="form-control floating"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)} // Actualizare stare pentru email
                          required
                        />
                        <label className="focus-label">Email</label>
                      </div>
                      {error && <p className="text-danger">{error}</p>}
                      {successMessage && (
                        <p className="text-success">{successMessage}</p>
                      )}
                      <button
                        className="btn btn-primary w-100 btn-lg login-btn"
                        type="submit"
                      >
                        Trimite link de resetare
                      </button>
                      <div className="text-end mt-3">
                        <Link className="forgot-link" href="/login-client">
                          Înapoi la autentificare
                        </Link>
                      </div>
                      <div className="text-center dont-have mt-4">
                        Nu ai cont?{" "}
                        <Link href="/register-client">Înregistrează-te</Link>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer {...props} />
    </>
  );
};

export default ForgotPassword;
