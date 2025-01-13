import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import TableToolbar from "../ProcessTable/TableToolbar";

import IconInSelect from "../ProcessTable/IconInSelect";

import CustomTableContainer from "../ProcessTable/CustomTableContainer";
import { useStyles } from "../../styles/ProcessTableStyles";
import { editData, getData, writeData } from "../../utils/realtimeUtils";
import { getCurrentDateTime } from "../../utils/timeUtils";
import { uploadImage } from "../../utils/storageUtils";
import { authentication, db, storage } from "../../firebase";
import { getDatabase, ref, remove, child, set } from "firebase/database";
import { deleteObject, ref as storageRef } from "firebase/storage";

import CartiViitorFields from "../Dashboard/CartiViitorFields";
import DeleteDialog from "../DialogBox/DeleteDialog";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

export default function CuloriNorocoaseTable() {
  // const { localDb } = useMockup();
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [localDb, setLocalDb] = useState([]);
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
    const filteredDb = localDb.filter((item) =>
      item.info.ro.descriere.toLowerCase().includes(lowerCaseValue)
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
    console.log(localDb[0].info.ro[key]);
    console.log(localDb[0]);
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
      sortedData = sortArray([...localDb]);
      setLocalDb(sortedData);
    }
  };

  const updateFirestoreCollection = async (collectionName, dataArray) => {
    try {
      console.log(`Încep actualizarea colecției ${collectionName}...`);
      const collectionRef = collection(db, collectionName);

      // 1. Șterge toate documentele existente din colecție
      const existingDocs = await getDocs(collectionRef);
      const deletePromises = existingDocs.docs.map((docSnap) =>
        deleteDoc(doc(collectionRef, docSnap.id))
      );
      await Promise.all(deletePromises);
      console.log(
        `Documentele existente din ${collectionName} au fost șterse.`
      );

      // 2. Adaugă fiecare obiect din dataArray ca un nou document
      const addPromises = dataArray.map((item) => {
        const newDocRef = doc(collectionRef); // Creează un document nou cu un ID generat automat
        return setDoc(newDocRef, item);
      });
      await Promise.all(addPromises);

      console.log(`Colecția ${collectionName} a fost actualizată cu succes.`);
    } catch (error) {
      console.error(
        `Eroare la actualizarea colecției ${collectionName}:`,
        error
      );
    }
  };

  const handleGetData = async () => {
    setIsLoading(true);
    const data = await getData("Others", "Culori-Norocoase");

    let rawData = [...data.arr];
    const sortedArr = rawData.sort((a, b) => a.id - b.id);
    console.log("sortedArr....", sortedArr);
    if (data) {
      setLocalDb([...sortedArr]);
      setIsLoading(false);

      // Apelează funcția de actualizare
      // await updateFirestoreCollection("CuloriNorocoase", sortedArr);
    } else {
      setIsLoading(false);
      console.error("Nu s-au găsit date pentru actualizare.");
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
    const authInstance = authentication;
    const currentUser = authInstance.currentUser;
    const database = getDatabase();

    // 1. Ștergeți elementul din Firebase
    const dataRef = ref(database, "Others/Culori-Norocoase/" + dialogData.id);
    remove(dataRef);

    // Creează o nouă matrice care exclude articolul cu ID-ul specificat
    const updatedDb = localDb.filter((a) => a.id !== dialogData.id);

    // 2. Resetarea ID-urilor pentru continuitate
    const finalDb = updatedDb.map((item, index) => {
      return {
        ...item,
        id: index + 1,
      };
    });

    // // Șterge toate nodurile existente sub "Services/"
    const dbRef = ref(database, "Others/Culori-Norocoase/");
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
      `images/Others/${currentUser?.uid}/${dialogData.image.fileName}`
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

    // Actualizează starea localDb cu noua matrice filtrată
    setLocalDb(finalDb);
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

      const updateData = localDb.map(async (item) => {
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
              "Others",
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
          editData(data, "Others", "Culori-Norocoase", dialogData.id);
          return data;
        } else {
          console.log("is not found");
          return item;
        }
      });
      // Use Promise.all to wait for all promises in the map to resolve
      const updatedData = await Promise.all(updateData);
      setLocalDb([...updatedData]);
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
        "Others",
        "Culori-Norocoase"
      );

      const data = {
        id: localDb.length + 1,
        info,
        image,
        date: dateTime.date,
        time: dateTime.time,
      };

      // Folosește await pentru a aștepta finalizarea promisiunii
      await writeData(data, "Others", "Culori-Norocoase");

      let newData = localDb;

      newData.push(data);

      setLocalDb([...newData]);

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
    // console.log(localDb);
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
                db={localDb}
                handleSearchFilter={handleSearchFilter}
              />
              <TableToolbar />
              <Stack direction="column" alignItems="center">
                {isLoading ? (
                  <CircularProgress />
                ) : localDb.length === 0 ? (
                  <Typography
                    sx={{
                      fontSize: 20,
                      marginTop: 5,
                      fontWeight: "400",
                      color: "white",
                    }}
                  >
                    Nu sunt culori norocoase adaugate adăugate
                  </Typography>
                ) : (
                  <>
                    <CustomTableContainer
                      db={localDb}
                      searchedDb={searchedDb}
                      searchValue={searchValue}
                      handleShowDialog={handleShowDialog}
                      showNume={false}
                      showDesc={true}
                      sortConfig={sortConfig}
                      handleSort={handleSort}
                    />
                  </>
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
