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
import {
  handleChangeEmail,
  handleChangePassword,
  handleLogout,
} from "../../utils/authUtils";
import { useAuth } from "../../context/AuthContext";
import PasswordDialog from "../../components/PasswordDialog/PasswordDialog";
import { handleUpdateFirestore } from "../../utils/firestoreUtils";
import { Alert } from "@mui/material";

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
  const { currentUser, isGuestUser, setAsGuestUser, setUserData, userData } =
    useAuth();
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [message, setMessage] = React.useState("email");
  const [showSnackback, setShowSnackback] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [registerType, setRegisterType] = React.useState("email");
  const [isLoading, setIsLoading] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalVisibleDelete, setModalVisibleDelete] = React.useState(false);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [last_name, setLastName] = React.useState("");
  const [first_name, setFirstName] = React.useState("");

  const [snackMessage, setSnackMessage] = React.useState("");

  const router = useRouter();

  const handleResetForm = () => {
    setEmail("");
    setConfirmPassword("");
    setPassword("");
    setLastName("");
    setFirstName("");
  };

  const handleSubmit = (event) => {
    if (event) {
      event.preventDefault();
    }

    let copyUserData = { ...userData };

    console.log("password...", password);
    console.log("currentPassword...", currentPassword);
    console.log("confirmPassword...", confirmPassword);
    //change password
    if (
      password &&
      currentPassword.length == 0 &&
      password === confirmPassword
    ) {
      console.log("first");
      setModalVisible(true);
    } else if (password && currentPassword.length > 0) {
      console.log("second");
      handleChangePassword(currentPassword, password).then(() => {
        setMessage("Password changed successfully");
        setShowSnackback(!showSnackback);
        setModalVisible(!modalVisible);
        handleResetForm();
      });
    }

    //change email
    if (email && currentPassword.length == 0) {
      console.log("first");
      setModalVisible(true);
    } else if (email && currentPassword.length > 0) {
      console.log("second");
      handleChangeEmail(currentPassword, email).then((message) => {
        if (message.length > 0) {
          setMessage(message);
        } else {
          setMessage(
            "Please check your new e-mail inbox or spam to verify the new e-mail"
          );
        }
        setShowSnackback(!showSnackback);
        setModalVisible(!modalVisible);
        handleResetForm();
      });
    }

    if (first_name) {
      copyUserData.first_name = first_name;

      const userLocation = `Users/${
        userData.owner_uid ? userData.owner_uid : ""
      }`; // Calea către document
      setUserData(copyUserData);
      handleUpdateFirestore(userLocation, copyUserData)
        .then(() => {
          console.log("Document successfully updated!");
          setMessage("Name updated successfully");
          setShowSnackback(!showSnackback);
          handleResetForm();
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    }

    if (last_name) {
      copyUserData.last_name = last_name;

      const userLocation = `Users/${
        userData.owner_uid ? userData.owner_uid : ""
      }`; // Calea către document
      // setUserData(newData);
      console.log("TEst...here", copyUserData);
      setUserData(copyUserData);
      handleUpdateFirestore(userLocation, copyUserData)
        .then(() => {
          console.log("Document successfully updated!");
          setMessage("Name updated successfully");
          setShowSnackback(!showSnackback);
          handleResetForm();
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
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

            <Typography variant="h1" style={{ color: colors.primary3 }}>
              Tarot by AI
            </Typography>
          </div>
        </Grid>
        {isGuestUser ? (
          <Grid
            item
            xs={12}
            sm={8}
            md={5}
            component={Paper}
            elevation={6}
            square
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                mt: 1,
                mb: 8,
                mx: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",

                height: "55%",
                width: "100%",
                marginTop: "10%",
                justifyContent: "space-around",
              }}
            >
              <Image
                src="/LogoPngTransparent.png"
                width={140}
                height={140}
                alt="Picture of the author"
              />

              <Typography component="h1" variant="h5">
                Explore more with your own account
              </Typography>
              <Typography variant="p">
                Create your own account and save your reading history
              </Typography>
              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit}
                sx={{ mt: 1, width: "80%" }}
              >
                <Button
                  onClick={() => {
                    handleLogout().then(() => {
                      setAsGuestUser(false);
                      router.push("login");
                    });
                  }}
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

                <Copyright sx={{ mt: 5 }} />
              </Box>
            </Box>
          </Grid>
        ) : (
          <Grid
            item
            xs={12}
            sm={8}
            md={5}
            component={Paper}
            elevation={6}
            square
          >
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
                My account
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
                  onChange={(e) => setFirstName(e.target.value)}
                  value={first_name}
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
                  onChange={(e) => setLastName(e.target.value)}
                  value={last_name}
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
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="newPassword"
                  label="New Password"
                  type="password"
                  id="newPassword"
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
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
                  Save changes
                </Button>
                <Grid container>
                  <Grid item xs>
                    <Button
                      variant="body2"
                      onClick={() => {
                        handleLogout().then(() => {
                          setAsGuestUser(false);
                          router.push("/login");
                        });
                      }}
                    >
                      Sign out
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button variant="body2">{"Delete account"}</Button>
                  </Grid>
                </Grid>
                <Copyright sx={{ mt: 5 }} />
              </Box>
            </Box>
          </Grid>
        )}
        <PasswordDialog
          setModalVisible={setModalVisible}
          modalVisible={modalVisible}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          handleSubmit={handleSubmit}
        />
        {showSnackback && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              bottom: 20,
              left: "40%",
            }}
          >
            <Alert severity="info">{message}</Alert>
          </Box>
        )}
      </Grid>
    </ThemeProvider>
  );
}
