import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import Head from "next/head";
import AfirmatiiPozitive from "../../../components/Tables/AfirmatiiPozitive";
import { handleGetFirestore } from "../../../utils/firestoreUtils";
import NotificariManuale from "../../../components/Tables/NotificariManuale";

export async function getServerSideProps(context) {
  console.log("Start......");
  try {
    // Obținerea datelor articolelor din Firestore
    const { locale, params, req } = context;

    const data = await handleGetFirestore("NotificariManuale");

    let rawData = [...data];

    const articles = rawData
      .filter((article) => article.firstUploadTimestamp) // Filtrăm doar articolele cu firstUploadTimestamp
      .map((article) => ({
        ...article,
        firstUploadTimestamp: article.firstUploadTimestamp.seconds
          ? new Date(article.firstUploadTimestamp.seconds * 1000).toISOString()
          : null, // Conversie din Firestore Timestamp
      }))
      .sort((a, b) => a.id - b.id); // Sortare după ID

    console.log("articles...aiciiii", articles.length);
    return {
      props: {
        articles,
      },
    };
  } catch (error) {
    console.error(
      "Eroare la preluarea datelor in dashboard articles:",
      error.message
    );
    // Returnează un obiect de eroare sau un mesaj de eroare ca prop pentru a fi gestionat în componenta ta
    return {
      props: {
        error: error.message,
      },
    };
  }
}

export default function index(props) {
  const { articles } = props;
  console.log("articles...here", articles);
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer selectedItem={"Notifificari Manuale"} drawerText={"Notifificari Manuale"}>
        <NotificariManuale articles={articles} />
      </CustomDrawer>
    </>
  );
}
