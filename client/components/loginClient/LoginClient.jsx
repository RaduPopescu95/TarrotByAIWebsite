import React, { useState } from "react";
import Link from "next/link";
import { handleSignIn, handleGoogleSignIn, handleFacebookSignIn } from "@/utils/authUtils"; // Asumând că authUtils conține metodele pentru autentificare
import Footer from "../footer";
import Home1Header from "../home/home-1/header";
import { useRouter } from "next/router";
import { useAuth } from "../../../context/AuthContext";

const LoginClient = (props) => {
  const [email, setEmail] = useState(""); // Stare pentru email
  const [password, setPassword] = useState(""); // Stare pentru parolă
  const [error, setError] = useState(""); // Stare pentru erori
  const { setCurrentUser,  currentUser, userData } = useAuth();
  const router = useRouter();

  // Functie pentru a gestiona trimiterea formularului de autentificare
  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(router.query.fromPayment)
    handleSignIn(email, password)
      .then((userCredentials) => {
        console.log("user credentials...", userCredentials);
        setCurrentUser(userCredentials.user); // Setează utilizatorul curent
        if(router?.query?.fromPayment){

          router.push("/calendar"); // Redirecționează după autentificare
        }else{

          router.push("/consultatii"); // Redirecționează după autentificare
        }
      })
      .catch((error) => {
        console.error("Error during sign in:", error.message);
        setError("Failed to log in. Error message: " + error.message);
      });
  };

  // Functie pentru autentificare cu Google
  const handleGoogleLogin = () => {
    handleGoogleSignIn()
      .then((userCredentials) => {
        setCurrentUser(userCredentials.user);
        if(router?.query?.fromPayment){

          router.push("/calendar"); // Redirecționează după autentificare
        }else{

          router.push("/consultatii"); // Redirecționează după autentificare
        }
      })
      .catch((error) => {
        console.error("Error during Google sign in:", error.message);
        setError("Failed to log in with Google. Error message: " + error.message);
      });
  };

  // Functie pentru autentificare cu Facebook
  const handleFacebookLogin = () => {
    handleFacebookSignIn()
      .then((userCredentials) => {
        setCurrentUser(userCredentials.user);
        router.push("/consultatii");
      })
      .catch((error) => {
        console.error("Error during Facebook sign in:", error.message);
        setError("Failed to log in with Facebook. Error message: " + error.message);
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
                      alt="Cristina Zurba login"
                    />
                  </div>
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
                          onChange={(e) => setEmail(e.target.value)} // Actualizează starea pentru email
                          required
                        />
                        <label className="focus-label">Email</label>
                      </div>
                      <div className="form-group form-focus">
                        <input
                          type="password"
                          className="form-control floating"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)} // Actualizează starea pentru parolă
                          required
                        />
                        <label className="focus-label">Parola</label>
                      </div>
                      {error && <p className="text-danger">{error}</p>}
                      <div className="text-end">
                        <Link
                          className="forgot-link"
                          href="/pages/forgot-password"
                        >
                          Ai uitat parola?
                        </Link>
                      </div>
                      <button
                        className="btn btn-primary w-100 btn-lg login-btn"
                        type="submit"
                      >
                        Autentificare
                      </button>
                      <div className="login-or">
                        <span className="or-line" />
                        <span className="span-or">sau</span>
                      </div>
                      <div className="row form-row social-login">
                        <div className="col-6">
                          <button
                            type="button"
                            className="btn btn-facebook w-100"
                            onClick={handleFacebookLogin} // Apel la autentificare cu Facebook
                          >
                            <i className="fab fa-facebook-f me-1" /> Facebook
                          </button>
                        </div>
                        <div className="col-6">
                          <button
                            type="button"
                            className="btn btn-google w-100"
                            onClick={handleGoogleLogin} // Apel la autentificare cu Google
                          >
                            <i className="fab fa-google me-1" /> Google
                          </button>
                        </div>
                      </div>
                      <div className="text-center dont-have">
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

export default LoginClient;
