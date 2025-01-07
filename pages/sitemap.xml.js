// pages/sitemap.xml.js
import { handleGetArticles, handleGetServices } from "../utils/realtimeUtils";
import { toUrlSlug } from "../utils/commonUtils";

const URL = "https://cristinazurba.com";

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function generateSiteMap(articles, services) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
          xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <!-- static URLs -->
  

    <url>
    <loc>${escapeXml(URL)}/citat-motivational/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/citire-personalizata/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/citire-viitor/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/culoare-norocoasa/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/numar-norocos/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/ora-norocoasa/</loc>
  </url>

  
  
  </urlset>`;
}

export async function getServerSideProps({ res }) {
  const articles = [];
  const services = [];

  const sitemap = generateSiteMap(
    articles.articlesArray,
    services.servicesArray
  );

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function SiteMap() {
  return null; // This page does not render anything
}
