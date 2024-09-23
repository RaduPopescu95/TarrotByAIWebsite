import React, { useState } from "react";
import Link from "next/link";
import Footer from "../footer";
import Home1Header from "../home/home-1/header";
import { emailWithoutSpace } from "../../../utils/strintText";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { authentication, db } from "../../../firebase";
import { doc, setDoc } from "firebase/firestore";
import { handleFirebaseAuthError } from "../../../utils/authUtils";
import { useRouter } from "next/router";

const RegisterClient = (props) => {
  const [firstName, setFirstName] = useState(""); // Stare pentru prenume
  const [lastName, setLastName] = useState(""); // Stare pentru nume
  const [email, setEmail] = useState(""); // Stare pentru email
  const [password, setPassword] = useState(""); // Stare pentru parolă
  const [confirmPassword, setConfirmPassword] = useState(""); // Stare pentru confirmarea parolei
  const [error, setError] = useState(""); // Stare pentru mesaje de eroare
  const router = useRouter();

  // Functia de inscriere
  const handleSignUp = async (event) => {
    event.preventDefault(); // Prevenim comportamentul default al formularului

    // Validare pentru coincidența parolelor
    if (password !== confirmPassword) {
      setError("Parolele nu coincid!");
      return;
    }

    try {
      const emailFormatted = emailWithoutSpace(email); // Formatam emailul pentru a elimina spatiile
      const userCredential = await createUserWithEmailAndPassword(
        authentication,
        emailFormatted,
        password
      );
      
      console.log("User created successfully with email: ", userCredential.user);
      const owner_uid = userCredential.user.uid;

      // Crearea unui nou document în Firebase Firestore
      const userData = {
        email: emailFormatted,
        first_name: firstName,
        last_name: lastName,
        owner_uid,
      };

      await setDoc(doc(db, "Users", owner_uid), userData).then(() => {
        console.log("Înregistrare cu succes");
      });

      setTimeout(() => {
        router.push("/consultatii");
      }, 3000);
      
    } catch (error) {
      console.error("Eroare la crearea utilizatorului: ", error);
      const message = handleFirebaseAuthError(error); // Gestionăm eroarea folosind utilitarul nostru
      setError(message);
    }
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
                      <h3>Înregistrează cont</h3>
                    </div>
                    {/* Register Form */}
                    <form onSubmit={handleSignUp}>
                      <div className="form-group form-focus">
                        <input
                          type="text"
                          className="form-control floating"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)} // Actualizare stare prenume
                          required
                        />
                        <label className="focus-label">Prenume</label>
                      </div>

                      <div className="form-group form-focus">
                        <input
                          type="text"
                          className="form-control floating"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)} // Actualizare stare nume
                          required
                        />
                        <label className="focus-label">Nume</label>
                      </div>

                      <div className="form-group form-focus">
                        <input
                          type="email"
                          className="form-control floating"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)} // Actualizare stare email
                          required
                        />
                        <label className="focus-label">Email</label>
                      </div>

                      <div className="form-group form-focus">
                        <input
                          type="password"
                          className="form-control floating"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)} // Actualizare stare parolă
                          required
                        />
                        <label className="focus-label">Parolă</label>
                      </div>

                      <div className="form-group form-focus">
                        <input
                          type="password"
                          className="form-control floating"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)} // Actualizare stare confirmare parolă
                          required
                        />
                        <label className="focus-label">Confirmă parolă</label>
                      </div>

                      {error && <p className="text-danger">{error}</p>}

                      <div className="text-end">
                        <Link className="forgot-link" href="/login">
                          Ai deja cont?
                        </Link>
                      </div>

                      <button
                        className="btn btn-primary w-100 btn-lg login-btn"
                        type="submit"
                      >
                        Înregistrează
                      </button>
                    </form>
                    {/* /Register Form */}
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

export default RegisterClient;
