import React from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import AppleIcon from "@mui/icons-material/Apple";
import BookmarkIcon from "@mui/icons-material/Bookmark";

import PhoneIcon from "@mui/icons-material/Phone";

import useStyles from "../header-style";
import Settings from "./Settings";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";

function UserMenu(props) {
  const { classes } = useStyles();
  const theme = useTheme();
  const { currentUser } = useAuth();

  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  return (
    <div className={classes.userMenu}>
      <div style={{ display: "flex", alignItems: "center", width: "auto" }}>
        {/* Buton pentru linkurile utilizatorilor neînregistrați */}
        {!currentUser && (
          <Link href="/linkurile-mele-guest" passHref>
            <Button
              style={{
                color: "white",
                marginRight: "10px",
                fontSize: 14,
                padding: "8px 16px",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "20px",
                textTransform: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              sx={{ 
                "&:hover": { 
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.6)"
                } 
              }}
            >
              <BookmarkIcon style={{ fontSize: 18 }} />
              Linkurile Mele
            </Button>
          </Link>
        )}
        
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
        {!props.isSlug && <Settings isWhiteBg={props.isOnlySettngs} />}
      </div>
    </div>
  );
}

export default UserMenu;
