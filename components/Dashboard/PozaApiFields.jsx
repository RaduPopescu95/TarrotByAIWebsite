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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { StyledTextField } from "../../styles/FormStyles";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import HorizontalLineWithText from "../HorizontalLineText";
import ArticleEditor from "../QuillForm";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import FieldRow from "./FieldRow";
import LoadingDialog from "../DialogBox/DialogLoader";

export default function PozaApiFields({
  handleUpload,
  handleEdit,
  handleShowSettings,
  isEdit,
  dialogData,
  handleDelete,
}) {
  const [content, setContent] = useState(""); // Starea pentru conținutul articolului

  // Funcția de actualizare a conținutului editorului
  const handleContentChange = (value) => {
    setContent(value);
  };
  const [loading, setLoading] = useState(false);

  const [selectedImages, setSelectedImages] = useState([]);
  const [image, setImage] = useState(dialogData.image ? dialogData.image : "");

  const [fileInputKey, setFileInputKey] = useState(Date.now());

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

  const handleUploadData = () => {
    setLoading(true);

    const oldFileName = dialogData.image ? dialogData.image.fileName : "";
    if (isEdit) {
      handleEdit(selectedImages, image, oldFileName).then(() => {
        setLoading(false);
      });
    } else {
      handleUpload(selectedImages).then(() => {
        setLoading(false);
      });
    }
  };

  const theme = useTheme();

  return (
    <>
      <Grid container spacing={2} sx={{ padding: 1 }}>
        <>
          <Grid
            item
            xs={12}
            sx={{
              width: "100%",

              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {isEdit && (
              <Button
                variant="outlined"
                onClick={handleDelete}
                style={{
                  position: "relative",
                  top: 10,
                  right: 10,
                  marginRight: 10,
                }}
              >
                Șterge
              </Button>
            )}
            <Button
              variant="text"
              onClick={handleShowSettings}
              style={{
                position: "relative",
                top: 10,
                right: 10,
              }}
            >
              Închide
            </Button>
          </Grid>
          <Grid item xs={12} sx={{ width: "100%", marginBottom: 1 }}>
            <HorizontalLineWithText text={"Setări Media"} />
          </Grid>

          <Box
            style={{
              width: "100%",
              paddingRight: "3%",
              paddingLeft: "3%",
              paddingBottom: "3%",
              paddingTop: "3%",
              backgroundColor: "#2B2B2B",
              marginRight: "2%",
              marginLeft: "2%",
              borderRadius: "1%",
            }}
          >
            <Grid
              item
              xs={12}
              sx={{
                width: selectedImages.length > 0 || image ? "100%" : "100%",
                height: "auto",
                position: "relative",
              }}
            >
              {selectedImages.length > 0 ? (
                <div
                  style={{
                    width: "100%",
                  }}
                >
                  {selectedImages.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        position: "relative",

                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        display: "flex",
                      }}
                    >
                      <img
                        src={URL.createObjectURL(item)}
                        alt={`Image ${index + 1}`}
                        loading="lazy"
                        style={{
                          maxWidth: "100%",

                          objectFit: "contain",
                          // height:"400px"
                          maxHeight: "400px",
                        }}
                      />
                      <Fab
                        size="small"
                        color="secondary"
                        aria-label="delete"
                        onClick={() => handleImageDelete(index)}
                        sx={{ position: "relative", bottom: 190, right: 25 }}
                      >
                        <DeleteIcon />
                      </Fab>
                    </div>
                  ))}
                </div>
              ) : image ? (
                <div>
                  <div
                    style={{
                      position: "relative",

                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      display: "flex",
                    }}
                  >
                    <img
                      src={image.finalUri}
                      alt={`Image`}
                      loading="lazy"
                      style={{
                        maxWidth: "100%",

                        objectFit: "contain",
                        // height:"400px"
                        maxHeight: "400px",
                      }}
                    />
                    <Fab
                      size="small"
                      color="secondary"
                      aria-label="delete"
                      onClick={() => handleImageDelete()}
                      sx={{ position: "relative", bottom: 190, right: 25 }}
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
                  <p style={{ color: "white" }}>Select Images</p>
                </label>
              )}
            </Grid>
          </Box>

          <Box
            sx={{
              width: "100%",

              marginTop: 2,
              justifyContent: "flex-end",
              display: "flex",
              paddingRight: "2%",
            }}
          >
            {isEdit ? (
              <Button
                variant="contained"
                onClick={handleUploadData}
                style={{ marginRight: 10 }}
              >
                {" "}
                Actualizează
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleUploadData}
                style={{ marginRight: 10 }}
              >
                {" "}
                Salvează
              </Button>
            )}
            <Button variant="outlined" onClick={handleShowSettings}>
              Cancel
            </Button>
          </Box>
          <LoadingDialog loading={loading} setLoading={setLoading} />
        </>
      </Grid>
    </>
  );
}
