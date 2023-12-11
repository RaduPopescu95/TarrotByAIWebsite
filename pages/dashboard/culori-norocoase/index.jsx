import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import ProcessTable from "../../ProcessTable";
import Head from "next/head";
import CartiViitorTable from "../../CartiViitorTable";
import CuloriNorocoaseTable from "../../CulorNorocoaseTable";

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
