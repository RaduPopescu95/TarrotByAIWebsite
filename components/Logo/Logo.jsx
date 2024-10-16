import React from "react";
import PropTypes from "prop-types";

import useStyles from "./logo-style";
import Image from "next/image";
// import LazyLoad from "react-lazyload";
import { useMediaQuery, useTheme } from "@mui/material";

function Logo(props) {
  const { classes, cx } = useStyles();
  const { type, size } = props;
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <span className={cx(classes[type], classes.logo, classes[size])}>
      {/* <LazyLoad height={200} offset={100} once> */}
      <img
        src={"/LogoPngTransparent.png"}
        alt="Cristina Zurba Logo"
        width={65}
        height={50}
        style={{ height: "60px" }}
      />
      {/* </LazyLoad> */}
      {/* { type !== 'only' ? brand.starter.name : '' } */}
    </span>
  );
}

Logo.propTypes = {
  type: PropTypes.string.isRequired,
  size: PropTypes.string,
};

Logo.defaultProps = {
  size: "medium",
};

export default Logo;
