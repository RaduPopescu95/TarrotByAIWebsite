import React from "react";
import Link from "next/link";
import DropdownMenu from "./dropdownMenu";
import useStyles from "../header-style";
import { useTranslation } from "next-i18next";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StyleIcon from "@mui/icons-material/Style";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../../../context/AuthContext";
import { useApiData } from "../../../context/ApiContext";
import { useRouter } from "next/router";
import { colors } from "../../../utils/colors";
import { useNumberContext } from "../../../context/NumberContext";

function NavBar({ fixed }) {
  const { classes } = useStyles();
  const { currentNumber, updateNumber, sendToHistory, setSendToHistory } =
    useNumberContext();
  const navData = ["", "citire-personalizata", "settings"];
  const {
    shuffleCartiViitor,
    startExitAnimation,
    setLoading,
    shuffleCartiPersonalizate,
  } = useApiData();
  const router = useRouter(); // Utilizați useRouter

  // Verificați dacă calea URL-ului curent este una dintre cele specificate
  const isCurrentPathSpecial =
    router.pathname === "/citire-viitor" ||
    router.pathname === "/citire-personalizata";

  const { t, i18n } = useTranslation("common");

  const handleStyleIconClick = () => {
    updateNumber(1);
    console.log("Star....exit...");
    startExitAnimation(); // Declanșează animația de ieșire
    setTimeout(() => {
      setLoading(true);
      if (router.pathname === "/citire-viitor") {
        shuffleCartiViitor(); // Amestecă cărțile după finalizarea animației
      } else if (router.pathname === "/citire-personalizata") {
        shuffleCartiPersonalizate(); // Amestecă cărțile după finalizarea animației
      }
    }, 1100); // Durata animației de ieșire, ajustează conform nevoilor
  };

  return (
    <ul>
      {navData.map((item, index) => {
        const isActive = router.pathname === `/${item.toLowerCase()}`;
        return (
          <li key={index}>
            {item === "citire-personalizata" && isCurrentPathSpecial ? (
              <StyleIcon
                className={isActive ? classes.iconHovered : classes.iconHover}
                onClick={handleStyleIconClick}
                style={{
                  color: isActive ? "white" : colors.primary3,
                  fontSize: isActive ? "70px" : "60px",
                  backgroundColor: "rgba(255, 255, 255, 1)",
                  color: colors.primary3,
                  borderRadius: 15,
                  cursor: "pointer",
                }}
              />
            ) : (
              // Restul logicii rămâne neschimbat
              <Link
                href={`/${item.toLowerCase()}`}
                style={{ color: "white" }}
                onMouseEnter={(e) =>
                  (e.target.style.borderBottomColor = "#FFF")
                }
                onMouseLeave={(e) =>
                  (e.target.style.borderBottomColor = "transparent")
                }
                onClick={() => updateNumber(1)}
              >
                {item === "" ? (
                  <StarBorderIcon
                    className={
                      isActive ? classes.iconHovered : classes.iconHover
                    }
                  />
                ) : item === "citire-personalizata" ? (
                  <StyleIcon
                    className={
                      isActive ? classes.iconHovered : classes.iconHover
                    }
                  />
                ) : (
                  <PersonIcon
                    className={
                      isActive ? classes.iconHovered : classes.iconHover
                    }
                  />
                )}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default NavBar;
