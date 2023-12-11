import React from "react";
import { Head } from "next/document";
import theme from "~/theme/palette";
import brand from "~/public/text/brand";

const HeadComponent = () => (
  <Head>

    {/* favi */}

    <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="60x60" href="/apple-touch-icon-60x60.png" />
  <link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-72x72.png" />
  <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png" />
  <link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114x114.png" />
  <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />
  <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144x144.png" />
  <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
  <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="manifest" href="/site.webmanifest" />


    {/* PWA primary color */}
    <meta name="theme-color" content={"#252525"} />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
    />
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    
    {/*  Facebook */}
    <meta property="author" content="MattealeConsulting" />
    <meta property="og:site_name" content="https://mattealeconsulting.com/" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="website" />
    {/*  Twitter */}
    <meta property="twitter:site" content="https://mattealeconsulting.com/" />
    <meta property="twitter:domain" content="https://mattealeconsulting.com/" />
    <meta property="twitter:creator" content="MattealeConsulting" />
    <meta property="twitter:card" content="summary" />
    <meta property="twitter:image:src" content="/matlogo.png" />
    <meta property="og:url" content={"genera.com.urk"} />

  
    <meta name="twitter:site" content={"twitter:site general"} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={"twitter:image general"} />
    <meta property="og:image" content={"og:image general"} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />


  </Head>
);

export default HeadComponent;
