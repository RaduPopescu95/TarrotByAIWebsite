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

function PostWidget({ lastFiveArticles }) {
  const { classes } = useStyles();

  const route = useRouter();

  const handleRoute = (item) => {
    route.push({
      pathname: "/news/[slug]",
      query: {
        slug: item.id,
      },
    });
  };

  return (
    <Paper
      title={"Latest Articles"}
      icon="ion-android-bookmark"
      whiteBg
      desc=""
    >
      <div
        className={classes.albumRoot}
        style={{ backgroundColor: "transparent" }}
      >
        <List component="nav">
          {lastFiveArticles.map((item, index) => (
            <Link
              href={{
                pathname: "/news/[slug]",
                query: { slug: `${item.id}-${toUrlSlug(item.name)}` },
              }}
              as={`/news/${item.id}-${toUrlSlug(item.name)}`}
              passHref={false}
            >
              <ListItem
                button
                sx={{
                  "&:hover": {
                    backgroundColor: "#252525", // Culoarea pentru hover
                  },
                }}
              >
                <ListItemText
                  primary={item.name}
                  secondary={item.date}
                  primaryTypographyProps={{ style: { color: "white" } }}
                  secondaryTypographyProps={{ style: { color: "#d3a03e" } }}
                />
              </ListItem>
            </Link>
          ))}
        </List>
      </div>
    </Paper>
  );
}

export default PostWidget;
