import React from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import ServicesTable from "../../ServicesTable";
import Head from "next/head";

export default function index() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer selectedItem={"Categorii"} drawerText={"Categorii"}>
        <ServicesTable />
      </CustomDrawer>
    </>
  );
}
