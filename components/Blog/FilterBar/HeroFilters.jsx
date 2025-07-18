import React from "react";
import { useTranslation } from "next-i18next";

function HeroFilters({ handleFilter, filterItem }) {
  const { t } = useTranslation("common");
  
  // Filter mapping: translation key -> filter value for backend
  const filterMapping = [
    { key: "all", value: "All", translationKey: "All" },
    { key: "daily", value: "Previziuni zilnice", translationKey: "Previziuni zilnice" },
    { key: "weekly", value: "Previziuni săptămânale", translationKey: "Previziuni săptămânale" },
    { key: "monthly", value: "Previziuni lunare", translationKey: "Previziuni lunare" },
    { key: "yearly", value: "Previziuni anuale", translationKey: "Previziuni anuale" },
  ];

  return (
    <div style={styles.heroFilterContainer}>
      <h3 style={styles.filterTitle}>{t("Filters")}</h3>
      <div style={styles.filterButtonsContainer}>
        {filterMapping.map((filter, index) => (
          <button
            key={index}
            onClick={() => handleFilter(filter.value)}
            style={{
              ...styles.filterButton,
              ...(filterItem === filter.value ? styles.filterButtonActive : {}),
            }}
            className="hero-filter-btn"
          >
            {t(filter.translationKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  heroFilterContainer: {
    marginTop: "2rem",
    padding: "2rem",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    maxWidth: "600px",
    margin: "2rem auto 0",
  },
  filterTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "white",
    marginBottom: "1.5rem",
    textAlign: "center",
    margin: "0 0 1.5rem 0",
  },
  filterButtonsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "center",
  },
  filterButton: {
    padding: "12px 20px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "white",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(5px)",
    whiteSpace: "nowrap",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderColor: "rgba(255, 255, 255, 0.5)",
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)",
    },
  },
  filterButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgba(255, 255, 255, 0.6)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    transform: "translateY(-1px)",
  },
};

// Add CSS for hover effects since inline styles don't support pseudo-classes
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    .hero-filter-btn:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
      border-color: rgba(255, 255, 255, 0.5) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
    }
    
    @media (max-width: 768px) {
      .hero-filter-container {
        margin: 1.5rem 1rem 0 !important;
        padding: 1.5rem !important;
      }
      
      .hero-filter-buttons {
        gap: 0.5rem !important;
      }
      
      .hero-filter-btn {
        padding: 10px 16px !important;
        font-size: 0.85rem !important;
      }
    }
  `;
  if (!document.head.querySelector('style[data-component="hero-filters"]')) {
    styleSheet.setAttribute('data-component', 'hero-filters');
    document.head.appendChild(styleSheet);
  }
}

export default HeroFilters; 