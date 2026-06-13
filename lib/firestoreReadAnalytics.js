export const READ_ANALYTICS_DAYS = [1, 7, 14, 30];
export const DEFAULT_READ_ANALYTICS_DAYS = 7;
export const MAX_READ_ANALYTICS_DOCS = 5000;

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textValue(value, fallback = "unknown") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function parseReadAnalyticsParams(query = {}) {
  const parsedDays = Number.parseInt(String(firstValue(query.days) || ""), 10);
  const days = READ_ANALYTICS_DAYS.includes(parsedDays)
    ? parsedDays
    : DEFAULT_READ_ANALYTICS_DAYS;
  const requestedSource = String(firstValue(query.source) || "all").toLowerCase();
  const source = ["all", "next", "expo"].includes(requestedSource)
    ? requestedSource
    : "all";
  const search = String(firstValue(query.search) || "").trim().toLowerCase();
  return { days, source, search };
}

export function getReadAnalyticsStartDate(days, now = new Date()) {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - Math.max(days - 1, 0));
  return start.toISOString().slice(0, 10);
}

function snapshotRows(snapshot) {
  return (snapshot?.docs || []).map((docSnap) => ({
    id: docSnap.id,
    ...(typeof docSnap.data === "function" ? docSnap.data() || {} : {}),
  }));
}

async function loadCollectionRows(db, collectionName, startDate, limit) {
  const snapshot = await db
    .collection(collectionName)
    .where("date", ">=", startDate)
    .limit(limit + 1)
    .get();
  const rows = snapshotRows(snapshot);
  return {
    rows: rows.slice(0, limit),
    truncated: rows.length > limit,
  };
}

function addToMap(map, key, initial, update) {
  const current = map.get(key) || { ...initial };
  update(current);
  map.set(key, current);
}

function matchesSearch(values, search) {
  if (!search) return true;
  return values.some((value) => String(value || "").toLowerCase().includes(search));
}

function aggregateNext(rows, search) {
  const routeMap = new Map();
  const queryMap = new Map();
  const trendMap = new Map();

  for (const row of rows) {
    if (row.kind === "route") {
      if (!matchesSearch([row.route], search)) continue;
      const route = textValue(row.route);
      addToMap(
        routeMap,
        route,
        {
          route,
          observedRequests: 0,
          totalRequestDurationMs: 0,
          responseErrorCount: 0,
          publicCacheRequests: 0,
          noPublicCacheRequests: 0,
        },
        (target) => {
          target.observedRequests += numberValue(row.observedRequests);
          target.totalRequestDurationMs += numberValue(row.totalRequestDurationMs);
          target.responseErrorCount += numberValue(row.responseErrorCount);
          target.publicCacheRequests += numberValue(row.publicCacheRequests);
          target.noPublicCacheRequests += numberValue(row.noPublicCacheRequests);
        }
      );
      continue;
    }
    if (row.kind !== "query") continue;
    if (!matchesSearch([row.route, row.page, row.queryName], search)) continue;

    const route = textValue(row.route);
    const queryName = textValue(row.queryName);
    const key = `${route}::${queryName}`;
    addToMap(
      queryMap,
      key,
      {
        route,
        page: textValue(row.page),
        queryName,
        sampleRate: numberValue(row.sampleRate) || 0.1,
        requestSamples: 0,
        operationCount: 0,
        queryCount: 0,
        docsReturned: 0,
        observedEstimatedReads: 0,
        projectedEstimatedReads: 0,
        totalDurationMs: 0,
        errorCount: 0,
        cacheHits: 0,
        repeatedRequestCount: 0,
      },
      (target) => {
        target.requestSamples += numberValue(row.requestSamples);
        target.operationCount += numberValue(row.operationCount);
        target.queryCount += numberValue(row.queryCount);
        target.docsReturned += numberValue(row.docsReturned);
        const observedReads = numberValue(row.estimatedReads);
        const rowSampleRate = numberValue(row.sampleRate) || 0.1;
        target.observedEstimatedReads += observedReads;
        target.projectedEstimatedReads += observedReads / rowSampleRate;
        target.totalDurationMs += numberValue(row.totalDurationMs);
        target.errorCount += numberValue(row.errorCount);
        target.cacheHits += numberValue(row.cacheHits);
        target.repeatedRequestCount += numberValue(row.repeatedRequestCount);
      }
    );

    const date = textValue(row.date, "");
    if (date) {
      addToMap(
        trendMap,
        date,
        { date, nextObservedReads: 0, nextProjectedReads: 0, expoEstimatedReads: 0 },
        (target) => {
          const observed = numberValue(row.estimatedReads);
          const sampleRate = numberValue(row.sampleRate) || 0.1;
          target.nextObservedReads += observed;
          target.nextProjectedReads += observed / sampleRate;
        }
      );
    }
  }

  const queries = Array.from(queryMap.values())
    .map((row) => ({
      ...row,
      projectedEstimatedReads: Math.round(row.projectedEstimatedReads),
      readsPerRequest:
        row.requestSamples > 0 ? row.observedEstimatedReads / row.requestSamples : 0,
      queriesPerRequest: row.requestSamples > 0 ? row.queryCount / row.requestSamples : 0,
      averageDurationMs: row.operationCount > 0 ? row.totalDurationMs / row.operationCount : 0,
      cacheHitRate: row.operationCount > 0 ? row.cacheHits / row.operationCount : 0,
      confidence: row.requestSamples >= 100 ? "high" : row.requestSamples >= 20 ? "medium" : "low",
    }))
    .sort((left, right) => right.projectedEstimatedReads - left.projectedEstimatedReads);

  const routeQueryTotals = new Map();
  queries.forEach((row) => {
    addToMap(
      routeQueryTotals,
      row.route,
      { observedEstimatedReads: 0, projectedEstimatedReads: 0, queryCount: 0 },
      (target) => {
        target.observedEstimatedReads += row.observedEstimatedReads;
        target.projectedEstimatedReads += row.projectedEstimatedReads;
        target.queryCount += row.queryCount;
      }
    );
  });

  const routes = Array.from(routeMap.values())
    .map((row) => {
      const totals = routeQueryTotals.get(row.route) || {};
      return {
        ...row,
        ...totals,
        averageRequestDurationMs:
          row.observedRequests > 0 ? row.totalRequestDurationMs / row.observedRequests : 0,
        publicCacheRate:
          row.observedRequests > 0 ? row.publicCacheRequests / row.observedRequests : 0,
      };
    })
    .sort((left, right) =>
      numberValue(right.projectedEstimatedReads) - numberValue(left.projectedEstimatedReads)
    );

  return { routes, queries, trendMap };
}

