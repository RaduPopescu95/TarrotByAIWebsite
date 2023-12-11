import React from "react";
import { Typography, Toolbar, Grid, Box, Stack } from "@mui/material/";

import ProcessCard from "../Board/ProcessCard";
import * as icons from "../../data/Icons";
import * as styles from "../../styles/MainScreenStyles";

export default function ProcessCardItems(props) {
  const processCardData = [
    <ProcessCard
      cardColor={"transparent"}
      icon={<icons.AddIcon fontSize={"large"} sx={{ color: "#6F6D7B" }} />}
      text={"Create a new process"}
      dashedBorder={"dashed"}
      colorBorder={"#D6D5D9"}
      isAddCard={true}
      setIsCreating={() => props.setIsCreating(true)}
    />,
    <ProcessCard
      cardColor={"#47BDFF"}
      icon={<icons.AssignmentIcon fontSize={"large"} sx={{ color: "white" }} />}
      text={"Process 1"}
    />,
    <ProcessCard
      cardColor={"#FF47B5"}
      icon={
        <icons.ShoppingCartOutlinedIcon
          fontSize={"large"}
          sx={{ color: "white" }}
        />
      }
      lockIcon={<icons.LockOutlinedIcon sx={{ height: 16, color: "white" }} />}
      menu={<icons.MoreVertIcon sx={{ height: 15, color: "white" }} />}
      text={"Process 2"}
    />,
    <ProcessCard
      cardColor={"#FF9F47"}
      icon={<icons.AssignmentIcon fontSize={"large"} sx={{ color: "white" }} />}
      lockIcon={
        <icons.LockOpenOutlinedIcon sx={{ height: 16, color: "white" }} />
      }
      menu={<icons.MoreVertIcon sx={{ height: 15, color: "white" }} />}
      text={"Process 3"}
    />,
    <ProcessCard
      cardColor={"#6C47FF"}
      icon={<icons.AssignmentIcon fontSize={"large"} sx={{ color: "white" }} />}
      text={"Process 4"}
    />,
    <ProcessCard
      cardColor={"#2EF1CE"}
      icon={<icons.AssignmentIcon fontSize={"large"} sx={{ color: "white" }} />}
      text={"Process 5"}
    />,
    <ProcessCard
      cardColor={"#F6D524"}
      icon={<icons.AssignmentIcon fontSize={"large"} sx={{ color: "white" }} />}
      text={"Process 6"}
    />,
    <ProcessCard
      cardColor={"#E547FF"}
      icon={<icons.AssignmentIcon fontSize={"large"} sx={{ color: "white" }} />}
      text={"Process 7"}
    />,
    <ProcessCard
      cardColor={"#F6D524"}
      icon={<icons.AssignmentIcon fontSize={"large"} sx={{ color: "white" }} />}
      text={"Process 8"}
    />,
    <ProcessCard
      cardColor={"#E547FF"}
      icon={<icons.AssignmentIcon fontSize={"large"} sx={{ color: "white" }} />}
      text={"Process 9"}
    />,
  ];
  return (
    <Box>
      <Grid container rowSpacing={1}>
        {processCardData.map((card, index) => (
          <Grid item md={1.5} sm={4} xs={8} sx={styles.cardGrid} key={index}>
            {card}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
