import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import Head from "next/head";
import BlogArticole from "../../../components/Tables/BlogArticole";
import { handleGetFirestore } from "../../../utils/firestoreUtils";

export async function getServerSideProps(context) {
  console.log("Start......")
  try {
 
    // Obținerea datelor articolelor din Firestore
    const { locale, params, req } = context;

    const data = await handleGetFirestore("BlogArticole");

    let rawData = [...data];
    const articles = rawData.sort((a, b) => a.id - b.id);

    console.log("articles...",articles[0])
    return {
      props: {
        articles,
  
      },
    };
  } catch (error) {
    console.error("Eroare la preluarea datelor in dashboard articles:", error.message);
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
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomDrawer selectedItem={"Articole"} drawerText={"Articole"}>
        <BlogArticole articles={articles}/>
      </CustomDrawer>
    </>
  );
}
