import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";

import Head from "next/head";
import VarianteCartiPersonalizateTable from "../../../components/Tables/VarianteCartiPersonalizateTable";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="google-adsense-account"
          content="ca-pub-9577714849380446"
        ></meta>
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
