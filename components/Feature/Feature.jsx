import React from "react";

import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import ScrollAnimation from "react-scroll-animation-wrapper";
import Grid from "@mui/material/Grid";

import useStyles from "./feature-style";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import {
  featureParagrafLineHeight,
  featureParagrafMargin,
  featureTitlePadding,
  indexLineHeight,
} from "../../data/data";

function Feature() {
  const { t } = useTranslation("common");
  const { classes, cx } = useStyles();

  const theme = useTheme();

  // const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const buttonHeaderStyle = {
    variant: "contained",
    color: "secondary",
    size: "large",
    className: classes.buttonHeader,
  };

  const imgStyle = {
    width: isMobile ? "100%" : "90%",
    height: isMobile ? "80%" : "100%",
    borderRadius: 2,
  };

  const illustrationImage = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // Adăugăm această linie pentru aliniere verticală
      }}
    >
      <div className={classes.illustrationLeft} style={{ width: "100%" }}>
        <figure
          className={cx(classes.figure, classes.graphic)}
          style={{
            justifyContent: isMobile ? "center" : "flex-start",
            alignItems: isMobile ? "center" : "flex-start",
            display: "flex",
          }}
        >
          <img
            width={550}
            height={460}
            src={"/SAP_feature_homepage.jpeg"}
            style={imgStyle}
            alt="Accelerate change across your enterprise"
          />
        </figure>
      </div>
    </Box>
  );

  const illustrationImageSecond = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // Adăugăm această linie pentru aliniere verticală
      }}
    >
      <div className={classes.illustrationLeft} style={{ width: "100%" }}>
        <figure
          className={cx(classes.figure, classes.graphic)}
          style={{
            justifyContent: isMobile ? "center" : "flex-end",
            alignItems: isMobile ? "center" : "flex-end",
            display: "flex",
          }}
        >
          <img
            width={550}
            height={660}
            src={"/accelerate_change.jpeg"}
            style={imgStyle}
            alt="Accelerate change across your enterprise"
          />
        </figure>
      </div>
    </Box>
  );

  const content = (
    <div
      className={classes.desc}
      style={{
        margin: 0,
      }}
    >
      <h2
        align={"left"}
        style={{
          color: "white",
          marginTop: 0,
          fontSize: 40,
          marginBottom: 0,
          lineHeight: indexLineHeight,
          padding: featureTitlePadding,
        }}
      >
        {t("EmpowerDigitalTransformation")}
      </h2>

      <div
        style={{
          borderLeft: "3px solid #D3A03E",
          marginLeft: "2%",
          paddingLeft: "5%",
          marginTop: 0,
        }}
      >
        <p
          align={"left"}
          style={{ color: "#D3A03E", marginTop: 0, fontSize: 20 }}
        >
          {t("EmpowerDigitalTransformationMsg")}
        </p>
      </div>

      <p
        align={"left"}
        style={{ color: "white", margin: featureParagrafMargin, fontSize: 20 }}
      >
        {t("EmpowerDigitalTransformationMsg2")}
      </p>
      <div
        style={{
          justifyContent: "flex-start",
          display: "flex",
          marginBottom: 40,
        }}
      >
        <Link href={"/services"}>
          <Button {...buttonHeaderStyle}>{t("SeeServices")}</Button>
        </Link>
      </div>
    </div>
  );

  const contentSecondSection = (
    <div
      className={classes.desc}
      style={{
        margin: 0,
        // paddingRight: "12%",
        marginBottom: 40,

        width: "100%", // Setăm lățimea la 100%
      }}
    >
      <h2
        align={"left"}
        style={{
          color: "white",
          marginTop: 0,
          fontSize: 40,
          marginBottom: 0,
          width: "100%", // Setăm lățimea la 100%
          lineHeight: indexLineHeight,
          padding: featureTitlePadding,
        }}
      >
        {t("AccelerateChange")}
      </h2>

      <div
        style={{
          borderLeft: "3px solid #D3A03E",
          marginLeft: "2%",
          paddingLeft: "5%",
          marginTop: 10,
          width: "100%", // Setăm lățimea la 100%
        }}
      >
        <p
          align={"left"}
          style={{
            color: "#D3A03E",
            marginTop: 0,
            fontSize: 20,
            width: "100%", // Setăm lățimea la 100%
          }}
        >
          {t("AccelerateChangeMsg")}{" "}
        </p>
      </div>

      <p
        align={"left"}
        style={{
          color: "white",
          marginTop: 20,
          fontSize: 20,
          width: "100%",
          margin: featureParagrafMargin,
        }}
      >
        {t("AccelerateChangeMsg2")}{" "}
      </p>
      <div
        style={{ justifyContent: "flex-start", display: "flex", width: "100%" }}
      >
        <Link href={"/about"}>
          <Button {...buttonHeaderStyle}> {t("AboutUs")} </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className={classes.root}>
      <div
        style={{
          paddingLeft: "6%",
          paddingRight: "6%",
          margin: 0,
          width: "100%",
        }}
      >
        <div className={classes.item} style={{ marginBottom: 120 }}>
          <Grid container spacing={0}>
            <Grid item md={6} xs={12}>
              {contentSecondSection}
            </Grid>
            <Grid item md={6} xs={12}>
              {illustrationImageSecond}
            </Grid>
          </Grid>
        </div>
        <div className={classes.item}>
          <Grid
            container
            spacing={0}
            direction={isMobile ? "column-reverse" : "row"}
          >
            <Grid item md={6} xs={12}>
              {illustrationImage}
            </Grid>
            <Grid item md={6} xs={12}>
              {content}
            </Grid>
          </Grid>
        </div>
      </div>
    </div>
  );
}

export default Feature;
