import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import Head from "next/head";
import CartiViitorTable from "../../../components/Tables/CartiViitorTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer selectedItem={"Carti"} drawerText={"Carti"}>
        <CartiViitorTable />
      </CustomDrawer>
    </>
  );
}
