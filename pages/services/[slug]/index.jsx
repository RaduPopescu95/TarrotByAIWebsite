import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import { useSpacing } from "~/theme/common";
import Header from "~/components/Header";
import Service from "~/components/Services/Service";
import Sidebar from "~/components/Services/Sidebar";
import Footer from "~/components/Footer";
import { useRouter } from "next/router";
import { useDatabase } from "../../../context/DatabaseContext";
import Serv from "../../../components/Services/Serv";
import { customStyles, wappPhone } from "../../../data/data";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { useMediaQuery, useTheme } from "@mui/material";

function ServiceDetail() {
  const { services } = useDatabase();
  const classes = useSpacing();
  const router = useRouter();

  // Initialize filteredServices as an empty array to show loading state initially
  const [filteredServices, setFilteredServices] = useState([]);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  // Remove useParams as it's not a standard Next.js hook
  useEffect(() => {
    // Wait until router is ready and services are loaded before filtering
    if (router.isReady && services.servicesArray) {
      const slug = router.query.slug; // Get the slug from the router query
      const id = slug.split("-")[0]; // Extract the ID part
      const filtered = services.servicesArray.filter(
        (service) => service.id.toString() === id
      );
      console.log("yes....");
      console.log(filtered);
      setFilteredServices(filtered); // Set the filtered services
    }
  }, [router.isReady, router.query.slug, services.servicesArray]);

  return (
    <Fragment>
      {filteredServices.length > 0 && (
        <Head>
          <title>{filteredServices[0].title}</title>
          <meta
            name="description"
            content={filteredServices[0].metaDescription}
          />
          <meta name="og:title" content={filteredServices[0].title} />
          <meta
            name="og:description"
            content={filteredServices[0].metaDescription}
          />
          <meta name="keywords" content={filteredServices[0].metaKeys} />
          <meta property="og:url" content={currentUrl} />
        </Head>
      )}
      <CssBaseline />
      <style>{customStyles}</style> {/* Incluziunea stilurilor CSS */}
      <section id="home" />
      <Header home />
      <div className={classes.mainWrap} style={{ backgroundColor: "black" }}>
        <>
          {filteredServices.length > 0 && (
            <div
              className={classes.wraperSection}
              style={{ paddingTop: isMobile ? 100 : 110 }}
            >
              <Box pt={5}>
                <Container>
                  <Grid container spacing={4}>
                    <Grid item md={8} xs={12} style={{ paddingTop: 0 }}>
                      <Serv filteredServices={filteredServices[0]} />
                    </Grid>
                    <Grid item md={4} xs={12} style={{ paddingTop: 0 }}>
                      <Sidebar services={services} />
                    </Grid>
                  </Grid>
                </Container>
              </Box>
            </div>
          )}
        </>
      </div>
      <div id="footer">
        <Footer />
      </div>
      <FloatingWhatsApp
        phoneNumber={wappPhone}
        accountName="Matteale Consulting"
        avatar="/logoWapp.svg"
      />
    </Fragment>
  );
}

ServiceDetail.propTypes = {
  // onToggleDark and onToggleDir props removed since they are not used in the component
};

export default ServiceDetail;
