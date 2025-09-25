import React from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

import Head from "next/head";
import CategoriiPersonalizatTable from "../../../components/Tables/CategoriiPersonalizatTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <CustomDrawer
          selectedItem={"Categorii-Citiri-Personalizate"}
          drawerText={"Categorii-Citiri-Personalizate"}
        >
          <CategoriiPersonalizatTable />
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
