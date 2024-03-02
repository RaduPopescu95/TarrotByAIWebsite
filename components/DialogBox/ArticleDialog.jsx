import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { AppBar, CircularProgress, Dialog } from "@mui/material";
import { useSpacing } from "../../../theme/common";
import Header from "../../../components/Header";
import Article from "../../../components/Blog/Article";
import Sidebar from "../../../components/Blog/Sidebar";

import { useRouter } from "next/router";
import { useDatabase } from "../../../context/DatabaseContext";
import languageDetector from "../../../lib/languageDetector";
import { colors } from "../../../utils/colors";
import { handleGetFirestore } from "../../../utils/firestoreUtils";

function BlogDetail(props) {
  const { onToggleDark, onToggleDir } = props;
  const { classes } = useSpacing();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const [articlesData, setArticlesData] = useState(null); // Starea pentru a stoca datele articolului

  return (
    <Fragment>
      <CssBaseline />

      <Dialog
        fullScreen
        open={item.data ? true : false}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <div
          style={{
            backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin4}, ${colors.gradientLogin4}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
          }}
        >
          {filteredArticle ? (
            <div className={classes.mainWrap}>
              <section id="home" />
              <div className={classes.wraperSection} style={{ height: "100%" }}>
                <Box pt={5}>
                  <Container>
                    <Grid container spacing={4}>
                      <Grid item md={12} xs={12}>
                        <Article filteredArticles={filteredArticle} />
                      </Grid>
                      {/* <Grid item md={4} xs={12}>
                        <Sidebar lastFiveArticles={articles.articlesData} />
                      </Grid> */}
                    </Grid>
                  </Container>
                </Box>
              </div>
            </div>
          ) : (
            <CircularProgress />
          )}
        </div>
      </Dialog>
    </Fragment>
  );
}

export default BlogDetail;
