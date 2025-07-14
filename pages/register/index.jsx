import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { validateEmail } from "../../utils/commonUtils";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { authentication, db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { handleFirebaseAuthError } from "../../utils/authUtils";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import Header from "../../components/Header";
import Head from "next/head";

function Copyright(props) {
  return (
    <div style={styles.copyrightContainer}>
      <p style={styles.copyrightText}>
        {"Copyright © "}
        <span>Cristina Zurba</span> {new Date().getFullYear()}
        {"."}
      </p>
      <p style={styles.copyrightText}>
        {"dezvoltat de "}
        <Link href="https://webappdynamicx.ro/" style={styles.copyrightLink}>
          Web App Dynamicx
        </Link>{" "}
        {"."}
      </p>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default function SignInSide() {
  // Stări pentru gestionarea erorilor
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [message, setMessage] = React.useState("email");
  const [showSnackback, setShowSnackback] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  
  const { t } = useTranslation("common");
  const { setUserData } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    lastName: "",
    firstName: "",
  });

  // Check if mobile
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isButtonDisabled =
    !formData.email ||
    !formData.password ||
    formData.password !== formData.confirmPassword ||
    !formData.firstName ||
    !formData.lastName;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");
    const confirmPassword = data.get("confirmPassword");
    const last_name = data.get("lastName");
    const first_name = data.get("firstName");

    // Resetare mesaje de eroare
    let hasError = false;

    let isValidEmail = validateEmail(email);

    if (!isValidEmail) {
      console.log("email not valid", email);
      setEmailError("Emailul nu este valid");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (password !== confirmPassword) {
      console.log("parolele nu sunt identice");
      setPasswordError("Parolele nu sunt identice");
      hasError = true;
    } else if (password.length < 6) {
      console.log("Parola trebuie să aibă cel puțin 6 caractere");
      setPasswordError("Parola trebuie să aibă cel puțin 6 caractere");
      hasError = true;
    } else {
      setPasswordError("");
    }

    // Dacă există erori, opriți procesarea formularului
    if (hasError) {
      setIsLoading(false);
      return;
    }

    console.log({ email, first_name, last_name });
    createUserWithEmailAndPassword(authentication, email, password)
      .then((userCredentials) => {
        setTimeout(async () => {
          const user = userCredentials.user;

          const collectionId = "Users";
          const documentId = user.uid;
          const value = {
            owner_uid: user.uid,
            first_name: first_name,
            last_name: last_name,
            email: email,
            // Adaugă orice alte câmpuri necesare
          };
          setUserData({ ...value });
          setDoc(doc(db, collectionId, documentId), value);
          console.log("success PASS");
        }, 1500);
      })
      .then(() => {})
      .then(() => {
        router.push("/");
        setIsLoading(false);
      })
      .catch((error) => {
        const errorMessage = handleFirebaseAuthError(error);
        setShowSnackback(true);
        setMessage(errorMessage);
        setIsLoading(false);
        console.log("error at submit user", error);
      });
  };

  return (
    <>
      <Head>
        <title>{t("registerTitle")}</title>
        <meta name="description" content={t("registerDescription")} />
        <meta name="robots" content="noindex,nofollow" />
        <meta property="og:title" content={t("registerTitle")} />
        <meta property="og:description" content={t("registerDescription")} />
      </Head>

      {/* Main wrapper with unified design */}
      <div style={styles.mainWrapper}>
        {/* Header */}
        <section>
          <Header isOnlySettngs={true} />
        </section>

        {/* Main content container */}
        <div style={styles.contentContainer}>
          
          {/* Left side - Register form */}
          <div style={{...styles.leftSide, marginLeft: isMobile ? '15%' : '0', marginTop: isMobile ? '20%' : '0'}}>
            <div style={styles.formContainer}>
              
              {/* Logo */}
              <div style={styles.logoContainer}>
                <Image
                  src="/LogoPngTransparent.png"
                  width={100}
                  height={100}
                  alt="Cristina Zurba Logo"
                />
              </div>

              {/* Title */}
              <h1 style={styles.title}>
                Înregistrare
              </h1>

              {/* Register Form */}
              <form onSubmit={handleSubmit} style={styles.form}>
                
                {/* First Name Field */}
                <div style={styles.inputGroup}>
                  <label htmlFor="firstName" style={styles.label}>
                    Prenume *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    autoComplete="given-name"
                    style={styles.input}
                    placeholder="Prenume"
                    onChange={handleChange}
                  />
                </div>

                {/* Last Name Field */}
                <div style={styles.inputGroup}>
                  <label htmlFor="lastName" style={styles.label}>
                    Nume *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    autoComplete="family-name"
                    style={styles.input}
                    placeholder="Nume"
                    onChange={handleChange}
                  />
                </div>

                {/* Email Field */}
                <div style={styles.inputGroup}>
                  <label htmlFor="email" style={styles.label}>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    style={{...styles.input, borderColor: emailError ? '#ff4757' : '#e9ecef'}}
                    placeholder="exemplu@email.com"
                    onChange={handleChange}
                  />
                  {emailError && (
                    <p style={styles.errorText}>{emailError}</p>
                  )}
                </div>

                {/* Password Field */}
                <div style={styles.inputGroup}>
                  <label htmlFor="password" style={styles.label}>
                    Parolă *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    autoComplete="new-password"
                    style={{...styles.input, borderColor: passwordError ? '#ff4757' : '#e9ecef'}}
                    placeholder="••••••••"
                    onChange={handleChange}
                  />
                  {passwordError && (
                    <p style={styles.errorText}>{passwordError}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div style={styles.inputGroup}>
                  <label htmlFor="confirmPassword" style={styles.label}>
                    Confirmă parola *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    autoComplete="new-password"
                    style={{...styles.input, borderColor: passwordError ? '#ff4757' : '#e9ecef'}}
                    placeholder="••••••••"
                    onChange={handleChange}
                  />
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  style={{
                    ...styles.registerButton,
                    ...(isButtonDisabled ? styles.buttonDisabled : {})
                  }}
                  disabled={isButtonDisabled || isLoading}
                >
                  {isLoading ? (
                    <div style={styles.spinner}></div>
                  ) : (
                    "Înregistrare"
                  )}
                </button>

                {/* Links */}
                <div style={styles.linksContainer}>
                  <div style={styles.linkGroup}>
                    <span style={styles.linkText}>
                      Ai deja un cont?
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      style={styles.link}
                    >
                      Autentificare
                    </button>
                  </div>
                </div>

                {/* Copyright */}
                <div style={styles.copyrightSection}>
                  <Copyright />
                </div>

              </form>
            </div>
          </div>

          {/* Right side - Marketing content */}
          <div style={styles.rightSide}>
            <div style={styles.marketingContent}>
              <div style={styles.marketingContainer}>
                
                {/* App marketing section */}
                <div style={styles.appSection}>
                  <Image
                    src="/appmarketing.png"
                    width={450}
                    height={450}
                    alt="App Marketing"
                    style={styles.appImage}
                  />
                  
                  <div style={styles.downloadSection}>
                    <h2 style={styles.downloadTitle}>
                      Descarcă 
                      <span style={styles.downloadTitleBold}>
                        aplicația acum
                      </span>
                    </h2>
                  </div>
                  
                  <div style={styles.storeButtons}>
                    <div style={styles.storeButton}>
                      <Link href="https://play.google.com/store/apps/details?id=com.cristina.zurba.tarot">
                        <img
                          src="/gplay.png"
                          alt="Google Play"
                          style={styles.storeIcon}
                        />
                      </Link>
                      <p style={styles.storeLabel}>Android</p>
                    </div>
                    <div style={styles.storeButton}>
                      <Link href="https://apps.apple.com/ro/app/cristina-zurba/id6475713937">
                        <img
                          src="/appstore.png"
                          alt="App Store"
                          style={styles.storeIcon}
                        />
                      </Link>
                      <p style={styles.storeLabel}>iOS</p>
                    </div>
                  </div>
                </div>

                {/* Tarot section */}
                <div style={styles.tarotSection}>
                  <Image
                    src="/lucky-deco.png"
                    width={278}
                    height={65}
                    alt="Lucky decoration"
                  />
                  <Image
                    src="/onboardImg.png"
                    width={400}
                    height={450}
                    alt="Tarot reading"
                    style={styles.tarotImage}
                  />
                  <h1 style={{...styles.tarotTitle, fontSize: isMobile ? '40px' : '80px'}}>
                    Tarot by AI
                  </h1>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Error notification */}
        {showSnackback && (
          <div style={styles.errorNotification}>
            <div style={styles.errorContent}>
              <i className="fa fa-exclamation-triangle" style={styles.errorIcon}></i>
              <span>{message}</span>
              <button
                style={styles.errorClose}
                onClick={() => setShowSnackback(false)}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// Styles matching /consultatii design
const styles = {
  mainWrapper: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    width: '100%',
  },
  contentContainer: {
    display: 'flex',
    minHeight: '100vh',
  },
  leftSide: {
    width: '41.67%', // 5/12
    padding: '2rem',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto',
    '@media (max-width: 768px)': {
      width: '100%',
      padding: '1rem',
    },
  },
  rightSide: {
    width: '58.33%', // 7/12
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    padding: '2rem',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e9ecef',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  errorText: {
    fontSize: '12px',
    color: '#ff4757',
    marginTop: '0.5rem',
    margin: '0.5rem 0 0 0',
  },
  registerButton: {
    width: '100%',
    padding: '15px 24px',
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  buttonDisabled: {
    background: '#e9ecef',
    color: '#6c757d',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid transparent',
    borderTop: '2px solid currentColor',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  linksContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  linkGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '0',
  },
  linkText: {
    fontSize: '14px',
    color: '#666',
  },
  copyrightSection: {
    marginTop: '2rem',
  },
  copyrightContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  copyrightText: {
    fontSize: '12px',
    color: '#666',
    margin: '0',
  },
  copyrightLink: {
    color: '#667eea',
    textDecoration: 'none',
  },
  marketingContent: {
    padding: '2rem',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketingContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3rem',
    maxWidth: '1000px',
  },
  appSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  appImage: {
    marginBottom: '1rem',
  },
  downloadSection: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  downloadTitle: {
    color: 'white',
    fontWeight: '300',
    margin: '0',
    fontSize: '1.5rem',
  },
  downloadTitleBold: {
    fontWeight: 'bold',
    marginLeft: '5px',
  },
  storeButtons: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '2rem',
    width: '70%',
  },
  storeButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  storeIcon: {
    width: '60px',
    height: '60px',
    marginBottom: '0.5rem',
  },
  storeLabel: {
    margin: '0',
    color: 'white',
    backgroundColor: 'rgba(40, 49, 64, 0.5)',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  tarotSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tarotImage: {
    marginTop: '1rem',
    marginBottom: '1rem',
  },
  tarotTitle: {
    color: 'white',
    fontWeight: 'bold',
    margin: '0',
    textAlign: 'center',
  },
  errorNotification: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    animation: 'slideInUp 0.3s ease-out',
  },
  errorContent: {
    background: '#ff4757',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  },
  errorIcon: {
    fontSize: '18px',
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '0',
    marginLeft: '10px',
    fontSize: '16px',
  },
};
