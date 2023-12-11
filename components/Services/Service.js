import React from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";


import useStyles from "./service-style";

function Service() {
  const { classes } = useStyles();


  // Theme breakpoints
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  const description = `Descrearaisdads dasd asdkasdnasd asdmasdasd asmdasda sdamsda sdkasd asdkasd asdkasd asdkas daksd asdkasd asdkasd askdas daskda sdaksd asdkasdm`;
  return (
    <div className={classes.root}>
      <article className={classes.article}>
        <p style={{ color: "white" }}>{description}</p>
      </article>
    </div>
  );
}

export default Service;
