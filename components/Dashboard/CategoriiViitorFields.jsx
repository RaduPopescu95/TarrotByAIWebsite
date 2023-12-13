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

export default function CategoriiViitorFields({
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

  const [numeRo, setNumeRo] = useState(
    dialogData.info ? dialogData.info.ro.nume : ""
  );

  const [numeEn, setNumeEn] = useState(
    dialogData.info ? dialogData.info.en.nume : ""
  );

  const [numeEs, setNumeEs] = useState(
    dialogData.info ? dialogData.info.es.nume : ""
  );

  const [numeIt, setNumeIt] = useState(
    dialogData.info ? dialogData.info.it.nume : ""
  );

  const [numePl, setNumePl] = useState(
    dialogData.info ? dialogData.info.pl.nume : ""
  );

  const [numeDe, setNumeDe] = useState(
    dialogData.info ? dialogData.info.de.nume : ""
  );

  const [numeHu, setNumeHu] = useState(
    dialogData.info ? dialogData.info.hu.nume : ""
  );

  const [numeCs, setNumeCs] = useState(
    dialogData.info ? dialogData.info.cs.nume : ""
  );

  const [numeSk, setNumeSk] = useState(
    dialogData.info ? dialogData.info.sk.nume : ""
  );

  const [numeHr, setNumeHr] = useState(
    dialogData.info ? dialogData.info.hr.nume : ""
  );

  const [numeRu, setNumeRu] = useState(
    dialogData.info ? dialogData.info.ru.nume : ""
  );

  const [numeBg, setNumeBg] = useState(
    dialogData.info ? dialogData.info.bg.nume : ""
  );

  const [numeEl, setNumeEl] = useState(
    dialogData.info ? dialogData.info.el.nume : ""
  );

  const [numeFr, setNumeFr] = useState(
    dialogData.info ? dialogData.info.fr.nume : ""
  );

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

  const handleUploadData = () => {
    setLoading(true);
    const data = {
      ro: { nume: numeRo },
      en: { nume: numeEn },
      es: { nume: numeEs },
      it: { nume: numeIt },
      pl: { nume: numePl },
      de: { nume: numeDe },
      hu: { nume: numeHu },
      cs: { nume: numeCs },
      sk: { nume: numeSk },
      hr: { nume: numeHr },
      ru: { nume: numeRu },
      bg: { nume: numeBg },
      el: { nume: numeEl },
      fr: { nume: numeFr },
    };
    console.log(data);

    if (isEdit) {
      console.log("start edit...");
      handleEdit(data).then(() => {
        setLoading(false);
      });
    } else {
      handleUpload(data).then(() => {
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
