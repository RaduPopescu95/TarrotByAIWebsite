import React from "react";
import Button from "@mui/material/Button";
import { NavLink, useNavigate } from "react-router-dom";
import * as styles from "../../styles/FormStyles";

export default function Btn(props) {
  const navigate = useNavigate();
  return (
    <Button
      type="submit"
      fullWidth
      variant="contained"
      color={props.btnColor}
      sx={styles.btn}
      onClick={() => navigate(props.navScreen)}
    >
      {props.btnTxt}
    </Button>
  );
}
