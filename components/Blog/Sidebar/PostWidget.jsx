import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import Paper from "../../Paper";
import useStyles from "../blog-style";
import { Button } from "@mui/material";
import { useRouter } from "next/router";
import Link from "next/link";
import { toUrlSlug } from "../../../utils/commonUtils";
import languageDetector from "../../../lib/languageDetector";
import { colors } from "../../../utils/colors";
import { useTranslation } from "react-i18next";

function PostWidget({ lastFiveArticles }) {
  const { classes } = useStyles();
  const detectedLng = languageDetector.detect();
  const { t } = useTranslation("common");
  const route = useRouter();

  const handleRoute = (item) => {
    route.push({
      pathname: "/news/[slug]",
      query: {
        slug: item.id,
      },
    });
  };

  return (
    <Paper
      title={t("Latest Articles")}
      icon="ion-android-bookmark"
      whiteBg
      desc=""
    >
      <div
        className={classes.albumRoot}
        style={{ backgroundColor: "transparent" }}
      >
        <List component="nav">
          {lastFiveArticles.map((item, index) => (
            <Link
              key={index}
              href={{
                pathname: "/news/[slug]",
                query: {
                  slug: `${item.id}-${toUrlSlug(
                    detectedLng === "hi"
                      ? item.info.hu.nume
                      : detectedLng === "id"
                        ? item.info.ru.nume
                        : item.info[detectedLng].nume
                  )}`,
                },
              }}
              as={`/news/${item.id}-${toUrlSlug(
                detectedLng === "hi"
                  ? item.info.hu.nume
                  : detectedLng === "id"
                    ? item.info.ru.nume
                    : item.info[detectedLng].nume
              )}`}
              passHref={false}
            >
              <ListItem
                button
                sx={{
                  "&:hover": {
                    backgroundColor: colors.primary3, // Culoarea pentru hover pe ListItem
                    // Schimbă culoarea textului la hover prin referirea la copilul ListItemText
                    "& .MuiTypography-root": {
                      color: "white",
                    },
                  },
                  backgroundColor: "transparent",
                  height:"auto"
                }}
              >
                <ListItemText
                  primary={
                    detectedLng === "hi"
                      ? item.info.hu.nume
                      : detectedLng === "id"
                        ? item.info.ru.nume
                        : item.info[detectedLng].nume
                  }
                  sx={{
                    ".MuiTypography-root": {
                      // Aplică stilul pentru toate elementele Typography din ListItemText
                      color: colors.primary3,
                      height: "2rem",
                      width: "auto",
                      height:"auto"
                    },
                    ".MuiTypography-secondary": {
                      color: "#d3a03e", // Culoarea pentru textul secundar, fără hover specific
                    },
                  }}
                />
              </ListItem>
            </Link>
          ))}
        </List>
      </div>
    </Paper>
  );
}

export default PostWidget;
