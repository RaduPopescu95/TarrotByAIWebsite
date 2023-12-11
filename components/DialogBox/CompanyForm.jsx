import { Typography, Stack, Grid } from "@mui/material";
import * as icons from "../../data/Icons";
import CustomRadioGroup from "./CustomRadioGroup";
import CustomDivider from "./CustomDivider";
import { StyledTextField } from "../../styles/FormStyles";

export default function CompanyForm() {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Company Data
      </Typography>
      <Stack direction="row" spacing={2}>
        <Stack
          direction="column"
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <icons.DescriptionOutlinedIcon />
          <CustomDivider />
        </Stack>
        <Stack>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <StyledTextField
                id="CompanyName"
                name="CompanyName"
                label="Company Name"
                fullWidth
                autoComplete="CompanyName"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <StyledTextField
                id="Surname"
                name="Surname"
                label="Surname"
                fullWidth
                autoComplete="Surname"
                variant="outlined"
              />
            </Grid>
          </Grid>
          <CustomRadioGroup isCompanyData={true} style={{ mt: 6 }} />
        </Stack>
      </Stack>
    </>
  );
}
