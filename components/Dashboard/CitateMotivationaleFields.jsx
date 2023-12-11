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
import HorizontalLineWithText from "../HorizontalLineText";
import FieldRow from "./FieldRow";

export default function CitateMotivationaleFields({
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

  const [descriereRo, setDescriereRo] = useState("");
  const [descriereEn, setDescriereEn] = useState("");
  const [descriereEs, setDescriereEs] = useState("");
  const [descriereIt, setDescriereIt] = useState("");
  const [descrierePl, setDescrierePl] = useState("");
  const [descriereDe, setDescriereDe] = useState("");
  const [descriereHu, setDescriereHu] = useState("");
  const [descriereCs, setDescriereCs] = useState("");
  const [descriereSk, setDescriereSk] = useState("");
  const [descriereHr, setDescriereHr] = useState("");
  const [descriereRu, setDescriereRu] = useState("");
  const [descriereBg, setDescriereBg] = useState("");
  const [descriereEl, setDescriereEl] = useState("");
  const [descriereFr, setDescriereFr] = useState("");

  const languageFields = [
    {
      id: "descriere-ro",
      label: "Descriere ro",
      value: descriereRo,
      setValue: setDescriereRo,
    },

    {
      id: "descriere-en",
      label: "Descriere en",
      value: descriereEn,
      setValue: setDescriereEn,
    },

    {
      id: "descriere-es",
      label: "Descriere es",
      value: descriereEs,
      setValue: setDescriereEs,
    },

    {
      id: "descriere-it",
      label: "Descriere it",
      value: descriereIt,
      setValue: setDescriereIt,
    },

    {
      id: "descriere-pl",
      label: "Descriere pl",
      value: descrierePl,
      setValue: setDescrierePl,
    },

    {
      id: "descriere-de",
      label: "Descriere de",
      value: descriereDe,
      setValue: setDescriereDe,
    },

    {
      id: "descriere-hu",
      label: "Descriere hu",
      value: descriereHu,
      setValue: setDescriereHu,
    },

    {
      id: "descriere-cs",
      label: "Descriere cs",
      value: descriereCs,
      setValue: setDescriereCs,
    },

    {
      id: "descriere-sk",
      label: "Descriere sk",
      value: descriereSk,
      setValue: setDescriereSk,
    },

    {
      id: "descriere-hr",
      label: "Descriere hr",
      value: descriereHr,
      setValue: setDescriereHr,
    },

    {
      id: "descriere-ru",
      label: "Descriere ru",
      value: descriereRu,
      setValue: setDescriereRu,
    },

    {
      id: "descriere-bg",
      label: "Descriere bg",
      value: descriereBg,
      setValue: setDescriereBg,
    },

    {
      id: "descriere-el",
      label: "Descriere el",
      value: descriereEl,
      setValue: setDescriereEl,
    },

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
              {/* Add a horizontal line after each element except the last one */}
              {index < languageFields.length - 1 && (
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
