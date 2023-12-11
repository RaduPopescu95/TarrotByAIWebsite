import React from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import Head from "next/head";
import CitateMotivationaleFields from "../../../components/Dashboard/CitateMotivationaleFields";
import CitateMotivationaleTable from "../../CitateMotivationaleTable";

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
