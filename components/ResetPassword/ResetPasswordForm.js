import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  TextField,
} from "@mui/material";

import * as styles from "./FormStyles";
import LockResetIcon from "@mui/icons-material/LockReset";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import TextBox from "./TextBox";
import TextFieldBox from "./TextFieldBox";
import FormFooter from "./FormFooter";

export default function ResetPasswordForm(props) {
  const [email, setEmail] = React.useState("");
  const [emailSent, setEmailSent] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const handleResetPass = () => {
    setIsResetting(true);
    const authentication = auth;
    sendPasswordResetEmail(authentication, email)
      .then(() => {
        setEmail("");
        setEmailSent(true);
        setTimeout(() => {
          setEmailSent(false);
        }, 3000);
        // Password reset email sent!
        // ..
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("Error on handleResetPass CODE:", errorCode);
        console.log("Error on handleResetPass MESSAGE:", errorMessage);
        // ..
      });
    setIsResetting(false);
  };

  return (
    <Container component="main" fixed={true} sx={styles.container}>
      <Box
        component="form"
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <LockResetIcon sx={{ fontSize: 50 }} />

        <TextBox
          txt={props.txt}
          subTxt={props.subTxt}
          styles={{ marginBottom: 6 }}
        />
        <TextField
          id="outlined-basic"
          label="Email"
          variant="outlined"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          sx={{ width: "100%" }}
        />

        <Button
          // type="submit"
          fullWidth
          variant="contained"
          onClick={handleResetPass}
          sx={{ mt: 3, mb: 2 }}
        >
          {isResetting ? <CircularProgress /> : "RESET PASSWORD"}
        </Button>

        {!props.isPasswordComplete && (
          <FormFooter
            txtLink={props.txtLink}
            navLink={props.navLink}
            navLinkTxt={"Login"}
          />
        )}
      </Box>
      {emailSent && (
        <Alert severity="success" sx={{ position: "absolute", bottom: 20 }}>
          Email sent! Check spam if you don't see your email
        </Alert>
      )}
    </Container>
  );
}
