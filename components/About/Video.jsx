import React from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { useText } from "~/theme/common";
import useStyles from "./about-style";
import Image from "next/image";
import { useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "next-i18next";
function Video({ textAligned }) {
  const { t } = useTranslation("common");
  const { classes } = useStyles();
  const { classes: text } = useText();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <div
      className={classes.bannerWrap}
      style={{
        backgroundColor: "#252525",
      }}
    >
      <div className={classes.inner}>
        <Container sx={{ padding: 0 }}>
          <Grid
            container
            rowGap={2}
            alignItems="flex-start"
            justifyContent="flex-start"
          >
            <Grid item sm={6}>
              <Box px={{ sm: 5 }}>
                <img
                  src="/vision.jpg"
                  style={{
                    width: "100%",
                    height: "auto",
                    minWidth: "60%",
                    borderRadius: 2,
                  }}
                  width={768}
                  height={476}
                  alt="Matteale Consulting"
                />
              </Box>
            </Grid>
            <Grid item sm={6}>
              <Box px={{ sm: 5 }}>
                <div className={classes.text}>
                  <h2
                    className={text.title2}
                    style={{
                      color: "white",
                      marginTop: isMobile && 10,
                      fontSize: 40,
                      marginBottom: 30,

                      lineHeight: isMobile && 0.5,
                    }}
                  >
                    {t("OurVision")}
                  </h2>
                  <h5
                    className={text.subtitle2}
                    style={{
                      marginTop: 0,
                      fontSize: 20,
                      textAlign: textAligned,
                      lineHeight: isMobile && 1.5,
                    }}
                  >
                    {t("OurVisionMsg")}
                  </h5>
                </div>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </div>
    </div>
  );
}

export default Video;
