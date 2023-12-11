import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Stack,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import { StyledTextField } from "../../styles/FormStyles";

const CustomAccordion = (props) => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <div>
      <Accordion
        expanded={expanded === "panel1"}
        onChange={handleChange("panel1")}
        elevation={0}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Box>
            <Stack
              direction={"row"}
              style={{ display: "flex", alignItems: "center" }}
            >
              <ArrowRightAltIcon fontSize="small" color="warning" />
              <ArrowRightAltIcon fontSize="small" color="warning" />
              <Typography variant="h6" ml={1}>
                {props.title}
              </Typography>
            </Stack>
            {props.isReady && (
              <Box style={{ mr: 1 }}>
                <Typography
                  variant="body2"
                  style={{ color: "primary.light" }}
                  align="center"
                >
                  Ready
                </Typography>
              </Box>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails
          style={{ backgroundColor: "transparent", elevation: 0 }}
        >
          <StyledTextField
            fullWidth
            id="ContractNumber"
            label={"Contract Number"}
            name="ContractNumber"
            autoComplete="ContractNumber"
            autoFocus
            style={{ marginLeft: "2px" }}
          />
          <StyledTextField
            margin="normal"
            fullWidth
            id="ContractNumber2"
            label={"Contract Number 2"}
            name="ContractNumber2"
            autoComplete="ContractNumber2"
            autoFocus
            style={{ marginLeft: "2px" }}
          />
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default CustomAccordion;
