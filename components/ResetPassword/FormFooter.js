import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import * as styles from "./FormStyles";
import Link from "next/link";

export default function FormFooter(props) {
  return (
    <Grid container sx={styles.formFooterGrid}>
      <Typography variant="body2">{props.txtLink}</Typography>
      <Link style={styles.signUpLink} href={"/signin"}>
        {props.navLinkTxt}
      </Link>
    </Grid>
  );
}
