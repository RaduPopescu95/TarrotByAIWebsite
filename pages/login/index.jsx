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
import { Alert } from "@mui/material";
import { handleFirebaseAuthError } from "../../utils/authUtils";
import { signInWithEmailAndPassword } from "firebase/auth";
import { authentication } from "../../firebase";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://mui.com/">
        Cristina Zurba
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function SignInSide() {
  const { currentUser, isGuestUser, setAsGuestUser } = useAuth();
  const [message, setMessage] = React.useState("email");
  const [showSnackback, setShowSnackback] = React.useState(false);
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
              Bine ai venit la
            </Typography>
            <Typography variant="h1" style={{ color: colors.primary3 }}>
              Tarot by AI
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
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
              Sign in
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
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
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
                Continue without account
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
                Sign In
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link href="/forgotpassword" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="/register" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
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
