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
import GTranslateIcon from "@mui/icons-material/GTranslate";
import { LANGUAGE_LABELS } from "../../data/constants";
import { gTranslateFetch } from "../../utils/apiUtils";

export default function CategoriiPersonalizateFields({
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
    {
      id: "nume-ro",
      label: LANGUAGE_LABELS.ro.name,
      value: numeRo,
      setValue: setNumeRo,
    },

    {
      id: "nume-en",
      label: LANGUAGE_LABELS.en.name,
      value: numeEn,
      setValue: setNumeEn,
    },

    {
      id: "nume-es",
      label: LANGUAGE_LABELS.es.name,
      value: numeEs,
      setValue: setNumeEs,
    },

    {
      id: "nume-it",
      label: LANGUAGE_LABELS.it.name,
      value: numeIt,
      setValue: setNumeIt,
    },

    {
      id: "nume-pl",
      label: LANGUAGE_LABELS.pl.name,
      value: numePl,
      setValue: setNumePl,
    },

    {
      id: "nume-de",
      label: LANGUAGE_LABELS.de.name,
      value: numeDe,
      setValue: setNumeDe,
    },

    {
      id: "nume-hu",
      label: LANGUAGE_LABELS.hi.name,
      value: numeHu,
      setValue: setNumeHu,
    },

    {
      id: "nume-cs",
      label: LANGUAGE_LABELS.cs.name,
      value: numeCs,
      setValue: setNumeCs,
    },

    {
      id: "nume-sk",
      label: LANGUAGE_LABELS.sk.name,
      value: numeSk,
      setValue: setNumeSk,
    },

    {
      id: "nume-hr",
      label: LANGUAGE_LABELS.hr.name,
      value: numeHr,
      setValue: setNumeHr,
    },

    {
      id: "nume-ru",
      label: LANGUAGE_LABELS.id.name,
      value: numeRu,
      setValue: setNumeRu,
    },

    {
      id: "nume-bg",
      label: LANGUAGE_LABELS.bg.name,
      value: numeBg,
      setValue: setNumeBg,
    },

    {
      id: "nume-el",
      label: LANGUAGE_LABELS.el.name,
      value: numeEl,
      setValue: setNumeEl,
    },

    {
      id: "nume-fr",
      label: LANGUAGE_LABELS.fr.name,
      value: numeFr,
      setValue: setNumeFr,
    },
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

  const handleToTranslate = async (numeRoValue) => {
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
      en: setNumeEn,
      es: setNumeEs,
      it: setNumeIt,
      pl: setNumePl,
      de: setNumeDe,
      hu: setNumeHu,
      cs: setNumeCs,
      sk: setNumeSk,
      hr: setNumeHr,
      ru: setNumeRu,
      bg: setNumeBg,
      el: setNumeEl,
      fr: setNumeFr,
    };

    for (let l of languages) {
      console.log(l);

      let translation;

      if (l === "hu") {
        translation = await handleTranslate(numeRoValue, "hi");
      } else if (l === "ru") {
        translation = await handleTranslate(numeRoValue, "id");
      } else {
        translation = await handleTranslate(numeRoValue, l);
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
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <FieldRow
                    id={field.id}
                    name={field.id}
                    label={field.label}
                    value={field.value}
                    onChange={(event) => field.setValue(event.target.value)}
                    widthLabel="10%"
                  />
                  {field.id === "nume-ro" && (
                    <IconButton
                      color="primary"
                      aria-label="add an alarm"
                      sx={{ position: "relative", left: 5, top: 15 }}
                      onClick={() => handleToTranslate(numeRo)}
                    >
                      {" "}
                      <GTranslateIcon />{" "}
                    </IconButton>
                  )}
                </Box>
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
