import React, { useState, useEffect } from "react";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import Head from "next/head";
import BlogArticole from "../../../components/Tables/BlogArticole";
import { handleGetFirestore } from "../../../utils/firestoreUtils";

export async function getServerSideProps(context) {
  console.log("Start......");
  try {
    // Obținerea datelor articolelor din Firestore
    const { locale, params, req } = context;

    const data = await handleGetFirestore("BlogArticole");

    // Sortează descrescător după data programată (dataProgramata + timpProgramat)
    // cu fallback pe firstUploadDate/firstUploadtime sau firstUploadTimestamp
    const toMs = (x) => {
      try {
        if (
          x?.dataProgramata &&
          x?.dataProgramata.length > 0 &&
          x?.timpProgramat &&
          x?.timpProgramat.length > 0
        ) {
          const [dd, mm, yyyy] = x.dataProgramata.split("-").map(Number);
          const [hh, min] = x.timpProgramat.split(":").map(Number);
          return new Date(yyyy, mm - 1, dd, hh, min).getTime();
        }
        if (x?.firstUploadDate && x?.firstUploadtime) {
          const [dd, mm, yyyy] = x.firstUploadDate.split("-").map(Number);
          const [hh, min] = x.firstUploadtime.split(":").map(Number);
          return new Date(yyyy, mm - 1, dd, hh, min).getTime();
        }
        if (x?.firstUploadTimestamp) {
          if (typeof x.firstUploadTimestamp === "string") {
            const ms = Date.parse(x.firstUploadTimestamp);
            if (!Number.isNaN(ms)) return ms;
          }
          if (x.firstUploadTimestamp.seconds) {
            return x.firstUploadTimestamp.seconds * 1000;
          }
          if (typeof x.firstUploadTimestamp.toDate === "function") {
            return x.firstUploadTimestamp.toDate().getTime();
          }
        }
      } catch (e) {}
      return 0;
    };

    const articles = [...data].sort((a, b) => toMs(b) - toMs(a));

    console.log("articles.....", articles[0]);
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
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <CustomDrawer selectedItem={"Articole"} drawerText={"Articole"}>
          <BlogArticole articles={articles} />
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
