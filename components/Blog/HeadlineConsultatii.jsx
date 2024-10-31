import React, { useEffect } from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";

import { useText } from "../../theme/common";
import useStyles from "./blog-style";
// import useStyles from "../Cards/post-card-style";
import { useRouter } from "next/router";
import {
  CssBaseline,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { toUrlSlug } from "../../utils/commonUtils";
import languageDetector from "../../lib/languageDetector";
import { colors } from "../../utils/colors";
import { useDatabase } from "../../context/DatabaseContext";

function HeadlineConsultatii({ newestArticle, isRo }) {
  const detectedLng = languageDetector.detect();
  const { classes, cx } = useStyles();
  const { classes: text } = useText();
  const theme = useTheme();

  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  let nume = "Cristina Zurba – Consultatii";
  let descriere = "Ghidare spirituală personalizată pentru echilibrul tău.";
  const route = useRouter();

  // return;
  return (
    <>
      <CssBaseline />
      <Card className={classes.blogHeadline} style={{ position: "relative" }}>
        <img
          className={classes.media}
          src={"https://i.ibb.co/FwXyfBx/SL-042620-30310-19.jpg"}
          alt="News Headline"
          width={500}
          height={500}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
        <Link
          href={{
            pathname: "/consultatii",
          }}
          passHref={false}
        >
          <CardActionArea
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardContent
              style={{
                textAlign: "center",
                backgroundColor: "rgba(0, 0, 0, 0)",
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: isDesktop ? "flex-end" : "center",
                alignItems: "flex-start",
                flexDirection: "column",
              }}
            >
              <div
                className="row align-items-center"
                style={{ position: "relative", top: !isMobile && "20%" }}
              >
                <div
                  className="col-lg-6 order-2 order-lg-1"
                  style={{
                    padding: isMobile ? "0px" : "20px",
                    paddingTop: "40px",
                  }}
                >
                  <div
                    style={{ paddingBottom: "0px" }}
                    className="banner-content aos"
                    data-aos="fade-up"
                  >
                    <h1 style={{ fontSize: isMobile && "20px" }}>
                      Ghidare spirituală <span>personalizată</span> pentru
                      echilibrul tău.
                    </h1>
                    <p
                      style={{
                        fontSize: isMobile && "12px",
                        marginBottom: isMobile && "0px",
                      }}
                    >
                      Cristina Zurba – Îndrumare spirituală autentică pentru o
                      viață armonioasă
                    </p>
                    <Link
                      href="/calendar"
                      className="btn btn-consult-start-index"
                    >
                      începe sedinta
                    </Link>
                  </div>
                </div>
                {!isMobile && (
                  <div
                    className="col-lg-6 order-1 order-lg-2"
                    style={{
                      display: "flex", // Ascunde pe mobil
                      justifyContent: "center",
                      paddingBottom: !isMobile && "1%",
                    }}
                  >
                    <Image
                      src="/img/banner-image.png"
                      alt="Cristina Zurba"
                      width={300}
                      height={400}
                      style={{ width: "65%", height: "auto" }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </CardActionArea>
        </Link>
      </Card>
    </>
  );
}

export default HeadlineConsultatii;
