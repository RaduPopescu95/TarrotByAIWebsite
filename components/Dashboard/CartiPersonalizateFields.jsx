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

export default function CartiViitorFields({
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
  const [descriereRo, setDescriereRo] = useState(
    dialogData.info ? dialogData.info.ro.descriere : ""
  );
  const [numeEn, setNumeEn] = useState(
    dialogData.info ? dialogData.info.en.nume : ""
  );
  const [descriereEn, setDescriereEn] = useState(
    dialogData.info ? dialogData.info.en.descriere : ""
  );
  const [numeEs, setNumeEs] = useState(
    dialogData.info ? dialogData.info.es.nume : ""
  );
  const [descriereEs, setDescriereEs] = useState(
    dialogData.info ? dialogData.info.es.descriere : ""
  );
  const [numeIt, setNumeIt] = useState(
    dialogData.info ? dialogData.info.it.nume : ""
  );
  const [descriereIt, setDescriereIt] = useState(
    dialogData.info ? dialogData.info.it.descriere : ""
  );
  const [numePl, setNumePl] = useState(
    dialogData.info ? dialogData.info.pl.nume : ""
  );
  const [descrierePl, setDescrierePl] = useState(
    dialogData.info ? dialogData.info.pl.descriere : ""
  );
  const [numeDe, setNumeDe] = useState(
    dialogData.info ? dialogData.info.de.nume : ""
  );
  const [descriereDe, setDescriereDe] = useState(
    dialogData.info ? dialogData.info.de.descriere : ""
  );
  const [numeHu, setNumeHu] = useState(
    dialogData.info ? dialogData.info.hu.nume : ""
  );
  const [descriereHu, setDescriereHu] = useState(
    dialogData.info ? dialogData.info.hu.descriere : ""
  );
  const [numeCs, setNumeCs] = useState(
    dialogData.info ? dialogData.info.cs.nume : ""
  );
  const [descriereCs, setDescriereCs] = useState(
    dialogData.info ? dialogData.info.cs.descriere : ""
  );
  const [numeSk, setNumeSk] = useState(
    dialogData.info ? dialogData.info.sk.nume : ""
  );
  const [descriereSk, setDescriereSk] = useState(
    dialogData.info ? dialogData.info.sk.descriere : ""
  );
  const [numeHr, setNumeHr] = useState(
    dialogData.info ? dialogData.info.hr.nume : ""
  );
  const [descriereHr, setDescriereHr] = useState(
    dialogData.info ? dialogData.info.hr.descriere : ""
  );
  const [numeRu, setNumeRu] = useState(
    dialogData.info ? dialogData.info.ru.nume : ""
  );
  const [descriereRu, setDescriereRu] = useState(
    dialogData.info ? dialogData.info.ru.descriere : ""
  );
  const [numeBg, setNumeBg] = useState(
    dialogData.info ? dialogData.info.bg.nume : ""
  );
  const [descriereBg, setDescriereBg] = useState(
    dialogData.info ? dialogData.info.bg.descriere : ""
  );
  const [numeEl, setNumeEl] = useState(
    dialogData.info ? dialogData.info.el.nume : ""
  );
  const [descriereEl, setDescriereEl] = useState(
    dialogData.info ? dialogData.info.el.descriere : ""
  );
  const [numeFr, setNumeFr] = useState(
    dialogData.info ? dialogData.info.fr.nume : ""
  );
  const [descriereFr, setDescriereFr] = useState(
    dialogData.info ? dialogData.info.fr.descriere : ""
  );

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
    const data = {
      ro: { nume: numeRo, descriere: descriereRo },
      en: { nume: numeEn, descriere: descriereEn },
      es: { nume: numeEs, descriere: descriereEs },
      it: { nume: numeIt, descriere: descriereIt },
      pl: { nume: numePl, descriere: descrierePl },
      de: { nume: numeDe, descriere: descriereDe },
      hu: { nume: numeHu, descriere: descriereHu },
      cs: { nume: numeCs, descriere: descriereCs },
      sk: { nume: numeSk, descriere: descriereSk },
      hr: { nume: numeHr, descriere: descriereHr },
      ru: { nume: numeRu, descriere: descriereRu },
      bg: { nume: numeBg, descriere: descriereBg },
      el: { nume: numeEl, descriere: descriereEl },
      fr: { nume: numeFr, descriere: descriereFr },
    };
    console.log(data);
    console.log("image...", dialogData.images);

    const oldFileName = dialogData.image ? dialogData.image.fileName : "";
    if (isEdit) {
      handleEdit(data, selectedImages, image, oldFileName).then(() => {
        setLoading(false);
      });
    } else {
      handleUpload(data, selectedImages).then(() => {
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
