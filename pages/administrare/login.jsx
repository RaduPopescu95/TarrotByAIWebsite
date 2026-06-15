import React from "react";
import Head from "next/head";
import LocalPasswordGate from "../../components/Dashboard/LocalPasswordGate";

export default function AdministrareLoginPage() {
  return (
    <>
      <Head>
        <title>Acces Administrare</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate
        title="Acces Administrare"
        description="Introduceți parola pentru a accesa panoul de administrare"
      />
    </>
  );
}
