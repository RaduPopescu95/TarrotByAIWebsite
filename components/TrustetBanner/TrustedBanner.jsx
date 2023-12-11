import React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import Carousel from "react-multi-carousel";
import useStyle from "./testi-style";
import Image from "next/image";
import carouselStyles from "./carousel.module.css";
import { useMediaQuery, useTheme } from "@mui/material";
import { useMemo } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import { useTranslation } from "next-i18next";

const images = [
  "/partners/unity solutions.png",
  "/kyndryl-logo-3.png",
  "/partners/SAP_Partner_R.png",
  "/partners/Alten-logo.png",
];

const TrustedBanner = () => {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { classes, cx } = useStyle();
  const centerContent = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };

  const imageStyle = {
    width: isMobile ? "70%" : "50%", // Aici am redus lățimea la 50% pentru a le face pe jumătate
    height: "auto", // Păstrăm aspect ratio
  };

  const responsive = useMemo(
    () => ({
      superLargeDesktop: {
        breakpoint: { max: 4000, min: 3000 },
        items: 5,
      },
      desktop: {
        breakpoint: { max: 3000, min: 1024 },
        items: 3,
      },
      tablet: {
        breakpoint: { max: 1024, min: 464 },
        items: 2,
      },
      mobile: {
        breakpoint: { max: 464, min: 0 },
        items: 1,
      },
    }),
    []
  );

  const domRef = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Stop observing the element after it has been animated
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    ); // Adjust the threshold as needed

    observer.observe(domRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <Paper elevation={0}>
      <Grid
        container
        spacing={2}
        ref={domRef}
        className={`slideUpFadeIn ${isVisible ? "animated" : ""}`}
      >
        <Grid item xs={12}>
          <h2
            style={{
              color: "white",
              fontSize: 37,
              marginTop: 0,
              marginBottom: 40,
              ...centerContent,
            }}
          >
            {t("TrustedByCompanies")}
          </h2>
        </Grid>
        <Grid item xs={12} style={{ height: "150px" }}>
          <Carousel
            responsive={responsive}
            ssr={true}
            autoPlay={true}
            autoPlaySpeed={3000}
            showDots={true}
            renderButtonGroupOutside={false}
            renderDotsOutside={false}
            swipeable
            infinite={true}
            removeArrowOnDeviceType={["tablet", "mobile", "desktop"]}
            style={centerContent}
            className={carouselStyles.carouselList}
          >
            {images.map((src, index) => (
              <div key={index} className={classes.cardWrapper}>
                <img
                  src={src}
                  alt={`Imagine ${index + 1}`}
                  style={imageStyle}
                  width={540}
                  height={160}
                />
              </div>
            ))}
          </Carousel>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default React.memo(TrustedBanner);
