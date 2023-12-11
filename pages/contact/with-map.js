import React, { Fragment } from "react";
import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Head from "next/head";
// Use this below for Server Side Render/Translation (SSR)

// Use this below for Static Site Generation (SSG)
// import { getStaticPaths, makeStaticProps } from '~/lib/getStatic';
import { useSpacing } from "~/theme/common";
import Header from "~/components/Header";
import ContactMap from "~/components/Forms/ContactMap";
import Footer from "~/components/Footer";
import brand from "~/public/text/brand";

function WithMap(props) {
  const { classes, cx } = useSpacing();


  return (
    <Fragment>
      <Head>
        <title>{brand.starter.name + " - Contact Map"}</title>
      </Head>
      <CssBaseline />
      <div className={classes.mainWrap}>
        <Header />
        <Container>
          <div className={cx(classes.containerGeneral, classes.containerFront)}>
            <ContactMap />
          </div>
        </Container>
        <Footer  />
      </div>
    </Fragment>
  );
}


export default WithMap;

// Use this below for Server Side Render/Translation (SSR)

// Use this below for Static Site Generation (SSG)
// const getStaticProps = makeStaticProps(['common']);
// export { getStaticPaths, getStaticProps };
