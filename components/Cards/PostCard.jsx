import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import CardMedia from "@mui/material/CardMedia";
import Box from "@mui/material/Box";

import useStyles from "./post-card-style";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { toUrlSlug } from "../../utils/commonUtils";

function PostCard(props) {
  const { classes, cx } = useStyles();
  const { date, title, desc, img, orientation, type, href, id } = props;

  const route = useRouter();

  useEffect(() => {}, []);

  return (
    <Card className={cx(classes.newsCard, classes[orientation], classes[type])}>
      <div className={classes.figure}>
        <img
          className={classes.media}
          src={img}
          alt="thumb"
          width={500}
          height={500}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </div>
      <div className={classes.properties}>
        <CardContent>
          <div className={classes.text}>
            <Typography
              display="block"
              noWrap
              variant="h2"
              className={classes.title}
            >
              <Box
                component="span"
                display="block"
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {title}
              </Box>
            </Typography>
            <Typography variant="caption" className={classes.caption}>
              {date}
            </Typography>
            <Typography display="block" className={classes.desc}>
              <span>{desc}</span>
            </Typography>
          </div>
        </CardContent>
        <Link
          href={{
            pathname: "/news/[slug]",
            query: { slug: `${id}-${toUrlSlug(title)}` },
          }}
          as={`/news/${id}-${toUrlSlug(title)}`}
          passHref={false}
        >
          <CardActions className={classes.action}>
            <Button variant="outlined" className={classes.btn}>
              Read More
            </Button>
          </CardActions>
        </Link>
      </div>
    </Card>
  );
}

PostCard.propTypes = {
  date: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  orientation: PropTypes.string,

  type: PropTypes.string,
  href: PropTypes.string,
};

PostCard.defaultProps = {
  orientation: "portrait",
  href: "#!",
  type: "full", // available props: full, rounded, over, oval
};

export default PostCard;
