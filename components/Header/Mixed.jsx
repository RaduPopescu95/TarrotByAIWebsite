import React, { useState, useEffect, Fragment } from "react";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Logo from "../Logo";

import MobileMenu from "./SideNav/MixedMobile";
import HeaderMenu from "./TopNav/MixedNav";
import UserMenu from "./TopNav/UserMenu";
import useStyles from "./header-style";
import samplePages from "./data/sample-pages";
import navData from "./data/single";
import i18nextConfig from "../../next-i18next.config";
import { useTranslation } from "next-i18next";
import multiple from "./data/multiple";
import { Button, Typography } from "@mui/material";
import link from "../../public/text/link";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../utils/colors";

function Mixed(props) {
  const [fixed, setFixed] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const { home } = props;
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const { userData, currentUser } = useAuth();
  const { t, i18n } = useTranslation();

  const buttonStyle = {
    position: "fixed",
    bottom: 35,
    left: 10,
    backgroundColor: "#ffc045",
    color: "white",
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "25px",
    zIndex: 15,
  };
  let flagFixed = false;

  const handleScroll = () => {
    const doc = document.documentElement;
    const scroll = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    const newFlagFixed = scroll > 80;
    if (flagFixed !== newFlagFixed) {
      setFixed(newFlagFixed);
      flagFixed = newFlagFixed;
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
  }, []);

  const handleOpenDrawer = () => {
    setOpenDrawer(!openDrawer);
  };

  const handleToggle = () => {
    setOpenMenu((prevOpen) => !prevOpen);
  };

  const handleClose = () => {
    setOpenMenu(false);
  };

  return (
    <Fragment>
      {isMobile && (
        <MobileMenu open={openDrawer} toggleDrawer={handleOpenDrawer} />
      )}
      <AppBar
        position="relative"
        id="header"
        className={cx(
          classes.header,
          openMenu && classes.noShadow,
          fixed && classes.fixed,
          openDrawer && classes.openDrawer
        )}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "transparent",
          maxHeight: "100px",
          zIndex: 9,
        }}
      >
        <Container
          fixed={isDesktop}
          style={{
            margin: 0,
            padding: 0,
            width: "100%",
            maxWidth: "none",
          }}
        >
          <div
            className={classes.headerContent}
            style={{ backgroundColor: "transparent" }}
          >
            <nav
              className={classes.navMenu}
              style={{ backgroundColor: "transparent" }}
            >
              {!props.isOnlySettngs && (
                <div
                  className={classes.logo}
                  style={{
                    paddingLeft: isMobile ? 10 : 10,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <a href={link.starter.home}>
                    <Logo type="landscape" fixed={fixed} />
                  </a>
                  {userData ? (
                    <Typography style={{ color: "white" }}>
                      {t("helloUser")}, {userData && userData.first_name}!
                    </Typography>
                  ) : (
                    <Typography style={{ color: "white" }}>
                      {t("helloUser")} !
                    </Typography>
                  )}
                </div>
              )}

              {isMobile && (
                <IconButton
                  onClick={handleOpenDrawer}
                  className={cx(
                    "hamburger hamburger--spin",
                    classes.mobileMenu,
                    openDrawer && "is-active"
                  )}
                  size="large"
                  aria-label="Toggle navigation menu"
                >
                  <span className="hamburger-box" style={{ color: "white" }}>
                    <span className={cx(classes.bar, "hamburger-inner")} />
                  </span>
                </IconButton>
              )}

              {isDesktop && !props.isOnlySettngs && (
                <div className={classes.mainMenu}>
                  <HeaderMenu
                    open={openMenu}
                    menuPrimary={navData}
                    dataMenu={multiple}
                    menuSecondary={samplePages}
                    toggle={handleToggle}
                    close={handleClose}
                    singleNav={home}
                    fixed={fixed}
                  />
                </div>
              )}

              {isDesktop && <UserMenu isOnlySettngs={props.isOnlySettngs} />}
            </nav>
          </div>
        </Container>
      </AppBar>

      {/* <div
        style={{
          backgroundColor: "#252525",
          height: isDesktop ? "86px" : "56px",
          width: "100%",
        }}
      ></div> */}
      {isMobile && currentUser && (
        <div
          style={{
            position: "fixed", // Schimbă aici din "absolute" în "fixed"
            bottom: 0,
            zIndex: 12,
            width: "100%",
            backgroundColor: colors.primary3,
            height: "60px",
          }}
        >
          <HeaderMenu
            open={openMenu}
            menuPrimary={navData}
            dataMenu={multiple}
            menuSecondary={samplePages}
            toggle={handleToggle}
            close={handleClose}
            singleNav={home}
            fixed={fixed}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
              content: '""',
              listStyleType: "none" /* Elimină bullet points */,
              paddingLeft: 0 /* Opțional, elimină indentarea */,
              margin: 4,
            }}
            fontSize={50}
          />
        </div>
      )}
    </Fragment>
  );
}

Mixed.defaultProps = {
  home: false,
};

export default Mixed;
