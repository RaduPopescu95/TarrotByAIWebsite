import React, { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Alert, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import Head from "next/head";

const defaultTheme = createTheme();

export default function SignUp() {
  const route = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordComplexityMessage, setPasswordComplexityMessage] =
    useState("");
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailInUse, setEmailInUse] = useState(false);

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
      if (value.length < 6) {
        newErrors.password = "Password should be at least 6 characters";
      } else {
        newErrors.password = "";
      }
    } else if (name === "confirmPassword") {
      if (!value) {
        newErrors.confirmPassword = "Confirm Password is required";
      } else if (formData.password !== value) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        newErrors.confirmPassword = "";
      }
    }
    setErrors(newErrors);

    // Check password complexity and update the strength indicator
    const strength = calculatePasswordStrength(value);
    setPasswordStrength(strength);

    // Update the password complexity message
    setPasswordComplexityMessage(getPasswordComplexityMessage(strength));

    // Show password strength only when the user starts typing
    setShowPasswordStrength(!!value);
  };

  const calculatePasswordStrength = (password) => {
    // Define your password complexity criteria here
    // For this example, we're looking at password length and if it contains both letters and numbers
    if (password.length < 6) {
      return "Weak";
    } else if (/\d/.test(password) && /[a-zA-Z]/.test(password)) {
      return "Strong";
    } else {
      return "Moderate";
    }
  };

  const getPasswordComplexityMessage = (strength) => {
    switch (strength) {
      case "Weak":
        return "Password is weak. Please use a stronger password.";
      case "Moderate":
        return "Password is moderately strong.";
      case "Strong":
        return "Password is strong.";
      default:
        return "";
    }
  };

  const handleSubmit = (event) => {
    try {
      event.preventDefault();

      // Check if required fields are filled
      let hasErrors = false;
      const newErrors = { ...errors };

      if (!formData.email) {
        newErrors.email = "Email is required";
        hasErrors = true;
      } else if (!isEmailValid(formData.email)) {
        newErrors.email = "Invalid email format";
        hasErrors = true;
      } else {
        newErrors.email = "";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
        hasErrors = true;
      } else if (formData.password.length < 6) {
        newErrors.password = "Password should be at least 6 characters";
        hasErrors = true;
      } else {
        newErrors.password = "";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirm Password is required";
        hasErrors = true;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        hasErrors = true;
      } else {
        newErrors.confirmPassword = "";
      }

      setErrors(newErrors);

      if (hasErrors) {
        return;
      }

      // Continue with data submission or authentication logic
      console.log({
        email: formData.email,
        password: formData.password,
      });

      createUserWithEmailAndPassword(auth, formData.email, formData.password)
        .then((userCredential) => {
          // Signed up
          const user = userCredential.user;
          route.push("/dashboard/citire-viitor-carti");
          // ...
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(
            "Error on createUserWithEmailAndPassword, error message...",
            errorMessage
          );
          console.log(
            "Error on createUserWithEmailAndPassword, error CODE...",
            errorCode
          );
          if (errorCode === "auth/email-already-in-use") {
            setEmailInUse(true);
            setFormData({ email: "", password: "", confirmPassword: "" });

            // Așteaptă timp de 3 secunde (3000 milisecunde) și apoi setează setEmailInUse(false)
            setTimeout(() => {
              setEmailInUse(false);
            }, 3000);
          }
          // ..
        });
    } catch (err) {
      console.log("handleSubmit ERROR ON SIGN UP SCREEN...", err);
    }
  };

  useEffect(() => {
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
              Sign up
            </Typography>
            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              // onSubmit={() => console.log("Submit only by admin")}
              sx={{ mt: 3 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"} // Schimbă tipul de input în text dacă showPassword este true
                    id="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    InputProps={{
                      // Adaugă o pictogramă pentru afișarea/ascunderea parolei
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)} // Inversează starea la apăsarea iconiței
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {showPasswordStrength && (
                    <div className="password-strength-indicator">
                      Password Strength: {passwordStrength}
                    </div>
                  )}
                  <LinearProgress
                    variant="determinate"
                    value={
                      passwordStrength === "Weak"
                        ? 33
                        : passwordStrength === "Moderate"
                        ? 66
                        : 100
                    }
                    sx={{
                      marginTop: 2,
                      marginBottom: 1,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor:
                        passwordStrength === "Weak"
                          ? "red"
                          : passwordStrength === "Moderate"
                          ? "yellow"
                          : "green",
                    }}
                  />
                  {showPasswordStrength && (
                    <div className="password-complexity-message">
                      {passwordComplexityMessage}
                    </div>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"} // Schimbă tipul de input în text dacă showConfirmPassword este true
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    InputProps={{
                      // Adaugă o pictogramă pentru afișarea/ascunderea parolei
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            } // Inversează starea la apăsarea iconiței
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                {/* <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox value="allowExtraEmails" color="primary" />
                    }
                    label="I want to receive inspiration, marketing promotions and updates via email."
                  />
                </Grid> */}
              </Grid>
              {/* <p>Sign up is only done with the admin</p> */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign Up
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link href="/signin">Already have an account? Sign in</Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
          {emailInUse && (
            <Alert severity="warning" sx={{ marginTop: 2 }}>
              This email is already in use
            </Alert>
          )}
        </Container>
      </ThemeProvider>
    </>
  );
}
