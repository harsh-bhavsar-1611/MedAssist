import React, { useEffect, useMemo, useState } from "react";
import { FileUp, FileText, Loader2, Sparkles, TriangleAlert, Trash2 } from "lucide-react";
import { ApiError, apiFetch } from "../lib/api";

const ReportsPage = ({ onBack }) => {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState(null);

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const response = await apiFetch("/api/reports/");
      const items = response?.data?.reports || [];
      setReports(items);
      if (!selectedReport && items.length) {
        setSelectedReport(items[0]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load report history.");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedReportId = selectedReport?.id;
  useEffect(() => {
    if (!selectedReportId) return;
    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await apiFetch(`/api/reports/${selectedReportId}/`);
        const fullReport = response?.data?.report || null;
        if (fullReport) {
          setSelectedReport(fullReport);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load report detail.");
      } finally {
        setLoadingDetail(false);
      }
    };
    loadDetail();
  }, [selectedReportId]);

  const canSubmit = useMemo(() => files.length > 0 && !isUploading, [files.length, isUploading]);

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!files.length) {
      setError("Please select at least one report file.");
      return;
    }
    setError("");
    setSuccess("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      if (title.trim()) {
        formData.append("title", title.trim());
      }
      files.forEach((file) => formData.append("files", file));

      const response = await apiFetch("/api/reports/analyze/", {
        method: "POST",
        body: formData,
      });
      const report = response?.data?.report || null;
      if (report) {
        setSelectedReport(report);
      }
      setTitle("");
      setFiles([]);
      setSuccess(response?.message || "Report analyzed successfully.");
      await loadReports();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not analyze report.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    const confirmed = window.confirm("Delete this report analysis? This cannot be undone.");
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingReportId(reportId);
    try {
      await apiFetch(`/api/reports/${reportId}/`, { method: "DELETE" });
      setReports((prev) => {
        const next = prev.filter((item) => item.id !== reportId);
        if (selectedReport?.id === reportId) {
          setSelectedReport(next[0] || null);
        }
        return next;
      });
      setSuccess("Report deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete report.");
    } finally {
      setDeletingReportId(null);
    }
  };

  const renderInline = (text) => {
    const parts = String(text || "").split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      const strongMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (strongMatch) {
        return <strong key={`${idx}-${strongMatch[1]}`} className="font-semibold">{strongMatch[1]}</strong>;
      }
      return <span key={`${idx}-${part}`}>{part}</span>;
    });
  };

  const renderFormattedAnalysis = (analysisText) => {
    const text = String(analysisText || "").trim();
    if (!text) return <p className="text-sm text-slate-500">No analysis available.</p>;

    const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const sections = [];
    let current = null;

    for (const line of lines) {
      const headingMatch = line.match(/^(\d+[).]|#{1,3})\s*(.+)$/);
      if (headingMatch) {
        if (current) sections.push(current);
        current = { heading: headingMatch[2], items: [] };
        continue;
      }
      if (!current) current = { heading: "Summary", items: [] };
      current.items.push(line);
    }
    if (current) sections.push(current);

    return (
      <div className="space-y-3">
        {sections.map((section, idx) => (
          <article key={`${idx}-${section.heading}`} className="rounded-xl border border-slate-200 bg-white/80 p-3">
            <h4 className="text-sm font-bold text-slate-900">{section.heading}</h4>
            <div className="mt-2 space-y-1.5 text-sm text-slate-800">
              {section.items.map((line, itemIdx) => {
                const bullet = line.match(/^[-*]\s+(.+)$/);
                const ordered = line.match(/^(\d+)\.\s+(.+)$/);
                if (bullet) {
                  return (
                    <div key={`${itemIdx}-${line}`} className="flex gap-2">
                      <span className="mt-[2px] text-slate-500">•</span>
                      <span>{renderInline(bullet[1])}</span>
                    </div>
                  );
                }
                if (ordered) {
                  return (
                    <div key={`${itemIdx}-${line}`} className="flex gap-2">
                      <span className="text-slate-500">{ordered[1]}.</span>
                      <span>{renderInline(ordered[2])}</span>
                    </div>
                  );
                }
                return <p key={`${itemIdx}-${line}`}>{renderInline(line)}</p>;
              })}
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-300/40 px-4 py-3 md:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Medical Reports</p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Upload and Analyze Reports</h2>
          </div>
          <button onClick={onBack} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
            Back to Chat
          </button>
        </div>
      </div>

      <div className="mx-auto grid h-full w-full max-w-6xl gap-4 overflow-hidden p-4 md:grid-cols-[320px_1fr] md:px-8 md:py-6">
        <aside className="frost-panel flex h-full flex-col overflow-hidden rounded-2xl p-3">
          <form onSubmit={handleAnalyze} className="space-y-3 border-b border-slate-300/45 pb-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              New Analysis
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional title"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <FileUp className="h-4 w-4 text-blue-600" />
              <span>{files.length ? `${files.length} file(s) selected` : "Choose medical report files"}</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                accept=".txt,.csv,.json,.pdf,.docx,.png,.jpg,.jpeg,.webp"
              />
            </label>
            <button
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {isUploading ? "Analyzing..." : "Analyze Report"}
            </button>
          </form>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">History</p>
              <button onClick={loadReports} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
                {loadingReports ? "..." : "Refresh"}
              </button>
            </div>
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedReport?.id === report.id
                      ? "border-blue-300 bg-blue-50/70 text-blue-800"
                      : "border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => setSelectedReport(report)} className="min-w-0 flex-1 text-left">
                      <p className="truncate font-semibold">{report.title || `Report ${report.id}`}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{report.created_at ? new Date(report.created_at).toLocaleString() : "-"}</p>
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      disabled={deletingReportId === report.id}
                      className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {!reports.length && <p className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-500">No reports analyzed yet.</p>}
            </div>
          </div>
        </aside>

        <section className="frost-panel min-h-0 overflow-y-auto rounded-2xl p-4 md:p-5">
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <TriangleAlert className="h-4 w-4" />
              {error}
            </div>
          )}
          {success && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

          {!selectedReport ? (
            <div className="flex h-full min-h-[280px] items-center justify-center text-slate-500">
              Select a report to view analysis.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedReport.title || `Report ${selectedReport.id}`}</h3>
                  <button
                    onClick={() => handleDeleteReport(selectedReport.id)}
                    disabled={deletingReportId === selectedReport.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingReportId === selectedReport.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
                <p className="text-xs text-slate-500">{selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : "-"}</p>
                {selectedReport.file_names?.length ? (
                  <p className="mt-1 text-xs text-slate-600">Files: {selectedReport.file_names.join(", ")}</p>
                ) : null}
              </div>

              {loadingDetail ? (
                <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading full report...
                </div>
              ) : null}

              <article className="rounded-xl border border-slate-200 bg-white/75 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Analysis</p>
                {renderFormattedAnalysis(selectedReport.analysis)}
              </article>

              {selectedReport.warnings?.length ? (
                <article className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Parser Warnings</p>
                  <ul className="list-disc pl-4 text-sm text-amber-800">
                    {selectedReport.warnings.map((warning, idx) => (
                      <li key={`${idx}-${warning}`}>{warning}</li>
                    ))}
                  </ul>
                </article>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReportsPage;
