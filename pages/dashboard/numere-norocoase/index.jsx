import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

import Head from "next/head";
import NumereNorocoaseTable from "../../../components/Tables/NumereNorocoaseTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <CustomDrawer
          selectedItem={"Numere norocoase"}
          drawerText={"Numere norocoase"}
        >
          <NumereNorocoaseTable />
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
