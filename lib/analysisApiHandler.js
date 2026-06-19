import { getOptionalAuth } from "./requireAuth";
import {
  AnalysisStoreError,
  deleteAnalysis,
  getAnalysisDetail,
  resolveRequestIdentity,
  searchAnalyses,
  updateAnalysis,
  upsertAnalysis,
} from "./analysisStore";

export const analysisApiConfig = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
    responseLimit: "8mb",
  },
};

const buildRequestId = () =>
  `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const methodNotAllowed = (res, method) => {
  res.setHeader("Allow", method);
  return res.status(405).json({ error: "Method not allowed" });
};

const run = async (req, res, allowedMethod, action) => {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (req.method !== allowedMethod) return methodNotAllowed(res, allowedMethod);

  try {
    const decoded = await getOptionalAuth(req);
    const identity = resolveRequestIdentity(req.body || {}, decoded);
    const result = await action(identity);
    return res.status(200).json({ ...result, requestId });
  } catch (error) {
    const statusCode =
      error instanceof AnalysisStoreError
        ? error.statusCode
        : Number(error?.statusCode) || 500;
    console.error("[mobile/analyses] request failed", {
      requestId,
      statusCode,
      code: error?.code || "internal_error",
      message: error?.message || String(error),
    });
    return res.status(statusCode).json({
      error: statusCode >= 500 ? "Analysis request failed" : error.message,
      code: error?.code || "internal_error",
      requestId,
    });
  }
};

export const handleImport = (req, res) =>
  run(req, res, "POST", async (identity) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) {
      throw new AnalysisStoreError("Import items are required", 400, "empty_import");
    }
    const imported = [];
    for (const item of items) {
      imported.push(
        await upsertAnalysis({
          family: item?.family,
          analysis: item?.analysis,
          identity,
        })
      );
    }
    return { imported, persisted: imported.every((item) => item.persisted) };
  });

export const handleUpsert = (req, res) =>
  run(req, res, "POST", async (identity) =>
    upsertAnalysis({
      family: req.body?.family,
      analysis: req.body?.analysis,
      identity,
    })
  );

export const handleSearch = (req, res) =>
  run(req, res, "POST", async (identity) => ({
    analyses: await searchAnalyses({
      identity,
      families: req.body?.families,
    }),
  }));

export const handleDetail = (req, res) =>
  run(req, res, "POST", async (identity) => ({
    analysis: await getAnalysisDetail({
      family: req.body?.family,
      analysisId: req.body?.analysisId,
      identity,
    }),
  }));

export const handleUpdate = (req, res) =>
  run(req, res, "PATCH", async (identity) =>
    updateAnalysis({
      family: req.body?.family,
      analysisId: req.body?.analysisId,
      patch: req.body?.patch,
      identity,
    })
  );

export const handleDelete = (req, res) =>
  run(req, res, "DELETE", async (identity) =>
    deleteAnalysis({
      family: req.body?.family,
      analysisId: req.body?.analysisId,
      identity,
    })
  );
