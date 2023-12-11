import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Toolbar,
  TableHead,
} from "@mui/material";

export default function CustomTableContainer(props) {
  console.log("table...");
  console.log(props.db);
  return (
    <TableContainer component={Paper} sx={{ backgroundColor: "#252525" }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                border: "1px solid rgb(26 104 119)",
                color: "white",
              }}
            >
              ID
            </TableCell>
            <TableCell
              sx={{
                border: "1px solid rgb(26 104 119)",
                color: "white",
              }}
            >
              Title
            </TableCell>
            <TableCell
              sx={{
                border: "1px solid rgb(26 104 119)",
                color: "white",
              }}
            >
              Date Created
            </TableCell>
            <TableCell
              sx={{
                border: "1px solid rgb(26 104 119)",
                color: "white",
              }}
            >
              Time Created
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.db &&
            props.db.map((row, index) => (
              <TableRow
                hover
                key={index}
                sx={{
                  cursor: "pointer",
                }}
                onClick={() =>
                  props.handleShowDialog(
                    row.id,
                    row.title,
                    row.metaDescription,
                    row.image,
                    row.tags,
                    row.content,
                    row.name
                  )
                }
              >
                <TableCell
                  sx={{
                    border: "1px solid rgb(26 104 119)",
                    color: "white",
                  }}
                  align="left"
                >
                  {row.id}
                </TableCell>
                <TableCell
                  sx={{
                    border: "1px solid rgb(26 104 119)",
                    color: "white",
                  }}
                  align="left"
                >
                  {row.title}
                </TableCell>

                <TableCell
                  sx={{
                    border: "2px solid rgb(26 104 119)",
                    color: "white",
                  }}
                  align="left"
                >
                  {row.date}
                </TableCell>
                <TableCell
                  sx={{
                    border: "2px solid rgb(26 104 119)",
                    color: "white",
                  }}
                  align="left"
                >
                  {row.time}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
