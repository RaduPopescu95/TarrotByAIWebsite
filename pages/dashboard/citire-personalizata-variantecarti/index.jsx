import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import ProcessTable from "../../ProcessTable";
import Head from "next/head";
import VarianteCartiPersonalizateTable from "../../VarianteCartiPersonalizateTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer
        selectedItem={"Variante de carti-Citiri-Personalizate"}
        drawerText={"Variante de carti-Citiri-Personalizate"}
      >
        <VarianteCartiPersonalizateTable />
      </CustomDrawer>
    </>
  );
}
