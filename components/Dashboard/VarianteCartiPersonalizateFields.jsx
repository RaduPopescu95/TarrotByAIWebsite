import React, { useEffect, useState } from "react";
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
import DropdownFieldRow from "./DropdownFieldRow";

export default function VarianteCartiViitorFields({
  handleUpload,
  handleEdit,
  handleShowSettings,
  isEdit,
  dialogData,
  handleDelete,
  carti,
  categorii,
  firebaseDb,
}) {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [categorie, setCategorie] = useState(
    dialogData.categorie ? dialogData.categorie : {}
  );
  const [carte, setCarte] = useState(dialogData.carte ? dialogData.carte : {});

  const handleChange = (item, tip) => {
    console.log("Asdas", tip);
    console.log(item);
    if (tip === "Categorie") {
      console.log("categorie...");
      setCategorie(item);
    } else if (tip === "Carti") {
      console.log("carte...");
      setCarte(item);
    }
  };

  const [content, setContent] = useState(""); // Starea pentru conținutul articolului

  // Funcția de actualizare a conținutului editorului
  const handleContentChange = (value) => {
    setContent(value);
  };
  const [loading, setLoading] = useState(false);

  const [selectedImages, setSelectedImages] = useState([]);
  const [image, setImage] = useState(dialogData.image ? dialogData.image : "");

  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const [videoRo, setVideoRo] = useState(
    dialogData.info
      ? dialogData.info.ro.video
      : `variation-${firebaseDb.length + 1}-lang-ro`
  );
  const [descriereRo, setDescriereRo] = useState(
    dialogData.info ? dialogData.info.ro.descriere : ``
  );
  const [videoEn, setVideoEn] = useState(
    dialogData.info
      ? dialogData.info.en.video
      : `variation-${firebaseDb.length + 1}-lang-en`
  );
  const [descriereEn, setDescriereEn] = useState(
    dialogData.info ? dialogData.info.en.descriere : ``
  );
  const [videoEs, setVideoEs] = useState(
    dialogData.info
      ? dialogData.info.es.video
      : `variation-${firebaseDb.length + 1}-lang-es`
  );
  const [descriereEs, setDescriereEs] = useState(
    dialogData.info ? dialogData.info.es.descriere : ``
  );
  const [videoIt, setVideoIt] = useState(
    dialogData.info
      ? dialogData.info.it.video
      : `variation-${firebaseDb.length + 1}-lang-it`
  );
  const [descriereIt, setDescriereIt] = useState(
    dialogData.info ? dialogData.info.it.descriere : ``
  );
  const [videoPl, setVideoPl] = useState(
    dialogData.info
      ? dialogData.info.pl.video
      : `variation-${firebaseDb.length + 1}-lang-pl`
  );
  const [descrierePl, setDescrierePl] = useState(
    dialogData.info ? dialogData.info.pl.descriere : ``
  );
  const [videoDe, setVideoDe] = useState(
    dialogData.info
      ? dialogData.info.de.video
      : `variation-${firebaseDb.length + 1}-lang-de`
  );
  const [descriereDe, setDescriereDe] = useState(
    dialogData.info ? dialogData.info.de.descriere : ``
  );
  const [videoHu, setVideoHu] = useState(
    dialogData.info
      ? dialogData.info.hu.video
      : `variation-${firebaseDb.length + 1}-lang-hu`
  );
  const [descriereHu, setDescriereHu] = useState(
    dialogData.info ? dialogData.info.hu.descriere : ``
  );
  const [videoCs, setVideoCs] = useState(
    dialogData.info
      ? dialogData.info.cs.video
      : `variation-${firebaseDb.length + 1}-lang-cs`
  );
  const [descriereCs, setDescriereCs] = useState(
    dialogData.info ? dialogData.info.cs.descriere : ``
  );
  const [videoSk, setVideoSk] = useState(
    dialogData.info
      ? dialogData.info.sk.video
      : `variation-${firebaseDb.length + 1}-lang-sk`
  );
  const [descriereSk, setDescriereSk] = useState(
    dialogData.info ? dialogData.info.sk.descriere : ``
  );
  const [videoHr, setVideoHr] = useState(
    dialogData.info
      ? dialogData.info.hr.video
      : `variation-${firebaseDb.length + 1}-lang-hr`
  );
  const [descriereHr, setDescriereHr] = useState(
    dialogData.info ? dialogData.info.hr.descriere : ``
  );
  const [videoRu, setVideoRu] = useState(
    dialogData.info
      ? dialogData.info.ru.video
      : `variation-${firebaseDb.length + 1}-lang-ru`
  );
  const [descriereRu, setDescriereRu] = useState(
    dialogData.info ? dialogData.info.ru.descriere : ``
  );
  const [videoBg, setVideoBg] = useState(
    dialogData.info
      ? dialogData.info.bg.video
      : `variation-${firebaseDb.length + 1}-lang-bg`
  );
  const [descriereBg, setDescriereBg] = useState(
    dialogData.info ? dialogData.info.bg.descriere : ``
  );
  const [videoEl, setVideoEl] = useState(
    dialogData.info
      ? dialogData.info.el.video
      : `variation-${firebaseDb.length + 1}-lang-el`
  );
  const [descriereEl, setDescriereEl] = useState(
    dialogData.info ? dialogData.info.el.descriere : ``
  );
  const [videoFr, setVideoFr] = useState(
    dialogData.info
      ? dialogData.info.fr.video
      : `variation-${firebaseDb.length + 1}-lang-fr`
  );
  const [descriereFr, setDescriereFr] = useState(
    dialogData.info ? dialogData.info.fr.descriere : ``
  );

  const languageFields = [
    {
      id: "video-ro",
      label: "Video ro",
      value: videoRo,
      setValue: setVideoRo,
    },
    {
      id: "descriere-ro",
      label: "Descriere ro",
      value: descriereRo,
      setValue: setDescriereRo,
    },
    {
      id: "video-en",
      label: "Video en",
      value: videoEn,
      setValue: setVideoEn,
    },
    {
      id: "descriere-en",
      label: "Descriere en",
      value: descriereEn,
      setValue: setDescriereEn,
    },
    {
      id: "video-es",
      label: "Video es",
      value: videoEs,
      setValue: setVideoEs,
    },
    {
      id: "descriere-es",
      label: "Descriere es",
      value: descriereEs,
      setValue: setDescriereEs,
    },
    {
      id: "video-it",
      label: "Video it",
      value: videoIt,
      setValue: setVideoIt,
    },
    {
      id: "descriere-it",
      label: "Descriere it",
      value: descriereIt,
      setValue: setDescriereIt,
    },
    {
      id: "video-pl",
      label: "Video pl",
      value: videoPl,
      setValue: setVideoPl,
    },
    {
      id: "descriere-pl",
      label: "Descriere pl",
      value: descrierePl,
      setValue: setDescrierePl,
    },
    {
      id: "video-de",
      label: "Video de",
      value: videoDe,
      setValue: setVideoDe,
    },
    {
      id: "descriere-de",
      label: "Descriere de",
      value: descriereDe,
      setValue: setDescriereDe,
    },
    {
      id: "video-hu",
      label: "Video hu",
      value: videoHu,
      setValue: setVideoHu,
    },
    {
      id: "descriere-hu",
      label: "Descriere hu",
      value: descriereHu,
      setValue: setDescriereHu,
    },
    {
      id: "video-cs",
      label: "Video cs",
      value: videoCs,
      setValue: setVideoCs,
    },
    {
      id: "descriere-cs",
      label: "Descriere cs",
      value: descriereCs,
      setValue: setDescriereCs,
    },
    {
      id: "video-sk",
      label: "Video sk",
      value: videoSk,
      setValue: setVideoSk,
    },
    {
      id: "descriere-sk",
      label: "Descriere sk",
      value: descriereSk,
      setValue: setDescriereSk,
    },
    {
      id: "video-hr",
      label: "Video hr",
      value: videoHr,
      setValue: setVideoHr,
    },
    {
      id: "descriere-hr",
      label: "Descriere hr",
      value: descriereHr,
      setValue: setDescriereHr,
    },
    {
      id: "video-ru",
      label: "Video ru",
      value: videoRu,
      setValue: setVideoRu,
    },
    {
      id: "descriere-ru",
      label: "Descriere ru",
      value: descriereRu,
      setValue: setDescriereRu,
    },
    {
      id: "video-bg",
      label: "Video bg",
      value: videoBg,
      setValue: setVideoBg,
    },
    {
      id: "descriere-bg",
      label: "Descriere bg",
      value: descriereBg,
      setValue: setDescriereBg,
    },
    {
      id: "video-el",
      label: "Video el",
      value: videoEl,
      setValue: setVideoEl,
    },
    {
      id: "descriere-el",
      label: "Descriere el",
      value: descriereEl,
      setValue: setDescriereEl,
    },
    {
      id: "video-fr",
      label: "Video fr",
      value: videoFr,
      setValue: setVideoFr,
    },
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
      ro: { video: videoRo, descriere: descriereRo },
      en: { video: videoEn, descriere: descriereEn },
      es: { video: videoEs, descriere: descriereEs },
      it: { video: videoIt, descriere: descriereIt },
      pl: { video: videoPl, descriere: descrierePl },
      de: { video: videoDe, descriere: descriereDe },
      hu: { video: videoHu, descriere: descriereHu },
      cs: { video: videoCs, descriere: descriereCs },
      sk: { video: videoSk, descriere: descriereSk },
      hr: { video: videoHr, descriere: descriereHr },
      ru: { video: videoRu, descriere: descriereRu },
      bg: { video: videoBg, descriere: descriereBg },
      el: { video: videoEl, descriere: descriereEl },
      fr: { video: videoFr, descriere: descriereFr },
    };
    console.log("start...");
    console.log(categorie);
    console.log(carte);

    if (isEdit) {
      handleEdit(data, categorie, carte).then(() => {
        setLoading(false);
      });
    } else {
      handleUpload(data, categorie, carte).then(() => {
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
                  isVideo={field.id.includes("video")}
                />
                {index % 2 === 1 && index < languageFields.length - 1 && (
                  <HorizontalLineWithText style={{ marginTop: "3%" }} />
                )}
              </React.Fragment>
            ))}
            <Grid
              item
              xs={12}
              sx={{ width: "100%", marginTop: 2, marginBottom: 1 }}
            >
              <HorizontalLineWithText />
            </Grid>

            <DropdownFieldRow
              id="language-select"
              name="language"
              label="Carti"
              value={carte.id}
              onChange={handleChange}
              widthLabel="11.5%"
              options={carti}
              placeHolder="Carti"
            />
            <Grid
              item
              xs={12}
              sx={{ width: "100%", marginTop: 2, marginBottom: 1 }}
            >
              <HorizontalLineWithText />
            </Grid>

            <DropdownFieldRow
              id="language-select"
              name="language"
              label="Categorie"
              value={categorie.id}
              onChange={handleChange}
              widthLabel="11.5%"
              options={categorii}
              placeHolder="Categorie"
            />
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
