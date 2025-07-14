import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "next-i18next";

function Copyright() {
  const { t } = useTranslation("common");

  return (
    <p style={styles.copyright}>
      &copy;&nbsp; 2024. Cristina Zurba. Toate drepturile rezervate.
    </p>
  );
}

const footers = [
  {
    title: "Companie",
    description: ["Despre"],
    link: ["/about"],
  },
  {
    title: "Legal",
    description: ["Politica de confidențialitate"],
    link: ["/privacypolicy"],
  },
];

// Social Media Icons as SVG components
const InstagramIcon = ({ style }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
      fill="currentColor"
    />
  </svg>
);

const YouTubeIcon = ({ style }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      fill="currentColor"
    />
  </svg>
);

const FacebookIcon = ({ style }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="currentColor"
    />
  </svg>
);

const TikTokIcon = ({ style }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
      fill="currentColor"
    />
  </svg>
);

const GooglePlayIcon = ({ style }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.25 12l2.248-2.491zM5.864 2.658L16.802 8.99 14.5 11.293 5.864 2.658z"
      fill="currentColor"
    />
  </svg>
);

const AppStoreIcon = ({ style }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      fill="currentColor"
    />
  </svg>
);

function Footer(props) {
  const { t } = useTranslation("common");
  const { toggleDir } = props;
  
  // Detectarea dimensiunii ecranului pentru responsive design
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Setarea inițială
    handleResize();
    
    // Ascultarea schimbărilor de dimensiune
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={{
          ...styles.grid,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr 1fr",
          gap: "2rem"
        }} className="footer-grid">
          {/* Logo and Copyright Section */}
          <div style={{
            ...styles.logoSection,
            alignItems: "flex-start"
          }}>
            <div style={styles.logoContainer}>
              <img
                src={"/LogoPngTransparent.png"}
                alt="logo"
                style={styles.logo}
              />
            </div>
            {!isMobile && (
              <div style={styles.copyrightDesktop} className="footer-copyright-desktop">
                <Copyright />
              </div>
            )}
          </div>

          {/* Navigation Links Section */}
          <div style={{
            ...styles.linksSection,
            justifyContent: isMobile ? "flex-start" : "center"
          }}>
            <div style={{
              ...styles.linksGrid,
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "2rem" : "4rem"
            }} className="footer-links-grid">
              {footers.map((footer) => (
                <div key={footer.title} style={styles.linkGroup}>
                  <h3 style={styles.linkTitle}>
                    {footer.title}
                  </h3>
                  <ul style={styles.linkList}>
                    {footer.description.map((item, index) => (
                      <li key={item} style={styles.linkItem}>
                        <Link
                          href={footer.link[index]}
                          style={styles.link}
                          className="footer-link"
                        >
                          {t(item) || item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media Section */}
          <div style={{
            ...styles.socialSection,
            alignItems: isMobile ? "flex-start" : "flex-end"
          }} className="footer-social">
            <h3 style={styles.socialTitle}>Urmărește-mă</h3>
            <div style={{
              ...styles.socialIcons,
              justifyContent: isMobile ? "flex-start" : "flex-end",
              gap: isMobile ? "1rem" : "0.75rem"
            }}>
              <a
                href="https://www.facebook.com/cristina.zurba.tarot"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.socialIcon,
                  backgroundColor: "#1877F2"
                }}
                className="social-icon"
                aria-label="Cristina Zurba on Facebook"
              >
                <FacebookIcon style={styles.iconSvg} />
              </a>

              <a
                href="https://www.instagram.com/cristina.zurba/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.socialIcon,
                  background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)"
                }}
                className="social-icon"
                aria-label="Cristina Zurba on Instagram"
              >
                <InstagramIcon style={styles.iconSvg} />
              </a>

              <a
                href="https://www.youtube.com/@CristinaZurba"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.socialIcon,
                  backgroundColor: "#FF0000"
                }}
                className="social-icon"
                aria-label="Cristina Zurba on Youtube"
              >
                <YouTubeIcon style={styles.iconSvg} />
              </a>

              <a
                href="https://www.youtube.com/channel/UCzL4kjv6nzRDC6Hi24x7lSg"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.socialIcon,
                  backgroundColor: "#FF0000"
                }}
                className="social-icon"
                aria-label="Cristina Zurba Second Youtube Channel"
              >
                <YouTubeIcon style={styles.iconSvg} />
              </a>

              <a
                href="https://www.tiktok.com/@cristina.zurba"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.socialIcon,
                  backgroundColor: "#000000"
                }}
                className="social-icon"
                aria-label="Cristina Zurba on TikTok"
              >
                <TikTokIcon style={styles.iconSvg} />
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.cristina.zurba.tarot&pli=1"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.socialIcon,
                  backgroundColor: "#34A853"
                }}
                className="social-icon"
                aria-label="Cristina Zurba App on Google Play"
              >
                <GooglePlayIcon style={styles.iconSvg} />
              </a>

              <a
                href="https://apps.apple.com/ro/app/cristina-zurba-tarot/id6475713937"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.socialIcon,
                  backgroundColor: "#000000"
                }}
                className="social-icon"
                aria-label="Cristina Zurba App on App Store"
              >
                <AppStoreIcon style={styles.iconSvg} />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Copyright */}
        {isMobile && (
          <div style={{
            ...styles.copyrightMobile,
            display: "block",
            textAlign: "left",
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.3)"
          }} className="footer-copyright-mobile">
            <Copyright />
          </div>
        )}
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)",
    backdropFilter: "blur(20px)",
    color: "white",
    padding: "4rem 0 2rem",
    marginTop: "0",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
  },
  grid: {
    display: "grid",
    alignItems: "start",
  },
  logoSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  logoContainer: {
    overflow: "hidden",
    marginBottom: "1rem",
  },
  logo: {
    width: "50px",
    height: "auto",
    objectFit: "contain",
  },
  copyrightDesktop: {
    // Displayed/hidden conditionally via JavaScript
  },
  copyrightMobile: {
    display: "none",
    // Displayed/hidden conditionally via JavaScript
  },
  copyright: {
    color: "white",
    fontSize: "14px",
    margin: 0,
  },
  linksSection: {
    display: "flex",
    justifyContent: "center",
  },
  linksGrid: {
    display: "flex",
    // Gap and direction handled conditionally via JavaScript
  },
  linkGroup: {
    minWidth: "120px",
  },
  linkTitle: {
    fontSize: "17px",
    fontWeight: "600",
    color: "white",
    marginBottom: "1rem",
    margin: "0 0 1rem 0",
  },
  linkList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  linkItem: {
    marginBottom: "0.5rem",
  },
  link: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "16px",
    textDecoration: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    padding: "0.5rem 0",
    borderRadius: "4px",
    position: "relative",
    "&:hover": {
      color: "#ffffff",
      transform: "translateX(4px)",
    },
  },
  socialSection: {
    display: "flex",
    flexDirection: "column",
    // Alignment handled conditionally via JavaScript
  },
  socialTitle: {
    fontSize: "17px",
    fontWeight: "600",
    color: "white",
    marginBottom: "1rem",
    margin: "0 0 1rem 0",
  },
  socialIcons: {
    display: "flex",
    flexWrap: "wrap",
    // Gap and justification handled conditionally via JavaScript
  },
  socialIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    textDecoration: "none",
    transition: "transform 0.3s ease",
    "&:hover": {
      transform: "scale(1.1)",
    },
  },
  iconSvg: {
    color: "white",
    width: "18px",
    height: "18px",
  },
};

// CSS styles are handled in global styles to avoid hydration issues

Footer.propTypes = {
  toggleDir: PropTypes.func,
};

Footer.defaultProps = {
  toggleDir: () => {},
};

export default Footer;