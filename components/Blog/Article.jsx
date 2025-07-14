import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { customStyles } from "../../data/constants";
import { useTranslation } from "next-i18next";
import {
  getYoutubeEmbedUrl,
  getYoutubeVideoId,
} from "../../utils/youtubeLinkUtils";

function Article({ filteredArticles }) {
  const { i18n } = useTranslation("common");
  const currentLanguage = i18n.language || 'ro';
  const pathname = usePathname();

  // Responsive design is handled via CSS media queries

  // Functie pentru partajare pe Facebook
  const shareOnFacebook = () => {
    const url = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank"
    );
  };

  // Functie pentru partajare pe instagram
  const shareOnInstagram = () => {
    window.open("instagram://camera", "_blank");
  };

  // Functie pentru partajare pe LinkedIn
  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/shareArticle?mini=true&url=${url}`,
      "_blank"
    );
  };

  useEffect(() => {
    console.log("filteredArticles?...", filteredArticles);
  }, [filteredArticles]);

  // Asigură-te că youtubeLinks este tratat ca un array chiar dacă este unul singur
  const youtubeEmbedLinks = filteredArticles?.youtubeLinks
    ? filteredArticles?.youtubeLinks.map((link) => getYoutubeEmbedUrl(link))
    : [];

  return (
    <div style={styles.root}>
      <style>{customStyles}</style>
      <article style={styles.article}>
        <div style={styles.content}>
          <h2 style={styles.titleBlog}>
            {currentLanguage === "hi"
              ? filteredArticles?.info?.hu.nume
              : currentLanguage === "id"
                ? filteredArticles?.info?.ru.nume
                : filteredArticles?.info[currentLanguage].nume}
          </h2>
          <span style={styles.caption}>
            {filteredArticles?.firstUploadDate}
          </span>
          <figure style={styles.imageBlog}>
            <img
              width={1440}
              height={282}
              src={filteredArticles?.image?.finalUri}
              alt="blog"
              style={styles.responsiveImage}
            />
          </figure>
          <div
            dangerouslySetInnerHTML={{
              __html:
                currentLanguage === "hi"
                  ? filteredArticles?.info?.hu.content
                  : currentLanguage === "id"
                    ? filteredArticles?.info?.ru.content
                    : filteredArticles?.info[currentLanguage].content,
            }}
            style={styles.contentText}
          ></div>

          {/* Încorporarea videoclipurilor YouTube folosind un map */}
          {youtubeEmbedLinks.map((embedLink, index) => (
            <iframe
              key={index}
              width="100%"
              height="415"
              src={embedLink}
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={styles.videoFrame}
            ></iframe>
          ))}
        </div>
      </article>
    </div>
  );
}

const styles = {
  root: {
    marginTop: "2rem",
  },
  article: {
    color: "#333",
    fontSize: "16px",
    lineHeight: "24px",
  },
  content: {
    padding: "0 1rem",
    "@media (min-width: 768px)": {
      padding: "0 2rem",
    },
  },
  titleBlog: {
    fontWeight: "500",
    color: "white",
    fontSize: "1.5rem",
    marginBottom: "1rem",
    lineHeight: "1.3",
  },
  caption: {
    color: "white",
    fontSize: "0.9rem",
    opacity: 0.8,
  },
  imageBlog: {
    margin: "2rem 0",
    "& img": {
      width: "100%",
      borderRadius: "8px",
    },
  },
  contentText: {
    color: "#667eea",
    fontSize: "16px",
    lineHeight: "1.6",
    marginBottom: "1rem",
  },
  videoFrame: {
    borderRadius: "10px",
    marginTop: "3%",
    maxWidth: "100%",
  },
  responsiveImage: {
    width: "100%",
    height: "auto",
  },
};

export default Article;
