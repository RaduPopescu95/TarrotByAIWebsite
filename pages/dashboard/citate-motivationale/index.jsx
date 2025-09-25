import React from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import Head from "next/head";
import CitateMotivationaleTable from "../../../components/Tables/CitateMotivationaleTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <CustomDrawer
          selectedItem={"Citate Motivationale"}
          drawerText={"Citate Motivationale"}
        >
          <CitateMotivationaleTable />
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
