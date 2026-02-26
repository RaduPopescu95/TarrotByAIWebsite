import { extractElaiErrorMessage } from "../utils/elaiStatusUtils";

const ELAI_API_BASE = "https://apis.elai.io/api/v1";
const HARDCODED_ELAI_TOKEN = "yB5iR69LtOdxenvBDcSw0roJYHCxXmhG";

function getElaiToken() {
  return process.env.ELAI_API_TOKEN || HARDCODED_ELAI_TOKEN;
}

function buildHeaders(includeJson = false) {
  return {
    accept: "application/json",
    ...(includeJson ? { "content-type": "application/json" } : {}),
    Authorization: `Bearer ${getElaiToken()}`,
  };
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = null;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    rawText: text,
  };
}

export async function getElaiVideo(videoId) {
  const response = await fetch(`${ELAI_API_BASE}/videos/${videoId}`, {
    method: "GET",
    headers: buildHeaders(false),
  });

  const parsed = await parseResponse(response);
  return {
    ...parsed,
    errorMessage:
      extractElaiErrorMessage(parsed?.data?.error) ||
      extractElaiErrorMessage(parsed?.data?.message) ||
      parsed.rawText ||
      "Unknown Elai error",
  };
}

export async function renderElaiVideo(videoId) {
  const response = await fetch(`${ELAI_API_BASE}/videos/render/${videoId}`, {
    method: "POST",
    headers: buildHeaders(false),
  });

  const parsed = await parseResponse(response);
  return {
    ...parsed,
    errorMessage:
      extractElaiErrorMessage(parsed?.data?.error) ||
      extractElaiErrorMessage(parsed?.data?.message) ||
      parsed.rawText ||
      "Unknown Elai error",
  };
}
