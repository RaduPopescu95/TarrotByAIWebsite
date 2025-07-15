import React from "react";
import { useTranslation } from "next-i18next";

function PostWidget({ handleFilter, filterItem }) {
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
    <div style={styles.filterWidget}>
      <h3 style={styles.title}>{t("Filters")}</h3>
      <div style={styles.filterList}>
        {filterMapping.map((filter, index) => (
          <button
            key={index}
            onClick={() => handleFilter(filter.value)}
            style={{
              ...styles.filterButton,
              ...(filterItem === filter.value ? styles.filterButtonActive : {}),
            }}
          >
            {t(filter.translationKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  filterWidget: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e0e0e0",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#333",
    marginBottom: "1.5rem",
    margin: "0 0 1.5rem 0",
    borderBottom: "2px solid #667eea",
    paddingBottom: "0.5rem",
  },
  filterList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  filterButton: {
    display: "block",
    width: "100%",
    padding: "0.75rem 1rem",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: "#667eea",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#667eea",
      color: "white",
      transform: "translateX(5px)",
    },
  },
  filterButtonActive: {
    backgroundColor: "#667eea",
    color: "white",
    borderColor: "#667eea",
  },
};

// Add CSS for hover effects
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    .filter-button:hover {
      background-color: #667eea !important;
      color: white !important;
      transform: translateX(5px);
    }
  `;
  if (!document.head.querySelector('style[data-component="filter-widget"]')) {
    styleSheet.setAttribute('data-component', 'filter-widget');
    document.head.appendChild(styleSheet);
  }
}

export default PostWidget;
