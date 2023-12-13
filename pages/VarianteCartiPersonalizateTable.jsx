import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import TableToolbar from "../components/ProcessTable/TableToolbar";

import IconInSelect from "../components/ProcessTable/IconInSelect";

import CustomTableContainer from "../components/ProcessTable/CustomTableContainer";
import { useStyles } from "../styles/ProcessTableStyles";
import { editData, getData, writeData } from "../utils/realtimeUtils";
import { getCurrentDateTime } from "../utils/timeUtils";
import { uploadImage } from "../utils/storageUtils";
import { auth, storage } from "../firebase";
import { getDatabase, ref, remove, child, set } from "firebase/database";
import { deleteObject, ref as storageRef } from "firebase/storage";

import CartiViitorFields from "../components/Dashboard/CartiViitorFields";
import DeleteDialog from "../components/DialogBox/DeleteDialog";
import CartiPersonalizateFields from "../components/Dashboard/CartiPersonalizateFields";
import VarianteCartiPersonalizateFields from "../components/Dashboard/VarianteCartiPersonalizateFields";
import { testString } from "../utils/strintText";
import VariatieCartiContainer from "../components/ProcessTable/VariatieCartiContainer";
import { generateElaiVideoAPI, renderElaiVideoAPI } from "../utils/apiUtils";

export default function VarianteCartiPersonalizateTable() {
  // const { db } = useMockup();
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [db, setDb] = useState([]);
  const [categorii, setCategorii] = useState([]);
  const [carti, setCarti] = useState([]);
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
      item.info.ro.descriere.toLowerCase().includes(lowerCaseValue)
    );

    console.log(filteredDb);
    console.log(value);
    setSearchValue(value);
    setSearchedDb(filteredDb);
  };

  const handleGetData = async () => {
    setIsLoading(true);
    const data = await getData("Citire-Personalizata", "VarianteCarti");
    const dataCarti = await getData("Citire-Personalizata", "Carti");
    const dataCategorii = await getData("Citire-Personalizata", "Categorii");

    let rawData = [...data.arr];
    const sortedArr = rawData.sort((a, b) => a.id - b.id);
    let rawDataCarti = [...dataCarti.arr];
    const sortedArrCarti = rawDataCarti.sort((a, b) => a.nume - b.nume);
    let rawDataCategorii = [...dataCategorii.arr];
    const sortedArrCategorii = rawDataCategorii.sort((a, b) => a.nume - b.nume);

    if (data) {
      setDb([...sortedArr]);
      setCarti([...sortedArrCarti]);
      setCategorii([...sortedArrCategorii]);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      // Handle the case where servicesDB is undefined
      // For example, display an error message or take appropriate action
    }
  };

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

  const confirmDelete = () => {
    const authInstance = auth;
    const currentUser = authInstance.currentUser;
    const database = getDatabase();

    // 1. Ștergeți elementul din Firebase
    const dataRef = ref(
      database,
      "Citire-Personalizata/VarianteCarti/" + dialogData.id
    );
    remove(dataRef);

    // Creează o nouă matrice care exclude articolul cu ID-ul specificat
    const updatedDb = db.filter((a) => a.id !== dialogData.id);

    // 2. Resetarea ID-urilor pentru continuitate
    const finalDb = updatedDb.map((item, index) => {
      return {
        ...item,
        id: index + 1,
      };
    });

    // // Șterge toate nodurile existente sub "Services/"
    const dbRef = ref(database, "Citire-Personalizata/VarianteCarti/");
    set(dbRef, {}).then(() => {
      // După ce toate nodurile sunt șterse, adaugă finalDb ca noile noduri copil
      finalDb.forEach((item) => {
        const newDbRef = child(dbRef, String(item.id));
        set(newDbRef, item);
      });
    });

    // Actualizează starea db cu noua matrice filtrată
    setDb(finalDb);
    handleShowDialog();
    handleDelete();
  };

  const handleEdit = async (info, categorie, carte) => {
    try {
      const dateTime = getCurrentDateTime();

      const updateData = db.map(async (item) => {
        if (item.id === dialogData.id) {
          console.log("is found");
          let data;

          data = {
            id: item.id,
            info,
            categorie,
            carte,
            date: dateTime.date,
            time: dateTime.time,
          };

          editData(
            data,
            "Citire-Personalizata",
            "VarianteCarti",
            dialogData.id
          );
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

  const handleUpload = async (info, categorie, carte) => {
    try {
      const dateTime = getCurrentDateTime();

      for (let item of Object.values(info)) {
        if (item.descriere.length > 0) {
          let response = await generateElaiVideoAPI(item.video, item.descriere);
          console.log("response:", response._id);
          renderElaiVideoAPI(response._id);
          // console.log("video:", item.video);
        }
      }
      // const data = {
      //   id: db.length + 1,
      //   info,
      //   categorie,
      //   carte,
      //   date: dateTime.date,
      //   time: dateTime.time,
      // };

      // // Folosește await pentru a aștepta finalizarea promisiunii
      // await writeData(data, "Citire-Personalizata", "VarianteCarti");

      // let newData = db;

      // newData.push(data);

      // setDb([...newData]);

      // setShowSettings(!showSettings);
    } catch (err) {
      console.log("Error handleUpload...", err);
    }
  };

  const handleShowSoloPopup = () => {
    setOpenSoloPopup(!openSoloPopup);
  };

  useEffect(() => {
    handleGetData();
    // fetchData();
    // console.log(db);
  }, []);

  return (
    <>
      {showSettings ? (
        <VarianteCartiPersonalizateFields
          handleEdit={handleEdit}
          handleUpload={handleUpload}
          handleShowSettings={handleShowSettings}
          isEdit={isEdit}
          dialogData={dialogData}
          handleDelete={handleDelete}
          carti={carti}
          categorii={categorii}
          firebaseDb={db}
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
                isElaiDownload={true}
                handleSearchFilter={handleSearchFilter}
              />
              <TableToolbar />
              <Stack direction="column" alignItems="center">
                {isLoading ? (
                  <CircularProgress />
                ) : db.length === 0 ? (
                  <Typography
                    sx={{
                      fontSize: 20,
                      marginTop: 5,
                      fontWeight: "400",
                      color: "white",
                    }}
                  >
                    Nu sunt cărți adăugate
                  </Typography>
                ) : (
                  <VariatieCartiContainer
                    db={db}
                    handleShowDialog={handleShowDialog}
                    searchedDb={searchedDb}
                    searchValue={searchValue}
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