function aggregateExpo(rows, search, trendMap) {
  const map = new Map();
  for (const row of rows) {
    if (!matchesSearch([row.screenName, row.collectionName, row.collectionPathPattern], search)) {
      continue;
    }
    const screenName = textValue(row.screenName);
    const collectionPathPattern = textValue(row.collectionPathPattern);
    const key = `${screenName}::${collectionPathPattern}`;
    addToMap(
      map,
      key,
      {
        screenName,
        collectionName: textValue(row.collectionName),
        collectionPathPattern,
        logicalReadCalls: 0,
        docReadCalls: 0,
        queryReadCalls: 0,
        serverReadCalls: 0,
        estimatedServerDocReads: 0,
        cacheHits: 0,
        realtimeSubscriptions: 0,
        realtimeSnapshots: 0,
      },
      (target) => {
        target.logicalReadCalls += numberValue(row.logicalReadCalls);
        target.docReadCalls += numberValue(row.docReadCalls);
        target.queryReadCalls += numberValue(row.queryReadCalls);
        target.serverReadCalls += numberValue(row.serverReadCalls);
        target.estimatedServerDocReads += numberValue(row.estimatedServerDocReads);
        target.cacheHits += numberValue(row.cacheHits);
        target.realtimeSubscriptions += numberValue(row.realtimeSubscriptions);
        target.realtimeSnapshots += numberValue(row.realtimeSnapshots);
      }
    );

    const date = textValue(row.date, "");
    if (date) {
      addToMap(
        trendMap,
        date,
        { date, nextObservedReads: 0, nextProjectedReads: 0, expoEstimatedReads: 0 },
        (target) => {
          target.expoEstimatedReads += numberValue(row.estimatedServerDocReads);
        }
      );
    }
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      cacheHitRate:
        row.logicalReadCalls > 0 ? row.cacheHits / row.logicalReadCalls : 0,
    }))
    .sort((left, right) => right.estimatedServerDocReads - left.estimatedServerDocReads);
}

