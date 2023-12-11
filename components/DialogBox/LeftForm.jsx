import { Box, Grid } from "@mui/material";

import StartForm from "./StartForm";

import * as styles from "../../styles/MainScreenStyles";

export default function LeftForm({ articleData, handleEditArticle }) {
  return (
    <Box mx={2} sx={styles.mainStartFormBox}>
      <StartForm
        articleData={articleData}
        handleEditArticle={handleEditArticle}
      />
      {/* <CompanyForm /> */}
      {/* <CustomRadioGroup /> */}
      {/* <Grid container spacing={3}>
        <Grid item xs={12}>
          <StyledTextField
            required
            id="AdditionalDetails"
            name="AdditionalDetails"
            label="Additional Details"
            fullWidth
            autoComplete="AdditionalDetails"
            variant="outlined"
            multiline
            rows={3}
          />
        </Grid>
      </Grid> */}
    </Box>
  );
}
