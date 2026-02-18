import { useEffect, useMemo, useState } from "react";

const MULTI_TARGET_CODES = ["ro", "es", "fr", "de", "it", "pt", "pl", "cs", "el"];

export default function SubtitrariOpenAIPagina() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewSrt, setPreviewSrt] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [subtitleLanguage, setSubtitleLanguage] = useState("en");
  const [processingMode, setProcessingMode] = useState("media");
  const [downloadName, setDownloadName] = useState("subtitrare.en.srt");

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const isSrtMultiMode = processingMode === "srt-multi";
  const fileAccept = isSrtMultiMode
    ? ".srt,text/plain,application/x-subrip"
    : "video/*,audio/*";
  const downloadButtonLabel = downloadName.toLowerCase().endsWith(".zip")
    ? "Descarca arhiva ZIP"
    : "Descarca SRT";

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) {
      return "Niciun fisier selectat";
    }
    const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(2);
    return `${selectedFile.name} (${sizeMb} MB)`;
  }, [selectedFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setErrorMessage("");
    setPreviewSrt("");
    setResultMessage("");

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl("");
    }
  };

  const handleProcessingModeChange = (event) => {
    const nextMode = event.target.value === "srt-multi" ? "srt-multi" : "media";
    setProcessingMode(nextMode);
    setSelectedFile(null);
    setErrorMessage("");
    setPreviewSrt("");
    setResultMessage("");
    setDownloadName(nextMode === "srt-multi" ? "subtitrari.multilang.srt.zip" : "subtitrare.en.srt");

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl("");
    }
  };

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value === "ro" ? "ro" : "en";
    setSubtitleLanguage(nextLanguage);
    setDownloadName(`subtitrare.${nextLanguage}.srt`);
    setErrorMessage("");
    setPreviewSrt("");
    setResultMessage("");

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage(
        isSrtMultiMode
          ? "Selecteaza un fisier SRT in engleza."
          : "Selecteaza un fisier video/audio."
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setPreviewSrt("");
    setResultMessage("");

    try {
      const formData = new FormData();
      if (isSrtMultiMode) {
        formData.append("file", selectedFile);
        formData.append("mode", "translate-srt-multi");
        formData.append("targetLanguages", JSON.stringify(MULTI_TARGET_CODES));
      } else {
        formData.append("video", selectedFile);
        formData.append("language", subtitleLanguage);
        formData.append("mode", subtitleLanguage === "en" ? "translate-to-en" : "transcribe");
      }

      const response = await fetch("/api/transcribe-ro-srt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let serverError = "Eroare la generarea subtitrarii.";
        const rawError = await response.text();
        try {
          const parsed = JSON.parse(rawError);
          if (parsed?.error) {
            serverError = parsed.error;
          } else if (rawError) {
            serverError = rawError;
          }
        } catch (parseError) {
          if (rawError) {
            serverError = rawError;
          }
        }
        throw new Error(serverError);
      }

      const outputBlob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const matchedFilename = contentDisposition?.match(/filename="([^"]+)"/i);
      const fallbackFilename = isSrtMultiMode
        ? "subtitrari.multilang.srt.zip"
        : `subtitrare.${subtitleLanguage}.srt`;
      const suggestedFilename = matchedFilename?.[1] || fallbackFilename;

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      const newUrl = URL.createObjectURL(outputBlob);
      setDownloadUrl(newUrl);
      setDownloadName(suggestedFilename);

      if (isSrtMultiMode) {
        setResultMessage(
          "Arhiva ZIP este pregatita. Contine acelasi subtitru tradus in 9 limbi."
        );
      } else {
        const srtText = await outputBlob.text();
        setPreviewSrt(srtText.slice(0, 3000));
      }
    } catch (error) {
      setErrorMessage(error.message || "Eroare neasteptata.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={styles.wrapper}>
      <section style={styles.card}>
        <h1 style={styles.title}>Generator subtitrare SRT (admin)</h1>
        <p style={styles.subtitle}>
          Poti genera subtitrare din video/audio sau poti incarca un SRT in engleza ca sa-l traduci
          automat in 9 limbi, fiecare in fisierul lui `.srt`.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="processing-mode" style={styles.label}>
            Mod procesare
          </label>
          <select
            id="processing-mode"
            value={processingMode}
            onChange={handleProcessingModeChange}
            style={styles.select}
          >
            <option value="media">Video/Audio - subtitrare SRT</option>
            <option value="srt-multi">SRT EN - traducere in 9 limbi (ZIP)</option>
          </select>
          <p style={styles.helperText}>
            {isSrtMultiMode
              ? "Target-uri implicite: RO, ES, FR, DE, IT, PT, PL, CS, EL."
              : "Pentru EN, audio-ul este tradus automat in engleza."}
          </p>

          {!isSrtMultiMode ? (
            <>
              <label htmlFor="subtitle-language" style={styles.label}>
                Limba subtitrarii
              </label>
              <select
                id="subtitle-language"
                value={subtitleLanguage}
                onChange={handleLanguageChange}
                style={styles.select}
              >
                <option value="en">English (EN) - traducere</option>
                <option value="ro">Romana (RO) - transcriere</option>
              </select>
            </>
          ) : null}

          <input
            type="file"
            accept={fileAccept}
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <p style={styles.fileLabel}>{selectedFileLabel}</p>

          <button type="submit" disabled={isLoading} style={styles.button}>
            {isLoading
              ? "Se proceseaza..."
              : isSrtMultiMode
                ? "Tradu SRT in 9 limbi"
                : "Genereaza subtitrare"}
          </button>
        </form>

        {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}

        {downloadUrl ? (
          <div style={styles.result}>
            <a href={downloadUrl} download={downloadName} style={styles.downloadLink}>
              {downloadButtonLabel}
            </a>

            {resultMessage ? <p style={styles.resultMessage}>{resultMessage}</p> : null}

            {previewSrt ? (
              <>
                <p style={styles.previewTitle}>Preview (primele caractere):</p>
                <pre style={styles.preview}>{previewSrt}</pre>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "linear-gradient(120deg, #f8f7f2 0%, #f3ece4 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "760px",
    background: "#fffefb",
    border: "1px solid #e3d9ca",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 14px 50px rgba(67, 45, 22, 0.12)",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "28px",
    color: "#3a2311",
  },
  subtitle: {
    margin: "0 0 18px 0",
    color: "#6f5842",
    lineHeight: 1.5,
  },
  form: {
    display: "grid",
    gap: "12px",
  },
  label: {
    margin: 0,
    color: "#71573b",
    fontSize: "14px",
    fontWeight: 600,
  },
  select: {
    background: "#fff",
    padding: "10px",
    border: "1px solid #d8c8b3",
    borderRadius: "10px",
    color: "#3f2f1f",
  },
  fileInput: {
    background: "#fff",
    padding: "10px",
    border: "1px solid #d8c8b3",
    borderRadius: "10px",
  },
  fileLabel: {
    margin: 0,
    color: "#71573b",
    fontSize: "14px",
  },
  helperText: {
    margin: "0 0 4px 0",
    color: "#86684a",
    fontSize: "13px",
  },
  button: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    background: "#6d3a1a",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  error: {
    marginTop: "12px",
    color: "#b20e0e",
  },
  result: {
    marginTop: "20px",
    borderTop: "1px solid #e7ddcf",
    paddingTop: "16px",
  },
  downloadLink: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#2f7c5e",
    color: "white",
    textDecoration: "none",
    fontWeight: 600,
  },
  resultMessage: {
    marginTop: "12px",
    marginBottom: 0,
    color: "#3f2f1f",
    lineHeight: 1.4,
  },
  previewTitle: {
    marginTop: "16px",
    marginBottom: "8px",
    color: "#3a2311",
    fontWeight: 600,
  },
  preview: {
    margin: 0,
    whiteSpace: "pre-wrap",
    background: "#f7f2e9",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e3d9ca",
    maxHeight: "280px",
    overflow: "auto",
    color: "#3f2f1f",
  },
};
