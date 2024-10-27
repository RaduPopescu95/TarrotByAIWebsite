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
import GTranslateIcon from "@mui/icons-material/GTranslate";
import { StyledTextField } from "../../styles/FormStyles";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import HorizontalLineWithText from "../HorizontalLineText";
import ArticleEditor from "../QuillForm";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import FieldRow from "./FieldRow";
import LoadingDialog from "../DialogBox/DialogLoader";
import DropdownFieldRow from "./DropdownFieldRow";
import { LANGUAGE_LABELS } from "../../data/constants";
import { gTranslateFetch } from "../../utils/apiUtils";

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
  noDelete,
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

  const nr = dialogData.info ? dialogData.id : firebaseDb.length + 1;

  const [videoRo, setVideoRo] = useState(`variation-${nr}-lang-ro`);
  const [descriereRo, setDescriereRo] = useState(
    dialogData.info ? dialogData.info.ro.descriere : ``
  );
  const [videoEn, setVideoEn] = useState(`variation-${nr}-lang-en`);
  const [descriereEn, setDescriereEn] = useState(
    dialogData.info ? dialogData.info.en.descriere : ``
  );
  const [videoEs, setVideoEs] = useState(`variation-${nr}-lang-es`);
  const [descriereEs, setDescriereEs] = useState(
    dialogData.info ? dialogData.info.es.descriere : ``
  );
  const [videoIt, setVideoIt] = useState(`variation-${nr}-lang-it`);
  const [descriereIt, setDescriereIt] = useState(
    dialogData.info ? dialogData.info.it.descriere : ``
  );
  const [videoPl, setVideoPl] = useState(`variation-${nr}-lang-pl`);
  const [descrierePl, setDescrierePl] = useState(
    dialogData.info ? dialogData.info.pl.descriere : ``
  );
  const [videoDe, setVideoDe] = useState(`variation-${nr}-lang-de`);
  const [descriereDe, setDescriereDe] = useState(
    dialogData.info ? dialogData.info.de.descriere : ``
  );
  const [videoHu, setVideoHu] = useState(`variation-${nr}-lang-hu`);
  const [descriereHu, setDescriereHu] = useState(
    dialogData.info ? dialogData.info.hu.descriere : ``
  );
  const [videoCs, setVideoCs] = useState(`variation-${nr}-lang-cs`);
  const [descriereCs, setDescriereCs] = useState(
    dialogData.info ? dialogData.info.cs.descriere : ``
  );
  const [videoSk, setVideoSk] = useState(`variation-${nr}-lang-sk`);
  const [descriereSk, setDescriereSk] = useState(
    dialogData.info ? dialogData.info.sk.descriere : ``
  );
  const [videoHr, setVideoHr] = useState(`variation-${nr}-lang-hr`);
  const [descriereHr, setDescriereHr] = useState(
    dialogData.info ? dialogData.info.hr.descriere : ``
  );
  const [videoRu, setVideoRu] = useState(`variation-${nr}-lang-ru`);
  const [descriereRu, setDescriereRu] = useState(
    dialogData.info ? dialogData.info.ru.descriere : ``
  );
  const [videoBg, setVideoBg] = useState(`variation-${nr}-lang-bg`);
  const [descriereBg, setDescriereBg] = useState(
    dialogData.info ? dialogData.info.bg.descriere : ``
  );
  const [videoEl, setVideoEl] = useState(`variation-${nr}-lang-el`);
  const [descriereEl, setDescriereEl] = useState(
    dialogData.info ? dialogData.info.el.descriere : ``
  );
  const [videoFr, setVideoFr] = useState(`variation-${nr}-lang-fr`);
  const [descriereFr, setDescriereFr] = useState(
    dialogData.info ? dialogData.info.fr.descriere : ``
  );

  const languageFields = [
    {
      id: "video-ro",
      label: LANGUAGE_LABELS.ro.video,
      value: videoRo,
      setValue: setVideoRo,
    },
    {
      id: "descriere-ro",
      label: LANGUAGE_LABELS.ro.description,
      value: descriereRo,
      setValue: setDescriereRo,
    },
    {
      id: "video-en",
      label: LANGUAGE_LABELS.en.video,
      value: videoEn,
      setValue: setVideoEn,
    },
    {
      id: "descriere-en",
      label: LANGUAGE_LABELS.en.description,
      value: descriereEn,
      setValue: setDescriereEn,
    },
    {
      id: "video-es",
      label: LANGUAGE_LABELS.es.video,
      value: videoEs,
      setValue: setVideoEs,
    },
    {
      id: "descriere-es",
      label: LANGUAGE_LABELS.es.description,
      value: descriereEs,
      setValue: setDescriereEs,
    },
    {
      id: "video-it",
      label: LANGUAGE_LABELS.it.video,
      value: videoIt,
      setValue: setVideoIt,
    },
    {
      id: "descriere-it",
      label: LANGUAGE_LABELS.it.description,
      value: descriereIt,
      setValue: setDescriereIt,
    },
    {
      id: "video-pl",
      label: LANGUAGE_LABELS.pl.video,
      value: videoPl,
      setValue: setVideoPl,
    },
    {
      id: "descriere-pl",
      label: LANGUAGE_LABELS.pl.description,
      value: descrierePl,
      setValue: setDescrierePl,
    },
    {
      id: "video-de",
      label: LANGUAGE_LABELS.de.video,
      value: videoDe,
      setValue: setVideoDe,
    },
    {
      id: "descriere-de",
      label: LANGUAGE_LABELS.de.description,
      value: descriereDe,
      setValue: setDescriereDe,
    },
    {
      id: "video-hu",
      label: LANGUAGE_LABELS.hi.video,
      value: videoHu,
      setValue: setVideoHu,
    },
    {
      id: "descriere-hu",
      label: LANGUAGE_LABELS.hi.description,
      value: descriereHu,
      setValue: setDescriereHu,
    },
    {
      id: "video-cs",
      label: LANGUAGE_LABELS.cs.video,
      value: videoCs,
      setValue: setVideoCs,
    },
    {
      id: "descriere-cs",
      label: LANGUAGE_LABELS.cs.description,
      value: descriereCs,
      setValue: setDescriereCs,
    },
    {
      id: "video-sk",
      label: LANGUAGE_LABELS.sk.video,
      value: videoSk,
      setValue: setVideoSk,
    },
    {
      id: "descriere-sk",
      label: LANGUAGE_LABELS.sk.description,
      value: descriereSk,
      setValue: setDescriereSk,
    },
    {
      id: "video-hr",
      label: LANGUAGE_LABELS.hr.video,
      value: videoHr,
      setValue: setVideoHr,
    },
    {
      id: "descriere-hr",
      label: LANGUAGE_LABELS.hr.description,
      value: descriereHr,
      setValue: setDescriereHr,
    },
    {
      id: "video-ru",
      label: LANGUAGE_LABELS.id.video,
      value: videoRu,
      setValue: setVideoRu,
    },
    {
      id: "descriere-ru",
      label: LANGUAGE_LABELS.id.description,
      value: descriereRu,
      setValue: setDescriereRu,
    },
    {
      id: "video-bg",
      label: LANGUAGE_LABELS.bg.video,
      value: videoBg,
      setValue: setVideoBg,
    },
    {
      id: "descriere-bg",
      label: LANGUAGE_LABELS.bg.description,
      value: descriereBg,
      setValue: setDescriereBg,
    },
    {
      id: "video-el",
      label: LANGUAGE_LABELS.el.video,
      value: videoEl,
      setValue: setVideoEl,
    },
    {
      id: "descriere-el",
      label: LANGUAGE_LABELS.el.description,
      value: descriereEl,
      setValue: setDescriereEl,
    },
    {
      id: "video-fr",
      label: LANGUAGE_LABELS.fr.video,
      value: videoFr,
      setValue: setVideoFr,
    },
    {
      id: "descriere-fr",
      label: LANGUAGE_LABELS.fr.description,
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
      ro: {
        video: videoRo,
        descriere: descriereRo,
        url: dialogData.info ? dialogData.info.ro.url : "",
        _id: dialogData.info ? dialogData.info.ro._id : "",
        isRendering: false,
      },
      en: {
        video: videoEn,
        descriere: descriereEn,
        url: dialogData.info ? dialogData.info.en.url : "",
        _id: dialogData.info ? dialogData.info.en._id : "",
        isRendering: false,
      },
      es: {
        video: videoEs,
        descriere: descriereEs,
        url: dialogData.info ? dialogData.info.es.url : "",
        _id: dialogData.info ? dialogData.info.es._id : "",
        isRendering: false,
      },
      it: {
        video: videoIt,
        descriere: descriereIt,
        url: dialogData.info ? dialogData.info.it.url : "",
        _id: dialogData.info ? dialogData.info.it._id : "",
        isRendering: false,
      },
      pl: {
        video: videoPl,
        descriere: descrierePl,
        url: dialogData.info ? dialogData.info.pl.url : "",
        _id: dialogData.info ? dialogData.info.pl._id : "",
        isRendering: false,
      },
      de: {
        video: videoDe,
        descriere: descriereDe,
        url: dialogData.info ? dialogData.info.de.url : "",
        _id: dialogData.info ? dialogData.info.de._id : "",
        isRendering: false,
      },
      hu: {
        video: videoHu,
        descriere: descriereHu,
        url: dialogData.info ? dialogData.info.hu.url : "",
        _id: dialogData.info ? dialogData.info.hu._id : "",
        isRendering: false,
      },
      cs: {
        video: videoCs,
        descriere: descriereCs,
        url: dialogData.info ? dialogData.info.cs.url : "",
        _id: dialogData.info ? dialogData.info.cs._id : "",
        isRendering: false,
      },
      sk: {
        video: videoSk,
        descriere: descriereSk,
        url: dialogData.info ? dialogData.info.sk.url : "",
        _id: dialogData.info ? dialogData.info.sk._id : "",
        isRendering: false,
      },
      hr: {
        video: videoHr,
        descriere: descriereHr,
        url: dialogData.info ? dialogData.info.hr.url : "",
        _id: dialogData.info ? dialogData.info.hr._id : "",
        isRendering: false,
      },
      ru: {
        video: videoRu,
        descriere: descriereRu,
        url: dialogData.info ? dialogData.info.ru.url : "",
        _id: dialogData.info ? dialogData.info.ru._id : "",
        isRendering: false,
      },
      bg: {
        video: videoBg,
        descriere: descriereBg,
        url: dialogData.info ? dialogData.info.bg.url : "",
        _id: dialogData.info ? dialogData.info.bg._id : "",
        isRendering: false,
      },
      el: {
        video: videoEl,
        descriere: descriereEl,
        url: dialogData.info ? dialogData.info.el.url : "",
        _id: dialogData.info ? dialogData.info.el._id : "",
        isRendering: false,
      },
      fr: {
        video: videoFr,
        descriere: descriereFr,
        url: dialogData.info ? dialogData.info.fr.url : "",
        _id: dialogData.info ? dialogData.info.fr._id : "",
        isRendering: false,
      },
    };
    console.log("start...");
    console.log(dialogData.info);

    if (isEdit) {
      console.log("Edit...");
      handleEdit(data, categorie, carte).then(() => {
        setLoading(false);
      });
    } else {
      console.log("Upload...");
      handleUpload(data, categorie, carte).then(() => {
        setLoading(false);
      });
    }
  };

  const theme = useTheme();

  // HANDLE TRANSLATE PAGE ON SCREEN AND GENERATE ELAI.IO FOR OTHER LANGUAGES THAT ARE NOT GENERATED
  const handleTranslate = async (text, target) => {
    try {
      const res = await gTranslateFetch(text, target);
      return res;
    } catch (err) {
      console.error("Error on translate.....:", err);
      // Handle error (e.g., show error message to user)
    }
  };

  //START THE DATA THAT NEESD TO TRANSLATE AND

  const handleToTranslate = async (descriereRoValue) => {
    const languages = [
      // "en",
      // "es",
      "it",
      "pl",
      "de",
      "hu",
      "cs",
      "sk",
      "hr",
      "ru",
      "bg",
      "el",
      "fr",
    ];

    // Creăm un obiect de mapare pentru funcțiile set
    const setFunctions = {
      en: setDescriereEn,
      es: setDescriereEs,
      it: setDescriereIt,
      pl: setDescrierePl,
      de: setDescriereDe,
      hu: setDescriereHu,
      cs: setDescriereCs,
      sk: setDescriereSk,
      hr: setDescriereHr,
      ru: setDescriereRu,
      bg: setDescriereBg,
      el: setDescriereEl,
      fr: setDescriereFr,
    };

    for (let l of languages) {
      console.log(l);

      let translation;

      if (l === "hu") {
        translation = await handleTranslate(descriereRoValue, "hi");
      } else if (l === "ru") {
        translation = await handleTranslate(descriereRoValue, "id");
      } else {
        translation = await handleTranslate(descriereRoValue, l);
      }

      // console.log("translation", translation);
      if (translation) {
        console.log("language round...", l);
        console.log("translation", translation);

        // Verificăm dacă există o funcție de setare corespunzătoare și actualizăm starea

        if (setFunctions[l]) {
          setFunctions[l](translation);
        }
      }
    }
  };

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
            {isEdit && !noDelete && (
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
                {field.id === "descriere-ro" && (
                  <IconButton
                    color="primary"
                    aria-label="add an alarm"
                    sx={{ position: "relative", left: 5, top: 15 }}
                    onClick={() => handleToTranslate(descriereRo)}
                  >
                    {" "}
                    <GTranslateIcon />{" "}
                  </IconButton>
                )}
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
              id="Carti-select"
              name="Carti"
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
              id="Categorie-select"
              name="Categorie"
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
