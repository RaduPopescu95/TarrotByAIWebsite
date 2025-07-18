import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  handleChangeEmail,
  handleChangePassword,
  handleLogout,
} from "../../utils/authUtils";
import { useAuth } from "../../context/AuthContext";
import PasswordDialog from "../../components/PasswordDialog/PasswordDialog";
import { handleUpdateFirestore } from "../../utils/firestoreUtils";
import Header from "../../components/Header";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
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
  const {
    currentUser,
    isGuestUser,
    setAsGuestUser,
    setUserData,
    userData,
    setCurrentUser,
  } = useAuth();
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [message, setMessage] = React.useState("email");
  const [showSnackback, setShowSnackback] = React.useState(false);
  const { t } = useTranslation("common");

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [registerType, setRegisterType] = React.useState("email");
  const [isLoading, setIsLoading] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalVisibleDelete, setModalVisibleDelete] = React.useState(false);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [last_name, setLastName] = React.useState("");
  const [first_name, setFirstName] = React.useState("");
  const [snackMessage, setSnackMessage] = React.useState("");
  const [isMobile, setIsMobile] = React.useState(false);

  const router = useRouter();

  // Check if mobile
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleResetForm = () => {
    setEmail("");
    setConfirmPassword("");
    setPassword("");
    setLastName("");
    setFirstName("");
  };

  const handleSubmit = (event) => {
    if (event) {
      event.preventDefault();
    }
    setIsLoading(true);

    let copyUserData = { ...userData };

    console.log("password...", password);
    console.log("currentPassword...", currentPassword);
    console.log("confirmPassword...", confirmPassword);
    //change password
    if (
      password &&
      currentPassword.length == 0 &&
      password === confirmPassword
    ) {
      console.log("first");
      setModalVisible(true);
    } else if (password && currentPassword.length > 0) {
      console.log("second");
      handleChangePassword(currentPassword, password).then(() => {
        setMessage("Password changed successfully");
        setShowSnackback(!showSnackback);
        setModalVisible(!modalVisible);
        handleResetForm();
      });
    }

    //change email
    if (email && currentPassword.length == 0) {
      console.log("first");
      setModalVisible(true);
    } else if (email && currentPassword.length > 0) {
      console.log("second");
      handleChangeEmail(currentPassword, email).then((message) => {
        if (message.length > 0) {
          setMessage(message);
        } else {
          setMessage(
            "Please check your new e-mail inbox or spam to verify the new e-mail"
          );
        }
        setShowSnackback(!showSnackback);
        setModalVisible(!modalVisible);
        handleResetForm();
      });
    }

    if (first_name) {
      copyUserData.first_name = first_name;

      const userLocation = `Users/${
        userData.owner_uid ? userData.owner_uid : ""
      }`; // Calea către document
      setUserData(copyUserData);
      handleUpdateFirestore(userLocation, copyUserData)
        .then(() => {
          console.log("Document successfully updated!");
          setMessage("Name updated successfully");
          setShowSnackback(!showSnackback);
          handleResetForm();
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    }

    if (last_name) {
      copyUserData.last_name = last_name;

      const userLocation = `Users/${
        userData.owner_uid ? userData.owner_uid : ""
      }`; // Calea către document
      console.log("TEst...here", copyUserData);
      setUserData(copyUserData);
      handleUpdateFirestore(userLocation, copyUserData)
        .then(() => {
          console.log("Document successfully updated!");
          setMessage("Name updated successfully");
          setShowSnackback(!showSnackback);
          handleResetForm();
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    }

    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Setări Cont | Cristina Zurba</title>
        <meta name="description" content="Gestionează setările contului tău pentru consultațiile spirituale cu Cristina Zurba." />
        <meta name="robots" content="noindex,nofollow" />
        <meta property="og:title" content="Setări Cont | Cristina Zurba" />
        <meta property="og:description" content="Gestionează setările contului tău pentru consultațiile spirituale cu Cristina Zurba." />
      </Head>

      {/* Main wrapper with unified design */}
      <div style={styles.mainWrapper}>
        {/* Header */}
        <section>
          <Header isOnlySettngs={true} />
        </section>

        {/* Main content container */}
        <div style={styles.contentContainer}>
          
          {/* Left side - Settings forms */}
          <div style={{...styles.leftSide, marginLeft: isMobile ? '15%' : '0', marginTop: isMobile ? '22%' : '0'}}>
            
            {/* Back button */}
            <div style={styles.backButton}>
              <button
                onClick={() => window.history.back()}
                style={styles.backButtonElement}
              >
                ← Back
              </button>
            </div>

            {/* Guest user view */}
            {isGuestUser ? (
              <div style={styles.guestContainer}>
                <div style={styles.logoContainer}>
                  <Image
                    src="/LogoPngTransparent.png"
                    width={140}
                    height={140}
                    alt="Cristina Zurba Logo"
                  />
                </div>

                <h1 style={styles.guestTitle}>
                  {t("createAccountCTA")}
                </h1>
                <p style={styles.guestMessage}>
                  {t("createAccountCTAMessage")}
                </p>

                <form onSubmit={handleSubmit} style={styles.guestForm}>
                  <button
                    onClick={() => {
                      handleLogout().then(() => {
                        setCurrentUser(null);
                        setUserData(null);
                        setAsGuestUser(false);
                        router.push("login");
                      });
                    }}
                    type="submit"
                    style={styles.registerButton}
                  >
                    {t("register")}
                  </button>
                  <div style={styles.copyrightSection}>
                    <Copyright />
                  </div>
                </form>
              </div>
            ) : (
              /* Authenticated user view */
              <div style={styles.userContainer}>
                <div style={styles.logoContainer}>
                  <Image
                    src="/LogoPngTransparent.png"
                    width={130}
                    height={130}
                    alt="Cristina Zurba Logo"
                  />
                </div>

                <div style={styles.userInfo}>
                  <h1 style={styles.userTitle}>
                    {t("myAccount")}
                  </h1>
                  <button
                    onClick={() => router.push("/istoric-citiri-personalizate")}
                    style={styles.historyLink}
                  >
                    {t("historyPersonalized")}
                  </button>
                  <button
                    onClick={() => router.push("/istoric-citiri-viitor")}
                    style={styles.historyLinkSecondary}
                  >
                    {t("historyFuture")}
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={styles.settingsForm}>
                  {/* First Name */}
                  <div style={styles.inputGroup}>
                    <label htmlFor="first-name" style={styles.label}>
                      {t("firstName")}
                    </label>
                    <input
                      type="text"
                      id="first-name"
                      name="first-name"
                      autoComplete="first-name"
                      onChange={(e) => setFirstName(e.target.value)}
                      value={first_name}
                      style={styles.input}
                      placeholder={t("firstName")}
                    />
                  </div>

                  {/* Last Name */}
                  <div style={styles.inputGroup}>
                    <label htmlFor="last-name" style={styles.label}>
                      {t("lastName")}
                    </label>
                    <input
                      type="text"
                      id="last-name"
                      name="last-name"
                      autoComplete="last-name"
                      onChange={(e) => setLastName(e.target.value)}
                      value={last_name}
                      style={styles.input}
                      placeholder={t("lastName")}
                    />
                  </div>

                  {/* Email */}
                  <div style={styles.inputGroup}>
                    <label htmlFor="email" style={styles.label}>
                      {t("email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                      style={styles.input}
                      placeholder={t("email")}
                    />
                  </div>

                  {/* New Password */}
                  <div style={styles.inputGroup}>
                    <label htmlFor="newPassword" style={styles.label}>
                      {t("createPassword")}
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      autoComplete="new-password"
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                      style={styles.input}
                      placeholder={t("createPassword")}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div style={styles.inputGroup}>
                    <label htmlFor="confirmPassword" style={styles.label}>
                      {t("confirmPassword")}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      autoComplete="new-password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      value={confirmPassword}
                      style={styles.input}
                      placeholder={t("confirmPassword")}
                    />
                  </div>

                  {/* Save Changes Button */}
                  <button
                    type="submit"
                    style={styles.saveButton}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div style={styles.spinner}></div>
                    ) : (
                      t("saveChanges")
                    )}
                  </button>

                  {/* Actions */}
                  <div style={styles.actionsContainer}>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout().then(() => {
                          setCurrentUser(null);
                          setUserData(null);
                          setAsGuestUser(false);
                          router.push("/login");
                        });
                      }}
                      style={styles.logoutButton}
                    >
                      {t("logOut")}
                    </button>
                  </div>

                  {/* Copyright */}
                  <div style={styles.copyrightSection}>
                    <Copyright />
                  </div>
                </form>
              </div>
            )}
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
                      {t("downloadThe")}
                      <span style={styles.downloadTitleBold}>
                        {t("appNow")}
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
                    {t("tarotByAi")}
                  </h1>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Password Dialog */}
        <PasswordDialog
          setModalVisible={setModalVisible}
          modalVisible={modalVisible}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          handleSubmit={handleSubmit}
        />

        {/* Snackbar */}
        {showSnackback && (
          <div style={styles.snackbar}>
            <div style={styles.alert}>
              {message}
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
    position: 'relative',
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
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
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
  backButton: {
    position: 'absolute',
    left: '10px',
    top: '90px',
    zIndex: 11,
    '@media (max-width: 768px)': {
      top: '20px',
    },
  },
  backButtonElement: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#667eea',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  guestContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '55%',
    width: '100%',
    marginTop: '10%',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  guestTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  guestMessage: {
    fontSize: '1rem',
    color: '#666',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  guestForm: {
    width: '80%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  userContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: '0',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '1rem',
    marginBottom: '2rem',
  },
  userTitle: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  historyLink: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '16px',
    cursor: 'pointer',
    textDecoration: 'underline',
    marginBottom: '0.5rem',
    padding: '0.5rem',
  },
  historyLinkSecondary: {
    background: 'none',
    border: 'none',
    color: '#333',
    fontSize: '16px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '0.5rem',
  },
  settingsForm: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
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
  saveButton: {
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
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid transparent',
    borderTop: '2px solid currentColor',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
  },
  logoutButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '16px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '0.5rem',
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
  snackbar: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
  },
  alert: {
    padding: '12px 24px',
    backgroundColor: '#e3f2fd',
    color: '#0277bd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    fontSize: '14px',
  },
};
