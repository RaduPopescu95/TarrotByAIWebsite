import React, { useEffect } from "react";

import { useSpacing } from "~/theme/common";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  CircularProgress,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";

// export async function getStaticProps() {
//   const articles = await handleGetArticles();
//   return {
//     props: {
//       articles,
//     },
//     revalidate: 5, // Regenerează pagina la fiecare 10 secunde dacă este accesată
//   };
// }

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function Landing(props) {
  const { classes, cx } = useSpacing();
  const { articles } = props;

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  useEffect(() => {
    router.push("/dashboard");
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CircularProgress />
    </div>
  );

  return <React.Fragment></React.Fragment>;
}

export default Landing;
