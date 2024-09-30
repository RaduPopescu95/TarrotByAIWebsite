import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Typography,
  Toolbar,
  AppBar,
  Slide,
  TextField,
  ImageList,
  ImageListItem,
  Fab,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import HorizontalLineWithText from "../HorizontalLineText";
import ArticleEditor from "../QuillForm";
import { uploadImage } from "../../utils/storageUtils";
import AddCircleIcon from "@mui/icons-material/AddCircle";

export default function AddArticleDialog(props) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [content, setContent] = useState(""); // Starea pentru conținutul articolului
  const [imageNotValid, setImageNotValid] = useState(false);

  const alertStyle = {
    position: "fixed",
    bottom: 10, // Distanța de la marginea de jos a paginii
    left: "50%", // O poziționează pe orizontală la mijloc
    transform: "translateX(-50%)", // O aliniază la mijlocul paginii
    maxWidth: "90%", // Lățime maximă pentru alerta
  };

  // Funcția de actualizare a conținutului editorului
  const handleContentChange = (value) => {
    setContent(value);
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = () => {
    if (tagInput.trim() === "") return;
    setTags([...tags, tagInput.trim()]);
    setTagInput("");
  };

  const handleDeleteTag = (tagToDelete) => {
    const updatedTags = tags.filter((tag) => tag !== tagToDelete);
    setTags(updatedTags);
  };

  // const isImageValid = (image) => {
  //   return image.width === 1440 && image.height === 482;
  // };

  const handleSubmit = async (event) => {
    try {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      let name = data.get("Name");
      let title = data.get("title");
      let metaDescription = data.get("Metadescription");

      // Verificare dimensiuni imagine
      // const imageElement = new Image();
      // imageElement.src = selectedImages[0]
      //   ? URL.createObjectURL(selectedImages[0])
      //   : "";
      // imageElement.onload = () => {
      //   if (!isImageValid(imageElement)) {
      //     console.log("Imaginea trebuie să aibă dimensiunile: 1440 x 482");
      //     setImageNotValid(true);
      //     // Setăm o întârziere de 3 secunde pentru a reseta imaginea invalidă
      //     setTimeout(() => {
      //       setImageNotValid(false);
      //     }, 3000); // 3000 milisecunde (3 secunde)
      //   } else {
      // După ce imaginea este validată, executați următoarele acțiuni

      props.handleShowAddContract();
      if (selectedImages.length > 0) {
        uploadImage(selectedImages, "", true).then((image) => {
          if (image && image.finalUri) {
            props.handleUploadArticle(
              name,
              title,
              metaDescription,
              tags,
              image,
              content
            );
          } else {
            console.log(
              "Imaginea nu a fost încărcată sau a fost o eroare la încărcare."
            );
          }
        });
      }

      //   }
      // };
    } catch (err) {
      console.log("Error at handleSubmit add article...", err);
    }
  };

  const handleImageChange = (event) => {
    const files = event.target.files;
    if (files) {
      setSelectedImages([...selectedImages, ...Array.from(files)]);
      setFileInputKey(Date.now());
    }
  };

  const handleImageDelete = (index) => {
    const updatedImages = [...selectedImages];
    updatedImages.splice(index, 1);
    setSelectedImages(updatedImages);
  };

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      fullScreen
      open={props.showAddContract}
      onClose={props.handleShowAddContract}
      TransitionComponent={Slide}
      sx={{ overflowY: "auto" }}
    >
      <AppBar sx={{ position: "relative", backgroundColor: "#303030" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={props.handleShowAddContract}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Add article
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: "16px",
          overflowY: "auto",
          maxHeight: "calc(100vh - 64px)",
        }}
      >
        <Box sx={{ width: "100%", marginTop: 2, marginBottom: 2 }}>
          <HorizontalLineWithText text={"Setări Media"} />
        </Box>
        <Box
          sx={{
            width: selectedImages.length > 0 ? "50%" : "100%",
            height: "auto",
            position: "relative",
          }}
        >
          <input
            key={fileInputKey}
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          {selectedImages.length > 0 ? (
            <div>
              {selectedImages.map((item, index) => (
                <div
                  key={index}
                  style={{ marginBottom: "20px", position: "relative" }}
                >
                  <img
                    src={URL.createObjectURL(item)}
                    alt={`Image ${index + 1}`}
                    loading="lazy"
                    style={{
                      maxWidth: "100%",

                      objectFit: "contain",
                      // height:"400px"
                      maxHeight:"400px"
                    }}
                  />
                  <Fab
                    size="small"
                    color="secondary"
                    aria-label="delete"
                    onClick={() => handleImageDelete(index)}
                    sx={{ position: "relative", bottom: 40, right: 5 }}
                  >
                    <DeleteIcon />
                  </Fab>
                </div>
              ))}
            </div>
          ) : (
            <label
              htmlFor="image-upload"
              style={{
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                display: "block",
                marginBottom: 2,
                marginTop: 15,
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 48, color: "#ccc" }} />
              <p>Select Image</p>
            </label>
          )}
        </Box>

        <Box sx={{ width: "100%", marginTop: 6, marginBottom: 2 }}>
          <HorizontalLineWithText text={"Setări Principale"} />
        </Box>
        <TextField
          margin="normal"
          fullWidth
          id="Name"
          label="Name"
          name="Name"
          autoComplete="Name"
          autoFocus
          sx={{ mb: 2 }}
        />
        <TextField
          margin="normal"
          fullWidth
          id="title"
          label="Title"
          name="title"
          autoComplete="title"
          autoFocus
          sx={{ mb: 2 }}
        />
        <TextField
          margin="normal"
          fullWidth
          name="Metadescription"
          label="Meta description"
          id="Metadescription"
          autoComplete="Metadescription"
          multiline
          rows={4}
          sx={{ mb: 2 }}
        />
        <Box sx={{ width: "100%", marginTop: 4, marginBottom: 4 }}>
          <HorizontalLineWithText text={"Setări de Conținut"} />
        </Box>
        <ArticleEditor
          content={content}
          handleContentChange={handleContentChange}
        />
        <TextField
          margin="normal"
          fullWidth
          id="Tags"
          label="Tags"
          name="Tags"
          autoComplete="Tags"
          autoFocus
          sx={{ mb: 2, mt: isMobile ? 10 : 5 }}
          value={tagInput}
          onChange={handleTagInputChange}
          InputProps={{
            endAdornment: (
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddTag}
                style={{
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  minWidth: "auto",
                }}
              >
                <AddCircleIcon />
              </Button>
            ),
          }}
        />
        <Box sx={{ display: "flex", flexWrap: "wrap" }}>
          {tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              onDelete={() => handleDeleteTag(tag)}
              sx={{ margin: 0.5 }}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={props.handleShowAddContract}
            sx={{ mt: 2, mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Save
          </Button>
        </Box>
      </Box>
      {imageNotValid && (
        <Alert severity="warning" sx={alertStyle}>
          Image must have the dimensions width 1440 & height 482
        </Alert>
      )}
    </Dialog>
  );
}
