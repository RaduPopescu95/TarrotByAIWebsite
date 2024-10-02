import React from "react";
import TextField from "@mui/material/TextField";
import { StyledTextField } from "./FormStyles";
import * as styles from "./FormStyles";
import Box from "@mui/material/Box";

export default function TextFieldBox(props) {
  return (
    <Box sx={styles.TextFieldBox}>
      {props.isCompleteProfile && (
        <Box sx={{ ...styles.FieldBoxSecondary, mb: 2 }}>
          <StyledTextField
            margin="normal"
            fullWidth
            id="name"
            label={props.name}
            name="name"
            autoComplete="name"
            autoFocus
          />
          <StyledTextField
            margin="normal"
            fullWidth
            id="surname"
            label={props.surname}
            name="surname"
            autoComplete="surname"
            autoFocus
            sx={{ ml: 2 }}
          />
        </Box>
      )}
      {props.isEmailField ? (
        <StyledTextField
          fullWidth
          id="email"
          label={props.firstLabel}
          name="email"
          type="email"
          autoFocus
        />
      ) : props.isWorkspaceName ? (
        <>
          <StyledTextField
            fullWidth
            id="password"
            label={props.firstLabel}
            name="password"
            type="password"
            autoFocus
          />
          <StyledTextField
            margin="normal"
            fullWidth
            name="confirmPassword"
            label={props.thirdLabel}
            type="password"
            id="confirmPassword"
          />
        </>
      ) : (
        <>
          <StyledTextField
            fullWidth
            id="password"
            label={props.firstLabel}
            name="password"
            type="password"
            autoFocus
          />
        </>
      )}

      {props.isWorkspaceEmail ? (
        <StyledTextField
          margin="normal"
          fullWidth
          id="email"
          label={props.secondLabel}
          name="email"
          type="email"
          autoFocus
        />
      ) : !props.isResetPassword ||
        props.isPasswordComplete ||
        props.isCompleteProfile ? (
        <StyledTextField
          margin="normal"
          fullWidth
          name="confirmPassword"
          label={props.secondLabel}
          type="password"
          id="confirmPassword"
        />
      ) : null}
    </Box>
  );
}
