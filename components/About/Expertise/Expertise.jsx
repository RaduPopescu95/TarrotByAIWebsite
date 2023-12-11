import React from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import ScrollAnimation from "react-scroll-animation-wrapper";

import { useText } from "~/theme/common";
import useStyles from "./expertise-style";
import TitleDeco from "./Title/WithDecoration";
import { useTranslation } from "next-i18next";

function Expertise({ textAligned }) {
  const { t } = useTranslation("common");
  // Theme breakpoints
  const theme = useTheme();
  const { classes: text } = useText();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // Translate Function

  const { classes, cx } = useStyles();
  return (
    <div className={classes.root}>
      <Container>
        <Grid container justifyContent="center" spacing={6}>
          {isDesktop && (
            <Grid item md={4} xs={12}>
              <div className={classes.titleDeco}>
                <svg
                  fill="#252525"
                  width={845}
                  height={1099}
                  className={classes.decoration}
                >
                  <use xlinkHref="/images/expertise/wave_decoration.svg#main" />
                </svg>
                <TitleDeco text={t("OurExpertise")} />
              </div>
            </Grid>
          )}
          <Grid
            item
            lg={7}
            md={8}
            xs={12}
            style={{ paddingLeft: textAligned == "start" && 35 }}
          >
            {textAligned == "start" && (
              <h2
                className={text.title2}
                style={{
                  color: "white",
                  marginTop: 10,
                  fontSize: 40,
                  marginBottom: 30,

                  lineHeight: 0.5,
                  textAlign: "start",
                }}
              >
                {t("OurExpertise")}
              </h2>
            )}
            <h3
              className={text.subtitle}
              style={{
                color: "white",
                fontSize: !isDesktop ? "20px" : "30px",
                textAlign: textAligned,
                lineHeight: 1.5,
              }}
            >
              {t("OurExpertiseMsg")}
            </h3>

            <div className={classes.list}>
              <Grid container spacing={isDesktop ? 2 : 4}>
                <Grid item sm={6} xs={6}>
                  <div
                    className={cx(classes.descIcon, classes.iconPrimary)}
                  ></div>
                  <h3 className={text.subtitle} style={{ color: "white" }}>
                    SAP S/4HANA
                  </h3>
                  {/* <p
                    className={text.paragraph}
                    style={{ color: "white", fontSize: "20px" }}
                  >
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s.
                  </p> */}
                </Grid>
                <Grid item sm={6} xs={6}>
                  <div
                    className={cx(classes.descIcon, classes.iconSecondary)}
                  ></div>
                  <h3 className={text.subtitle} style={{ color: "white" }}>
                    SAP Business One
                  </h3>
                </Grid>
                <Grid item sm={6} xs={6}>
                  <div
                    className={cx(classes.descIcon, classes.iconAccent)}
                  ></div>
                  <h3 className={text.subtitle} style={{ color: "white" }}>
                    SAP Business Objects
                  </h3>
                </Grid>
                <Grid item sm={6} xs={6}>
                  <div
                    className={cx(classes.descIcon, classes.iconAccent)}
                  ></div>
                  <h3 className={text.subtitle} style={{ color: "white" }}>
                    SAP Fiori
                  </h3>
                </Grid>
                <Grid item sm={6} xs={6}>
                  <div
                    className={cx(classes.descIcon, classes.iconAccent)}
                  ></div>
                  <h3 className={text.subtitle} style={{ color: "white" }}>
                    MM/WM
                  </h3>
                </Grid>
                <Grid item sm={6} xs={6}>
                  <div
                    className={cx(classes.descIcon, classes.iconAccent)}
                  ></div>
                  <h3 className={text.subtitle} style={{ color: "white" }}>
                    FICO
                  </h3>
                </Grid>
                <Grid item sm={6} xs={6}>
                  <div
                    className={cx(classes.descIcon, classes.iconAccent)}
                  ></div>
                  <h3 className={text.subtitle} style={{ color: "white" }}>
                    HR
                  </h3>
                </Grid>
              </Grid>
            </div>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default Expertise;
