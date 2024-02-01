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
import { Alert, IconButton, useMediaQuery, useTheme } from "@mui/material";
import Header from "../../components/Header";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Head from "next/head";

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
  const { currentUser, isGuestUser, setAsGuestUser, setUserData, userData } =
    useAuth();
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [message, setMessage] = React.useState("email");
  const [showSnackback, setShowSnackback] = React.useState(false);
  const { t } = useTranslation("common");

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

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <ThemeProvider theme={defaultTheme}>
        <Grid container component="main" sx={{ height: "100vh" }}>
          <CssBaseline />
          <section>
            <Header isOnlySettngs={true} />
          </section>
          {isGuestUser ? (
            <Grid
              item
              xs={12}
              sm={8}
              md={5}
              // component={Paper}
              elevation={6}
              square
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                marginLeft: isMobile ? "15%" : 0,
                marginTop: isMobile ? "20%" : 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  top: isMobile ? 20 : 90,
                  zIndex: 11,
                }}
              >
                <IconButton
                  aria-label="delete"
                  onClick={() => window.history.back()}
                >
                  <ArrowBackIcon />
                </IconButton>
              </div>
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
                  {t("createAccountCTA")}
                </Typography>
                <Typography variant="p">
                  {t("createAccountCTAMessage")}
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
                    {t("register")}
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
              // component={Paper}
              elevation={6}
              square
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                marginLeft: isMobile ? "15%" : 0,
                marginTop: isMobile ? "22%" : 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  top: isMobile ? 20 : 90,
                  zIndex: 11,
                }}
              >
                <IconButton
                  aria-label="delete"
                  onClick={() => window.history.back()}
                >
                  <ArrowBackIcon />
                </IconButton>
              </div>
              <Box
                sx={{
                  mt: 0,
                  mb: 8,
                  mx: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Image
                  src="/LogoPngTransparent.png"
                  width={130}
                  height={130}
                  alt="Picture of the author"
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    marginTop: 5,
                  }}
                >
                  <Typography component="h1" variant="h4">
                    {t("myAccount")}
                  </Typography>
                  <Typography
                    component="p"
                    onClick={() => router.push("/istoric-citiri-personalizate")}
                    style={{ cursor: "pointer", color: colors.primary3 }}
                  >
                    {t("historyPersonalized")}
                  </Typography>

                  <Typography
                    component="p"
                    onClick={() => router.push("/istoric-citiri-viitor")}
                    style={{ cursor: "pointer" }}
                  >
                    {t("historyFuture")}
                  </Typography>
                </div>
                <Box component="form" noValidate onSubmit={handleSubmit}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="first-name"
                    label={t("firstName")}
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
                    label={t("lastName")}
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
                    label={t("email")}
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
                    label={t("createPassword")}
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
                    label={t("confirmPassword")}
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
                    {t("saveChanges")}
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
                        {t("logOut")}
                      </Button>
                    </Grid>
                    {/* <Grid item>
                    <Button variant="body2"> {t("deleteAccount")}</Button>
                  </Grid> */}
                  </Grid>
                  <Copyright sx={{ mt: 5 }} />
                </Box>
              </Box>
            </Grid>
          )}
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
                justifyContent: "flex-start",
                alignItems: "center",
                flexDirection: "column",
                height: "100%",
                paddingTop: "3%",
                paddingBottom: "3%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    src="/appmarketing.png"
                    width={450}
                    height={500}
                    alt="Picture of the author"
                    style={{
                      top: 20,
                      position: "relative",
                      height: 450,
                      width: 450,
                    }}
                  />
                  <div
                    style={{
                      maxHeight: "100px",
                      width: "auto",

                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <h2
                      style={{
                        color: colors.primary3,
                        fontWeight: "300",
                        margin: 0, // Elimină marja implicită de sus și jos
                        paddingBottom: "0px", // Adaugă un spațiu mic la partea de jos, dacă este necesar
                      }}
                    >
                      {t("downloadThe")}
                      <span
                        style={{
                          color: colors.primary3,
                          fontWeight: "bold",
                          marginLeft: 5, // Elimină marja implicită de sus și jos
                        }}
                      >
                        {t("appNow")}
                      </span>
                    </h2>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      marginTop: 10,
                      width: "70%",
                      justifyContent: "space-around",
                    }}
                  >
                    <div
                      style={{
                        height: "3rem",
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                        justifyContent: "center",
                        paddingTop: "7%",
                      }}
                    >
                      <Link href="https://play.google.com/store/apps/details?id=com.cristina.zurba.tarot">
                        <img
                          src={"/gplay.png"}
                          style={{
                            width: "60px",
                            height: "60px",
                          }}
                        />
                      </Link>
                      <p
                        style={{
                          margin: 0,
                          bottom: 10,
                          position: "relative",
                          color: colors.white,
                          backgroundColor: "rgba(40, 49, 64, 0.5)",
                          paddingLeft: 5,
                          paddingRight: 5,
                          marginTop: 4,
                          borderRadius: 8,
                        }}
                      >
                        Android
                      </p>
                    </div>
                    <div
                      style={{
                        height: "3rem",
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                        justifyContent: "center",
                        paddingTop: "7%",
                      }}
                    >
                      <Link href="https://apps.apple.com/ro/app/cristina-zurba/id6475713937">
                        <img
                          src={"/appstore.png"}
                          style={{
                            width: "60px",
                            height: "60px",
                          }}
                        />
                      </Link>
                      <p
                        style={{
                          margin: 0,
                          bottom: 10,
                          position: "relative",
                          color: colors.white,
                          backgroundColor: "rgba(40, 49, 64, 0.5)",
                          paddingLeft: 5,
                          paddingRight: 5,
                          marginTop: 4,
                          borderRadius: 8,
                        }}
                      >
                        IOS
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
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
                    style={{
                      top: 20,
                      position: "relative",
                      height: 450,
                      width: 400,
                    }}
                  />
                  <Typography
                    variant="h1"
                    style={{
                      color: colors.primary3,
                      fontSize: isMobile ? 40 : 80,
                    }}
                  >
                    {t("tarotByAi")}
                  </Typography>
                </div>
              </div>
            </div>
          </Grid>

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
    </>
  );
}
