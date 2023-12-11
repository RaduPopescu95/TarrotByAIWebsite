import { CssBaseline, Box, CircularProgress } from "@mui/material";
import { Outlet } from "react-router-dom";
import * as styles from "./MainScreenStyles";
import CustomDrawer from "../../components/Dashboard/CustomDrawer";
import { useEffect } from "react";
import { auth } from "../../firebase";
import { redirect } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";

export default function MainScreen() {
  const route = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true);
    const authenticated = auth;
    onAuthStateChanged(authenticated, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        console.log("is user.......");
        setIsLoading(false);
        route.push("/dashboard/articles");
        // ...
      } else {
        console.log("is user......no.");
        route.push("/signin");
        setIsLoading(false);
        // User is signed out
        // ...
      }
    });
  });
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center", // Center horizontally
            alignItems: "center", // Center vertically
            height: "100vh", // Optional: Set a specific height for the centering container
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={styles.mainBox}>
          <CssBaseline />
          {/* <CustomDrawer /> */}
        </Box>
      )}
    </>
  );
}
