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

export default function CategoriiViitorFields({
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
  const [numeEn, setNumeEn] = useState("");
  const [numeEs, setNumeEs] = useState("");
  const [numeIt, setNumeIt] = useState("");
  const [numePl, setNumePl] = useState("");
  const [numeDe, setNumeDe] = useState("");
  const [numeHu, setNumeHu] = useState("");
  const [numeCs, setNumeCs] = useState("");
  const [numeSk, setNumeSk] = useState("");
  const [numeHr, setNumeHr] = useState("");
  const [numeRu, setNumeRu] = useState("");
  const [numeBg, setNumeBg] = useState("");
  const [numeEl, setNumeEl] = useState("");
  const [numeFr, setNumeFr] = useState("");

  const languageFields = [
    { id: "nume-ro", label: "Nume ro", value: numeRo, setValue: setNumeRo },

    { id: "nume-en", label: "Nume en", value: numeEn, setValue: setNumeEn },

    { id: "nume-es", label: "Nume es", value: numeEs, setValue: setNumeEs },

    { id: "nume-it", label: "Nume it", value: numeIt, setValue: setNumeIt },

    { id: "nume-pl", label: "Nume pl", value: numePl, setValue: setNumePl },

    { id: "nume-de", label: "Nume de", value: numeDe, setValue: setNumeDe },

    { id: "nume-hu", label: "Nume hu", value: numeHu, setValue: setNumeHu },

    { id: "nume-cs", label: "Nume cs", value: numeCs, setValue: setNumeCs },

    { id: "nume-sk", label: "Nume sk", value: numeSk, setValue: setNumeSk },

    { id: "nume-hr", label: "Nume hr", value: numeHr, setValue: setNumeHr },

    { id: "nume-ru", label: "Nume ru", value: numeRu, setValue: setNumeRu },

    { id: "nume-bg", label: "Nume bg", value: numeBg, setValue: setNumeBg },

    { id: "nume-el", label: "Nume el", value: numeEl, setValue: setNumeEl },

    { id: "nume-fr", label: "Nume fr", value: numeFr, setValue: setNumeFr },
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
