import React, { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import TableToolbar from "../ProcessTable/TableToolbar";

import IconInSelect from "../ProcessTable/IconInSelect";
import { useStyles } from "../../styles/ProcessTableStyles";
import { editData, getData, writeData } from "../../utils/realtimeUtils";
import { getCurrentDateTime } from "../../utils/timeUtils";
import { getDatabase, ref, remove, child, set } from "firebase/database";

import DeleteDialog from "../DialogBox/DeleteDialog";
import ElaiVideoPreviewDialog from "../DialogBox/ElaiVideoPreviewDialog";
import VarianteCartiPersonalizateFields from "../Dashboard/VarianteCartiPersonalizateFields";
import VariatieCartiContainer from "../ProcessTable/VariatieCartiContainer";
import { generateElaiVideoAPI, renderElaiVideoAPI } from "../../utils/apiUtils";
import { checkDescription } from "../../utils/commonUtils";
import {
  canRerenderElaiStatus,
  computeRecordIsRendering,
  ensureElaiMeta,
  normalizeElaiStatus,
  normalizeVarianteRecord,
} from "../../utils/elaiStatusUtils";
import { postElaiRerender, postElaiStatusSync } from "../../utils/elaiAdminApi";

export default function VarianteCartiPersonalizateTable() {
  // const { db } = useMockup();
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [db, setDb] = useState([]);
  const [categorii, setCategorii] = useState([]);
  const [carti, setCarti] = useState([]);
  const [dialogData, setDialogData] = useState({});
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showAddContract, setShowAddContract] = React.useState(false);
  const [openSoloPopup, setOpenSoloPopup] = React.useState(false);
  const settingsRef = React.useRef(null);
  const classes = useStyles();

  const [searchedDb, setSearchedDb] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [isSyncingElaiStatus, setIsSyncingElaiStatus] = useState(false);
  const [isRetryingElai, setIsRetryingElai] = useState(false);
  const [isRetryingSelectedRow, setIsRetryingSelectedRow] = useState(false);
  const [isSyncingSelectedRow, setIsSyncingSelectedRow] = useState(false);
  const [isSyncingSingleElai, setIsSyncingSingleElai] = useState(false);
  const [isRetryingSingleElai, setIsRetryingSingleElai] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState({
    recordId: "",
    lang: "",
    info: {},
  });

  const handleSearchFilter = (value) => {
    const lowerCaseValue = value.toLowerCase();
    const filteredDb = db.filter(
      (item) =>
        item.info.ro.descriere.toLowerCase().includes(lowerCaseValue) ||
        item.info.ro.video.toLowerCase().includes(lowerCaseValue) ||
        item.info.ro.video.toLowerCase().includes(`variation-${lowerCaseValue}`)
    );

    console.log(filteredDb);
    console.log(value);
    setSearchValue(value);
    setSearchedDb(filteredDb);
  };
  // GET DATA FROM FIREBASE (AND URL TO ELAI.IO THAT IS IN FIREBASE)
  const handleGetData = async () => {
    setIsLoading(true);
    const data = await getData("Citire-Personalizata", "VarianteCarti");
    const dataCarti = await getData("Citire-Personalizata", "Carti");
    const dataCategorii = await getData("Citire-Personalizata", "Categorii");

    let rawData = [...data.arr];
    const sortedArr = rawData
      .map((item) => normalizeVarianteRecord(item))
      .sort((a, b) => a.id - b.id);
    let rawDataCarti = [...dataCarti.arr];
    const sortedArrCarti = rawDataCarti.sort((a, b) => a.nume - b.nume);
    let rawDataCategorii = [...dataCategorii.arr];
    const sortedArrCategorii = rawDataCategorii.sort((a, b) => a.nume - b.nume);

    if (data) {
      setDb([...sortedArr]);
      setCarti([...sortedArrCarti]);
      setCategorii([...sortedArrCategorii]);
      setIsLoading(false);
      return sortedArr;
    } else {
      setIsLoading(false);
      // Handle the case where servicesDB is undefined
      // For example, display an error message or take appropriate action
      return [];
    }
  };

  const handleToggleRecordSelection = (recordId) => {
    setSelectedRecordIds((prev) => {
      if (prev.includes(recordId)) {
        return prev.filter((id) => id !== recordId);
      }
      return [...prev, recordId];
    });
  };

  const handleToggleSelectCurrentPage = (pageIds = [], shouldSelect) => {
    setSelectedRecordIds((prev) => {
      const current = new Set(prev);
      for (const id of pageIds) {
        if (shouldSelect) current.add(id);
        else current.delete(id);
      }
      return Array.from(current);
    });
  };

  const handleOpenPreview = ({ row, lang }) => {
    const info = row?.info?.[lang] || {};
    setPreviewPayload({
      recordId: row?.id || "",
      lang: lang || "",
      info,
    });
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const updatePreviewPayloadFromRows = (rows, recordId, lang) => {
    const refreshedRow = rows.find((row) => row.id === recordId);
    if (!refreshedRow) return;
    setPreviewPayload({
      recordId,
      lang,
      info: refreshedRow?.info?.[lang] || {},
    });
  };

  const handleSyncSingleLanguage = async ({ recordId, lang, info }) => {
    if (isSyncingSingleElai) return;
    const normalizedInfo = ensureElaiMeta(info);
    const numericRecordId = Number(recordId);
    const safeLang = typeof lang === "string" ? lang : "";

    if (!Number.isFinite(numericRecordId) || numericRecordId <= 0 || !safeLang) {
      alert("Date invalide pentru sync pe limba selectata.");
      return;
    }

    if (!normalizedInfo._id) {
      alert("Lipseste video ID pentru limba selectata.");
      return;
    }

    try {
      setIsSyncingSingleElai(true);
      const syncResponse = await postElaiStatusSync({
        targets: [
          {
            recordId: numericRecordId,
            lang: safeLang,
            videoId: normalizedInfo._id,
          },
        ],
        limit: 1,
      });

      const refreshedRows = await handleGetData();
      updatePreviewPayloadFromRows(refreshedRows, numericRecordId, safeLang);

      alert(
        `Sync ${safeLang.toUpperCase()} finalizat: ${syncResponse?.updated || 0} actualizate, ${
          Array.isArray(syncResponse?.errors) ? syncResponse.errors.length : 0
        } erori.`
      );
    } catch (error) {
      alert(`Eroare la sync pe limba selectata: ${error.message}`);
    } finally {
      setIsSyncingSingleElai(false);
    }
  };

  const handleRetrySingleLanguage = async ({ recordId, lang, info }) => {
    if (isRetryingSingleElai) return;
    const normalizedInfo = ensureElaiMeta(info);
    const numericRecordId = Number(recordId);
    const safeLang = typeof lang === "string" ? lang : "";

    if (!Number.isFinite(numericRecordId) || numericRecordId <= 0 || !safeLang) {
      alert("Date invalide pentru retry pe limba selectata.");
      return;
    }

    if (!normalizedInfo._id) {
      alert("Lipseste video ID pentru limba selectata.");
      return;
    }

    if (!canRerenderElaiStatus(normalizedInfo.elaiStatus)) {
      alert("Retry este permis doar pentru status draft/error.");
      return;
    }

    try {
      setIsRetryingSingleElai(true);
      const rerenderResponse = await postElaiRerender({
        targets: [
          {
            recordId: numericRecordId,
            lang: safeLang,
            videoId: normalizedInfo._id,
          },
        ],
      });

      const refreshedRows = await handleGetData();
      updatePreviewPayloadFromRows(refreshedRows, numericRecordId, safeLang);

      alert(
        `Retry ${safeLang.toUpperCase()} finalizat: ${
          rerenderResponse?.succeeded || 0
        } succes, ${rerenderResponse?.failed || 0} esec.`
      );
    } catch (error) {
      alert(`Eroare la retry pe limba selectata: ${error.message}`);
    } finally {
      setIsRetryingSingleElai(false);
    }
  };

  const handleShowDialog = (item) => {
    console.log(item);
    if (showSettings) {
      setDialogData({});
      setIsEdit(false);
      handleShowSettings();
      setSearchedDb([]);
      setSearchValue("");
    } else {
      console.log("item...");
      console.log(item.info.ro);
      setIsEdit(true);
      setDialogData(item);
      handleShowSettings();
      setSearchedDb([]);
      setSearchValue("");
    }
  };

  const handleShowSettings = () => {
    setShowSettings(!showSettings);
    if (dialogData.id) {
      setDialogData({});
      setIsEdit(false);
    }
  };

  const handleShowAddContract = () => {
    setShowAddContract(!showAddContract);
  };

  const handleDelete = () => {
    console.log("Start");
    setOpenDeleteDialog(!openDeleteDialog);
  };

  const confirmDelete = () => {
    const database = getDatabase();

    // 1. Ștergeți elementul din Firebase
    const dataRef = ref(
      database,
      "Citire-Personalizata/VarianteCarti/" + dialogData.id
    );
    remove(dataRef);

    // Creează o nouă matrice care exclude articolul cu ID-ul specificat
    const updatedDb = db.filter((a) => a.id !== dialogData.id);

    // 2. Resetarea ID-urilor pentru continuitate
    const finalDb = updatedDb.map((item, index) => {
      return {
        ...item,
        id: index + 1,
      };
    });

    // // Șterge toate nodurile existente sub "Services/"
    const dbRef = ref(database, "Citire-Personalizata/VarianteCarti/");
    set(dbRef, {}).then(() => {
      // După ce toate nodurile sunt șterse, adaugă finalDb ca noile noduri copil
      finalDb.forEach((item) => {
        const newDbRef = child(dbRef, String(item.id));
        set(newDbRef, item);
      });
    });

    // Actualizează starea db cu noua matrice filtrată
    setDb(finalDb);
    handleShowDialog();
    handleDelete();
  };

  //EDIT INFO FIREBASE AND ELAI.IO

  const handleEdit = async (info, categorie, carte) => {
    console.log("info url that is comming for the test equals....");
    console.log(info.url);
    // ("657bfed264df067abaef327b");
    try {
      const dateTime = getCurrentDateTime();

      const updateData = db.map(async (item) => {
        if (item.id === dialogData.id) {
          console.log("is found");
          let data;
          let fData;

          data = {
            id: item.id,
            info,
            categorie,
            carte,
            date: dateTime.date,
            time: dateTime.time,
          };

          const finalData = await checkDescription(data, dialogData);
          console.log(
            "----------------------------------------------------------------"
          );
          console.log(finalData.isRendering);
          fData = {
            id: item.id,
            info,
            categorie,
            carte,
            date: dateTime.date,
            time: dateTime.time,
            isRendering: computeRecordIsRendering(info) || Boolean(finalData.isRendering),
          };

          editData(
            fData,
            "Citire-Personalizata",
            "VarianteCarti",
            dialogData.id
          );
          return fData;
        } else {
          console.log("is not found");
          return item;
        }
      });
      // Use Promise.all to wait for all promises in the map to resolve
      const updatedData = await Promise.all(updateData);
      setDb([...updatedData]);
      handleShowDialog();
    } catch (err) {
      console.log("Error handleEdit...", err);
    }
  };

  //UPLOAD INFO TO FIREBASE AND ELAI.IO

  const handleUpload = async (info, categorie, carte) => {
    try {
      const dateTime = getCurrentDateTime();
      console.log("info", info);
      console.log("categorie", categorie);
      console.log("carte", carte);

      const nowIso = new Date().toISOString();
      for (let [lang, item] of Object.entries(info)) {
        if (item.descriere.length > 0) {
          let response = await generateElaiVideoAPI(item.video, item.descriere);
          if (response?._id) {
            console.log("response:", response._id);
            await renderElaiVideoAPI(response._id);
            const previous = ensureElaiMeta(info[lang]);
            info[lang] = {
              ...previous,
              video: item.video,
              descriere: item.descriere,
              _id: response._id,
              url: "",
              isRendering: true,
              elaiStatus: "rendering",
              elaiError: "",
              lastRenderAttemptAt: nowIso,
            };
          }
          // console.log("video:", item.video);
        }
      }

      const data = {
        id: db.length + 1,
        info,
        categorie,
        carte,
        date: dateTime.date,
        time: dateTime.time,
        firstUpload: true,
        isRendering: computeRecordIsRendering(info),
      };

      // Folosește await pentru a aștepta finalizarea promisiunii
      await writeData(data, "Citire-Personalizata", "VarianteCarti");

      let newData = db;

      newData.push(data);

      setDb([...newData]);

      setShowSettings(!showSettings);
    } catch (err) {
      console.log("Error handleUpload...", err);
    }
  };

  const handleSyncElaiStatus = async (syncPayload = { staleHours: 6, limit: 200 }) => {
    if (syncPayload?.nativeEvent) {
      syncPayload = { staleHours: 6, limit: 200 };
    }
    if (isSyncingElaiStatus) return;
    try {
      setIsSyncingElaiStatus(true);
      const response = await postElaiStatusSync(syncPayload);
      console.info("[ELAI status-sync]", response);
      await handleGetData();

      if (!syncPayload?.silent) {
        const errorsCount = Array.isArray(response?.errors) ? response.errors.length : 0;
        const candidates = Number(response?.candidates || 0);
        const limitedCandidates = Number(response?.limitedCandidates || 0);
        const wasLimited = candidates > limitedCandidates;
        const samplePreview = Array.isArray(response?.debugSamples)
          ? response.debugSamples
              .slice(0, 3)
              .map((sample) => `${sample.lang}:${sample.rawStatus || "n/a"}->${sample.mappedStatus}`)
              .join(" | ")
          : "";
        alert(
          `Sync completat: ${response?.processed || 0} verificate, ${
            response?.updated || 0
          } actualizate, ${errorsCount} erori.` +
            `${wasLimited ? `\nLimitat: ${limitedCandidates}/${candidates} (ruleaza din nou pentru restul).` : ""}` +
            `${response?.requestId ? `\nRequest ID: ${response.requestId}` : ""}` +
            `${samplePreview ? `\nSample: ${samplePreview}` : ""}`
        );
      }
    } catch (error) {
      if (!syncPayload?.silent) {
        alert(`Eroare la sync ELAI: ${error.message}`);
      }
    } finally {
      setIsSyncingElaiStatus(false);
    }
  };

  const handleRetrySelected = async () => {
    if (isRetryingElai) return;
    const selectedRows = db.filter((item) => selectedRecordIds.includes(item.id));

    const targets = [];
    for (const row of selectedRows) {
      for (const [lang, rawInfo] of Object.entries(row.info || {})) {
        const info = ensureElaiMeta(rawInfo);
        if (!info._id) continue;
        if (!canRerenderElaiStatus(info.elaiStatus)) continue;
        targets.push({
          recordId: row.id,
          lang,
          videoId: info._id,
        });
      }
    }

    if (targets.length === 0) {
      alert("Nu exista videoclipuri draft/error selectate pentru retry.");
      return;
    }

    if (targets.length > 5) {
      alert(
        `Ai selectat ${targets.length} target-uri. Limita este 5 per rulare pentru protectia minutelor.`
      );
      return;
    }

    try {
      setIsRetryingElai(true);
      const rerenderResponse = await postElaiRerender({ targets });
      await handleGetData();
      setSelectedRecordIds([]);

      const attempted = rerenderResponse?.attempted || 0;
      const succeeded = rerenderResponse?.succeeded || 0;
      const failed = rerenderResponse?.failed || 0;
      alert(`Retry finalizat: ${attempted} incercate, ${succeeded} succes, ${failed} esec.`);
    } catch (error) {
      alert(`Eroare la retry render: ${error.message}`);
    } finally {
      setIsRetryingElai(false);
    }
  };

  const getSingleSelectedRow = () => {
    if (selectedRecordIds.length !== 1) {
      alert("Selecteaza exact un rand pentru aceasta actiune.");
      return null;
    }

    const selectedId = selectedRecordIds[0];
    const row = db.find((item) => item.id === selectedId);
    if (!row) {
      alert("Randul selectat nu mai exista. Reincarca datele.");
      return null;
    }

    return row;
  };

  const buildRowTargets = (row, mode = "render") => {
    const targets = [];
    for (const [lang, rawInfo] of Object.entries(row?.info || {})) {
      const info = ensureElaiMeta(rawInfo);
      if (!info._id) continue;

      if (mode === "render" && !canRerenderElaiStatus(info.elaiStatus)) {
        continue;
      }

      if (mode === "sync" && normalizeElaiStatus(info.elaiStatus) === "ready") {
        continue;
      }

      targets.push({
        recordId: row.id,
        lang,
        videoId: info._id,
      });
    }

    return targets;
  };

  const handleRetrySelectedRow = async () => {
    if (isRetryingSelectedRow) return;
    const row = getSingleSelectedRow();
    if (!row) return;

    const targets = buildRowTargets(row, "render");
    if (targets.length === 0) {
      alert("Nu exista limbi draft/error eligibile pentru render pe randul selectat.");
      return;
    }

    if (targets.length > 5) {
      alert(
        `Randul selectat are ${targets.length} target-uri eligibile. Limita este 5 per rulare.`
      );
      return;
    }

    try {
      setIsRetryingSelectedRow(true);
      const rerenderResponse = await postElaiRerender({ targets });
      await handleGetData();

      alert(
        `Render pe rand finalizat: ${rerenderResponse?.succeeded || 0} succes, ${
          rerenderResponse?.failed || 0
        } esec.`
      );
    } catch (error) {
      alert(`Eroare la render pe rand: ${error.message}`);
    } finally {
      setIsRetryingSelectedRow(false);
    }
  };

  const handleSyncSelectedRow = async () => {
    if (isSyncingSelectedRow) return;
    const row = getSingleSelectedRow();
    if (!row) return;

    const targets = buildRowTargets(row, "sync");
    if (targets.length === 0) {
      alert("Nu exista limbi non-ready eligibile pentru sync pe randul selectat.");
      return;
    }

    try {
      setIsSyncingSelectedRow(true);
      const response = await postElaiStatusSync({
        targets,
        limit: targets.length,
      });
      await handleGetData();

      alert(
        `Sync pe rand finalizat: ${response?.processed || 0} verificate, ${
          response?.updated || 0
        } actualizate, ${Array.isArray(response?.errors) ? response.errors.length : 0} erori.`
      );
    } catch (error) {
      alert(`Eroare la sync pe rand: ${error.message}`);
    } finally {
      setIsSyncingSelectedRow(false);
    }
  };

  const handleShowSoloPopup = () => {
    setOpenSoloPopup(!openSoloPopup);
  };

  useEffect(() => {
    handleGetData();
    // fetchData();
    // console.log(db);
  }, []);

  useEffect(() => {
    setSelectedRecordIds((prev) =>
      prev.filter((id) => db.some((item) => item.id === id))
    );
  }, [db]);

  // HANDLE TRANSLATE PAGE ON SCREEN AND GENERATE ELAI.IO FOR OTHER LANGUAGES THAT ARE NOT GENERATED
  const handleTranslate = async (text, target, videoNumberComplet) => {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, target }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Translation:", data);
      // GENERATE ELAI.IO VIDEO
      console.log("videoNumberComplet:", videoNumberComplet);
      let res = await generateElaiVideoAPI(
        videoNumberComplet,
        data.translation
      );
      console.log("res:", res._id);
      renderElaiVideoAPI(res._id);
    } catch (err) {
      console.error("Error on translate:", err);
    }
  };
  //START THE VIDEOS THAT NEED TO TRANSLATE AND GENERATE IN ELAI.IO
  const handleVideosToTranslate = async (items) => {
    console.log(items.length);
    let itemIndex = 0; // Inițializează indexul pentru item

    for (const item of items) {
      console.log(`Procesând item-ul cu indexul: ${itemIndex}`); // Afișează indexul curent
      const info = item.info;

      for (const language in info) {
        const languageDetails = info[language];
        const number = info["ro"].videoNumber;
        let videoNumberComplet = `variation-${number}-lang-${language}`;

        if (
          languageDetails._id.length === 0 ||
          languageDetails.descriere.length === 0
        ) {
          // Logica ta existentă
          await handleTranslate(
            info["ro"].descriere,
            language,
            videoNumberComplet
          );
        }
      }

      itemIndex++; // Incrementează indexul după fiecare item procesat
    }
  };

  return (
    <>
      {showSettings ? (
        <VarianteCartiPersonalizateFields
          handleEdit={handleEdit}
          handleUpload={handleUpload}
          handleShowSettings={handleShowSettings}
          isEdit={isEdit}
          dialogData={dialogData}
          handleDelete={handleDelete}
          carti={carti}
          categorii={categorii}
          firebaseDb={db}
          noDelete={true}
        />
      ) : (
        <>
          <Box component="main" className={classes.mainBox}>
            <Box>
              <TableToolbar
                isMainToolbar={true}
                handleShowSettings={handleShowSettings}
                handleShowAddContract={handleShowAddContract}
                handleShowSoloPopup={handleShowSoloPopup}
                settingsRef={settingsRef}
                db={db}
                isElaiDownload={true}
                handleSearchFilter={handleSearchFilter}
                onSyncElaiStatus={handleSyncElaiStatus}
                onRetrySelected={handleRetrySelected}
                onRetrySelectedRow={handleRetrySelectedRow}
                onSyncSelectedRow={handleSyncSelectedRow}
                retryDisabled={selectedRecordIds.length === 0}
                rowModeDisabled={selectedRecordIds.length !== 1}
                isSyncingElaiStatus={isSyncingElaiStatus}
                isRetryingElai={isRetryingElai}
                isRetryingSelectedRow={isRetryingSelectedRow}
                isSyncingSelectedRow={isSyncingSelectedRow}
              />
              <TableToolbar />

              <Stack direction="column" alignItems="center">
                {isLoading ? (
                  <CircularProgress />
                ) : db.length === 0 ? (
                  <Typography
                    sx={{
                      fontSize: 20,
                      marginTop: 5,
                      fontWeight: "400",
                      color: "white",
                    }}
                  >
                    Nu sunt cărți adăugate
                  </Typography>
                ) : (
                  <VariatieCartiContainer
                    handleVideosToTranslate={handleVideosToTranslate}
                    db={db}
                    handleShowDialog={handleShowDialog}
                    searchedDb={searchedDb}
                    searchValue={searchValue}
                    selectedRecordIds={selectedRecordIds}
                    onToggleRecordSelection={handleToggleRecordSelection}
                    onToggleSelectCurrentPage={handleToggleSelectCurrentPage}
                    onPreviewLanguage={handleOpenPreview}
                  />
                )}
              </Stack>
            </Box>
          </Box>
          <IconInSelect
            anchorEl={settingsRef.current}
            open={openSoloPopup}
            onClose={setOpenSoloPopup}
          />
        </>
      )}
      <DeleteDialog
        openConfirmDialog={openDeleteDialog}
        handleDelete={handleDelete}
        confirmDelete={confirmDelete}
      />
      <ElaiVideoPreviewDialog
        open={previewOpen}
        onClose={handleClosePreview}
        recordId={previewPayload.recordId}
        lang={previewPayload.lang}
        info={previewPayload.info}
        onSyncSingle={handleSyncSingleLanguage}
        isSyncingSingle={isSyncingSingleElai}
        onRetrySingle={handleRetrySingleLanguage}
        isRetryingSingle={isRetryingSingleElai}
      />
    </>
  );
}
