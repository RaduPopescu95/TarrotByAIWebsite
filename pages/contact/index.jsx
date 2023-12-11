import React, { useState, useEffect } from "react";

import { Alert, CssBaseline, useMediaQuery, useTheme } from "@mui/material";
import ContactForm from "../../components/Forms/Contact";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import MapContainer from "../../components/Forms/ContactMap";
import Head from "next/head";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { useRouter } from "next/router";
import { wappPhone } from "../../data/data";

function Contact() {
  const [isMessageSent, setIsMessageSent] = useState(false); // Stare pentru a afișa mesajul de succes

  
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const router = useRouter()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mattealeconsulting.com';
  
  const currentUrl = `${baseUrl}${router.asPath || ''}`;

  useEffect(() => {
    // Dacă mesajul a fost trimis cu succes, setează o întârziere pentru a-l ascunde după 3 secunde
    if (isMessageSent) {
      const timeoutId = setTimeout(() => {
        setIsMessageSent(false);
      }, 3000); // Ascunde mesajul după 3 secunde (3000 milisecunde)

      // Curăță timeout-ul când componenta este demontată pentru a evita memory leaks
      return () => clearTimeout(timeoutId);
    }
  }, [isMessageSent]);

  return (
    <>
      <Head>
        <title>Contact | Matteale Consulting</title>
        <meta
          name="description"
          content="We are the SAP partner company that can support your journey to increase efficiency and features dedicated to the digital transformation of your enterprise."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="Contact | Matteale Consulting" />
        <meta
          property="og:description"
          content="We are the SAP partner company that can support your journey to increase efficiency and features dedicated to the digital transformation of your enterprise."
        />
         <meta property="og:image" content="https://mattealeconsulting.com/images/social-share.jpg" /> 
        <meta name="format-detection" content="telephone=no"/>
      
      </Head>
      <Header />
      <CssBaseline />
      <div style={{ backgroundColor: "#252525", paddingTop: isMobile ? 50 : 70 }}>
        <section>
          <ContactForm
            setIsMessageSent={setIsMessageSent}
            isMessageSent={isMessageSent}
          />
        </section>
        <section>
          <MapContainer />
        </section>
        <section>
          <Footer />
        </section>
      </div>
      {/* Afișează Alert-ul pentru mesajul de succes în partea de jos a browserului */}
      {isMessageSent && (
        <Alert
          severity="success"
          sx={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: 500,
            zIndex: 1000, // Asigură că alerta este afișată peste tot conținutul
            marginBottom: 5,
            backgroundColor: "#edf7ed", // Verde deschis transparent
          }}
        >
          Message sent successfully!
        </Alert>
      )}
      <FloatingWhatsApp
        phoneNumber={wappPhone}
        accountName="Matteale Consulting"
        avatar="/logoWapp.svg"
      />
    </>
  );
}

export default Contact;
