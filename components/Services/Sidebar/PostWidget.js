import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import Paper from "../../Paper";
import useStyles from "../service-style";
import { Button } from "@mui/material";
import { useDatabase } from "../../../context/DatabaseContext";
import { useRouter } from "next/router";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { constantServices } from "../../../data/servicesData";
import Link from "next/link";
import { toUrlSlug } from "../../../utils/commonUtils";
import { useTranslation } from "next-i18next";

function PostWidget({ services }) {
  const { t: tCommon } = useTranslation("common");
  const { t: tServices } = useTranslation("services");

  const { classes } = useStyles();

  const route = useRouter();
  const handleRoute = (item) => {
    route.push({
      pathname: "/services/[slug]",
      query: {
        slug: item.id,
      },
    });
  };
  return (
    <Paper
      title={tCommon("Other Services")}
      // sx={{ textAlign: "start" }}
      icon="none"
      whiteBg
      desc=""
    >
      <div
        className={classes.albumRoot}
        style={{ backgroundColor: "transparent" }}
      >
        <List component="nav">
          {constantServices.map((item, index) => (
            <ListItem
              key={index.toString()}
              onClick={() => {
                route.push({
                  pathname: item.link,
                });
              }}
              button
              sx={{ width: "auto", paddingLeft: 0, paddingRight: 0 }}
              className={classes.listItemContainer}
            >
              <ListItemText
                className={classes.listItem}
                primary={tCommon(item.name)}
                primaryTypographyProps={{
                  style: { color: "white", width: "auto" },
                }}
              />
            </ListItem>
          ))}
          {services.servicesArray.map((item, index) => (
            <Link
              href={{
                pathname: "/services/[slug]",
                query: { slug: `${item.id}-${toUrlSlug(item.name)}` },
              }}
              as={`/services/${item.id}-${toUrlSlug(item.name)}`}
              passHref={false}
            >
              <ListItem
                key={index.toString()}
                button
                sx={{ width: "auto", paddingLeft: 0, paddingRight: 0 }}
                className={classes.listItemContainer}
              >
                <ListItemText
                  className={classes.listItem}
                  primary={item.title}
                  primaryTypographyProps={{
                    style: { color: "white", width: "auto" },
                  }}
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
