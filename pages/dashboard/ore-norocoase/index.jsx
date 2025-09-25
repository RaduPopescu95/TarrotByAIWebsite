import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

import Head from "next/head";
import OreNorocoaseTable from "../../../components/Tables/OreNorocoaseTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <CustomDrawer selectedItem={"Ore norocoase"} drawerText={"Ore norocoase"}>
          <OreNorocoaseTable />
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
