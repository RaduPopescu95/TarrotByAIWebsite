import React from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useTranslation } from "next-i18next";

import useStyles from "./serv-style";
import Image from "next/image";
import { customStyles } from "../../data/data";

function Serv({ filteredServices }) {
  const { t: tCommon } = useTranslation("common");
  const { t: tServices } = useTranslation("services");

  const { classes } = useStyles();

  // Theme breakpoints
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  // Functie pentru partajare pe Facebook
  const shareOnFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank"
    );
  };

  // Functie pentru partajare pe Twitter
  const shareOnTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?url=${url}`, "_blank");
  };

  // Functie pentru partajare pe LinkedIn
  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/shareArticle?mini=true&url=${url}`,
      "_blank"
    );
  };

  return (
    <div className={classes.root}>
      <style>{customStyles}</style> {/* Incluziunea stilurilor CSS */}
      <article className={classes.article}>
        <div className={classes.content}>
          <Typography variant="h2" className={classes.titleBlog}>
            {tCommon(filteredServices.name)}
          </Typography>

          <figure className={classes.imageBlog}>
            <img
              width={1440}
              height={isDesktop ? 282 : 123}
              src={filteredServices.image.finalUri}
              alt="blog"
            />
          </figure>
          <div
            dangerouslySetInnerHTML={{
              __html: filteredServices.content,
            }}
            style={{ color: "white" }}
          ></div>

          <Divider className={classes.dividerBordered} />
        </div>
      </article>
      <Divider className={classes.dividerBordered} />
    </div>
  );
}

export default Serv;
