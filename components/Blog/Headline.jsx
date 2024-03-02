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

function Headline({ newestArticle, isRo }) {
  const detectedLng = languageDetector.detect();
  const { classes, cx } = useStyles();
  const { classes: text } = useText();
  const theme = useTheme();
  const { article, setArticle } = useDatabase(); // Assuming this is a context hook for fetching articles
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  let nume =
    detectedLng === "hi"
      ? newestArticle.info.hu.nume
      : detectedLng === "id"
        ? newestArticle.info.ru.nume
        : newestArticle.info[detectedLng].nume;
  let descriere =
    detectedLng === "hi"
      ? newestArticle.info.hu.descriere
      : detectedLng === "id"
        ? newestArticle.info.ru.descriere
        : newestArticle.info[detectedLng].descriere;
  const route = useRouter();
  useEffect(() => {
    console.log("test here...", newestArticle);
  }, []);
  // return;
  return (
    <>
      <CssBaseline />
      <Card
        className={classes.blogHeadline}
        style={{ position: "relative", backgroundColor: colors.primary2 }}
      >
        <img
          className={classes.media}
          src={newestArticle.image.finalUri}
          alt="News Headline"
          width={500}
          height={500}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
        <Link
          href={{
            pathname: "/news/[slug]",
            query: {
              slug: `${newestArticle.id}-${toUrlSlug(nume)}`,
            },
          }}
          as={`/news/${newestArticle.id}-${toUrlSlug(nume)}`}
          passHref={false}
        >
          <CardActionArea
            onClick={() => console.log(article)}
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
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: isDesktop ? "flex-end" : "center",
                alignItems: "flex-start",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h1"
                className={cx(text.title2)}
                style={{
                  fontSize: isMobile ? "1.5rem" : "2.5rem", // Responsive font size
                  color: "white",
                  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                }}
              >
                {nume}
              </Typography>
              {isDesktop && (
                <Typography
                  variant="p"
                  className={cx(text.title2)}
                  style={{
                    fontSize: "20px",
                    color: "white",
                    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)", // Text shadow for legibility
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    textOverflow: "ellipsis",
                    whiteSpace: "normal",
                  }}
                >
                  {descriere}
                </Typography>
              )}
            </CardContent>
          </CardActionArea>
        </Link>
      </Card>
    </>
  );
}

export default Headline;
