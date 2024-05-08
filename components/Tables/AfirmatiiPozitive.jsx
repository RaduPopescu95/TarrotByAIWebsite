import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import TableToolbar from "../ProcessTable/TableToolbar";

import IconInSelect from "../ProcessTable/IconInSelect";

import CustomTableContainer from "../ProcessTable/CustomTableContainer";
import { useStyles } from "../../styles/ProcessTableStyles";
import { editData, getData, writeData } from "../../utils/realtimeUtils";
import { getCurrentDateTime } from "../../utils/timeUtils";
import { uploadImage } from "../../utils/storageUtils";
import { authentication, storage } from "../../firebase";
import { getDatabase, ref, remove, child, set } from "firebase/database";
import { deleteObject, ref as storageRef } from "firebase/storage";

import CartiViitorFields from "../Dashboard/CartiViitorFields";
import DeleteDialog from "../DialogBox/DeleteDialog";
import AfirmatiiPozitiveFields from "../Dashboard/AfirmatiiPozitiveFields";
import {
  handleDeleteFirestoreData,
  handleGetFirestore,
  handleUpdateFirestore,
  handleUploadFirestore,
} from "../../utils/firestoreUtils";
import { handleYotubeLinksToArray } from "../../utils/youtubeLinkUtils";




export default function AfirmatiiPozitive({articles}) {
  // const { db } = useMockup();
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [db, setDb] = useState([...articles]);

  const [dialogData, setDialogData] = useState({});
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showAddContract, setShowAddContract] = React.useState(false);
  const [openSoloPopup, setOpenSoloPopup] = React.useState(false);
  const settingsRef = React.useRef(null);
  const classes = useStyles();


  const [searchedDb, setSearchedDb] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const handleSearchFilter = (value) => {
    const lowerCaseValue = value.toLowerCase();
    const filteredDb = db.filter((item) =>
      item.info.ro.nume.toLowerCase().includes(lowerCaseValue)
    );

    console.log(filteredDb);
    console.log(value);
    setSearchValue(value);
    setSearchedDb(filteredDb);
  };

  // Starea inițială setată pentru fiecare coloană Sortare
  const [sortConfig, setSortConfig] = useState({
    id: { direction: "ascending" },
    nume: { direction: "ascending" },
    descriere: { direction: "ascending" },
  });

  const handleSort = (key) => {
    console.log(db[0].info.ro[key]);
    console.log(db[0]);
    console.log(key);
    const direction =
      sortConfig[key].direction === "ascending" ? "descending" : "ascending";
    setSortConfig({ ...sortConfig, [key]: { direction } });

    const sortArray = (array) => {
      return array.sort((a, b) => {
        if (key === "id") {
          if (a[key] < b[key]) {
            return direction === "ascending" ? -1 : 1;
          }
          if (a[key] > b[key]) {
            return direction === "ascending" ? 1 : -1;
          }
        } else {
          if (a.info.ro[key] < b.info.ro[key]) {
            return direction === "ascending" ? -1 : 1;
          }
          if (a.info.ro[key] > b.info.ro[key]) {
            return direction === "ascending" ? 1 : -1;
          }
        }
        return 0;
      });
    };

    let sortedData;
    if (searchValue.length > 0) {
      sortedData = sortArray([...searchedDb]);
      setSearchedDb(sortedData);
    } else {
      sortedData = sortArray([...db]);
      setDb(sortedData);
    }
  };

  // ELIMINAT SI INLOCUIT CU GETSERVERSIDEPROPS
  // const handleGetData = async () => {
  //   console.log("Start......")
  //   setIsLoading(true);
  //   const data = await handleGetFirestore("AfirmatiiPozitive");

  //   let rawData = [...data];
  //   const sortedArr = rawData.sort((a, b) => a.id - b.id);

  //   if (data) {
  //     setDb([...sortedArr]);
  //     setIsLoading(false);
  //   } else {
  //     setIsLoading(false);
  //     // Handle the case where servicesDB is undefined
  //     // For example, display an error message or take appropriate action
  //   }
  // };

  const handleShowDialog = (item) => {
    console.log(item);
    if (showSettings) {
      setDialogData({});
      setIsEdit(false);
      handleShowSettings();
    } else {
      setIsEdit(true);
      setDialogData(item);
      handleShowSettings();
    }
  };

  const handleShowSettings = () => {
    setShowSettings(!showSettings);
    if (dialogData.id) {
      setDialogData({});
      setIsEdit(false);
    }
  };

  const handleShowAddContract = () => {
    setShowAddContract(!showAddContract);
  };

  const handleDelete = () => {
    console.log("Start");
    setOpenDeleteDialog(!openDeleteDialog);
  };

  const confirmDelete = async () => {
    const authInstance = authentication;
    const currentUser = authInstance.currentUser;
    const database = getDatabase();
    // console.log(dialogData);

    //  O FUNCTIE PENTRU STERGERE DOC SI A INNOI ID URILE TUTUROR DOCUMENTELOR PENTRU CA ID URILE SA RAMANA IN ORDINE
    const newData = await handleDeleteFirestoreData(
      `AfirmatiiPozitive/${dialogData.documentId}`,
      true,
      "AfirmatiiPozitive"
    );

    console.log("new data.....", newData);


    // Actualizează starea db cu noua matrice filtrată
    setDb(newData);
    handleShowDialog();
    handleDelete();
  };

  const handleEdit = async (
    info,
    image,
    initialImage,
    oldFileName,
    categorie,
    youtubeLink,
    timpProgramat, 
    dataProgramata
  ) => {
    console.log("youtubeLink....");
    console.log(youtubeLink);

    try {
      const updateData = db.map(async (item) => {
        if (item.id === dialogData.id) {
          console.log("is found");
          let data;
          if (image.length === 0) {
            
            let date;
            if(timpProgramat.length > 0){
              const dateParts = dataProgramata.split('-');
              const timeParts = timpProgramat.split(':');
              date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
              
            }else{
              const dateParts = item.firstUploadDate.split('-');
              const timeParts = item.firstUploadTime.split(':');
              date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
        
            }
            data = {
              ...item,
              firstUploadtime: timpProgramat.length > 0 ? timpProgramat : item.firstUploadTime ,
              firstUploadDate: dataProgramata.length > 0 ? dataProgramata : item.firstUploadDate,
              firstUploadTimestamp:date,
              info,
           
              timpProgramat,
              dataProgramata
            };
            console.log("if.....", data);
          } else {
            console.log("else.....", data);
   
            let date;
            if(timpProgramat.length > 0){
              const dateParts = dataProgramata.split('-');
              const timeParts = timpProgramat.split(':');
              date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
              
            }else{
              const dateParts = item.firstUploadDate.split('-');
              const timeParts = item.firstUploadTime.split(':');
              date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
        
            }
        
            data = {
              ...item,
              firstUploadtime: timpProgramat.length > 0 ? timpProgramat : item.firstUploadTime ,
              firstUploadDate: dataProgramata.length > 0 ? dataProgramata : item.firstUploadDate,
              firstUploadTimestamp:date,
              info,
              timpProgramat,
              dataProgramata
            };
          }
          await handleUpdateFirestore(`AfirmatiiPozitive/${data.documentId}`, data);
          return data;
        } else {
          console.log("is not found");
          return item;
        }
      });
      // Use Promise.all to wait for all promises in the map to resolve
      const updatedData = await Promise.all(updateData);
      setDb([...updatedData]);
      handleShowDialog();
    } catch (err) {
      console.log("Error handleEdit...", err);
    }
  };

  const handleUpload = async (info, selectedImages, categorie, youtubeLink,  timpProgramat, dataProgramata) => {
    try {
   


      const data = {
        info,
        timpProgramat,
        dataProgramata
      };
 
      // Folosește await pentru a aștepta finalizarea promisiunii
      const dataReturned = await handleUploadFirestore(data, "AfirmatiiPozitive");

      let newData = db;

      newData.push(dataReturned);

      setDb([...newData]);

      setShowSettings(!showSettings);
    } catch (err) {
      console.log("Error handleUpload...", err);
    }
  };

  const handleShowSoloPopup = () => {
    setOpenSoloPopup(!openSoloPopup);
  };

  // useEffect(() => {
  //   handleGetData();
  //   // console.log(db);
  // }, []);

  return (
    <>
      {showSettings ? (
        <AfirmatiiPozitiveFields
          handleEdit={handleEdit}
          handleUpload={handleUpload}
          handleShowSettings={handleShowSettings}
          isEdit={isEdit}
          dialogData={dialogData}
          handleDelete={handleDelete}
        />
      ) : (
        <>
          <Box component="main" className={classes.mainBox}>
            <Box>
              <TableToolbar
                isMainToolbar={true}
                handleShowSettings={handleShowSettings}
                handleShowAddContract={handleShowAddContract}
                handleShowSoloPopup={handleShowSoloPopup}
                settingsRef={settingsRef}
                db={db}
                handleSearchFilter={handleSearchFilter}
              />
              <TableToolbar />
              <Stack direction="column" alignItems="center">
                {isLoading ? (
                  <CircularProgress />
                ) : articles.length === 0 ? (
                  <Typography
                    sx={{
                      fontSize: 20,
                      marginTop: 5,
                      fontWeight: "400",
                      color: "white",
                    }}
                  >
                    Nu sunt afirmatii adăugate
                  </Typography>
                ) : (
                  <CustomTableContainer
                    db={articles}
                    searchedDb={searchedDb}
                    searchValue={searchValue}
                    handleShowDialog={handleShowDialog}
                    showNume={true}
                    showDesc={true}
                    sortConfig={sortConfig}
                    handleSort={handleSort}
                  />
                )}
              </Stack>
            </Box>
          </Box>
          <IconInSelect
            anchorEl={settingsRef.current}
            open={openSoloPopup}
            onClose={setOpenSoloPopup}
          />
        </>
      )}
      <DeleteDialog
        openConfirmDialog={openDeleteDialog}
        handleDelete={handleDelete}
        confirmDelete={confirmDelete}
      />
    </>
  );
}
