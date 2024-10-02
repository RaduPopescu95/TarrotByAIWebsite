import React from "react";
import PropTypes from "prop-types";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ButtonBase from "@mui/material/ButtonBase";
import useStyles from "./media-card-style";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Image from 'next/image';


function MediaCard(props) {
  const { classes, cx } = useStyles();
  const { thumb, title, orientation, duration, type, action, href } = props;

  return (
    <Card
      className={cx(classes.mediaCard, classes[orientation], classes[type])}
    >
      <CardContent>
     
        <figure>
        <img src={thumb} alt="cover" style={{ objectFit: "cover", width: "100%", height: "100%" }} />

        </figure>
        <div className={classes.property}>
          {type === "video" && (
            <IconButton
              className={classes.playBtn}
              onClick={action}
              aria-label="Play button" 
              size="large"
            >
              <PlayArrowIcon style={{ color: "white", fontSize: 60 }} />
            </IconButton>
          )}
          <Typography className={classes.mediaTitle} variant="h5">
            {title}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

MediaCard.propTypes = {
  thumb: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  type: PropTypes.string,
  orientation: PropTypes.string,
  duration: PropTypes.string,
  href: PropTypes.string,
  action: PropTypes.func,
};

MediaCard.defaultProps = {
  duration: "00:01",
  type: "video",
  orientation: "portrait",
  href: "#",
  action: () => {},
};

export default MediaCard;
