import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { buildArticleHref } from "../../utils/commonUtils";

function Headline({ newestArticle, isRo }) {
  const { t, i18n } = useTranslation("common");
  
  // Responsive design is handled via CSS media queries

  useEffect(() => {
    console.log("newestArticle?..", newestArticle);
  }, [newestArticle]);

  if (!newestArticle || !newestArticle.id) {
    return null;
  }

  const currentLanguage = i18n.language || 'ro';
  
  const articleTitle = currentLanguage === "hi"
    ? newestArticle?.info?.hu?.nume
    : currentLanguage === "id"
      ? newestArticle?.info?.ru?.nume
      : newestArticle?.info?.[currentLanguage]?.nume || newestArticle?.info?.ro?.nume || "Untitled";

  const articleDescription = currentLanguage === "hi"
    ? newestArticle?.info?.hu?.descriere
    : currentLanguage === "id"
      ? newestArticle?.info?.ru?.descriere
      : newestArticle?.info?.[currentLanguage]?.descriere || newestArticle?.info?.ro?.descriere;

  return (
    <div style={styles.headlineContainer}>
      <Link
        href={buildArticleHref(newestArticle, articleTitle)}
        passHref={false}
      >
        <div style={styles.headlineCard} className="headline-card">
          <div style={styles.imageContainer} className="headline-image-container">
            <img
              src={newestArticle?.image?.finalUri}
              alt={articleTitle}
              style={styles.headlineImage}
              className="headline-image"
            />
            <div style={styles.overlay}></div>
          </div>
          <div style={styles.contentContainer} className="headline-content">
            <span style={styles.date}>{newestArticle?.firstUploadDate}</span>
            <h2 style={styles.title} className="headline-title">{articleTitle}</h2>
            <p style={styles.description}>
              {articleDescription?.length > 200
                ? `${articleDescription.substring(0, 200)}...`
                : articleDescription}
            </p>
            <div style={styles.readMore} className="read-more">
              {t("readMore") || "Citește mai mult"}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

const styles = {
  headlineContainer: {
    marginBottom: "0rem",
    height: "100%",
  },
  headlineCard: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "white",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
    },
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: "550px",
    overflow: "hidden",
  },
  headlineImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%)",
  },
  contentContainer: {
    padding: "2rem",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  date: {
    fontSize: "0.9rem",
    color: "#667eea",
    fontWeight: "500",
    marginBottom: "0.75rem",
    display: "block",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#333",
    lineHeight: "1.3",
    marginBottom: "1rem",
    margin: "0 0 1rem 0",
  },
  description: {
    fontSize: "1rem",
    color: "#666",
    lineHeight: "1.6",
    marginBottom: "1.5rem",
    flex: 1,
  },
  readMore: {
    fontSize: "1rem",
    color: "#667eea",
    fontWeight: "600",
    transition: "color 0.3s ease",
    alignSelf: "flex-start",
    "&:hover": {
      color: "#764ba2",
    },
  },
};

// CSS hover effects and responsive styles are handled in global styles

export default Headline;
