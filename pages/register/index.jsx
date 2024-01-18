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
import { validateEmail } from "../../utils/commonUtils";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { authentication, db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { handleFirebaseAuthError } from "../../utils/authUtils";
import { Alert } from "@mui/material";
import { useRouter } from "next/router";

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
  // Stări pentru gestionarea erorilor
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [message, setMessage] = React.useState("email");
  const [showSnackback, setShowSnackback] = React.useState(false);
  const { setUserData } = useAuth();
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");
    const confirmPassword = data.get("confirmPassword");
    const last_name = data.get("last-name");
    const first_name = data.get("first-name");

    // Resetare mesaje de eroare
    let hasError = false;

    let isValidEmail = validateEmail(email);

    if (!isValidEmail) {
      console.log("email not valid", email);
      setEmailError("Emailul nu este valid");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (password !== confirmPassword) {
      console.log("parolele nu sunt identice");
      setPasswordError("Parolele nu sunt identice");
      hasError = true;
    } else if (password.length < 6) {
      console.log("Parola trebuie să aibă cel puțin 6 caractere");
      setPasswordError("Parola trebuie să aibă cel puțin 6 caractere");
      hasError = true;
    } else {
      setPasswordError("");
    }

    // Dacă există erori, opriți procesarea formularului
    if (hasError) {
      return;
    }

    console.log({ email, first_name, last_name });
    createUserWithEmailAndPassword(authentication, email, password)
      .then((userCredentials) => {
        setTimeout(async () => {
          const user = userCredentials.user;

          const collectionId = "Users";
          const documentId = user.uid;
          const value = {
            owner_uid: user.uid,
            first_name: first_name,
            last_name: last_name,
            email: email,
            // Adaugă orice alte câmpuri necesare
          };
          setUserData({ ...value });
          setDoc(doc(db, collectionId, documentId), value);
          console.log("success PASS");
        }, 1500);
      })
      .then(() => {})
      .then(() => {
        router.push("/");
      })
      .catch((error) => {
        const errorMessage = handleFirebaseAuthError(error);
        // Aici puteți folosi errorMessage pentru a afișa un snackbar sau un alert
        setShowSnackback(true);
        setMessage(errorMessage);
        console.log("error at submit user", error);
      });
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
              mt: 1,
              mb: 8,
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Image
              src="/LogoPngTransparent.png"
              width={100}
              height={100}
              alt="Picture of the author"
            />

            <Typography component="h1" variant="h5">
              Register Account
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
                id="first-name"
                label="First Name"
                name="first-name"
                autoComplete="first-name"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="last-name"
                label="Last Name"
                name="last-name"
                autoComplete="last-name"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                error={!!emailError}
                helperText={emailError}
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
                error={!!passwordError}
                helperText={passwordError}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="confirm-password"
                error={!!passwordError}
                helperText={passwordError}
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
                Register
              </Button>
              <Grid container>
                <Grid item>
                  <Link href="#" variant="body2">
                    {"Have an account? Log in"}
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
