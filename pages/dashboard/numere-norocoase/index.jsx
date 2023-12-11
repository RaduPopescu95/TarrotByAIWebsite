import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import ProcessTable from "../../ProcessTable";
import Head from "next/head";
import CartiViitorTable from "../../CartiViitorTable";
import NumereNorocoaseTable from "../../NumereNorocoaseTable";

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
