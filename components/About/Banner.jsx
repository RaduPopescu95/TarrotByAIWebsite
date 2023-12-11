import React from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { useText } from "~/theme/common";
import useStyles from "./about-style";
import Image from "next/image";
import { useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "next-i18next";

function Banner({ textAligned }) {
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
        backgroundColor: "black",
      }}
    >
      <div className={classes.inner}>
        <Container sx={{ padding: 0 }}>
          <Grid
            container
            rowGap={5}
            alignItems="flex-start"
            justifyContent="flex-start"
          >
            <Grid item sm={6} order={{ xs: 2, sm: 1, md: 1 }}>
              <Box px={{ sm: 5 }}>
                <div className={classes.text}>
                  <h2
                    className={text.title2}
                    style={{
                      color: "white",
                      marginTop: 0,
                      fontSize: 40,
                      marginBottom: 30,

                      lineHeight: 0.5,
                    }}
                  >
                    {t("OurStory")}
                  </h2>
                  <p
                    className={text.subtitle2}
                    style={{
                      marginTop: 0,
                      fontSize: 20,
                      textAlign: textAligned,
                      lineHeight: isMobile && 1.5,
                    }}
                  >
                    {t("OurStoryMsg")}
                  </p>
                </div>
              </Box>
            </Grid>
            <Grid item sm={6} order={{ xs: 1, sm: 2, md: 2 }}>
              <Box px={{ sm: 5 }}>
                <img
                  src="/ourStory.jpg"
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
          </Grid>
        </Container>
      </div>
    </div>
  );
}

export default Banner;
