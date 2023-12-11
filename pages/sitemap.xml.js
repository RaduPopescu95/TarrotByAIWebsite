// pages/sitemap.xml.js
import { handleGetArticles, handleGetServices } from "../utils/realtimeUtils";
import { toUrlSlug } from "../utils/commonUtils";

const URL = "https://mattealeconsulting.com";

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
    <loc>${escapeXml(URL)}/news/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/about/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/home/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/contact/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/services/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/services/it-infrastructure-support/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/services/web-app-support/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/services/SAP-migration-implementation/</loc>
  </url>
  <url>
    <loc>${escapeXml(URL)}/services/cloud-solutions/</loc>
  </url>
  
    <!-- Dynamically generated URLs for articles -->
    ${articles
      .map(({ name, image, id }) => {
        return `
          <url>
            <loc>${escapeXml(
              `${escapeXml(URL)}/news/${id}-${toUrlSlug(name)}/`
            )}</loc>
            ${
              image && image.finalUri
                ? `<image:image>
              <image:loc>${escapeXml(image.finalUri)}</image:loc>
            </image:image>`
                : ""
            }
          </url>
        `;
      })
      .join("")}
  
    <!-- Dynamically generated URLs for services -->
    ${services
      .map(({ name, image, id }) => {
        return `
          <url>
            <loc>${escapeXml(
              `${escapeXml(URL)}/services/${id}-${toUrlSlug(name)}/`
            )}</loc>
            ${
              image && image.finalUri
                ? `<image:image>
              <image:loc>${escapeXml(image.finalUri)}</image:loc>
            </image:image>`
                : ""
            }
          </url>
        `;
      })
      .join("")}
  </urlset>`;
}

export async function getServerSideProps({ res }) {
  const articles = await handleGetArticles();
  const services = await handleGetServices();

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
