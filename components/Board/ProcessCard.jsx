import * as React from "react";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Typography,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import * as styles from "../../styles/MainScreenStyles";

export default function ProcessCard(props) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        width: 150,
        height: 150,
        backgroundColor: props.cardColor,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderStyle: props.dashedBorder,
        borderColor: props.colorBorder,
        boxShadow: "none",
      }}
    >
      <CardActions sx={{ display: "flex", justifyContent: "space-between" }}>
        {props.lockIcon} {props.menu}
      </CardActions>
      <CardContent sx={styles.cardContent}>
        {props.isAddCard ? (
          <IconButton onClick={() => props.setIsCreating()}>
            {props.icon}
          </IconButton>
        ) : (
          <IconButton
            onClick={() =>
              navigate("/mainscreen/process", { state: props.text })
            }
          >
            {props.icon}
          </IconButton>
        )}

        <Box sx={{ width: 100, maxHeight: 30 }}>
          <Typography
            sx={{ fontSize: 16, textAlign: "center" }}
            color={props.isAddCard ? "#6F6D7B" : "white"}
            gutterBottom
          >
            {props.text}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
