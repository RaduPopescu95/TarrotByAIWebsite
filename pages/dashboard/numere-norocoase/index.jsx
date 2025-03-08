import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";

import Head from "next/head";
import NumereNorocoaseTable from "../../../components/Tables/NumereNorocoaseTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer
        selectedItem={"Numere norocoase"}
        drawerText={"Numere norocoase"}
      >
        <NumereNorocoaseTable />
      </CustomDrawer>
    </>
  );
}
