import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import Head from "next/head";
import BlogArticole from "../../../components/Tables/BlogArticole";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer selectedItem={"Articole"} drawerText={"Articole"}>
        <BlogArticole />
      </CustomDrawer>
    </>
  );
}
