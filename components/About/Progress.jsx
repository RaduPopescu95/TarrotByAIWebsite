import React, { useState } from "react";
import ScrollAnimation from "react-scroll-animation-wrapper";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useText } from "~/theme/common";
import useStyles from "./about-style";
import { useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "next-i18next";

function Progress({ textAligned }) {
  const { t } = useTranslation("common");
  const { classes } = useStyles();
  const { classes: text } = useText();

  const [play, setPlay] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handlePlay = (visible) => {
    if (visible.inViewport) {
      setTimeout(() => {
        setPlay(true);
      }, 200);
    }
  };

  return (
    <div className={classes.progressWrap} style={{ padding: 0 }}>
      <ScrollAnimation
        animateOnce
        animateIn="fadeIn"
        delay={400}
        duration={0.3}
        afterAnimatedIn={handlePlay}
      >
        <div style={{ marginBottom: "27px" }}>
          <h2
            className={text.title2}
            style={{
              color: "white",
              marginTop: isMobile ? 30 : 0,
              fontSize: 40,
              marginBottom: 30,

              lineHeight: 0.5,
            }}
          >
            {t("OurValues")}
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            flexDirection: "column",
          }}
        >
          <div
            className={classes.textIcon}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              marginBottom: "18px",
              marginLeft: "2px",
            }}
          >
            {/* <i className="ion-wand" /> */}
            <Typography
              variant="h4"
              className={text.title2}
              style={{
                color: "rgb(240,181,67)",
                fontSize: "27px",
                lineHeight: "1.5em",
              }}
            >
              {t("Learn")}
            </Typography>
            <Typography
              variant="body"
              className={text.subtitle2}
              style={{
                marginLeft: 0,
                fontSize: "20px",
                lineHeight: "1.5em",
                marginLeft: "1px",
                textAlign: textAligned,
              }}
            >
              {t("LearnMsg")}
            </Typography>
          </div>
          <div
            className={classes.textIcon}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              marginBottom: "20px",
              marginLeft: "2px",
              textAlign: textAligned,
            }}
          >
            <Typography
              variant="h4"
              className={text.title2}
              style={{
                color: "rgb(240,181,67)",
                fontSize: "27px",
                lineHeight: "1.5em",
              }}
            >
              {t("Commit")}
            </Typography>
            <Typography
              variant="body"
              className={text.subtitle2}
              style={{
                marginLeft: 0,
                fontSize: "20px",
                lineHeight: "1.5em",
                marginLeft: "1px",
                textAlign: textAligned,
              }}
            >
              {t("CommitMsg")}
            </Typography>
          </div>
          <div
            className={classes.textIcon}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              marginBottom: "20px",
              marginLeft: "2px",
            }}
          >
            <Typography
              variant="h4"
              className={text.title2}
              style={{
                color: "rgb(240,181,67)",
                fontSize: "27px",
                lineHeight: "1.5em",
              }}
            >
              {t("Change")}
            </Typography>
            <Typography
              variant="body"
              className={text.subtitle2}
              style={{
                marginLeft: 0,
                fontSize: "20px",
                lineHeight: "1.5em",
                marginLeft: "1px",
              }}
            >
              {t("ChangeMsg")}
            </Typography>
          </div>
        </div>
      </ScrollAnimation>
    </div>
  );
}

export default Progress;
