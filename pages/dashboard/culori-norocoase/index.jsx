import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

import Head from "next/head";
import CuloriNorocoaseTable from "../../../components/Tables/CulorNorocoaseTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <CustomDrawer
          selectedItem={"Culori Norocoase"}
          drawerText={"Culori Norocoase"}
        >
          <CuloriNorocoaseTable />
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
