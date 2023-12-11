const ESLintPlugin = require("eslint-webpack-plugin");
const { i18n } = require("./next-i18next.config");

module.exports = {
  i18n,
  trailingSlash: true,
  images: {
    disableStaticImages: false, // Use Next.js's built-in image optimization
    domains: ["firebasestorage.googleapis.com"], // For external images
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  publicRuntimeConfig: {
    localeSubpaths:
      typeof process.env.LOCALE_SUBPATHS === "string"
        ? process.env.LOCALE_SUBPATHS
        : "none",
  },
  webpack: (config, options) => {
    // If you need to modify webpack config, do it here
    // Example: config.plugins.push(new YourPlugin());
    return config;
  },
  async rewrites() {
    return [
      // Your rewrites
      {
        source: "/services/web-app-support",
        destination: "/services/webandappsupport",
      },
      {
        source: "/services/cloud-solutions",
        destination: "/services/cloudsolutions",
      },
      {
        source: "/services/SAP-migration-implementation",
        destination: "/services/migrationandimplementation",
      },
      {
        source: "/services/it-infrastructure-support",
        destination: "/services/supportinfrastructure",
      },
    ];
  },
};
