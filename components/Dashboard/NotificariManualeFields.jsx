import React, { useMemo, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Grid, IconButton } from "@mui/material";
import GTranslateIcon from "@mui/icons-material/GTranslate";
import HorizontalLineWithText from "../HorizontalLineText";
import FieldRow from "./FieldRow";
import LoadingDialog from "../DialogBox/DialogLoader";
import { LANGUAGE_LABELS } from "../../data/constants";
import { gTranslateFetch } from "../../utils/apiUtils";

const NOTIFICATION_LOCALE_ORDER = [
  "sq",
  "ar",
  "bs",
  "bg",
  "cs",
  "zh",
  "ko",
  "hr",
  "he",
  "en",
  "fr",
  "de",
  "el",
  "hi",
  "id",
  "it",
  "ja",
  "hu",
  "mn",
  "pl",
  "pt",
  "ro",
  "ru",
  "sr",
  "sk",
  "es",
  "tr",
];

const LEGACY_NOTIFICATION_LOCALE_KEYS = {
  hi: ["hu"],
  id: ["ru"],
  ru: ["rusa"],
};

const TRANSLATION_TARGET_BY_LOCALE = {
  zh: "zh-TW",
};

const readLocalizedValue = (info, locale, field) => {
  const direct = info?.[locale]?.[field];
  if (typeof direct === "string") {
    return direct;
  }

  const legacyKeys = LEGACY_NOTIFICATION_LOCALE_KEYS[locale] || [];
  for (const legacyKey of legacyKeys) {
    const legacyValue = info?.[legacyKey]?.[field];
    if (typeof legacyValue === "string") {
      return legacyValue;
    }
  }

  return "";
};

const buildInitialLocalizedInfo = (info) =>
  NOTIFICATION_LOCALE_ORDER.reduce((acc, locale) => {
    acc[locale] = {
      nume: readLocalizedValue(info, locale, "nume"),
      descriere: readLocalizedValue(info, locale, "descriere"),
    };
    return acc;
  }, {});

const buildFirestoreInfo = (localizedInfo, updateAvailable) => {
  const data = NOTIFICATION_LOCALE_ORDER.reduce((acc, locale) => {
    acc[locale] = {
      nume: localizedInfo[locale]?.nume || "",
      descriere: localizedInfo[locale]?.descriere || "",
    };
    return acc;
  }, {});
  data.updateAvailable = updateAvailable;
  return data;
};

