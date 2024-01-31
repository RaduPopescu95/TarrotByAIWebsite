import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";

import Head from "next/head";
import OreNorocoaseTable from "../../../components/Tables/OreNorocoaseTable";

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
      <CustomDrawer selectedItem={"Ore norocoase"} drawerText={"Ore norocoase"}>
        <OreNorocoaseTable />
      </CustomDrawer>
    </>
  );
}
