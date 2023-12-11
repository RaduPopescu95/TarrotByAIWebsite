import { Box, Grid } from "@mui/material";
import CustomRadioGroup from "./CustomRadioGroup";
import { StyledTextField } from "../../styles/FormStyles";
import DialogMenu from "./DialogMenu";
import StartForm from "./StartForm";
import CompanyForm from "./CompanyForm";
import * as styles from "../../styles/MainScreenStyles";
import StartFormService from "./StartFormService";

export default function LeftFormService({ articleData, handleEditArticle }) {
  return (
    <Box mx={2} sx={styles.mainStartFormBox}>
      <StartFormService
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
