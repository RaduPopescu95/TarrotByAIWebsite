import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button"; // Importă componenta Button

import useStyles from "./subscribe-style";

function SubscribeForm() {

  const { classes } = useStyles();
  const [values, setValues] = useState({
    email: "",
  });

  const handleChange = (name) => (event) => {
    setValues({ ...values, [name]: event.target.value });
  };

  const handleSubscribe = () => {
    // Aici poți adăuga logica de abonare, cum ar fi trimiterea datelor pe server
    const email = values.email;
    // Exemplu simplu de afișare în consolă, dar de obicei, trebuie să trimiti datele la un server
    console.log(`Subscribed with email: ${email}`);
  };

  // Theme breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <div className={classes.subscribeWrap} style={{ paddingTop: 20 }}>
      <Paper
        className={classes.paper}
        elevation={0}
        style={{
          padding: 0,
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          flexDirection: "column",
        }}
      >
        <Typography color={"white"} align="center" variant="h2" sx={{fontSize:30}}>
          Subscribe
        </Typography>
        <form
          className={classes.container}
          noValidate
          autoComplete="off"
          style={{
            padding: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <TextField
            variant="filled"
            id="standard-email"
            label={"Email"}
            className={classes.textField}
            fullWidth
            value={values.email}
            onChange={handleChange("email")}
            margin="normal"
            InputProps={{
              style: { color: "white", willChange: "transform, opacity" }, 
            }}
            InputLabelProps={{
              style: { color: "white" },
            }}
          />

          <div style={{ textAlign: "center" }}>
            <Button className={classes.buttonHeader} onClick={handleSubscribe}>
              Subscribe
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
}

export default SubscribeForm;
