import React from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";

import Head from "next/head";
import CategoriiViitorTable from "../../CategoriiViitorTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer selectedItem={"Categorii"} drawerText={"Categorii"}>
        <CategoriiViitorTable />
      </CustomDrawer>
    </>
  );
}
