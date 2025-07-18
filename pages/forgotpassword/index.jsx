import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Header from "../../components/Header";
import { useRouter } from "next/router";
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
  const { t } = useTranslation("common");
  const [isMobile, setIsMobile] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
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

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get("email"),
    });
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Add actual password reset logic here
    }, 2000);
  };

  return (
    <>
      <Head>
        <title>{t("forgotPasswordTitle")}</title>
        <meta name="description" content={t("forgotPasswordDescription")} />
        <meta name="robots" content="noindex,nofollow" />
        <meta property="og:title" content={t("forgotPasswordTitle")} />
        <meta property="og:description" content={t("forgotPasswordDescription")} />
      </Head>

      {/* Main wrapper with unified design */}
      <div style={styles.mainWrapper}>
        {/* Header */}
        <section>
          <Header isOnlySettngs={true} />
        </section>

        {/* Main content container */}
        <div style={styles.contentContainer}>
          
          {/* Left side - Reset password form */}
          <div style={{...styles.leftSide, marginLeft: isMobile ? '15%' : '0', marginTop: isMobile ? '20%' : '0'}}>
            <div style={styles.formContainer}>
              
              {/* Logo */}
              <div style={styles.logoContainer}>
                <Image
                  src="/LogoPngTransparent.png"
                  width={140}
                  height={140}
                  alt="Cristina Zurba Logo"
                />
              </div>

              {/* Title */}
              <h1 style={styles.title}>
                Resetează parola
              </h1>

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} style={styles.form}>
                
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
                    autoFocus
                    style={styles.input}
                    placeholder="exemplu@email.com"
                  />
                </div>

                {/* Reset Button */}
                <button
                  type="submit"
                  style={styles.resetButton}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div style={styles.spinner}></div>
                  ) : (
                    "Resetează parola"
                  )}
                </button>

                {/* Links */}
                <div style={styles.linksContainer}>
                  <div style={styles.linkGroup}>
                    <span style={styles.linkText}>
                      Îți amintești parola?
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
    marginTop: '20%',
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
    width: '80%',
    margin: '0 auto',
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
  resetButton: {
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
};
