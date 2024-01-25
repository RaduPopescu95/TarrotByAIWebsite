import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";
import Image from "next/image";
import { colors } from "../../utils/colors";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Header from "../../components/Header";
import { useMediaQuery } from "@mui/material";
import { useRouter } from "next/router";

function Copyright(props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        {...props}
      >
        {"Copyright © "}
        <span color="inherit">Cristina Zurba</span> {new Date().getFullYear()}
        {"."}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        {...props}
      >
        {"dezvoltat de "}
        <Link color="inherit" href="https://webappdynamicx.ro/">
          Web App Dynamicx
        </Link>{" "}
        {"."}
      </Typography>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function SignInSide() {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get("email"),
      password: data.get("password"),
    });
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: "100vh" }}>
        <CssBaseline />
        <section>
          <Header isOnlySettngs={true} />
        </section>

        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundRepeat: "no-repeat",
            backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin1}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              height: "100%",
              paddingTop: "3%",
              paddingBottom: "3%",
            }}
          >
            <Image
              src="/lucky-deco.png"
              width={278}
              height={65}
              alt="Picture of the author"
            />
            <Image
              src="/onboardImg.png"
              width={450}
              height={500}
              alt="Picture of the author"
              style={{ top: 20, position: "relative", height: 450, width: 400 }}
            />
            <Typography variant="h4" style={{ color: colors.primary3 }}>
              {t("welcomeTo")}
            </Typography>
            <Typography
              variant="h1"
              style={{ color: colors.primary3, fontSize: isMobile ? 60 : 80 }}
            >
              {t("tarotByAi")}
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12} sm={8} md={5} elevation={6} square>
          <Box
            sx={{
              my: "20%",
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Image
              src="/LogoPngTransparent.png"
              width={140}
              height={140}
              alt="Picture of the author"
            />

            <Typography component="h1" variant="h5">
              {t("resetPassword")}
            </Typography>
            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              sx={{ mt: 1, width: "80%" }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label={t("email")}
                name="email"
                autoComplete="email"
                autoFocus
              />

              {/* <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              /> */}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  backgroundColor: colors.primary3,
                  borderColor: colors.primary3,
                  borderWidth: "2px",
                  borderStyle: "solid",
                  color: colors.white,
                  "&:hover": {
                    backgroundColor: colors.primary3, // Menține culoarea de fundal la hover
                    boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.25)", // Adaugă umbra la hover
                    // puteți ajusta valorile umbrei după preferință
                  },
                }}
              >
                {t("resetPassword")}
              </Button>
              <Grid container>
                <Grid item style={{ display: "flex", flexDirection: "row" }}>
                  <Typography href="#" variant="body2">
                    {t("alreadyAccount")}
                  </Typography>
                  <Typography
                    onClick={() => router.push("/login")}
                    variant="body2"
                    style={{ color: "blue", cursor: "pointer" }}
                  >
                    {t("registerLogin")}
                  </Typography>
                </Grid>
              </Grid>
              <Copyright sx={{ mt: 5 }} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
