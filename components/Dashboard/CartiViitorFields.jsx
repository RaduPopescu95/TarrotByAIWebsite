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

export default function CartiViitorFields({ articleData, handleEditArticle }) {
  const [content, setContent] = useState(""); // Starea pentru conținutul articolului

  // Funcția de actualizare a conținutului editorului
  const handleContentChange = (value) => {
    setContent(value);
  };

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [selectedImages, setSelectedImages] = useState([]);
  const [image, setImage] = useState("");
  const [tags, setTags] = useState([]);

  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const [tagInput, setTagInput] = useState("");

  const [nameRo, setNameRo] = useState("");
  const [descriptionRo, setDescriptionRo] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [nameEs, setNameEs] = useState("");
  const [descriptionEs, setDescriptionEs] = useState("");
  const [nameIt, setNameIt] = useState("");
  const [descriptionIt, setDescriptionIt] = useState("");
  const [namePl, setNamePl] = useState("");
  const [descriptionPl, setDescriptionPl] = useState("");
  const [nameDe, setNameDe] = useState("");
  const [descriptionDe, setDescriptionDe] = useState("");
  const [nameHu, setNameHu] = useState("");
  const [descriptionHu, setDescriptionHu] = useState("");
  const [nameCs, setNameCs] = useState("");
  const [descriptionCs, setDescriptionCs] = useState("");
  const [nameSk, setNameSk] = useState("");
  const [descriptionSk, setDescriptionSk] = useState("");
  const [nameHr, setNameHr] = useState("");
  const [descriptionHr, setDescriptionHr] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [nameBg, setNameBg] = useState("");
  const [descriptionBg, setDescriptionBg] = useState("");
  const [nameEl, setNameEl] = useState("");
  const [descriptionEl, setDescriptionEl] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [descriptionFr, setDescriptionFr] = useState("");

  const languageFields = [
    { id: "name-ro", label: "Nume ro", value: nameRo, setValue: setNameRo },
    {
      id: "description-ro",
      label: "Descriere ro",
      value: descriptionRo,
      setValue: setDescriptionRo,
    },
    { id: "name-en", label: "Nume en", value: nameEn, setValue: setNameEn },
    {
      id: "description-en",
      label: "Descriere en",
      value: descriptionEn,
      setValue: setDescriptionEn,
    },
    { id: "name-es", label: "Nume es", value: nameEs, setValue: setNameEs },
    {
      id: "description-es",
      label: "Descriere es",
      value: descriptionEs,
      setValue: setDescriptionEs,
    },
    { id: "name-it", label: "Nume it", value: nameIt, setValue: setNameIt },
    {
      id: "description-it",
      label: "Descriere it",
      value: descriptionIt,
      setValue: setDescriptionIt,
    },
    { id: "name-pl", label: "Nume pl", value: namePl, setValue: setNamePl },
    {
      id: "description-pl",
      label: "Descriere pl",
      value: descriptionPl,
      setValue: setDescriptionPl,
    },
    { id: "name-de", label: "Nume de", value: nameDe, setValue: setNameDe },
    {
      id: "description-de",
      label: "Descriere de",
      value: descriptionDe,
      setValue: setDescriptionDe,
    },
    { id: "name-hu", label: "Nume hu", value: nameHu, setValue: setNameHu },
    {
      id: "description-hu",
      label: "Descriere hu",
      value: descriptionHu,
      setValue: setDescriptionHu,
    },
    { id: "name-cs", label: "Nume cs", value: nameCs, setValue: setNameCs },
    {
      id: "description-cs",
      label: "Descriere cs",
      value: descriptionCs,
      setValue: setDescriptionCs,
    },
    { id: "name-sk", label: "Nume sk", value: nameSk, setValue: setNameSk },
    {
      id: "description-sk",
      label: "Descriere sk",
      value: descriptionSk,
      setValue: setDescriptionSk,
    },
    { id: "name-hr", label: "Nume hr", value: nameHr, setValue: setNameHr },
    {
      id: "description-hr",
      label: "Descriere hr",
      value: descriptionHr,
      setValue: setDescriptionHr,
    },
    { id: "name-ru", label: "Nume ru", value: nameRu, setValue: setNameRu },
    {
      id: "description-ru",
      label: "Descriere ru",
      value: descriptionRu,
      setValue: setDescriptionRu,
    },
    { id: "name-bg", label: "Nume bg", value: nameBg, setValue: setNameBg },
    {
      id: "description-bg",
      label: "Descriere bg",
      value: descriptionBg,
      setValue: setDescriptionBg,
    },
    { id: "name-el", label: "Nume el", value: nameEl, setValue: setNameEl },
    {
      id: "description-el",
      label: "Descriere el",
      value: descriptionEl,
      setValue: setDescriptionEl,
    },
    { id: "name-fr", label: "Nume fr", value: nameFr, setValue: setNameFr },
    {
      id: "description-fr",
      label: "Descriere fr",
      value: descriptionFr,
      setValue: setDescriptionFr,
    },
  ];

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
    console.log("articleData................");
    console.log(articleData);
    let img;
    let initialImage = articleData.image.fileName;

    if (selectedImages.length > 0) {
      console.log("Selected images are over 0....");
      img = selectedImages;
      handleEditArticle(
        articleData.id,
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
      handleEditArticle(
        articleData.id,
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
    <>
      <Grid container spacing={2} sx={{ padding: 1 }}>
        <Grid
          item
          xs={12}
          sx={{ width: "100%", marginTop: 2, marginBottom: 1 }}
        >
          <HorizontalLineWithText text={"Setări Media"} />
        </Grid>

        <Box
          style={{
            width: "100%",
            paddingRight: "3%",
            paddingLeft: "3%",
            paddingBottom: "3%",
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
                        maxHeight: "400px",
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
                      maxHeight: "400px",
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
                <p style={{ color: "white" }}>Select Images</p>
              </label>
            )}
          </Grid>
        </Box>
        <Grid
          item
          xs={12}
          sx={{ width: "100%", marginTop: 2, marginBottom: 1 }}
        >
          <HorizontalLineWithText text={"Setări Principale"} />
        </Grid>

        <Box
          style={{
            width: "100%",
            paddingRight: "3%",
            paddingLeft: "3%",
            paddingBottom: "3%",
            backgroundColor: "#2B2B2B",
            marginRight: "2%",
            marginLeft: "2%",
            borderRadius: "1%",
          }}
        >
          {languageFields.map((field, index) => (
            <React.Fragment key={field.id}>
              <FieldRow
                id={field.id}
                name={field.id}
                label={field.label}
                value={field.value}
                onChange={(event) => field.setValue(event.target.value)}
                widthLabel="10%"
              />
              {index % 2 === 1 && index < languageFields.length - 1 && (
                <HorizontalLineWithText style={{ marginTop: "3%" }} />
              )}
            </React.Fragment>
          ))}
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
          <Button variant="contained" style={{ marginRight: 10 }}>
            {" "}
            Contained
          </Button>
          <Button variant="outlined">Outlined</Button>
        </Box>
      </Grid>
    </>
  );
}
