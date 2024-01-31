import React from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";

import Head from "next/head";
import CategoriiViitorTable from "../../../components/Tables/CategoriiViitorTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="google-adsense-account"
          content="ca-pub-9577714849380446"
        ></meta>
      </Head>
      <CustomDrawer selectedItem={"Categorii"} drawerText={"Categorii"}>
        <CategoriiViitorTable />
      </CustomDrawer>
    </>
  );
}
