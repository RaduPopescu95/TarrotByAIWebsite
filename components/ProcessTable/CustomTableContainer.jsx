import React, { useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Pagination,
  Typography,
} from "@mui/material";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";

export default function CustomTableContainer(props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24; // Ajustează numărul de elemente pe pagină după nevoie

  const handleChangePage = (event, newPage) => {
    console.log("props.searchedDb");
    console.log(props.searchedDb);
    setCurrentPage(newPage);
  };

  // Alege între props.db și props.searchedDb
  const dataSource =
    props.searchedDb && props.searchedDb.length > 0 && props.searchedValue
      ? props.searchedDb
      : props.searchedDb && props.searchValue.length > 0
      ? props.searchedDb
      : props.db;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataSource.slice(indexOfFirstItem, indexOfLastItem);
  const idInterval = `${indexOfFirstItem + 1}-${
    indexOfLastItem > dataSource.length ? dataSource.length : indexOfLastItem
  }`;

  return (
    <TableContainer component={Paper} sx={{ backgroundColor: "#252525" }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                border: "1px solid rgb(26 104 119)",
                color: "white",
                cursor: "pointer",
              }}
              onClick={() => props.handleSort("id")}
            >
              ID{" "}
              {props.sortConfig.id.direction === "ascending" ? (
                <ArrowDropUp />
              ) : (
                <ArrowDropDown />
              )}
            </TableCell>
            {props.showNume && (
              <TableCell
                sx={{
                  border: "1px solid rgb(26 104 119)",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => props.handleSort("nume")}
              >
                Nume Ro{" "}
                {props.sortConfig.nume.direction === "ascending" ? (
                  <ArrowDropUp />
                ) : (
                  <ArrowDropDown />
                )}
              </TableCell>
            )}
            {props.showDesc && (
              <TableCell
                sx={{
                  border: "1px solid rgb(26 104 119)",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => props.handleSort("descriere")}
              >
                Descriere Ro{" "}
                {props.sortConfig.descriere.direction === "ascending" ? (
                  <ArrowDropUp />
                ) : (
                  <ArrowDropDown />
                )}
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {currentItems.map((row, index) => (
            <TableRow
              hover
              key={index}
              sx={{
                cursor: "pointer",
              }}
              onClick={() => props.handleShowDialog(row)}
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
              {props.showNume && (
                <TableCell
                  sx={{
                    border: "1px solid rgb(26 104 119)",
                    color: "white",
                  }}
                  align="left"
                >
                  {row.info.ro.nume}
                </TableCell>
              )}
              {props.showDesc && (
                <TableCell
                  sx={{
                    border: "2px solid rgb(26 104 119)",
                    color: "white",
                  }}
                  align="left"
                >
                  {row.info.ro.descriere}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {props.searchedDb &&
        props.searchedDb.length === 0 &&
        props.searchValue.length > 0 && (
          <Box
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <Typography style={{ color: "white" }}>
              Nu s-au găsit rezultate pentru căutarea dvs.
            </Typography>
          </Box>
        )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 2,
        }}
      >
        <Pagination
          count={Math.ceil(dataSource.length / itemsPerPage)}
          page={currentPage}
          onChange={handleChangePage}
          color="primary"
          sx={{
            ".MuiPaginationItem-root": {
              color: "white",
            },
          }}
        />
        <Box sx={{ color: "white" }}>
          {idInterval} din {dataSource.length}
        </Box>
      </Box>
    </TableContainer>
  );
}
