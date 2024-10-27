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
import { LANGUAGE_LABELS } from "../../data/constants";

export default function OreNorocoaseFields({
  handleUpload,
  handleEdit,
  handleShowSettings,
  isEdit,
  dialogData,
  handleDelete,
}) {
  const [ora, setOra] = useState(dialogData ? dialogData.ora : ""); // Starea pentru conținutul articolului

  const [loading, setLoading] = useState(false);

  const [selectedImages, setSelectedImages] = useState([]);
  const [image, setImage] = useState(dialogData.image ? dialogData.image : "");

  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const [descriereRo, setDescriereRo] = useState(
    dialogData.info ? dialogData.info.ro.descriere : ""
  );

  const [descriereEn, setDescriereEn] = useState(
    dialogData.info ? dialogData.info.en.descriere : ""
  );

  const [descriereEs, setDescriereEs] = useState(
    dialogData.info ? dialogData.info.es.descriere : ""
  );

  const [descriereIt, setDescriereIt] = useState(
    dialogData.info ? dialogData.info.it.descriere : ""
  );

  const [descrierePl, setDescrierePl] = useState(
    dialogData.info ? dialogData.info.pl.descriere : ""
  );

  const [descriereDe, setDescriereDe] = useState(
    dialogData.info ? dialogData.info.de.descriere : ""
  );

  const [descriereHu, setDescriereHu] = useState(
    dialogData.info ? dialogData.info.hu.descriere : ""
  );

  const [descriereCs, setDescriereCs] = useState(
    dialogData.info ? dialogData.info.cs.descriere : ""
  );

  const [descriereSk, setDescriereSk] = useState(
    dialogData.info ? dialogData.info.sk.descriere : ""
  );

  const [descriereHr, setDescriereHr] = useState(
    dialogData.info ? dialogData.info.hr.descriere : ""
  );

  const [descriereRu, setDescriereRu] = useState(
    dialogData.info ? dialogData.info.ru.descriere : ""
  );

  const [descriereBg, setDescriereBg] = useState(
    dialogData.info ? dialogData.info.bg.descriere : ""
  );

  const [descriereEl, setDescriereEl] = useState(
    dialogData.info ? dialogData.info.el.descriere : ""
  );

  const [descriereFr, setDescriereFr] = useState(
    dialogData.info ? dialogData.info.fr.descriere : ""
  );

  const languageFields = [
    {
      id: "descriere-ro",
      label: LANGUAGE_LABELS.ro.description,
      value: descriereRo,
      setValue: setDescriereRo,
    },

    {
      id: "descriere-en",
      label: LANGUAGE_LABELS.en.description,
      value: descriereEn,
      setValue: setDescriereEn,
    },

    {
      id: "descriere-es",
      label: LANGUAGE_LABELS.es.description,
      value: descriereEs,
      setValue: setDescriereEs,
    },

    {
      id: "descriere-it",
      label: LANGUAGE_LABELS.it.description,
      value: descriereIt,
      setValue: setDescriereIt,
    },

    {
      id: "descriere-pl",
      label: LANGUAGE_LABELS.pl.description,
      value: descrierePl,
      setValue: setDescrierePl,
    },

    {
      id: "descriere-de",
      label: LANGUAGE_LABELS.de.description,
      value: descriereDe,
      setValue: setDescriereDe,
    },

    {
      id: "descriere-hu",
      label: LANGUAGE_LABELS.hi.description,
      value: descriereHu,
      setValue: setDescriereHu,
    },

    {
      id: "descriere-cs",
      label: LANGUAGE_LABELS.cs.description,
      value: descriereCs,
      setValue: setDescriereCs,
    },

    {
      id: "descriere-sk",
      label: LANGUAGE_LABELS.sk.description,
      value: descriereSk,
      setValue: setDescriereSk,
    },

    {
      id: "descriere-hr",
      label: LANGUAGE_LABELS.hr.description,
      value: descriereHr,
      setValue: setDescriereHr,
    },

    {
      id: "descriere-ru",
      label: LANGUAGE_LABELS.id.description,
      value: descriereRu,
      setValue: setDescriereRu,
    },

    {
      id: "descriere-bg",
      label: LANGUAGE_LABELS.bg.description,
      value: descriereBg,
      setValue: setDescriereBg,
    },

    {
      id: "descriere-el",
      label: LANGUAGE_LABELS.el.description,
      value: descriereEl,
      setValue: setDescriereEl,
    },

    {
      id: "descriere-fr",
      label: LANGUAGE_LABELS.fr.description,
      value: descriereFr,
      setValue: setDescriereFr,
    },
  ];

  const handleUploadData = () => {
    setLoading(true);
    const data = {
      ro: { descriere: descriereRo },
      en: { descriere: descriereEn },
      es: { descriere: descriereEs },
      it: { descriere: descriereIt },
      pl: { descriere: descrierePl },
      de: { descriere: descriereDe },
      hu: { descriere: descriereHu },
      cs: { descriere: descriereCs },
      sk: { descriere: descriereSk },
      hr: { descriere: descriereHr },
      ru: { descriere: descriereRu },
      bg: { descriere: descriereBg },
      el: { descriere: descriereEl },
      fr: { descriere: descriereFr },
    };
    console.log(data);

    if (isEdit) {
      console.log("start edit...");
      handleEdit(data, ora).then(() => {
        setLoading(false);
      });
    } else {
      handleUpload(data, ora).then(() => {
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
            <HorizontalLineWithText text={"Oră norocoasă"} />
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
            <FieldRow
              id={"Oră norocos"}
              name={"Oră norocos"}
              label={"Oră norocos"}
              value={ora}
              onChange={(event) => setOra(event.target.value)}
              widthLabel="10%"
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
