import React from "react";
import Head from "next/head";
import LocalPasswordGate from "../../components/Dashboard/LocalPasswordGate";

export default function DashboardLoginPage() {
  return (
    <>
      <Head>
        <title>Acces Dashboard</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate />
    </>
  );
}
