import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import Paper from "../../Paper";
import useStyles from "../blog-style";
import { Button } from "@mui/material";
import { useRouter } from "next/router";
import Link from "next/link";
import { toUrlSlug } from "../../../utils/commonUtils";
import { colors } from "../../../utils/colors";

function PostWidget({ handleFilter, filterItem }) {
  const filters = [
    "All",
    "Previziuni zilnice",
    "Previziuni săptămânale",
    "Previziuni lunare",
    "Previziuni anuale",
  ];

  const { classes } = useStyles();

  const route = useRouter();

  return (
    <Paper title={"Filters"} icon="ion-android-bookmark" whiteBg desc="">
      <div
        className={classes.albumRoot}
        style={{ backgroundColor: "transparent" }}
      >
        <List component="nav">
          {filters.map((item, index) => (
            <ListItem
              button
              sx={{
                "&:hover": {
                  backgroundColor: colors.primary3, // Culoarea pentru hover pe ListItem
                  // Schimbă culoarea textului la hover prin referirea la copilul ListItemText
                  "& .MuiTypography-root": {
                    color: "white",
                  },
                },
                backgroundColor:
                  filterItem === item ? colors.primary3 : "transparent",
              }}
              onClick={() => handleFilter(item)}
            >
              <ListItemText
                primary={item}
                sx={{
                  ".MuiTypography-root": {
                    // Aplică stilul pentru toate elementele Typography din ListItemText
                    color: filterItem === item ? "white" : colors.primary3,
                    height: "2rem",
                    width: "auto",
                  },
                  ".MuiTypography-secondary": {
                    color: "#d3a03e", // Culoarea pentru textul secundar, fără hover specific
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </div>
    </Paper>
  );
}

export default PostWidget;
