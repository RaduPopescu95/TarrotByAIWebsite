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

export default function CuloriNorocoaseFields({
  articleData,
  handleEditArticle,
}) {
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

  const [numeRo, setNumeRo] = useState("");
  const [descriereRo, setDescriereRo] = useState("");
  const [numeEn, setNumeEn] = useState("");
  const [descriereEn, setDescriereEn] = useState("");
  const [numeEs, setNumeEs] = useState("");
  const [descriereEs, setDescriereEs] = useState("");
  const [numeIt, setNumeIt] = useState("");
  const [descriereIt, setDescriereIt] = useState("");
  const [numePl, setNumePl] = useState("");
  const [descrierePl, setDescrierePl] = useState("");
  const [numeDe, setNumeDe] = useState("");
  const [descriereDe, setDescriereDe] = useState("");
  const [numeHu, setNumeHu] = useState("");
  const [descriereHu, setDescriereHu] = useState("");
  const [numeCs, setNumeCs] = useState("");
  const [descriereCs, setDescriereCs] = useState("");
  const [numeSk, setNumeSk] = useState("");
  const [descriereSk, setDescriereSk] = useState("");
  const [numeHr, setNumeHr] = useState("");
  const [descriereHr, setDescriereHr] = useState("");
  const [numeRu, setNumeRu] = useState("");
  const [descriereRu, setDescriereRu] = useState("");
  const [numeBg, setNumeBg] = useState("");
  const [descriereBg, setDescriereBg] = useState("");
  const [numeEl, setNumeEl] = useState("");
  const [descriereEl, setDescriereEl] = useState("");
  const [numeFr, setNumeFr] = useState("");
  const [descriereFr, setDescriereFr] = useState("");

  const languageFields = [
    { id: "nume-ro", label: "Nume ro", value: numeRo, setValue: setNumeRo },
    {
      id: "descriere-ro",
      label: "Descriere ro",
      value: descriereRo,
      setValue: setDescriereRo,
    },
    { id: "nume-en", label: "Nume en", value: numeEn, setValue: setNumeEn },
    {
      id: "descriere-en",
      label: "Descriere en",
      value: descriereEn,
      setValue: setDescriereEn,
    },
    { id: "nume-es", label: "Nume es", value: numeEs, setValue: setNumeEs },
    {
      id: "descriere-es",
      label: "Descriere es",
      value: descriereEs,
      setValue: setDescriereEs,
    },
    { id: "nume-it", label: "Nume it", value: numeIt, setValue: setNumeIt },
    {
      id: "descriere-it",
      label: "Descriere it",
      value: descriereIt,
      setValue: setDescriereIt,
    },
    { id: "nume-pl", label: "Nume pl", value: numePl, setValue: setNumePl },
    {
      id: "descriere-pl",
      label: "Descriere pl",
      value: descrierePl,
      setValue: setDescrierePl,
    },
    { id: "nume-de", label: "Nume de", value: numeDe, setValue: setNumeDe },
    {
      id: "descriere-de",
      label: "Descriere de",
      value: descriereDe,
      setValue: setDescriereDe,
    },
    { id: "nume-hu", label: "Nume hu", value: numeHu, setValue: setNumeHu },
    {
      id: "descriere-hu",
      label: "Descriere hu",
      value: descriereHu,
      setValue: setDescriereHu,
    },
    { id: "nume-cs", label: "Nume cs", value: numeCs, setValue: setNumeCs },
    {
      id: "descriere-cs",
      label: "Descriere cs",
      value: descriereCs,
      setValue: setDescriereCs,
    },
    { id: "nume-sk", label: "Nume sk", value: numeSk, setValue: setNumeSk },
    {
      id: "descriere-sk",
      label: "Descriere sk",
      value: descriereSk,
      setValue: setDescriereSk,
    },
    { id: "nume-hr", label: "Nume hr", value: numeHr, setValue: setNumeHr },
    {
      id: "descriere-hr",
      label: "Descriere hr",
      value: descriereHr,
      setValue: setDescriereHr,
    },
    { id: "nume-ru", label: "Nume ru", value: numeRu, setValue: setNumeRu },
    {
      id: "descriere-ru",
      label: "Descriere ru",
      value: descriereRu,
      setValue: setDescriereRu,
    },
    { id: "nume-bg", label: "Nume bg", value: numeBg, setValue: setNumeBg },
    {
      id: "descriere-bg",
      label: "Descriere bg",
      value: descriereBg,
      setValue: setDescriereBg,
    },
    { id: "nume-el", label: "Nume el", value: numeEl, setValue: setNumeEl },
    {
      id: "descriere-el",
      label: "Descriere el",
      value: descriereEl,
      setValue: setDescriereEl,
    },
    { id: "nume-fr", label: "Nume fr", value: numeFr, setValue: setNumeFr },
    {
      id: "descriere-fr",
      label: "Descriere fr",
      value: descriereFr,
      setValue: setDescriereFr,
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
