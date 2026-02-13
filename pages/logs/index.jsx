import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import LocalPasswordGate from "../../components/Dashboard/LocalPasswordGate";
import { fetchAdminUiLogs } from "../../src/features/video-library-admin/services/adminUiLogs.client";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const PAGE_SIZE = 50;

function formatDateTime(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleString("ro-RO");
}

function levelBadge(level) {
  if (level === "warn") {
    return <Badge variant="warning">warn</Badge>;
  }
  if (level === "error") {
    return <Badge className="border-transparent bg-red-100 text-red-800">error</Badge>;
  }
  return <Badge variant="secondary">info</Badge>;
}

export default function AdminUiLogsPage() {
  const [logs, setLogs] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async ({ reset } = { reset: false }) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError("");
    try {
      const response = await fetchAdminUiLogs({
        limit: PAGE_SIZE,
        cursor: reset ? null : cursor,
      });
      setLogs((prev) => (reset ? response.logs : [...prev, ...response.logs]));
      setCursor(response.nextCursor || null);
    } catch (err) {
      setError(err?.message || "Nu am putut încărca logurile.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadLogs({ reset: true });
  }, []);

  const uniqueEvents = useMemo(() => {
    const values = logs
      .map((item) => item?.event)
      .filter((eventName) => typeof eventName === "string" && eventName.trim().length > 0);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const lower = search.trim().toLowerCase();
    const fromMs = fromDate ? new Date(fromDate).getTime() : null;
    const toMs = toDate ? new Date(toDate).getTime() : null;

    return logs.filter((entry) => {
      const createdAtMs = typeof entry.createdAtMs === "number" ? entry.createdAtMs : null;
      if (levelFilter !== "all" && entry.level !== levelFilter) return false;
      if (eventFilter !== "all" && entry.event !== eventFilter) return false;
      if (fromMs !== null && (createdAtMs === null || createdAtMs < fromMs)) return false;
      if (toMs !== null && (createdAtMs === null || createdAtMs > toMs)) return false;
      if (!lower) return true;

      const searchable = [
        entry.message,
        entry.event,
        entry.source,
        entry.sessionId,
        entry.pagePath,
      ]
        .filter((value) => typeof value === "string")
        .join(" ")
        .toLowerCase();

      return searchable.includes(lower);
    });
  }, [logs, search, levelFilter, eventFilter, fromDate, toDate]);

  return (
    <>
      <Head>
        <title>Admin UI Logs</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate redirectTo="/dashboard/login" onGranted={() => {}}>
        <div className="min-h-screen bg-gray-50">
          <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            <Card className="shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">Admin UI Logs</CardTitle>
                <CardDescription>
                  Loguri persistente pentru investigarea fluxului de creare video.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[240px] flex-1">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
                      Caută
                    </label>
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Mesaj, event, sesiune, pagină..."
                    />
                  </div>

                  <div className="min-w-[140px]">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
                      Level
                    </label>
                    <select
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                    >
                      <option value="all">Toate</option>
                      <option value="info">Info</option>
                      <option value="warn">Warn</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div className="min-w-[220px]">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
                      Event
                    </label>
                    <select
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                    >
                      <option value="all">Toate</option>
                      {uniqueEvents.map((eventName) => (
                        <option key={eventName} value={eventName}>
                          {eventName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-[220px]">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
                      De la
                    </label>
                    <Input
                      type="datetime-local"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>

                  <div className="min-w-[220px]">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
                      Până la
                    </label>
                    <Input
                      type="datetime-local"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-gray-600">
                    Afișate: <span className="font-semibold text-gray-900">{filteredLogs.length}</span> /{" "}
                    {logs.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => loadLogs({ reset: true })}
                      disabled={loading}
                    >
                      {loading ? "Se încarcă..." : "Reîncarcă"}
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setLevelFilter("all");
                        setEventFilter("all");
                        setFromDate("");
                        setToDate("");
                      }}
                    >
                      Resetează filtre
                    </Button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="rounded-md border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timp</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Mesaj</TableHead>
                        <TableHead>Sesiune</TableHead>
                        <TableHead>Pagină</TableHead>
                        <TableHead className="text-right">Detalii</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-sm text-gray-500">
                            {loading ? "Se încarcă logurile..." : "Nu există loguri pentru filtrele selectate."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap text-sm text-gray-700">
                              {formatDateTime(entry.createdAtMs)}
                            </TableCell>
                            <TableCell>{levelBadge(entry.level)}</TableCell>
                            <TableCell className="max-w-[220px] truncate font-mono text-xs text-gray-700">
                              {entry.event || "—"}
                            </TableCell>
                            <TableCell className="max-w-[360px] truncate text-sm text-gray-700">
                              {entry.message || "—"}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate font-mono text-xs text-gray-600">
                              {entry.sessionId || "—"}
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate text-xs text-gray-600">
                              {entry.pagePath || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedLog(entry)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadLogs({ reset: false })}
                    disabled={!cursor || loadingMore}
                  >
                    {loadingMore ? "Se încarcă..." : cursor ? "Încarcă mai mult" : "Fără alte rezultate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>

        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalii log</DialogTitle>
              <DialogDescription>
                Inspectează payload-ul complet pentru evenimentul selectat.
              </DialogDescription>
            </DialogHeader>
            {selectedLog ? (
              <div className="space-y-3 px-6 pb-2">
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
                  <div>
                    <span className="font-semibold text-gray-900">ID:</span> {selectedLog.id}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Timp:</span>{" "}
                    {formatDateTime(selectedLog.createdAtMs)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Event:</span>{" "}
                    <code className="text-xs">{selectedLog.event}</code>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Level:</span> {selectedLog.level}
                  </div>
                </div>
                <div className="max-h-[420px] overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3">
                  <pre className="text-xs text-gray-700">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedLog(null)}>
                Închide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </LocalPasswordGate>
    </>
  );
}
