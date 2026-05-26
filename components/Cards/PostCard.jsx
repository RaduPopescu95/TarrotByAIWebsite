import React from "react";
import { buildArticleHref } from "../../utils/commonUtils";
import Link from "next/link";
import { useTranslation } from "next-i18next";

function PostCard({ article, isRo }) {
  const { t, i18n } = useTranslation("common");
  const currentLanguage = i18n.language || 'ro';

  return (
    <article style={styles.cardContainer}>
      <Link
        href={buildArticleHref(
          article,
          currentLanguage === "hi"
            ? article?.info?.hu?.nume
            : currentLanguage === "id"
              ? article?.info?.ru?.nume
              : article?.info?.[currentLanguage]?.nume || article?.info?.ro?.nume || "untitled"
        )}
        passHref={false}
        style={styles.linkWrapper}
      >
        <div style={styles.card} className="post-card">
          <div style={styles.imageContainer} className="post-card-image-container">
            <img
              src={article?.image?.finalUri}
              alt={
                currentLanguage === "hi"
                  ? article?.info?.hu?.nume
                  : currentLanguage === "id"
                    ? article?.info?.ru?.nume
                    : article?.info?.[currentLanguage]?.nume || article?.info?.ro?.nume || "untitled"
              }
              style={styles.image}
              className="post-image"
            />
            <div style={styles.imageOverlay} className="post-image-overlay" />
            <div style={styles.categoryBadge}>
              {t("news") || "Știri"}
            </div>
          </div>
          
          <div style={styles.content} className="post-card-content">
            <div style={styles.meta}>
              <time style={styles.date}>{article?.firstUploadDate}</time>
              <span style={styles.readTime}>3 min</span>
            </div>
            
            <h3 style={styles.title} className="post-card-title post-title">
              {currentLanguage === "hi"
                ? article?.info?.hu?.nume
                : currentLanguage === "id"
                  ? article?.info?.ru?.nume
                  : article?.info?.[currentLanguage]?.nume || article?.info?.ro?.nume || "Untitled"}
            </h3>
            
            <p style={styles.description}>
              {(currentLanguage === "hi"
                ? article?.info?.hu?.content
                : currentLanguage === "id"
                  ? article?.info?.ru?.content
                  : article?.info?.[currentLanguage]?.content || article?.info?.ro?.content)
                ?.replace(/<[^>]*>/g, "")
                .substring(0, 120)}...
            </p>
            
            <div style={styles.footer}>
              <div style={styles.readMore}>
                {t("readMore") || "Citește mai mult"}
                <span style={styles.arrow} className="post-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

const styles = {
  cardContainer: {
    marginBottom: "0rem",
    opacity: 0,
    transform: "translateY(20px)",
    animation: "fadeInUp 0.6s ease forwards",
    height: "100%",
  },
  linkWrapper: {
    textDecoration: "none",
    color: "inherit",
    display: "block",
    height: "100%",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    position: "relative",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    "&:hover": {
      transform: "translateY(-8px)",
      boxShadow: "0 12px 48px rgba(102, 126, 234, 0.15)",
    },
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: "320px",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%)",
    opacity: 0,
    transition: "opacity 0.3s ease",
  },
  categoryBadge: {
    position: "absolute",
    top: "1rem",
    left: "1rem",
    backgroundColor: "rgba(102, 126, 234, 0.9)",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    backdropFilter: "blur(10px)",
  },
  content: {
    padding: "2rem",
    flex: "1",
    display: "flex",
    flexDirection: "column",
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  date: {
    fontSize: "0.85rem",
    color: "#666",
    fontWeight: "500",
  },
  readTime: {
    fontSize: "0.85rem",
    color: "#999",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: "1rem",
    lineHeight: "1.3",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    transition: "color 0.3s ease",
  },
  description: {
    fontSize: "1rem",
    color: "#666",
    lineHeight: "1.6",
    marginBottom: "1.5rem",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    flex: "1",
  },
  footer: {
    paddingTop: "1rem",
    borderTop: "1px solid rgba(0, 0, 0, 0.05)",
  },
  readMore: {
    fontSize: "0.95rem",
    color: "#667eea",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.3s ease",
    "&:hover": {
      color: "#764ba2",
    },
  },
  arrow: {
    fontSize: "1rem",
    transition: "transform 0.3s ease",
  },
};

// CSS animations and hover effects are handled in global styles

export default PostCard;
