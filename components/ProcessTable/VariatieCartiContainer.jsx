import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Pagination,
  Box,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

export default function VariatieCartiContainer(props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const languages = [
    "ro",
    "en",
    "es",
    "bg",
    "cs",
    "de",
    "el",
    "fr",
    "hr",
    "hu",
    "it",
    "pl",
    "ru",
    "sk",
  ];

  const renderLanguageCell = (url) =>
    url.length > 0 ? (
      <CheckCircleOutlineIcon sx={{ color: "green", fontSize: "25px" }} />
    ) : (
      <HighlightOffIcon sx={{ color: "red", fontSize: "25px" }} />
    );
  const cellStyle = { border: "1px solid rgb(26 104 119)", color: "#D3D3D3" };
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Alege între props.db și props.searchedDb
  const dataSource =
    props.searchedDb && props.searchedDb.length > 0 && props.searchedValue
      ? props.searchedDb
      : props.searchedDb && props.searchValue.length > 0
      ? props.searchedDb
      : props.db;
  const currentItems = dataSource.slice(indexOfFirstItem, indexOfLastItem);
  // Adăugarea unui element pentru afișarea intervalului de ID-uri
  const idInterval = `${indexOfFirstItem + 1}-${
    indexOfLastItem > dataSource.length ? dataSource.length : indexOfLastItem
  }`;
  return (
    <TableContainer component={Paper} sx={{ backgroundColor: "#252525" }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell style={cellStyle}>ID</TableCell>
            {languages.map((lang) => (
              <TableCell style={cellStyle} key={lang}>
                {lang.toUpperCase()}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {currentItems.map((row, index) => (
            <TableRow
              hover
              key={index}
              onClick={() => props.handleShowDialog(row)}
              sx={{
                cursor: "pointer",
              }}
            >
              <TableCell style={cellStyle}>{row.id}</TableCell>
              {languages.map((lang) => (
                <TableCell key={lang} align="center" style={cellStyle}>
                  {renderLanguageCell(row.info[lang].url)}
                </TableCell>
              ))}
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
          count={Math.ceil(props.db.length / itemsPerPage)}
          page={currentPage}
          onChange={handleChangePage}
          color="primary"
          sx={{
            marginY: 2,
            ".MuiPaginationItem-root": {
              color: "#D3D3D3", // Schimbă culoarea textului
            },
          }}
        />
        <Box sx={{ color: "#D3D3D3" }}>
          {idInterval} din {props.db.length}
        </Box>
      </Box>
    </TableContainer>
  );
}
