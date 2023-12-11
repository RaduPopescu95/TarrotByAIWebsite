import { Box, Typography } from "@mui/material";

export default function LabelButton(props) {
  return (
    <>
      <Box
        sx={{
          borderRadius: "100px",
          textTransform: "capitalize",
          mr: 1,
          height: "22px",
          width: "81px",
          backgroundColor: props.bgColor,
          color: "white",
        }}
      >
        <Typography variant="body2" align="center">
          {props.txt}
        </Typography>
      </Box>
    </>
  );
}