export function buildReadCostRecommendations({ nextRoutes, nextQueries, expoRows }) {
  const recommendations = [];
  nextQueries.forEach((row) => {
    if (row.queriesPerRequest >= 5) {
      recommendations.push({
        severity: "high",
        type: "n_plus_one",
        source: "next",
        target: `${row.route} · ${row.queryName}`,
        message: `${row.queriesPerRequest.toFixed(1)} operații/query per request indică posibil N+1.`,
      });
    }
    if (row.readsPerRequest >= 20) {
      recommendations.push({
        severity: "high",
        type: "high_reads_per_request",
        source: "next",
        target: `${row.route} · ${row.queryName}`,
        message: `${row.readsPerRequest.toFixed(1)} citiri estimate per request.`,
      });
    }
    if (row.repeatedRequestCount > 0) {
      recommendations.push({
        severity: "medium",
        type: "repeated_query",
        source: "next",
        target: `${row.route} · ${row.queryName}`,
        message: `Același query a fost repetat în ${row.repeatedRequestCount} request-uri eșantionate.`,
      });
    }
    if (row.requestSamples >= 20 && row.cacheHitRate <= 0.2) {
      recommendations.push({
        severity: "medium",
        type: "low_cache_hit",
        source: "next",
        target: `${row.route} · ${row.queryName}`,
        message: `Cache hit rate ${(row.cacheHitRate * 100).toFixed(0)}% după ${row.requestSamples} samples.`,
      });
    }
  });

  nextRoutes.forEach((row) => {
    if (row.observedRequests >= 20 && row.publicCacheRate === 0 && !/purchased|playback/i.test(row.route)) {
      recommendations.push({
        severity: "medium",
        type: "missing_http_cache",
        source: "next",
        target: row.route,
        message: "Endpoint observat fără cache HTTP public.",
      });
    }
  });

  expoRows.forEach((row) => {
    if (row.realtimeSnapshots >= 20 || row.realtimeSubscriptions >= 20) {
      recommendations.push({
        severity: "high",
        type: "realtime_volume",
        source: "expo",
        target: `${row.screenName} · ${row.collectionPathPattern}`,
        message: `${row.realtimeSnapshots || row.realtimeSubscriptions} evenimente realtime observate.`,
      });
    }
  });

  const severityRank = { high: 0, medium: 1, low: 2 };
  return recommendations
    .sort((left, right) => severityRank[left.severity] - severityRank[right.severity])
    .slice(0, 50);
}

export async function loadFirestoreReadAnalytics(db, options = {}) {
  const startedAt = Date.now();
  const { days, source, search } = parseReadAnalyticsParams(options);
  const startDate = getReadAnalyticsStartDate(days);
  const shouldLoadNext = source === "all" || source === "next";
  const shouldLoadExpo = source === "all" || source === "expo";
  const perSourceLimit = source === "all" ? Math.floor(MAX_READ_ANALYTICS_DOCS / 2) : MAX_READ_ANALYTICS_DOCS;

  const [nextResult, expoResult] = await Promise.all([
    shouldLoadNext
      ? loadCollectionRows(db, "FirestoreReadTelemetryDaily", startDate, perSourceLimit)
      : Promise.resolve({ rows: [], truncated: false }),
    shouldLoadExpo
      ? loadCollectionRows(db, "ReadTelemetryDaily", startDate, perSourceLimit)
      : Promise.resolve({ rows: [], truncated: false }),
  ]);

  const next = aggregateNext(nextResult.rows, search);
  const expo = aggregateExpo(expoResult.rows, search, next.trendMap);
  const trend = Array.from(next.trendMap.values()).sort((left, right) =>
    left.date.localeCompare(right.date)
  );
  const summary = {
    nextObservedReads: next.queries.reduce((sum, row) => sum + row.observedEstimatedReads, 0),
    nextProjectedReads: next.queries.reduce((sum, row) => sum + row.projectedEstimatedReads, 0),
    nextSampledRequests: next.routes.reduce((sum, row) => sum + row.observedRequests, 0),
    expoEstimatedReads: expo.reduce((sum, row) => sum + row.estimatedServerDocReads, 0),
    expoLogicalReadCalls: expo.reduce((sum, row) => sum + row.logicalReadCalls, 0),
    realtimeSubscriptions: expo.reduce((sum, row) => sum + row.realtimeSubscriptions, 0),
    realtimeSnapshots: expo.reduce((sum, row) => sum + row.realtimeSnapshots, 0),
  };

  return {
    summary,
    trend,
    next: { routes: next.routes, queries: next.queries },
    expo: { rows: expo },
    recommendations: buildReadCostRecommendations({
      nextRoutes: next.routes,
      nextQueries: next.queries,
      expoRows: expo,
    }),
    meta: {
      days,
      source,
      search,
      startDate,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      documentLimit: MAX_READ_ANALYTICS_DOCS,
      documentsScanned: nextResult.rows.length + expoResult.rows.length,
      truncated: nextResult.truncated || expoResult.truncated,
      nextSampleRate: 0.1,
      estimationMethod: "sampled_document_reads",
    },
  };
}
