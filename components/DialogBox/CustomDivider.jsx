import Box from "@mui/material/Box";

export default function CustomDivider() {
  return (
    <Box
      sx={{
        width: 2,
        height: 200,
        backgroundColor: "rgba(234, 234, 236, 1)",
        "&:hover": {
          backgroundColor: "primary.main",
          opacity: [0.9, 0.8, 0.7],
        },
      }}
    />
  );
}
