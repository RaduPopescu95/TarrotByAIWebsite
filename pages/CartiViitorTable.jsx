import React, { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import TableToolbar from "../components/ProcessTable/TableToolbar";

import IconInSelect from "../components/ProcessTable/IconInSelect";

import CustomTableContainer from "../components/ProcessTable/CustomTableContainer";
import { useStyles } from "../styles/ProcessTableStyles";
import {
  handleGetServices,
  writeEditService,
  writeServiceData,
} from "../utils/realtimeUtils";
import { getCurrentDateTime } from "../utils/timeUtils";
import { uploadImage, uploadImageServices } from "../utils/storageUtils";
import { auth, storage } from "../firebase";
import {
  getDatabase,
  ref,
  remove,
  get,
  child,
  set,
  onValue,
  update,
} from "firebase/database";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  updateMetadata, // Import this module
} from "firebase/storage";

import CustomServiceDialog from "../components/DialogBox/CustomServiceDialog";
import AddCategoriiDialog from "../components/ProcessTable/CategoriiViitor/AddCategoriiDialog";
import CategoriiViitorFields from "../components/Dashboard/CategoriiViitorFields";
import CartiViitorFields from "../components/Dashboard/CartiViitorFields";

export default function CartiViitorTable() {
  // const { db } = useMockup();
  const [isLoading, setIsLoading] = useState(false);
  const [db, setDb] = useState([]);
  const [dialogData, setDialogData] = useState({});
  const [showDialog, setShowDialog] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showAddContract, setShowAddContract] = React.useState(false);
  const [openSoloPopup, setOpenSoloPopup] = React.useState(false);
  const settingsRef = React.useRef(null);
  const classes = useStyles();

  const handleServices = async () => {
    setIsLoading(true);
    const servicesDB = await handleGetServices();

    let rawArticles = [...servicesDB.servicesArray];
    const sortedArticles = rawArticles.sort((a, b) => a.id - b.id);

    if (servicesDB) {
      setDb([...sortedArticles]);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      // Handle the case where servicesDB is undefined
      // For example, display an error message or take appropriate action
    }
  };

  const handleShowDialog = (
    id,
    title,
    metaDescription,
    image,
    tags,
    content,
    name
  ) => {
    let serviceData = {
      id,
      title,
      metaDescription,
      image,
      tags,
      content,
      name,
    };

    if (showDialog) {
      setDialogData({});
    } else {
      setDialogData(serviceData);
    }
    setShowDialog(!showDialog);
  };
  const handleShowSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleShowAddContract = () => {
    setShowAddContract(!showAddContract);
  };

  const handleDeleteArt = (id, imageFileName) => {
    const authInstance = auth;
    const currentUser = authInstance.currentUser;
    const database = getDatabase();

    // 1. Ștergeți elementul din Firebase
    const dataRef = ref(database, "Services/" + id);
    remove(dataRef);

    // Creează o nouă matrice care exclude articolul cu ID-ul specificat
    const updatedDb = db.filter((a) => a.id !== id);

    // 2. Resetarea ID-urilor pentru continuitate
    const finalDb = updatedDb.map((item, index) => {
      return {
        ...item,
        id: index + 1,
      };
    });

    // Șterge toate nodurile existente sub "Services/"
    const servicesRef = ref(database, "Services");
    set(servicesRef, {}).then(() => {
      // După ce toate nodurile sunt șterse, adaugă finalDb ca noile noduri copil
      finalDb.forEach((service) => {
        const newServiceRef = child(servicesRef, String(service.id));
        set(newServiceRef, service);
      });
    });

    // Create a reference to the file to delete
    const deletedRef = storageRef(
      storage,
      `images/services/${currentUser?.uid}/${imageFileName}`
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
  };

  const handleEditService = async (
    id,
    name,
    title,
    metaDescription,
    image,
    initialImage,
    content,
    tags,
    noNewImage
  ) => {
    try {
      let metaKeys = tags.join(", ");

      const dateTime = getCurrentDateTime();

      setShowDialog(!showDialog);
      const updateServices = db.map(async (service) => {
        if (service.id === id) {
          let updatedService;
          if (noNewImage) {
            let imgReupload = { finalUri: image, fileName: initialImage };
            updatedService = {
              id,
              name,
              title,
              metaDescription,
              content,
              date: service.date,
              time: service.time,
              updatedAtDate: dateTime.date,
              updatedAtTime: dateTime.time,
              image: imgReupload,
              tags,
              metaKeys,
            };
          } else {
            const newImage = await uploadImageServices(
              image,
              initialImage,
              false
            );
            updatedService = {
              id,
              name,
              title,
              metaDescription,
              content,
              date: service.date,
              time: service.time,
              updatedAtDate: dateTime.date,
              updatedAtTime: dateTime.time,
              image: newImage,
              tags,
              metaKeys,
            };
          }

          writeEditService(updatedService);

          return updatedService;
        } else {
          return service;
        }
      });

      // Use Promise.all to wait for all promises in the map to resolve
      const updatedServices = await Promise.all(updateServices);

      setDb([...updatedServices]);
    } catch (err) {
      console.log("Error handleEditService...", err);
    }
  };

  const handleUploadService = async (
    name,
    title,
    metaDescription,
    tags,
    image,
    content
  ) => {
    try {
      const dateTime = getCurrentDateTime();

      let metaKeys = tags.join(", ");

      const newService = {
        id: db.length + 1,
        name,
        title: title,
        metaDescription,
        tags,
        content,
        date: dateTime.date,
        time: dateTime.time,
        image,
        metaKeys,
      };

      // Folosește await pentru a aștepta finalizarea promisiunii
      await writeServiceData(newService);

      let newServices = db;

      newServices.push(newService);

      setDb([...newServices]);

      setShowAddContract(!showAddContract);
    } catch (err) {
      console.log("Error handleUploadArticle...", err);
    }
  };
  const handleShowSoloPopup = () => {
    setOpenSoloPopup(!openSoloPopup);
  };

  useEffect(() => {
    handleServices();
  }, []);

  return (
    <>
      {true ? (
        <CartiViitorFields />
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
              />
              {/* {showAddContract && (
            <AddContract
              handleShowAddContract={handleShowAddContract}
              handleUploadService={handleUploadService}
            />
          )} */}
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
                    No services added
                  </Typography>
                ) : (
                  <CustomTableContainer
                    db={db}
                    handleShowDialog={handleShowDialog}
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
    </>
  );
}
