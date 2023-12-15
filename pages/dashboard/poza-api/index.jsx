import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import ProcessTable from "../../ProcessTable";
import Head from "next/head";
import CartiViitorTable from "../../CartiViitorTable";
import PozaApi from "../../PozaApi";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer
        selectedItem={"Poza API Elai.io"}
        drawerText={"Poza API Elai.io"}
      >
        <PozaApi />
      </CustomDrawer>
    </>
  );
}
