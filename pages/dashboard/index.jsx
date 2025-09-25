import { CssBaseline } from "@mui/material";
import Head from "next/head";
import LocalPasswordGate from "../../components/Dashboard/LocalPasswordGate";
import CustomDrawer from "../../components/Dashboard/CustomDrawer";

export default function MainScreen() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate>
        <CssBaseline />
        <CustomDrawer />
      </LocalPasswordGate>
    </>
  );
}
