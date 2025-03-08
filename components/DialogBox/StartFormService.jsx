import React, { useState } from "react";
import {
  Typography,
  TextField,
  Grid,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  ImageList,
  ImageListItem,
  Fab,
  Box,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { StyledTextField } from "../../styles/FormStyles";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import HorizontalLineWithText from "../HorizontalLineText";
import ServiceEditor from "../QuillForm";
import AddCircleIcon from "@mui/icons-material/AddCircle";

export default function StartFormService({ serviceData, handleEditService }) {
  const [content, setContent] = useState(
    serviceData.content ? serviceData.content : ""
  ); // Starea pentru conținutul articolului

  // Funcția de actualizare a conținutului editorului
  const handleContentChange = (value) => {
    setContent(value);
  };

  const [name, setName] = useState(serviceData.name ? serviceData.name : "");
  const [title, setTitle] = useState(
    serviceData.title ? serviceData.title : ""
  );
  const [metaDescription, setMetaDescription] = useState(
    serviceData.metaDescription ? serviceData.metaDescription : ""
  );

  const [selectedImages, setSelectedImages] = useState([]);
  const [image, setImage] = useState(
    serviceData.image.finalUri ? serviceData.image.finalUri : ""
  );
  const [tags, setTags] = useState(serviceData.tags ? serviceData.tags : []);

  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const [tagInput, setTagInput] = useState("");

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

  const handleSave = () => {
    console.log("serviceData................");
    console.log(serviceData);
    let img;
    let initialImage = serviceData.image.fileName;

    if (selectedImages.length > 0) {
      console.log("Selected images are over 0....");
      img = selectedImages;
      handleEditService(
        serviceData.id,
        name,
        title,
        metaDescription,
        img,
        initialImage,
        content,
        tags,
        false
      );
    } else {
      console.log("Selected images are NOT over 0....");
      img = image;
      let noNewImage = true;
      handleEditService(
        serviceData.id,
        name,
        title,
        metaDescription,
        img,
        initialImage,
        content,
        tags,
        true
      );
    }
  };

  const handleImageDelete = (index) => {
    const updatedImages = [...selectedImages];
    updatedImages.splice(index, 1);
    setSelectedImages(updatedImages);
    setImage("");
  };

  const handleImageChange = (event) => {
    const files = event.target.files;
    setSelectedImages([...selectedImages, ...Array.from(files)]);
    setFileInputKey(Date.now()); // Reset the input to allow selecting more images
  };

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sx={{ width: "100%", marginTop: 2, marginBottom: 1 }}>
        <HorizontalLineWithText text={"Setări Media"} />
      </Grid>
      <Grid
        item
        xs={12}
        sx={{
          width: selectedImages.length > 0 || image ? "50%" : "100%",
          height: "auto",
          position: "relative",
        }}
      >
        {selectedImages.length > 0 ? (
          <div style={{ width: "50%" }}>
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
        ) : image ? (
          <div>
            <div style={{ marginBottom: "20px", position: "relative" }}>
                <img
                  src={image}
                  alt={`Image`}
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
                    onClick={() => handleImageDelete(image)}
                    sx={{ position: "relative", bottom: 40, right: 5 }}
                  >
                    <DeleteIcon />
                  </Fab>
            </div>
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
            <input
              key={fileInputKey}
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            <AddPhotoAlternateIcon sx={{ fontSize: 48, color: "#ccc" }} />
            <p>Select Images</p>
          </label>
        )}
      </Grid>

      <Grid item xs={12} sx={{ width: "100%", marginTop: 2 }}>
        <HorizontalLineWithText text={"Setări Principale"} />
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 2 }}>
        <StyledTextField
          id="Name"
          name="Name"
          label="Name"
          fullWidth
          autoComplete="Name"
          variant="outlined"
          sx={{ borderRadius: 8 }}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 2 }}>
        <StyledTextField
          id="Title"
          name="Title"
          label="Title"
          fullWidth
          autoComplete="Title"
          variant="outlined"
          sx={{ borderRadius: 8 }}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 2 }}>
        <TextField
          id="MetaDescription"
          name="MetaDescription"
          label="MetaDescription"
          fullWidth
          autoComplete="MetaDescription"
          variant="outlined"
          multiline
          rows={10}
          sx={{ borderRadius: 8 }}
          value={metaDescription}
          onChange={(event) => {
            setMetaDescription(event.target.value);
          }}
        />
      </Grid>

      <Grid item xs={12} sx={{ width: "100%", marginTop: 3, marginBottom: 2 }}>
        <HorizontalLineWithText text={"Setări de Conținut"} />
      </Grid>
      <Grid item xs={12} sx={{ width: "100%" }}>
        <ServiceEditor
          content={content}
          handleContentChange={handleContentChange}
        />
      </Grid>
      <Grid item xs={12} sx={{ width: "100%" }}>
        <TextField
          margin="normal"
          fullWidth
          id="Tags"
          label="Tags"
          name="Tags"
          autoComplete="Tags"
          autoFocus
          sx={{ mb: 2, mt: isMobile ? 10 : 0 }}
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
      </Grid>
      <Grid item xs={12} sx={{ width: "100%" }}>
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
      </Grid>
      <Grid item xs={12}>
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 10 }}
        >
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="secondary"
            sx={{
              mt: 3,
              mb: 2,
              mr: 1,
              width: "138px",
              textTransform: "capitalize",
            }}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </Grid>
    </Grid>
  );
}
