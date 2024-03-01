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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { LANGUAGE_LABELS } from "../../data/constants";
import { gTranslateFetch } from "../../utils/apiUtils";
import DropdownFieldRow from "./DropdownFieldRow";
import DropdownFieldCategorii from "./DropdownFieldCategorii";

export default function BlogArticoleFields({
  handleUpload,
  handleEdit,
  handleShowSettings,
  isEdit,
  dialogData,
  handleDelete,
}) {
  // Funcția de actualizare a conținutului editorului
  const handleContentChange = (value) => {
    setContent(value);
  };
  const [loading, setLoading] = useState(false);

  const [selectedImages, setSelectedImages] = useState([]);
  const [image, setImage] = useState(dialogData.image ? dialogData.image : "");
  const [youtubeLink, setYoutubeLink] = useState(
    dialogData.youtubeLinks ? dialogData.youtubeLinks.join("; ") : ""
  );
  const [categorie, setCategorie] = useState(
    dialogData.categorie ? dialogData.categorie : ""
  );

  const [fileInputKey, setFileInputKey] = useState(Date.now());

  //---RO---
  const [numeRo, setNumeRo] = useState(
    dialogData.info ? dialogData.info.ro.nume : ""
  );
  const [descriereRo, setDescriereRo] = useState(
    dialogData.info ? dialogData.info.ro.descriere : ""
  );
  const [contentRo, setContentRo] = useState(
    dialogData.info ? dialogData.info.ro.content : ""
  );

  //---EN---
  const [numeEn, setNumeEn] = useState(
    dialogData.info ? dialogData.info.en.nume : ""
  );
  const [descriereEn, setDescriereEn] = useState(
    dialogData.info ? dialogData.info.en.descriere : ""
  );
  const [contentEn, setContentEn] = useState(
    dialogData.info ? dialogData.info.en.content : ""
  );

  //---ES---
  const [numeEs, setNumeEs] = useState(
    dialogData.info ? dialogData.info.es.nume : ""
  );
  const [descriereEs, setDescriereEs] = useState(
    dialogData.info ? dialogData.info.es.descriere : ""
  );
  const [contentEs, setContentEs] = useState(
    dialogData.info ? dialogData.info.es.content : ""
  );

  //---IT---
  const [numeIt, setNumeIt] = useState(
    dialogData.info ? dialogData.info.it.nume : ""
  );
  const [descriereIt, setDescriereIt] = useState(
    dialogData.info ? dialogData.info.it.descriere : ""
  );
  const [contentIt, setContentIt] = useState(
    dialogData.info ? dialogData.info.it.content : ""
  );

  //---PL---
  const [numePl, setNumePl] = useState(
    dialogData.info ? dialogData.info.pl.nume : ""
  );
  const [descrierePl, setDescrierePl] = useState(
    dialogData.info ? dialogData.info.pl.descriere : ""
  );
  const [contentPl, setContentPl] = useState(
    dialogData.info ? dialogData.info.pl.content : ""
  );

  //---DE---
  const [numeDe, setNumeDe] = useState(
    dialogData.info ? dialogData.info.de.nume : ""
  );
  const [descriereDe, setDescriereDe] = useState(
    dialogData.info ? dialogData.info.de.descriere : ""
  );
  const [contentDe, setContentDe] = useState(
    dialogData.info ? dialogData.info.de.content : ""
  );

  //---HU care este HI---
  const [numeHu, setNumeHu] = useState(
    dialogData.info ? dialogData.info.hu.nume : ""
  );
  const [descriereHu, setDescriereHu] = useState(
    dialogData.info ? dialogData.info.hu.descriere : ""
  );
  const [contentHu, setContentHu] = useState(
    dialogData.info ? dialogData.info.hu.content : ""
  );

  //---CS---
  const [numeCs, setNumeCs] = useState(
    dialogData.info ? dialogData.info.cs.nume : ""
  );
  const [descriereCs, setDescriereCs] = useState(
    dialogData.info ? dialogData.info.cs.descriere : ""
  );
  const [contentCs, setContentCs] = useState(
    dialogData.info ? dialogData.info.cs.content : ""
  );

  //---SK---
  const [numeSk, setNumeSk] = useState(
    dialogData.info ? dialogData.info.sk.nume : ""
  );
  const [descriereSk, setDescriereSk] = useState(
    dialogData.info ? dialogData.info.sk.descriere : ""
  );
  const [contentSk, setContentSk] = useState(
    dialogData.info ? dialogData.info.sk.content : ""
  );

  //---HR---
  const [numeHr, setNumeHr] = useState(
    dialogData.info ? dialogData.info.hr.nume : ""
  );
  const [descriereHr, setDescriereHr] = useState(
    dialogData.info ? dialogData.info.hr.descriere : ""
  );
  const [contentHr, setContentHr] = useState(
    dialogData.info ? dialogData.info.hr.content : ""
  );

  //---RU care este ID---
  const [numeRu, setNumeRu] = useState(
    dialogData.info ? dialogData.info.ru.nume : ""
  );
  const [descriereRu, setDescriereRu] = useState(
    dialogData.info ? dialogData.info.ru.descriere : ""
  );
  const [contentRu, setContentRu] = useState(
    dialogData.info ? dialogData.info.ru.content : ""
  );

  //---BG---
  const [numeBg, setNumeBg] = useState(
    dialogData.info ? dialogData.info.bg.nume : ""
  );
  const [descriereBg, setDescriereBg] = useState(
    dialogData.info ? dialogData.info.bg.descriere : ""
  );
  const [contentBg, setContentBg] = useState(
    dialogData.info ? dialogData.info.bg.content : ""
  );

  //---EL---
  const [numeEl, setNumeEl] = useState(
    dialogData.info ? dialogData.info.el.nume : ""
  );
  const [descriereEl, setDescriereEl] = useState(
    dialogData.info ? dialogData.info.el.descriere : ""
  );
  const [contentEl, setContentEl] = useState(
    dialogData.info ? dialogData.info.el.content : ""
  );

  //---FR---
  const [numeFr, setNumeFr] = useState(
    dialogData.info ? dialogData.info.fr.nume : ""
  );
  const [descriereFr, setDescriereFr] = useState(
    dialogData.info ? dialogData.info.fr.descriere : ""
  );
  const [contentFr, setContentFr] = useState(
    dialogData.info ? dialogData.info.fr.content : ""
  );

  const languageFields = [
    // Română
    {
      id: "nume-ro",
      label: LANGUAGE_LABELS.ro.name,
      value: numeRo,
      setValue: setNumeRo,
      denumire: LANGUAGE_LABELS.ro.denumire,
    },
    {
      id: "descriere-ro",
      label: LANGUAGE_LABELS.ro.description,
      value: descriereRo,
      setValue: setDescriereRo,
      denumire: LANGUAGE_LABELS.ro.denumire,
    },
    {
      id: "content-ro",
      label: LANGUAGE_LABELS.ro.content,
      value: contentRo,
      setValue: setContentRo,
      denumire: LANGUAGE_LABELS.ro.denumire,
    },
    // Engleză
    {
      id: "nume-en",
      label: LANGUAGE_LABELS.en.name,
      value: numeEn,
      setValue: setNumeEn,
      denumire: LANGUAGE_LABELS.en.denumire,
    },
    {
      id: "descriere-en",
      label: LANGUAGE_LABELS.en.description,
      value: descriereEn,
      setValue: setDescriereEn,
      denumire: LANGUAGE_LABELS.en.denumire,
    },
    {
      id: "content-en",
      label: LANGUAGE_LABELS.en.content,
      value: contentEn,
      setValue: setContentEn,
      denumire: LANGUAGE_LABELS.en.denumire,
    },
    // Spaniolă
    {
      id: "nume-es",
      label: LANGUAGE_LABELS.es.name,
      value: numeEs,
      setValue: setNumeEs,
      denumire: LANGUAGE_LABELS.es.denumire,
    },
    {
      id: "descriere-es",
      label: LANGUAGE_LABELS.es.description,
      value: descriereEs,
      setValue: setDescriereEs,
      denumire: LANGUAGE_LABELS.es.denumire,
    },
    {
      id: "content-es",
      label: LANGUAGE_LABELS.es.content,
      value: contentEs,
      setValue: setContentEs,
      denumire: LANGUAGE_LABELS.es.denumire,
    },
    // Italiană
    {
      id: "nume-it",
      label: LANGUAGE_LABELS.it.name,
      value: numeIt,
      setValue: setNumeIt,
      denumire: LANGUAGE_LABELS.it.denumire,
    },
    {
      id: "descriere-it",
      label: LANGUAGE_LABELS.it.description,
      value: descriereIt,
      setValue: setDescriereIt,
      denumire: LANGUAGE_LABELS.it.denumire,
    },
    {
      id: "content-it",
      label: LANGUAGE_LABELS.it.content,
      value: contentIt,
      setValue: setContentIt,
      denumire: LANGUAGE_LABELS.it.denumire,
    },
    // Poloneză
    {
      id: "nume-pl",
      label: LANGUAGE_LABELS.pl.name,
      value: numePl,
      setValue: setNumePl,
      denumire: LANGUAGE_LABELS.pl.denumire,
    },
    {
      id: "descriere-pl",
      label: LANGUAGE_LABELS.pl.description,
      value: descrierePl,
      setValue: setDescrierePl,
      denumire: LANGUAGE_LABELS.pl.denumire,
    },
    {
      id: "content-pl",
      label: LANGUAGE_LABELS.pl.content,
      value: contentPl,
      setValue: setContentPl,
      denumire: LANGUAGE_LABELS.pl.denumire,
    },
    // Germană
    {
      id: "nume-de",
      label: LANGUAGE_LABELS.de.name,
      value: numeDe,
      setValue: setNumeDe,
      denumire: LANGUAGE_LABELS.de.denumire,
    },
    {
      id: "descriere-de",
      label: LANGUAGE_LABELS.de.description,
      value: descriereDe,
      setValue: setDescriereDe,
      denumire: LANGUAGE_LABELS.de.denumire,
    },
    {
      id: "content-de",
      label: LANGUAGE_LABELS.de.content,
      value: contentDe,
      setValue: setContentDe,
      denumire: LANGUAGE_LABELS.de.denumire,
    },
    // Hindi
    {
      id: "nume-hu",
      label: LANGUAGE_LABELS.hi.name,
      value: numeHu,
      setValue: setNumeHu,
      denumire: LANGUAGE_LABELS.hi.denumire,
    },
    {
      id: "descriere-hu",
      label: LANGUAGE_LABELS.hi.description,
      value: descriereHu,
      setValue: setDescriereHu,
      denumire: LANGUAGE_LABELS.hi.denumire,
    },
    {
      id: "content-hu",
      label: LANGUAGE_LABELS.hi.content,
      value: contentHu,
      setValue: setContentHu,
      denumire: LANGUAGE_LABELS.hi.denumire,
    },
    // Cehă
    {
      id: "nume-cs",
      label: LANGUAGE_LABELS.cs.name,
      value: numeCs,
      setValue: setNumeCs,
      denumire: LANGUAGE_LABELS.cs.denumire,
    },
    {
      id: "descriere-cs",
      label: LANGUAGE_LABELS.cs.description,
      value: descriereCs,
      setValue: setDescriereCs,
      denumire: LANGUAGE_LABELS.cs.denumire,
    },
    {
      id: "content-cs",
      label: LANGUAGE_LABELS.cs.content,
      value: contentCs,
      setValue: setContentCs,
      denumire: LANGUAGE_LABELS.cs.denumire,
    },
    // Slovacă
    {
      id: "nume-sk",
      label: LANGUAGE_LABELS.sk.name,
      value: numeSk,
      setValue: setNumeSk,
      denumire: LANGUAGE_LABELS.sk.denumire,
    },
    {
      id: "descriere-sk",
      label: LANGUAGE_LABELS.sk.description,
      value: descriereSk,
      setValue: setDescriereSk,
      denumire: LANGUAGE_LABELS.sk.denumire,
    },
    {
      id: "content-sk",
      label: LANGUAGE_LABELS.sk.content,
      value: contentSk,
      setValue: setContentSk,
      denumire: LANGUAGE_LABELS.sk.denumire,
    },
    // Croată
    {
      id: "nume-hr",
      label: LANGUAGE_LABELS.hr.name,
      value: numeHr,
      setValue: setNumeHr,
      denumire: LANGUAGE_LABELS.hr.denumire,
    },
    {
      id: "descriere-hr",
      label: LANGUAGE_LABELS.hr.description,
      value: descriereHr,
      setValue: setDescriereHr,
      denumire: LANGUAGE_LABELS.hr.denumire,
    },
    {
      id: "content-hr",
      label: LANGUAGE_LABELS.hr.content,
      value: contentHr,
      setValue: setContentHr,
      denumire: LANGUAGE_LABELS.hr.denumire,
    },
    // Indoneziana
    {
      id: "nume-ru",
      label: LANGUAGE_LABELS.id.name,
      value: numeRu,
      setValue: setNumeRu,
      denumire: LANGUAGE_LABELS.id.denumire,
    },
    {
      id: "descriere-ru",
      label: LANGUAGE_LABELS.id.description,
      value: descriereRu,
      setValue: setDescriereRu,
      denumire: LANGUAGE_LABELS.id.denumire,
    },
    {
      id: "content-ru",
      label: LANGUAGE_LABELS.id.content,
      value: contentRu,
      setValue: setContentRu,
      denumire: LANGUAGE_LABELS.id.denumire,
    },
    // Bulgară
    {
      id: "nume-bg",
      label: LANGUAGE_LABELS.bg.name,
      value: numeBg,
      setValue: setNumeBg,
      denumire: LANGUAGE_LABELS.bg.denumire,
    },
    {
      id: "descriere-bg",
      label: LANGUAGE_LABELS.bg.description,
      value: descriereBg,
      setValue: setDescriereBg,
      denumire: LANGUAGE_LABELS.bg.denumire,
    },
    {
      id: "content-bg",
      label: LANGUAGE_LABELS.bg.content,
      value: contentBg,
      setValue: setContentBg,
      denumire: LANGUAGE_LABELS.bg.denumire,
    },
    // Greacă
    {
      id: "nume-el",
      label: LANGUAGE_LABELS.el.name,
      value: numeEl,
      setValue: setNumeEl,
      denumire: LANGUAGE_LABELS.el.denumire,
    },
    {
      id: "descriere-el",
      label: LANGUAGE_LABELS.el.description,
      value: descriereEl,
      setValue: setDescriereEl,
      denumire: LANGUAGE_LABELS.el.denumire,
    },
    {
      id: "content-el",
      label: LANGUAGE_LABELS.el.content,
      value: contentEl,
      setValue: setContentEl,
      denumire: LANGUAGE_LABELS.el.denumire,
    },
    // Franceză
    {
      id: "nume-fr",
      label: LANGUAGE_LABELS.fr.name,
      value: numeFr,
      setValue: setNumeFr,
      denumire: LANGUAGE_LABELS.fr.denumire,
    },
    {
      id: "descriere-fr",
      label: LANGUAGE_LABELS.fr.description,
      value: descriereFr,
      setValue: setDescriereFr,
      denumire: LANGUAGE_LABELS.fr.denumire,
    },
    {
      id: "content-fr",
      label: LANGUAGE_LABELS.fr.content,
      value: contentFr,
      setValue: setContentFr,
      denumire: LANGUAGE_LABELS.fr.denumire,
    },
    // Adaugă aici orice alte limbi necesare, respectând acest format.
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
      ro: { nume: numeRo, descriere: descriereRo, content: contentRo },
      en: { nume: numeEn, descriere: descriereEn, content: contentEn },
      es: { nume: numeEs, descriere: descriereEs, content: contentEs },
      it: { nume: numeIt, descriere: descriereIt, content: contentIt },
      pl: { nume: numePl, descriere: descrierePl, content: contentPl },
      de: { nume: numeDe, descriere: descriereDe, content: contentDe },
      hu: { nume: numeHu, descriere: descriereHu, content: contentHu },
      cs: { nume: numeCs, descriere: descriereCs, content: contentCs },
      sk: { nume: numeSk, descriere: descriereSk, content: contentSk },
      hr: { nume: numeHr, descriere: descriereHr, content: contentHr },
      ru: { nume: numeRu, descriere: descriereRu, content: contentRu },
      bg: { nume: numeBg, descriere: descriereBg, content: contentBg },
      el: { nume: numeEl, descriere: descriereEl, content: contentEl },
      fr: { nume: numeFr, descriere: descriereFr, content: contentFr },
    };

    console.log(data);
    console.log("youtube...", youtubeLink);

    const oldFileName = dialogData.image ? dialogData.image.fileName : "";
    if (isEdit) {
      handleEdit(
        data,
        selectedImages,
        image,
        oldFileName,
        categorie,
        youtubeLink
      ).then(() => {
        setLoading(false);
      });
    } else {
      console.log("else.....");
      console.log(selectedImages);
      console.log(data);
      handleUpload(data, selectedImages, categorie, youtubeLink).then(() => {
        setLoading(false);
      });
    }
  };

  const theme = useTheme();

  // HANDLE TRANSLATE
  const handleTranslate = async (text, target) => {
    console.log("translate text...", text);
    try {
      const res = await gTranslateFetch(text, target);
      return res;
    } catch (err) {
      console.error("Error on translate.....:", err);
      // Handle error (e.g., show error message to user)
    }
  };

  //---------- NUME HANDLE TRANSLATE -----------

  const handleToTranslateNume = async (numeRoValue) => {
    const languages = [
      "en",
      "es",
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
      console.log("language to translate...", l);

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

  //---------- DESCRIERE HANDLE TRANSLATE -----------

  const handleToTranslateDescriere = async (descriereRoValue) => {
    const languages = [
      "en",
      "es",
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
  //---------- CONTENT HANDLE TRANSLATE -----------

  const handleToTranslateContent = async (contentRoValue) => {
    const languages = [
      "en",
      "es",
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
      en: setContentEn,
      es: setContentEs,
      it: setContentIt,
      pl: setContentPl,
      de: setContentDe,
      hu: setContentHu,
      cs: setContentCs,
      sk: setContentSk,
      hr: setContentHr,
      ru: setContentRu,
      bg: setContentBg,
      el: setContentEl,
      fr: setContentFr,
    };

    for (let l of languages) {
      console.log(l);

      let translation;

      if (l === "hu") {
        translation = await handleTranslate(contentRoValue, "hi");
      } else if (l === "ru") {
        translation = await handleTranslate(contentRoValue, "id");
      } else {
        translation = await handleTranslate(contentRoValue, l);
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
              <React.Fragment>
                <h1 style={{ color: "#D3D3D3", fontSize: 30, marginTop: 20 }}>
                  Link Youtube
                </h1>

                <FieldRow
                  id={"youtubeLink"}
                  name={"youtubeLink"}
                  label={"Link Youtube"}
                  value={youtubeLink}
                  onChange={(event) => setYoutubeLink(event.target.value)}
                  widthLabel="10%"
                />
              </React.Fragment>
            </Grid>
          </Box>
          <Grid
            item
            xs={12}
            sx={{ width: "100%", marginTop: 2, marginBottom: 1 }}
          >
            <HorizontalLineWithText text={"Setări Categorie"} />
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
            <DropdownFieldCategorii
              id="Categorii-select"
              name="Categorii"
              label="Categorii"
              value={categorie}
              onChange={(item) => setCategorie(item)}
              widthLabel="11.5%"
              options={[
                "Previziuni zilnice",
                "Previziuni săptămânale",
                "Previziuni lunare",
                "Previziuni anuale",
              ]}
              placeHolder="Categorii"
            />
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
                {index % 3 === 0 && (
                  <h1 style={{ color: "#D3D3D3", fontSize: 30, marginTop: 20 }}>
                    {field.denumire}
                  </h1>
                )}
                {!field.id.includes("content") ? (
                  <FieldRow
                    id={field.id}
                    name={field.id}
                    label={field.label}
                    value={field.value}
                    onChange={(event) => field.setValue(event.target.value)}
                    widthLabel="10%"
                  />
                ) : (
                  <ArticleEditor
                    content={field.value}
                    setContent={(value) => field.setValue(value)}
                  />
                )}
                {field.id === "nume-ro" && (
                  <IconButton
                    color="primary"
                    aria-label="add an alarm"
                    sx={{ position: "relative", left: 5, top: 15 }}
                    onClick={() => handleToTranslateNume(numeRo)}
                  >
                    <GTranslateIcon />
                  </IconButton>
                )}
                {field.id === "descriere-ro" && (
                  <IconButton
                    color="primary"
                    aria-label="add an alarm"
                    sx={{ position: "relative", left: 5, top: 15 }}
                    onClick={() => handleToTranslateDescriere(descriereRo)}
                  >
                    <GTranslateIcon />
                  </IconButton>
                )}
                {field.id === "content-ro" && (
                  <IconButton
                    color="primary"
                    aria-label="add an alarm"
                    sx={{ position: "relative", left: 5, top: 15 }}
                    onClick={() => handleToTranslateContent(contentRo)}
                  >
                    <GTranslateIcon />
                  </IconButton>
                )}
                {/* Ajustează condiția pentru afișarea liniei orizontale */}
                {index !== 0 && (index + 1) % 3 === 0 && (
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
