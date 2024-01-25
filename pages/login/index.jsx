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
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Image from "next/image";
import { colors } from "../../utils/colors";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { retrieveTypeOfUser } from "../../utils/getFirebaseData";
import { emailWithoutSpace } from "../../utils/strintText";
import { Alert, useMediaQuery, useTheme } from "@mui/material";
import { handleFirebaseAuthError } from "../../utils/authUtils";
import { signInWithEmailAndPassword } from "firebase/auth";
import { authentication } from "../../firebase";
import Header from "../../components/Header";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";

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
  const { currentUser, isGuestUser, setAsGuestUser, setCurrentUser } =
    useAuth();
  const [message, setMessage] = React.useState("email");
  const [showSnackback, setShowSnackback] = React.useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { t } = useTranslation("common");
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");

    const emailNew = emailWithoutSpace(email);
    console.log("login with...", {
      email: emailNew,
      password: data.get("password"),
    });

    signInWithEmailAndPassword(authentication, emailNew, password)
      .then(async (userCredentials) => {
        setCurrentUser(userCredentials);
        console.log("userCredentials...", userCredentials.user.uid);
        router.push("/");
        setIsLoading(false);
      })
      .catch((error) => {
        const errorMessage = handleFirebaseAuthError(error);
        // Aici puteți folosi errorMessage pentru a afișa un snackbar sau un alert
        setShowSnackback(true);
        setMessage(errorMessage);

        console.log("error on sign in user...", error.message);
        console.log("error on sign in user...", error.code);
      });
  };

  const handleLoginAsGuest = async () => {
    try {
      // Setează valoarea pentru a indica că utilizatorul este un guest user

      setAsGuestUser(true);

      router.push("/");

      console.log("Utilizatorul este acum setat ca guest user.");
    } catch (error) {
      // Gestionează orice erori care pot apărea la scrierea în AsyncStorage
      console.error(
        "Eroare la setarea guest user-ului în AsyncStorage:",
        error
      );
    }
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
              my: 8,
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Image
              src="/LogoPngTransparent.png"
              width={120}
              height={120}
              alt="Picture of the author"
            />

            <Typography component="h1" variant="h5">
              {t("loginNow")}
            </Typography>
            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              sx={{ mt: 1 }}
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
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={t("password")}
                type="password"
                id="password"
                autoComplete="current-password"
              />
              {/* <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              /> */}
              <Button
                fullWidth
                onClick={handleLoginAsGuest}
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  height: "60px",
                  backgroundColor: "transparent",
                  borderColor: colors.primary3,
                  borderWidth: "2px",
                  borderStyle: "solid", // Adaugă stilul bordurii
                  color: colors.primary3,
                  "&:hover": {
                    backgroundColor: "transparent", // Menține fundalul transparent la hover
                    boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.25)", // Adaugă umbra la hover
                    // borderWidth: "3px",
                    // Adăugați aici orice alte stiluri pentru hover, dacă este necesar
                  },
                }}
              >
                {t("loginNowNoAccount")}
              </Button>

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
                {t("login")}
              </Button>
              <Grid container>
                <Grid item xs>
                  <Typography
                    onClick={() => router.push("/forgotpassword")}
                    variant="body2"
                    style={{ color: "blue", cursor: "pointer" }}
                  >
                    {t("forgotPassword")}
                  </Typography>
                </Grid>
                <Grid item style={{ display: "flex", flexDirection: "row" }}>
                  <Typography variant="body2">{t("dntHaveAccount")}</Typography>
                  <Typography
                    onClick={() => router.push("/register")}
                    variant="body2"
                    style={{ color: "blue", cursor: "pointer" }}
                  >
                    {t("signUp")}
                  </Typography>
                </Grid>
              </Grid>
              <Copyright sx={{ mt: 5 }} />
            </Box>
          </Box>
        </Grid>
        {showSnackback && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "center",
              position: "absolute",
              bottom: 20,
            }}
          >
            <Alert severity="info">{message}</Alert>
          </Box>
        )}
      </Grid>
    </ThemeProvider>
  );
}
