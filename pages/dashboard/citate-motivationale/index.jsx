import React from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import Head from "next/head";
import CitateMotivationaleTable from "../../../components/Tables/CitateMotivationaleTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer
        selectedItem={"Citate Motivationale"}
        drawerText={"Citate Motivationale"}
      >
        <CitateMotivationaleTable />
      </CustomDrawer>
    </>
  );
}
