import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";

import Head from "next/head";
import CuloriNorocoaseTable from "../../../components/Tables/CulorNorocoaseTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer
        selectedItem={"Culori Norocoase"}
        drawerText={"Culori Norocoase"}
      >
        <CuloriNorocoaseTable />
      </CustomDrawer>
    </>
  );
}
