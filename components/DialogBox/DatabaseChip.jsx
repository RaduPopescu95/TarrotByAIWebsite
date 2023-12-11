import { Box, Typography } from "@mui/material";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import * as styles from "../../styles/DialogStyles";

export default function DatabaseChip(props) {
  return (
    <Box sx={styles.databaseChip}>
      <StorageOutlinedIcon fontSize="small" />
      <Typography ml={1} variant="body1">
        {props.txt}
      </Typography>
    </Box>
  );
}
