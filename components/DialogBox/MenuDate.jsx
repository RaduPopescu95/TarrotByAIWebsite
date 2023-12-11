import { Stack, Typography } from "@mui/material";

export default function MenuDate() {
  return (
    <Stack direction={"row"}>
      <Typography
        variant="body2"
        style={{ color: "rgba(111, 109, 123, 1)" }}
        ml={1}
      >
        05/10/2021 - 15:50
      </Typography>
    </Stack>
  );
}