export default function NotificariManualeFields({
  handleUpload,
  handleEdit,
  handleShowSettings,
  isEdit,
  dialogData,
  handleDelete,
}) {
  const [loading, setLoading] = useState(false);
  const [selectedImages] = useState([]);
  const [image] = useState(dialogData.image ? dialogData.image : "");
  const [youtubeLink] = useState(
    dialogData.youtubeLinks ? dialogData.youtubeLinks.join("; ") : ""
  );
  const [categorie] = useState(dialogData.categorie ? dialogData.categorie : "");
  const [dataProgramata] = useState(dialogData.dataProgramata ? dialogData.dataProgramata : "");
  const [timpProgramat] = useState(dialogData.timpProgramat ? dialogData.timpProgramat : "");
  const [updateAvailable, setUpdateAvailable] = useState(
    dialogData.info?.updateAvailable === true
  );
  const [localizedInfo, setLocalizedInfo] = useState(() =>
    buildInitialLocalizedInfo(dialogData.info)
  );

  const languageFields = useMemo(
    () =>
      NOTIFICATION_LOCALE_ORDER.map((locale) => ({
        locale,
        denumire: LANGUAGE_LABELS[locale]?.denumire || locale.toUpperCase(),
        nameLabel: LANGUAGE_LABELS[locale]?.name || `Nume ${locale.toUpperCase()}`,
        descriptionLabel:
          LANGUAGE_LABELS[locale]?.description || `Descriere ${locale.toUpperCase()}`,
      })),
    []
  );

  const updateLocalizedField = (locale, field, value) => {
    setLocalizedInfo((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] || { nume: "", descriere: "" }),
        [field]: value,
      },
    }));
  };

  const handleUploadData = () => {
    setLoading(true);
    const data = buildFirestoreInfo(localizedInfo, updateAvailable);
    const oldFileName = dialogData.image ? dialogData.image.fileName : "";
    const action = isEdit
      ? handleEdit(
          data,
          selectedImages,
          image,
          oldFileName,
          categorie,
          youtubeLink,
          timpProgramat,
          dataProgramata
        )
      : handleUpload(
          data,
          selectedImages,
          categorie,
          youtubeLink,
          timpProgramat,
          dataProgramata
        );

    action
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.error(`Error during ${isEdit ? "edit" : "upload"}:`, error);
      });
  };

  const handleTranslate = async (text, locale) => {
    if (!text || !text.trim()) {
      return "";
    }

    try {
      return await gTranslateFetch(text, TRANSLATION_TARGET_BY_LOCALE[locale] || locale);
    } catch (err) {
      console.error("Error on translate:", err);
      return "";
    }
  };

  const translateFromRomanian = async (field) => {
    const sourceText = localizedInfo.ro?.[field] || "";
    if (!sourceText.trim()) {
      return;
    }

    setLoading(true);
    try {
      for (const locale of NOTIFICATION_LOCALE_ORDER) {
        if (locale === "ro") {
          continue;
        }

        const translation = await handleTranslate(sourceText, locale);
        if (translation) {
          updateLocalizedField(locale, field, translation);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Grid container spacing={2} sx={{ padding: 1 }}>
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

        <Grid item xs={12} sx={{ width: "100%", marginTop: 2, marginBottom: 1 }}>
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
          <FormControlLabel
            sx={{ color: "white" }}
            control={
              <Checkbox
                checked={updateAvailable}
                onChange={(event) => setUpdateAvailable(event.target.checked)}
                sx={{
                  color: "white",
                  "&.Mui-checked": {
                    color: "white",
                  },
                }}
              />
            }
            label="Actualizare disponibilă?"
          />

          {languageFields.map((field) => (
            <React.Fragment key={field.locale}>
              <h1 style={{ color: "#D3D3D3", fontSize: 30, marginTop: 20 }}>
                {field.denumire}
              </h1>
              <FieldRow
                id={`nume-${field.locale}`}
                name={`nume-${field.locale}`}
                label={field.nameLabel}
                value={localizedInfo[field.locale]?.nume || ""}
                onChange={(event) =>
                  updateLocalizedField(field.locale, "nume", event.target.value)
                }
                widthLabel="10%"
              />
              {field.locale === "ro" && (
                <IconButton
                  color="primary"
                  aria-label="translate notification title"
                  sx={{ position: "relative", left: 5, top: 15 }}
                  onClick={() => translateFromRomanian("nume")}
                >
                  <GTranslateIcon />
                </IconButton>
              )}
              <FieldRow
                id={`descriere-${field.locale}`}
                name={`descriere-${field.locale}`}
                label={field.descriptionLabel}
                value={localizedInfo[field.locale]?.descriere || ""}
                onChange={(event) =>
                  updateLocalizedField(field.locale, "descriere", event.target.value)
                }
                widthLabel="10%"
              />
              {field.locale === "ro" && (
                <IconButton
                  color="primary"
                  aria-label="translate notification description"
                  sx={{ position: "relative", left: 5, top: 15 }}
                  onClick={() => translateFromRomanian("descriere")}
                >
                  <GTranslateIcon />
                </IconButton>
              )}
              <HorizontalLineWithText style={{ marginTop: "3%" }} />
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
          <Button variant="contained" onClick={handleUploadData} style={{ marginRight: 10 }}>
            {isEdit ? "Actualizează" : "Salvează"}
          </Button>
          <Button variant="outlined" onClick={handleShowSettings}>
            Cancel
          </Button>
        </Box>
        <LoadingDialog loading={loading} setLoading={setLoading} />
      </Grid>
    </>
  );
}
