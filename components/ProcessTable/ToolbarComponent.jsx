import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";

export default function ToolbarComponent(props) {
  return (
    <Box
      sx={{
        ...props.style,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        pr: props.padingR ? props.padingR : 3,
      }}
    >
      {props.icon && (
        <IconButton
          size="small"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{
            color: "black",
            borderRadius: "1px",
            mr: 0.5,
          }}
        >
          {props.icon}
        </IconButton>
      )}
      <Typography
        variant="h6"
        sx={{
          ...props.txtStyle,
          flexGrow: 1,
          color: "black",
        }}
        align="center"
      >
        {props.txt}
      </Typography>
    </Box>
  );
}
