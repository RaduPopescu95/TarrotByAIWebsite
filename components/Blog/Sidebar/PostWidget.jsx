import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { buildArticleHref } from "../../../utils/commonUtils";

function PostWidget({ lastFiveArticles }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const currentLanguage = router.locale || 'ro';

  if (!lastFiveArticles || lastFiveArticles.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>📰</div>
        <p style={styles.emptyText}>{t("noArticlesAvailable")}</p>
      </div>
    );
  }

  return (
    <div style={styles.widgetContainer}>
      <div style={styles.header}>
        <h3 style={styles.title}>{t("popularArticles")}</h3>
        <div style={styles.titleDecoration}></div>
      </div>
      
      <div style={styles.postsList}>
        {lastFiveArticles.map((article, index) => {
          const articleTitle = currentLanguage === "hi"
            ? article?.info?.hu?.nume
            : currentLanguage === "id"
              ? article?.info?.ru?.nume
              : article?.info?.[currentLanguage]?.nume || article?.info?.ro?.nume || "Untitled";

          return (
            <Link
              key={index}
              href={buildArticleHref(article, articleTitle)}
              passHref={false}
              style={styles.linkWrapper}
            >
              <article 
                style={{
                  ...styles.postItem,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div style={styles.imageContainer}>
                  <img
                    src={article?.image?.finalUri}
                    alt={articleTitle}
                    style={styles.postImage}
                  />
                  <div style={styles.imageOverlay}></div>
                </div>
                
                <div style={styles.postContent}>
                  <h4 style={styles.postTitle}>{articleTitle}</h4>
                  <div style={styles.postMeta}>
                    <span style={styles.postDate}>{article?.firstUploadDate}</span>
                    <span style={styles.readTime}>2 min</span>
                  </div>
                </div>
                
                <div style={styles.postHover}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
      
      <div style={styles.footer}>
        <Link href="/news" style={styles.viewAllLink}>
          {t("viewAllArticles")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

const styles = {
  widgetContainer: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "0",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    position: "relative",
  },
  header: {
    padding: "1.5rem 1.5rem 1rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    position: "relative",
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: "600",
    margin: "0",
    color: "white",
  },
  titleDecoration: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "60px",
    height: "3px",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: "2px",
  },
  postsList: {
    padding: "1rem 0",
  },
  linkWrapper: {
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },
  postItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem 1.5rem",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
    position: "relative",
    opacity: 0,
    transform: "translateX(20px)",
    animation: "slideInLeft 0.5s ease forwards",
    "&:last-child": {
      borderBottom: "none",
    },
    "&:hover": {
      backgroundColor: "#f8fafc",
      transform: "translateX(8px)",
    },
  },
  imageContainer: {
    flexShrink: 0,
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
    opacity: 0,
    transition: "opacity 0.3s ease",
  },
  postContent: {
    flex: 1,
    minWidth: 0,
  },
  postTitle: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#1a1a1a",
    lineHeight: "1.3",
    marginBottom: "0.5rem",
    margin: "0 0 0.5rem 0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    transition: "color 0.3s ease",
  },
  postMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  postDate: {
    fontSize: "0.75rem",
    color: "#666",
    fontWeight: "500",
  },
  readTime: {
    fontSize: "0.75rem",
    color: "#999",
    "&::before": {
      content: "•",
      marginRight: "0.25rem",
    },
  },
  postHover: {
    color: "#667eea",
    opacity: 0,
    transform: "translateX(-10px)",
    transition: "all 0.3s ease",
  },
  footer: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid rgba(0, 0, 0, 0.05)",
    backgroundColor: "#f8fafc",
  },
  viewAllLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    color: "#667eea",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    "&:hover": {
      color: "#764ba2",
    },
  },
  emptyContainer: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "2rem",
    textAlign: "center",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
  },
  emptyIcon: {
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  emptyText: {
    color: "#666",
    fontSize: "0.9rem",
    margin: "0",
  },
};

// Add CSS for animations and hover effects
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .post-item:hover {
      background-color: #f8fafc !important;
      transform: translateX(8px) !important;
    }
    
    .post-item:hover .post-title {
      color: #667eea !important;
    }
    
    .post-item:hover .post-image {
      transform: scale(1.05) !important;
    }
    
    .post-item:hover .post-image-overlay {
      opacity: 1 !important;
    }
    
    .post-item:hover .post-hover {
      opacity: 1 !important;
      transform: translateX(0) !important;
    }
    
    .view-all-link:hover {
      color: #764ba2 !important;
    }
    
    .read-time::before {
      content: "•";
      margin-right: 0.25rem;
    }
  `;
  if (!document.head.querySelector('style[data-component="post-widget"]')) {
    styleSheet.setAttribute('data-component', 'post-widget');
    document.head.appendChild(styleSheet);
  }
}

export default PostWidget;
