import React from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";

function HeadlineConsultatii() {
  const { t } = useTranslation("common");

  return (
    <section style={styles.heroSection} className="hero-section">
      {/* Floating geometric elements for visual appeal */}
      <div style={styles.geometricElements}>
        <div style={{...styles.circle, ...styles.circle1}}></div>
        <div style={{...styles.circle, ...styles.circle2}}></div>
        <div style={{...styles.triangle, ...styles.triangle1}}></div>
        <div style={{...styles.triangle, ...styles.triangle2}}></div>
      </div>
      
      <div style={styles.heroContainer} className="hero-content">
        <div style={styles.heroGrid}>
          {/* Left side - Content */}
          <div style={styles.heroContentLeft}>
            <div style={styles.badgeContainer}>
              <div style={styles.badge}>
                <span style={styles.badgeIcon}>✨</span>
                <span>Ghidare spirituală autentică</span>
              </div>
            </div>
            
            <h1 style={styles.heroTitle} className="hero-title">
              <span style={styles.titleMain}>
                {t("heroTitle") || "Descoperă-ți"}
              </span>
              <span style={styles.titleAccent}>
                calea către echilibrul interior
              </span>
            </h1>
            
            <p style={styles.heroSubtitle} className="hero-subtitle">
              {t("heroSubtitle") || "Cristina Zurba te ghidează în călătoria ta spirituală cu înțelepciune, empatie și claritate. Găsește-ți armonia prin citiri personalizate și îndrumare autentică."}
            </p>
            
            <div style={styles.heroActions} className="hero-actions">
              <Link href="/consultatii" style={styles.primaryButtonLink}>
                <button style={styles.primaryButton} className="primary-cta">
                  <span>{t("startConsultation") || "Începe o consultație"}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </Link>
              <button style={styles.secondaryButton} className="secondary-cta">
                <span>{t("learnMore") || "Explorează serviciile"}</span>
              </button>
            </div>
            
            <div style={styles.heroStats} className="hero-stats">
              <div style={styles.stat}>
                <div style={styles.statNumber}>10K+</div>
                <div style={styles.statLabel}>Citiri realizate</div>
              </div>
              <div style={styles.statDivider}></div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>5★</div>
                <div style={styles.statLabel}>Evaluare medie</div>
              </div>
              <div style={styles.statDivider}></div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>100%</div>
                <div style={styles.statLabel}>Confidențialitate</div>
              </div>
            </div>
          </div>
          
          {/* Right side - Visual elements */}
          <div style={styles.heroContentRight}>
            <div style={styles.visualContainer}>
              <div style={styles.profileCard}>
                <div style={styles.profileImageContainer}>
                  <img
                    src="/icon.png"
                    alt="Cristina Zurba"
                    style={styles.profileImage}
                    className="hero-icon"
                  />
                  <div style={styles.profileGlow}></div>
                </div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>Cristina Zurba</h3>
                  <p style={styles.cardSubtitle}>Ghid spiritual & Tarot reader</p>
                  <div style={styles.cardFeatures}>
                    <div style={styles.feature}>
                      <span style={styles.featureIcon}>🔮</span>
                      <span>Citiri Tarot</span>
                    </div>
                    <div style={styles.feature}>
                      <span style={styles.featureIcon}>🌟</span>
                      <span>Consultații spirituale</span>
                    </div>
                    <div style={styles.feature}>
                      <span style={styles.featureIcon}>💫</span>
                      <span>Ghidare personalizată</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating testimonial cards */}
              <div style={{...styles.testimonialCard, ...styles.testimonial1}}>
                <div style={styles.testimonialStars}>⭐⭐⭐⭐⭐</div>
                <p style={styles.testimonialText}>"Incredibil de precisă!"</p>
                <div style={styles.testimonialAuthor}>- Maria D.</div>
              </div>
              
              <div style={{...styles.testimonialCard, ...styles.testimonial2}}>
                <div style={styles.testimonialStars}>⭐⭐⭐⭐⭐</div>
                <p style={styles.testimonialText}>"Mi-a schimbat viața!"</p>
                <div style={styles.testimonialAuthor}>- Alex P.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.scrollIndicator} className="scroll-indicator">
        <div style={styles.scrollIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l3 3 7-7"/>
            <path d="M8 21l4-4 4 4"/>
          </svg>
        </div>
        <span style={styles.scrollText}>Explorează</span>
      </div>
    </section>
  );
}

