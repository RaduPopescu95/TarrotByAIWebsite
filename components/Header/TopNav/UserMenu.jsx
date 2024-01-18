import React from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import AppleIcon from "@mui/icons-material/Apple";

import PhoneIcon from "@mui/icons-material/Phone";

import useStyles from "../header-style";
import Settings from "./Settings";

function UserMenu(props) {
  const { classes } = useStyles();
  const theme = useTheme();

  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  return (
    <div className={classes.userMenu}>
      <div style={{ display: "flex", alignItems: "center", width: "110px" }}>
        {/* <Button
          href={"Tel:+40345404753"}
          style={{
            color: "white",
            marginLeft: "0px",
            fontSize: 16,
            padding: "0px 5px 0px 0px",
          }}
          sx={{ "&:hover": { backgroundColor: "transparent" } }}
        >
          +40 345 404 753
        </Button> */}
        <Settings />
        <img
          src={"/gplay.png"}
          style={{ width: "40px", height: "40px", marginRight: 10 }}
        />
        <img src={"/appstore.png"} style={{ width: "40px", height: "40px" }} />
      </div>
    </div>
  );
}

export default UserMenu;
