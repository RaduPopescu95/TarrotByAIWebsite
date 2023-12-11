import React, { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import TableToolbar from "../components/ProcessTable/TableToolbar";

// import * as styles from "../styles/ProcessTableStyles";
import CustomDialog from "../components/DialogBox/CustomDialog";

import IconInSelect from "../components/ProcessTable/IconInSelect";
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
import CustomTableContainer from "../components/ProcessTable/CustomTableContainer";
import { useStyles } from "../styles/ProcessTableStyles";
import {
  handleGetArticles,
  writeArticleData,
  writeEditArticle,
} from "../utils/realtimeUtils";
import { getCurrentDateTime } from "../utils/timeUtils";
import { uploadImage } from "../utils/storageUtils";
import { auth, storage } from "../firebase";

import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  updateMetadata, // Import this module
} from "firebase/storage";
import AddArticleDialog from "../components/ProcessTable/AddArticleDialog";

export default function ProcessTable() {
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

  const handleArticles = async () => {
    setIsLoading(true);
    const articlesDB = await handleGetArticles();

    let rawArticles = [...articlesDB.articlesArray];
    const sortedArticles = rawArticles.sort((a, b) => a.id - b.id);

    if (articlesDB) {
      setDb([...sortedArticles]);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      // Handle the case where articlesDB is undefined
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
    let articleData = {
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
      setDialogData(articleData);
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
    const dataRef = ref(database, "Articles/" + id);
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

    // Șterge toate nodurile existente sub "Articles/"
    const articlesRef = ref(database, "Articles");
    set(articlesRef, {}).then(() => {
      // După ce toate nodurile sunt șterse, adaugă finalDb ca noile noduri copil
      finalDb.forEach((article) => {
        const newArticleRef = child(articlesRef, String(article.id));
        set(newArticleRef, article);
      });
    });

    // Create a reference to the file to delete
    const deletedRef = storageRef(
      storage,
      `images/articles/${currentUser?.uid}/${imageFileName}`
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

  const handleEditArticle = async (
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
      const updateArticles = db.map(async (article) => {
        if (article.id === id) {
          let updatedArticle;
          if (noNewImage) {
            let imgReupload = { finalUri: image, fileName: initialImage };
            updatedArticle = {
              id,
              name,
              title,
              metaDescription,
              content,
              date: article.date,
              time: article.time,
              updatedAtDate: dateTime.date,
              updatedAtTime: dateTime.time,
              image: imgReupload,
              tags,
              metaKeys,
            };
          } else {
            const newImage = await uploadImage(image, initialImage, false);
            updatedArticle = {
              id,
              name,
              title,
              metaDescription,
              content,
              date: article.date,
              time: article.time,
              updatedAtDate: dateTime.date,
              updatedAtTime: dateTime.time,
              image: newImage,
              tags,
              metaKeys,
            };
          }

          writeEditArticle(updatedArticle);

          return updatedArticle;
        } else {
          return article;
        }
      });

      // Use Promise.all to wait for all promises in the map to resolve
      const updatedArticles = await Promise.all(updateArticles);

      setDb([...updatedArticles]);
    } catch (err) {
      console.log("Error handleEditArticle...", err);
    }
  };

  const handleUploadArticle = async (
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

      const newArticle = {
        id: db.length + 1,
        name,
        title,
        metaDescription,
        tags,
        content,
        date: dateTime.date,
        time: dateTime.time,
        image,
        metaKeys,
      };

      // Folosește await pentru a aștepta finalizarea promisiunii
      await writeArticleData(newArticle);

      let newArticles = db;

      newArticles.push(newArticle);

      setDb([...newArticles]);

      setShowAddContract(!showAddContract);
    } catch (err) {
      console.log("Error handleUploadArticle...", err);
    }
  };

  const handleShowSoloPopup = () => {
    setOpenSoloPopup(!openSoloPopup);
  };

  useEffect(() => {
    handleArticles();
  }, []);

  return (
    <>
      {showDialog && (
        <CustomDialog
          handleShowDialog={handleShowDialog}
          articleData={dialogData}
          handleEditArticle={handleEditArticle}
          handleDeleteArt={handleDeleteArt}
        />
      )}
      {showAddContract && (
        <AddArticleDialog
          handleShowAddContract={handleShowAddContract}
          handleUploadArticle={handleUploadArticle}
          showAddContract={showAddContract}
        />
      )}

      <Box component="main" className={classes.mainBox}>
        <Box>
          <TableToolbar
            isMainToolbar={true}
            handleShowSettings={handleShowSettings}
            handleShowAddContract={handleShowAddContract}
            handleShowSoloPopup={handleShowSoloPopup}
            settingsRef={settingsRef}
            db={db}
            toolbarTitle={"Articles"}
          />
          {/* {showAddContract && (
            <AddContract
              handleShowAddContract={handleShowAddContract}
              handleUploadArticle={handleUploadArticle}
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
                No articles added
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
  );
}
