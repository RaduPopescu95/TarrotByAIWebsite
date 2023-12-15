import React from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";

import Head from "next/head";
import CategoriiPersonalizatTable from "../../CategoriiPersonalizatTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer
        selectedItem={"Categorii-Citiri-Personalizate"}
        drawerText={"Categorii-Citiri-Personalizate"}
      >
        <CategoriiPersonalizatTable />
      </CustomDrawer>
    </>
  );
}