const styles = {
  heroSection: {
    position: "relative",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "120px 0 80px",
  },
  
  // Geometric floating elements
  geometricElements: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 1,
  },
  circle: {
    position: "absolute",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
    filter: "blur(1px)",
  },
  circle1: {
    width: "300px",
    height: "300px",
    top: "10%",
    right: "10%",
    animation: "float 6s ease-in-out infinite",
  },
  circle2: {
    width: "200px",
    height: "200px",
    bottom: "20%",
    left: "5%",
    animation: "float 8s ease-in-out infinite reverse",
  },
  triangle: {
    position: "absolute",
    width: 0,
    height: 0,
    filter: "blur(0.5px)",
  },
  triangle1: {
    borderLeft: "50px solid transparent",
    borderRight: "50px solid transparent", 
    borderBottom: "86px solid rgba(102, 126, 234, 0.05)",
    top: "60%",
    right: "20%",
    animation: "float 7s ease-in-out infinite",
  },
  triangle2: {
    borderLeft: "30px solid transparent",
    borderRight: "30px solid transparent",
    borderBottom: "52px solid rgba(118, 75, 162, 0.05)",
    top: "20%",
    left: "15%",
    animation: "float 9s ease-in-out infinite reverse",
  },
  
  // Main container
  heroContainer: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 2rem",
    width: "100%",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4rem",
    alignItems: "center",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      gap: "3rem",
      textAlign: "center",
    },
  },
  
  // Left content
  heroContentLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  badgeContainer: {
    display: "flex",
    justifyContent: "flex-start",
    "@media (max-width: 768px)": {
      justifyContent: "center",
    },
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "12px 24px",
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: "50px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#667eea",
    border: "1px solid rgba(102, 126, 234, 0.2)",
    backdropFilter: "blur(10px)",
  },
  badgeIcon: {
    fontSize: "16px",
  },
  heroTitle: {
    fontSize: "3.5rem",
    fontWeight: "800",
    lineHeight: "1.1",
    color: "#1a202c",
    margin: 0,
    "@media (max-width: 768px)": {
      fontSize: "2.5rem",
    },
  },
  titleMain: {
    display: "block",
    marginBottom: "0.5rem",
  },
  titleAccent: {
    display: "block",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    fontSize: "1.25rem",
    lineHeight: "1.6",
    color: "#4a5568",
    fontWeight: "400",
    margin: 0,
    maxWidth: "500px",
    "@media (max-width: 768px)": {
      fontSize: "1.1rem",
      maxWidth: "100%",
    },
  },
  heroActions: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    "@media (max-width: 768px)": {
      flexDirection: "column",
      gap: "1rem",
    },
  },
  primaryButtonLink: {
    textDecoration: "none",
  },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "18px 32px",
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "50px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 12px 48px rgba(102, 126, 234, 0.4)",
      backgroundColor: "#5a67d8",
    },
  },
  secondaryButton: {
    padding: "18px 32px",
    backgroundColor: "transparent",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: "50px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      backgroundColor: "#667eea",
      color: "white",
      transform: "translateY(-2px)",
    },
  },
  heroStats: {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    padding: "2rem 0",
    "@media (max-width: 768px)": {
      justifyContent: "center",
      flexWrap: "wrap",
      gap: "1.5rem",
    },
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    "@media (max-width: 768px)": {
      alignItems: "center",
    },
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#667eea",
    lineHeight: "1",
    marginBottom: "0.25rem",
  },
  statLabel: {
    fontSize: "14px",
    color: "#718096",
    fontWeight: "500",
  },
  statDivider: {
    width: "1px",
    height: "40px",
    backgroundColor: "#e2e8f0",
    "@media (max-width: 768px)": {
      display: "none",
    },
  },
  
  // Right content
  heroContentRight: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    "@media (max-width: 768px)": {
      order: -1,
    },
  },
  visualContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "450px",
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: "24px",
    padding: "2rem",
    boxShadow: "0 20px 60px rgba(102, 126, 234, 0.15)",
    border: "1px solid rgba(102, 126, 234, 0.1)",
    position: "relative",
    zIndex: 3,
  },
  profileImageContainer: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  profileImage: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid white",
    boxShadow: "0 8px 32px rgba(102, 126, 234, 0.2)",
    position: "relative",
    zIndex: 2,
  },
  profileGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "140px",
    height: "140px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "50%",
    filter: "blur(20px)",
    opacity: 0.3,
    zIndex: 1,
  },
  cardContent: {
    textAlign: "center",
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1a202c",
    margin: "0 0 0.5rem 0",
  },
  cardSubtitle: {
    fontSize: "1rem",
    color: "#667eea",
    fontWeight: "500",
    margin: "0 0 1.5rem 0",
  },
  cardFeatures: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "14px",
    color: "#4a5568",
    fontWeight: "500",
  },
  featureIcon: {
    fontSize: "18px",
  },
  
  // Floating testimonials
  testimonialCard: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "1rem",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(102, 126, 234, 0.1)",
    maxWidth: "200px",
    zIndex: 2,
  },
  testimonial1: {
    top: "10%",
    right: "-20px",
    transform: "rotate(5deg)",
  },
  testimonial2: {
    bottom: "20%",
    left: "-20px",
    transform: "rotate(-5deg)",
  },
  testimonialStars: {
    fontSize: "12px",
    marginBottom: "0.5rem",
  },
  testimonialText: {
    fontSize: "13px",
    color: "#4a5568",
    fontWeight: "500",
    margin: "0 0 0.5rem 0",
    fontStyle: "italic",
  },
  testimonialAuthor: {
    fontSize: "12px",
    color: "#667eea",
    fontWeight: "600",
    margin: 0,
  },
  
  // Scroll indicator
  scrollIndicator: {
    position: "absolute",
    bottom: "2rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    color: "#667eea",
    opacity: 0.8,
    cursor: "pointer",
  },
  scrollIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    transition: "all 0.3s ease",
  },
  scrollText: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
};

// CSS animations and responsive styles are handled in global styles

export default HeadlineConsultatii;

