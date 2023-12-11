import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "next-i18next";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import Popper from "@mui/material/Popper";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import Paper from "@mui/material/Paper";
import Grow from "@mui/material/Grow";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import useStyles from "../header-style";
import i18nextConfig from "~/next-i18next.config";
import LanguageSwitch from "../../LangSwitch/Menu";
import { Divider } from "@mui/material";

function Settings(props) {
  const { classes } = useStyles();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const { t, i18n } = useTranslation("common");
  const { toggleDark, toggleDir, invert, isMobile } = props;

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    // Verifică dacă evenimentul și target-ul evenimentului sunt definite
    if (
      event &&
      event.target &&
      anchorRef.current &&
      anchorRef.current.contains(event.target)
    ) {
      return;
    }
    setOpen(false);
  };

  return (
    <div className={classes.setting} style={{ margin: isMobile && 20 }}>
      <IconButton
        ref={anchorRef}
        aria-describedby={open ? "settings-popper" : undefined}
        aria-label="Settings"
        onClick={handleToggle}
        className={classes.icon}
        size="large"
      >
        <SettingsIcon fontSize="inherit" style={{ color: "white" }} />
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        placement="bottom-start"
        className={classes.popper}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <List
                  component="nav"
                  aria-label="Language-menu"
                  // subheader={
                  //   <>
                  //     <ListSubheader component="div" style={{ color: "white" }}>
                  //       {t("Language")}
                  //     </ListSubheader>
                  //     <div
                  //       style={{
                  //         backgroundColor: "white",
                  //         height: "1px",
                  //         width: "100%",
                  //       }}
                  //     ></div>
                  //   </>
                  // }
                  style={{ display: "flex", flexDirection: "column" }} // Adaugă acest stil
                >
                  {i18nextConfig.i18n.locales.map((locale) => (
                    <LanguageSwitch
                      ssg={i18nextConfig.ssg}
                      locale={locale}
                      key={locale}
                      checked={locale === i18n.language}
                      toggleDir={toggleDir}
                      closePopup={handleClose}
                    />
                  ))}
                </List>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
}

Settings.propTypes = {
  toggleDark: PropTypes.func.isRequired,
  toggleDir: PropTypes.func.isRequired,
  invert: PropTypes.bool,
};

Settings.defaultProps = {
  invert: false,
};

export default Settings;
