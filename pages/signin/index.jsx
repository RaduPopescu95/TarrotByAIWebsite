import React, { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { Alert, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";

import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { auth } from "../../firebase";
import Head from "next/head";

const defaultTheme = createTheme();

export default function SignIn() {
  const route = useRouter();

  const [isInvalid, setIsInvalid] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const isEmailValid = (email) => {
    // Regular expression for email validation
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(email);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });

    // Update the error for the specified field when the user interacts with it
    const newErrors = { ...errors };
    if (name === "email") {
      if (!value) {
        newErrors.email = "Email is required";
      } else if (!isEmailValid(value)) {
        newErrors.email = "Invalid email format";
      } else {
        newErrors.email = "";
      }
    } else if (name === "password") {
      if (!value) {
        newErrors.password = "Password is required";
      } else {
        newErrors.password = "";
      }
    }
    setErrors(newErrors);
  };

  const handleSubmit = (event) => {
    try {
      event.preventDefault();

      // Check if either email or password is empty
      if (!formData.email || !formData.password) {
        setErrors({
          email: !formData.email ? "Email is required" : "",
          password: !formData.password ? "Password is required" : "",
        });
        return;
      }

      // Continue with data submission or authentication logic
      console.log({
        email: formData.email,
        password: formData.password,
      });

      signInWithEmailAndPassword(auth, formData.email, formData.password)
        .then((userCredential) => {
          // Signed in
          // Change "/dashboard" to your desired route
          const user = userCredential.user;
          route.push("/dashboard/articles");
          // ...
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(
            "Error at signInWithEmailAndPassword firebase...",
            errorMessage
          );
          console.log(
            "Error at signInWithEmailAndPassword firebase ERROR CODE...",
            errorCode
          );
          if (errorCode === "auth/invalid-login-credentials") {
            setIsInvalid(true);
          }
        });
    } catch (err) {
      console.log("Error at handleSubmit signin...", err);
    }
  };

  const [isLogged, setIsLogged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Folosim useEffect pentru a verifica starea de autentificare la încărcarea componentei
    console.log("START APP.TSX....");

    const unsubscribe = auth.onAuthStateChanged((user) => {
     
      if (user) {
        route.push("/dashboard/articles").then(() => {
          console.log("is user...");
          setIsLogged(true);
          setIsLoading(false);

        })
      } else {
        console.log("is no user...");
        setIsLogged(false);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if(isLoading){
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
    )
  }

  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <ThemeProvider theme={defaultTheme}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
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
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
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
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
              />
              {/* <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            /> */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Grid container>
                {/* <Grid item xs>
                  <Link href="/resetpassword">Forgot password?</Link>
                </Grid> */}
                {/* <Grid item>
                  <Link href="/signup">{"Don't have an account? Sign Up"}</Link>
                </Grid> */}
              </Grid>
            </Box>
            {isInvalid && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                  position: "absolute",
                  bottom: 20,
                }}
              >
                <Alert severity="error">
                  Invalid Login Credentials. Your e-mail or password is not
                  correct.
                </Alert>
              </Box>
            )}
          </Box>
        </Container>
      </ThemeProvider>
    </>
  );
}
