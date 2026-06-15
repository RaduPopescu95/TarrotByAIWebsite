import { CssBaseline } from "@mui/material";
import Head from "next/head";
import LocalPasswordGate from "../../components/Dashboard/LocalPasswordGate";
import CustomDrawer from "../../components/Dashboard/CustomDrawer";

export default function AdministrareScreen() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate
        title="Acces Administrare"
        description="Introduceți parola pentru a accesa panoul de administrare"
      >
        <CssBaseline />
        <CustomDrawer variant="admin" basePath="/administrare" />
      </LocalPasswordGate>
    </>
  );
}
