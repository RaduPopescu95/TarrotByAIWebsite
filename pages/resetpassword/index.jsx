import * as React from "react";
import Paper from "@mui/material/Paper";

import { createTheme, ThemeProvider } from "@mui/material/styles";

import * as styles from "../../components/ResetPassword/FormStyles";
import ResetPasswordForm from "../../components/ResetPassword/ResetPasswordForm";
import { Box, CircularProgress, Grid } from "@mui/material";
import Head from "next/head";
import { useRouter } from "next/router";

export default function ResetPassword() {
  const route = useRouter();
  React.useEffect(() => {
    route.push("/signin");
  });

  if (true) {
    return (
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
    );
  }
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Grid container component="main" sx={styles.mainGrid}>
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          component={Paper}
          sx={styles.confirmationGrid}
        >
          <ResetPasswordForm
            txt={"Do you forgot your password?"}
            subTxt={
              "Insert your email and we will send you a link in your email box to reset your password."
            }
            txtLink={"Go back to"}
            navLink={"/"}
            firstLabel={"Email"}
            btnTxt={"Reset Password"}
            isEmail={true}
          />
        </Grid>
      </Grid>
    </>
  );
}
