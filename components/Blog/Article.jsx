import React from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import useStyles from "./blog-style";
import { usePathname } from "next/navigation";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import Image from "next/image";
import { customStyles } from "../../data/data";

function Article({ filteredArticles }) {
  const { classes } = useStyles();

  const pathname = usePathname();

  // Functie pentru partajare pe Facebook
  const shareOnFacebook = () => {
    const url = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank"
    );
  };

  // Functie pentru partajare pe instagram
  const shareOnInstagram = () => {
    window.open("instagram://camera", "_blank");
  };

  // Functie pentru partajare pe LinkedIn
  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/shareArticle?mini=true&url=${url}`,
      "_blank"
    );
  };

  // Theme breakpoints
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  return (
    <div className={classes.root}>
      <style>{customStyles}</style> {/* Incluziunea stilurilor CSS */}
      <article className={classes.article}>
        <div className={classes.content}>
          <Typography variant="h2" className={classes.titleBlog}>
            {filteredArticles.name}
          </Typography>
          <span className={classes.caption} style={{ color: "white" }}>
            {filteredArticles.date}
          </span>
          <figure className={classes.imageBlog}>
            <img
              width={1440}
              height={isDesktop ? 282 : 123}
              src={filteredArticles.image.finalUri}
              alt="blog"
            />
          </figure>
          <div
            dangerouslySetInnerHTML={{
              __html: filteredArticles.content,
            }}
            style={{ color: "white" }}
          ></div>

          <Divider className={classes.dividerBordered} />
        </div>
      </article>
      <section className={classes.socmedShare}>
        <div className={classes.btnArea}>
          <Typography variant="h6" sx={{ color: "white" }}>
            Share to social media
          </Typography>
          <Box mt={3}>
            <Button
              variant="outlined"
              className={classes.indigoBtn}
              type="button"
              onClick={shareOnFacebook}
            >
              <FacebookIcon sx={{ marginRight: isDesktop && 1 }} />
              {isDesktop && "Facebook"}
            </Button>
            <Button
              variant="outlined"
              className={classes.cyanBtn}
              type="button"
              onClick={shareOnInstagram}
            >
              <InstagramIcon sx={{ marginRight: isDesktop && 1 }} />
              {isDesktop && "Instagram"}
            </Button>
            <Button
              variant="outlined"
              className={classes.blueBtn}
              type="button"
              onClick={shareOnLinkedIn}
            >
              <LinkedInIcon sx={{ marginRight: isDesktop && 1 }} />
              {isDesktop && "Linkedin"}
            </Button>
          </Box>
        </div>
      </section>
      <Divider className={classes.dividerBordered} />
    </div>
  );
}

export default Article;
