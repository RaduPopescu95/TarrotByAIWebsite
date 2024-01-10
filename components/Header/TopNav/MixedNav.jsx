import React from "react";
import Link from "next/link";
import DropdownMenu from "./dropdownMenu";
import useStyles from "../header-style";
import { useTranslation } from "next-i18next";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StyleIcon from "@mui/icons-material/Style";
import PersonIcon from "@mui/icons-material/Person";

function NavBar({ fixed }) {
  const { classes } = useStyles();
  const navData = ["Home", "About", "Contact"];

  const { t, i18n } = useTranslation("common");
  return (
    <ul>
      {navData.map((item, index) => {
        return (
          <li key={index}>
            <Link
              href={`/${item.toLowerCase()}`}
              style={{
                color: "white",
              }}
              onMouseEnter={(e) => (e.target.style.borderBottomColor = "#FFF")}
              onMouseLeave={(e) =>
                (e.target.style.borderBottomColor = "transparent")
              }
            >
              {item === "Home" ? (
                <StarBorderIcon className={classes.iconHover} />
              ) : item === "About" ? (
                <StyleIcon className={classes.iconHover} />
              ) : (
                <PersonIcon className={classes.iconHover} />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default NavBar;
