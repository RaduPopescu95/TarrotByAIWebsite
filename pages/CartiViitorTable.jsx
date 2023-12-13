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

export default function CartiViitorTable() {
  // const { db } = useMockup();
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [db, setDb] = useState([]);

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

  const handleGetData = async () => {
    setIsLoading(true);
    const data = await getData("Citire-Viitor", "Carti");

    let rawData = [...data.arr];
    const sortedArr = rawData.sort((a, b) => a.id - b.id);

    if (data) {
      setDb([...sortedArr]);
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
    const dataRef = ref(database, "Citire-Viitor/Carti/" + dialogData.id);
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
    const dbRef = ref(database, "Citire-Viitor/Carti/");
    set(dbRef, {}).then(() => {
      // După ce toate nodurile sunt șterse, adaugă finalDb ca noile noduri copil
      finalDb.forEach((item) => {
        const newDbRef = child(dbRef, String(item.id));
        set(newDbRef, item);
      });
    });

    // Create a reference to the file to delete
    const deletedRef = storageRef(
      storage,
      `images/Citire-Viitor/${currentUser?.uid}/${dialogData.image.fileName}`
    );

    // Delete the file
    deleteObject(deletedRef)
      .then(() => {
        console.log("File deleted successfully");
      })
      .catch((error) => {
        console.log(
          "Uh-oh, an error occurred! AT uploadImage DELETE...",
          error
        );
      });

    // Actualizează starea db cu noua matrice filtrată
    setDb(finalDb);
    handleShowDialog();
    handleDelete();
  };

  const handleEdit = async (info, image, initialImage, oldFileName) => {
    console.log("info....");
    console.log(info);
    console.log(image);
    console.log(initialImage);
    console.log(oldFileName);
    try {
      const dateTime = getCurrentDateTime();

      const updateData = db.map(async (item) => {
        if (item.id === dialogData.id) {
          console.log("is found");
          let data;
          if (image.length === 0) {
            data = {
              id: item.id,
              info,
              image: initialImage,
              date: dateTime.date,
              time: dateTime.time,
            };
          } else {
            const hasNewImage = image.length > 0;
            const newImage = await uploadImage(
              image,
              initialImage,
              true,
              "Citire-Viitor",
              "",
              oldFileName
            );
            data = {
              id: dialogData.id,
              info,
              image: newImage,
              date: dateTime.date,
              time: dateTime.time,
            };
          }
          editData(data, "Citire-Viitor", "Carti", dialogData.id);
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

  const handleUpload = async (info, selectedImages) => {
    try {
      const dateTime = getCurrentDateTime();

      const image = await uploadImage(
        selectedImages,
        [],
        false,
        "Citire-Viitor",
        "Carti"
      );

      const data = {
        id: db.length + 1,
        info,
        image,
        date: dateTime.date,
        time: dateTime.time,
      };

      // Folosește await pentru a aștepta finalizarea promisiunii
      await writeData(data, "Citire-Viitor", "Carti");

      let newData = db;

      newData.push(data);

      setDb([...newData]);

      setShowSettings(!showSettings);
    } catch (err) {
      console.log("Error handleUpload...", err);
    }
  };

  const handleShowSoloPopup = () => {
    setOpenSoloPopup(!openSoloPopup);
  };

  useEffect(() => {
    handleGetData();
    // console.log(db);
  }, []);

  return (
    <>
      {showSettings ? (
        <CartiViitorFields
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
                  <CustomTableContainer
                    db={db}
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
