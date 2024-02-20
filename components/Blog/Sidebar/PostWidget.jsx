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

function PostWidget({ lastFiveArticles, isRo }) {
  const filters = ["filterOne", "filterTwo", "filterThree"];

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
                  backgroundColor: "#252525", // Culoarea pentru hover
                },
              }}
            >
              <ListItemText
                primary={item}
                primaryTypographyProps={{ style: { color: "white" } }}
                secondaryTypographyProps={{ style: { color: "#d3a03e" } }}
              />
            </ListItem>
          ))}
        </List>
      </div>
    </Paper>
  );
}

export default PostWidget;
