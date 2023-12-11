import React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Head from "next/head";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { wappPhone } from "../../data/data";

const CookiesPrivacyPolicyPage = () => {
  return (
    <>
      <Head>
        <title>Home | Numele Site-ului</title>
        <meta
          name="description"
          content="Descrierea relevantă pentru pagina de start."
        />
        <meta name="og:title" content="Home | Numele Site-ului" />
        <meta
          name="og:description"
          content="Descrierea relevantă pentru pagina de start."
        />
        <meta name="keywords" content="cuvant1, cuvant2, cuvant3" />
      </Head>
      <Header />
      <div style={{ backgroundColor: "black", height: "100vh" }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom color={"white"}>
            Cookies and Privacy Policy
          </Typography>
          <Typography variant="body1" paragraph color={"white"}>
            This is the content of your Cookies and Privacy Policy. You can
            provide details about how you handle cookies and user privacy here.
          </Typography>
        </Container>
      </div>
      <Footer />
      <FloatingWhatsApp
        phoneNumber={wappPhone}
        accountName="Matteale Consulting"
        avatar="/logoWapp.svg"
      />
    </>
  );
};

export default CookiesPrivacyPolicyPage;
