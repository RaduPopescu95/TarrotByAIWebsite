import { CssBaseline, Box } from "@mui/material";
import Head from "next/head";
import LocalPasswordGate from "../../components/Dashboard/LocalPasswordGate";
import { useRouter } from "next/router";
import { useEffect } from "react";

function Redirector() {
  const router = useRouter();
  useEffect(() => {
    router.prefetch("/dashboard/blog-articole");
    router.replace("/dashboard/blog-articole");
  }, [router]);
  return null;
}

export default function MainScreen() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <Redirector />
      </LocalPasswordGate>
    </>
  );
}
