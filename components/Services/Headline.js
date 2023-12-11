import React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import link from "~/public/text/link";
import { useText } from "~/theme/common";
import useStyles from "./service-style";
import Image from "next/image";

function Headline() {
  const { classes, cx } = useStyles();
  const { classes: text } = useText();
  return (
    <Card className={classes.blogHeadline}>
      {/* <Image
        className={classes.media}
        src="https://source.unsplash.com/random"
        width={500}
        height={500}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
        loading="lazy"
        alt="News Headline"
      /> */}

<img
 className={classes.media}
       width={500}
       height={500}
    src="https://source.unsplash.com/random"
 
    alt="Headline"
  />
      <CardActionArea href={link.starter.blogDetail}>
        <CardContent>
          <span className={classes.anchorContent}>
            <span className={cx(classes.headlineTitle, text.title2)}>
              Pellentesque habitant morbi tristique senectus Proin pretium arcu
              eget.
            </span>
            <span className={cx(classes.subtitle, text.subtitle2)}>
              Multiple lines of text that form the lede, informing new readers
              quickly and efficiently about what&apos;s most interesting in this
              posts contents.
            </span>
          </span>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default Headline;
