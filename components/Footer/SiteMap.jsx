import React from "react";
import PropTypes from "prop-types";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";

import { useTextAlign } from "~/theme/common";

import useStyles from "./sitemap-style";

import Subscribe from "../Subscribe";
import FacebookIcon from "@mui/icons-material/Facebook";

import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Image from "next/image";
import { useTranslation } from "next-i18next";

function Copyright() {
  const { t } = useTranslation("common");

  return (
    <Typography
      sx={{ color: "white" }}
      variant="body2"
      display="block"
      color="textSecondary"
    >
      &copy;&nbsp; 2023. Cristina Zurba. {t("RightsReserved")}.
    </Typography>
  );
}

const footers = [
  {
    title: "Company",
    description: ["About", "Services", "Contact", "News"],
    link: ["/about", "/services", "/contact", "/news"],
  },
  {
    title: "Services",
    description: [
      "IT Infrastructure Support",
      "Web and app support",
      "SAP Migration and implementation",
      "Cloud Services",
    ],
    link: [
      "/services/it-infrastructure-support",
      "/services/web-app-support",
      "/services/SAP-migration-implementation",
      "/services/cloud-solutions",
    ],
  },
  {
    title: "Legal",
    description: ["Privacy policy"],
    link: ["/privacypolicy"],
  },
];

function Footer(props) {
  const { t } = useTranslation("common");
  // Theme breakpoints
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Translation Function
  const { toggleDir } = props;

  const { classes } = useStyles();
  const { classes: align } = useTextAlign();

  return (
    <div component="footer" className={classes.footer}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <div style={{ overflow: "hidden" }}>
            <img
              src={"/matlogo.png"}
              alt="logo"
              width={155}
              height={60}
              style={{
                objectFit: "contain",
              }}
            />

            <Typography
              color="textPrimary"
              className={classes.footerDesc}
              gutterBottom
              style={{
                textAlign: "left",
                paddingLeft: 0,
                overflow: "hidden",
                // textOverflow: "ellipsis",
                // display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2, // Setează la 2 pentru a afișa maxim 2 linii
                maxWidth: 400,
              }}
            >
              {t("FooterMsg")}
            </Typography>
          </div>
          {isDesktop && <Copyright />}
        </Grid>
        <Grid item xs={12} md={6}>
          <Grid container spacing={4} justifyContent="space-evenly">
            {footers.map((footer) => (
              <Grid
                item
                xs={12}
                sm={4}
                md={footer.title === "Services" ? 5.7 : 2.8}
                key={footer.title}
                className={classes.siteMapItem}
              >
                <div>
                  <Typography
                    variant="h2"
                    className={classes.title}
                    color="white"
                    gutterBottom
                    style={{ fontSize: "17px" }}
                  >
                    {footer.title}
                  </Typography>
                  <ul>
                    {footer.description.map((item, index) => (
                      <li key={item}>
                        <Link
                          href={footer.link[index]}
                          className={classes.navLinkMixed}
                          variant="subtitle1"
                          underline="hover"
                          style={{
                            color: "white",
                            fontSize: "16px",
                            marginRight: 0,
                          }}
                        >
                          {t(item)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item xs={12} md={3}>
          <div className={classes.socmed}>
            <IconButton
              aria-label="FB"
              className={classes.margin}
              size="small"
              style={{ backgroundColor: "#1877F2", marginLeft: 0 }}
            >
              <a
                href="https://www.facebook.com/cristinazurba"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center" }}
                aria-label="Cristina Zurba on Facebook"
              >
                <FacebookIcon style={{ color: "white" }} />
              </a>
            </IconButton>

            <IconButton
              aria-label="IG"
              className={classes.margin}
              size="small"
              style={{
                background:
                  "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
              }}
            >
              <a
                href="https://www.instagram.com/cristinazurba/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center" }}
                aria-label="Cristina Zurba on Instagram"
              >
                <InstagramIcon style={{ color: "white" }} />
              </a>
            </IconButton>

            <IconButton
              className={classes.margin}
              size="small"
              style={{ backgroundColor: "#0077B5" }}
              aria-label="Cristina Zurba on Linkedin"
            >
              <a
                href="https://www.linkedin.com/company/cristinazurba/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center" }}
                aria-label="Cristina Zurba on Linkedin"
              >
                <LinkedInIcon style={{ color: "white" }} />
              </a>
            </IconButton>

            <IconButton
              aria-label="Cristina Zurba on Youtube"
              className={classes.margin}
              size="small"
              style={{ backgroundColor: "#FF0000" }}
            >
              <a
                href="https://www.youtube.com/channel/UCcCrYY8-Afj8UvVuM0PyC_A"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center" }}
                aria-label="Cristina Zurba on Youtube"
              >
                <YouTubeIcon style={{ color: "white" }} />
              </a>
            </IconButton>
          </div>
          {/* <Subscribe /> */}
        </Grid>
      </Grid>
      {isMobile && (
        <div className={align.textCenter}>
          <Box p={4}>
            <Copyright />
          </Box>
        </div>
      )}
    </div>
  );
}

Footer.propTypes = {
  toggleDir: PropTypes.func,
};

Footer.defaultProps = {
  toggleDir: () => {},
};

export default Footer;
