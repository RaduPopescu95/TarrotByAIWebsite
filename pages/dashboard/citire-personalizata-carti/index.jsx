import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";

import Head from "next/head";
import CartiPersonalizateTable from "../../../components/Tables/CartiPersonalizateTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer
        selectedItem={"Carti-Citiri-Personalizate"}
        drawerText={"Carti-Citiri-Personalizate"}
      >
        <CartiPersonalizateTable />
      </CustomDrawer>
    </>
  );
}
