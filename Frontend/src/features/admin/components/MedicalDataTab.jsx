import React, { useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export const MedicalDataTab = ({
  medicalRows,
  expandedRows,
  medicalStats,
  medicalForm,
  loadingMedical,
  savingMedical,
  medicalPage, setMedicalPage,
  medicalRowsPerPage,
  medicalVersions,
  loadingVersions,
  versionPage, setVersionPage,
  versionPagination,
  restoringVersionId,
  loadMedicalRows,
  saveMedicalData,
  onMedicalFormChange,
  addMedicalEntry,
  deleteMedicalEntry,
  toggleRowExpanded,
  restoreMedicalVersion,
  loadMedicalVersions
}) => {
  const pagedMedicalRows = useMemo(() => {
    const start = (medicalPage - 1) * medicalRowsPerPage;
    return medicalRows.slice(start, start + medicalRowsPerPage);
  }, [medicalRows, medicalPage, medicalRowsPerPage]);

  const medicalTotalPages = useMemo(
    () => Math.max(1, Math.ceil((medicalRows?.length || 0) / medicalRowsPerPage)),
    [medicalRows, medicalRowsPerPage]
  );

  return (
    <section className="space-y-4">
      <div className="frost-panel rounded-2xl p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-xl font-bold">Medical JSON Manager</h2>
          <span className="text-xs text-slate-500">Entries: {medicalStats?.entries ?? medicalRows.length}</span>
          <button onClick={loadMedicalRows} className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm font-semibold">
            {loadingMedical ? "Loading..." : "Reload"}
          </button>
          <button onClick={saveMedicalData} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 transition">
            {savingMedical ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:p-4">
          <p className="mb-3 text-sm font-semibold">Add New Record</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={medicalForm.symptoms}
              onChange={(event) => onMedicalFormChange("symptoms", event.target.value)}
              placeholder="Symptoms (comma separated)"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <input
              value={medicalForm.medications}
              onChange={(event) => onMedicalFormChange("medications", event.target.value)}
              placeholder="Medications (comma separated)"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <input
              value={medicalForm.possible_diagnosis}
              onChange={(event) => onMedicalFormChange("possible_diagnosis", event.target.value)}
              placeholder="Possible diagnosis"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <input
              value={medicalForm.advice}
              onChange={(event) => onMedicalFormChange("advice", event.target.value)}
              placeholder="Advice"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <button onClick={addMedicalEntry} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            Add Entry
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/70">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Diagnosis</th>
                <th className="px-3 py-2">Symptoms</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedMedicalRows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 font-semibold">{row.id}</td>
                    <td className="px-3 py-2">{row.possible_diagnosis}</td>
                    <td className="px-3 py-2">{(row.symptoms || []).slice(0, 3).join(", ")}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleRowExpanded(row.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold"
                        >
                          {expandedRows[row.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          View More
                        </button>
                        <button
                          onClick={() => deleteMedicalEntry(row.id)}
                          className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows[row.id] && (
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <td colSpan={4} className="px-3 py-3">
                        <div className="grid gap-2 text-xs md:grid-cols-2">
                          <DetailItem label="Symptoms" value={(row.symptoms || []).join(", ")} />
                          <DetailItem label="Diagnosis" value={row.possible_diagnosis} />
                          <DetailItem label="Advice" value={row.advice} />
                          <DetailItem label="Medications" value={(row.medications || []).join(", ")} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            disabled={medicalPage <= 1}
            onClick={() => setMedicalPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-slate-600">
            Page {medicalPage} of {medicalTotalPages}
          </span>
          <button
            disabled={medicalPage >= medicalTotalPages}
            onClick={() => setMedicalPage((prev) => Math.min(medicalTotalPages, prev + 1))}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Version History</p>
            <button
              onClick={() => loadMedicalVersions(versionPage)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold"
            >
              {loadingVersions ? "Loading..." : "Refresh"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="px-2 py-2">Version</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2">By</th>
                  <th className="px-2 py-2">Entries</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {medicalVersions.map((version) => (
                  <tr key={version.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">#{version.id}</td>
                    <td className="px-2 py-2">{version.created_at ? new Date(version.created_at).toLocaleString() : "-"}</td>
                    <td className="px-2 py-2">{version.actor_email || "system"}</td>
                    <td className="px-2 py-2">{version.entries || 0}</td>
                    <td className="px-2 py-2">
                      <button
                        disabled={restoringVersionId === version.id}
                        onClick={() => restoreMedicalVersion(version.id)}
                        className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 disabled:opacity-50"
                      >
                        {restoringVersionId === version.id ? "Restoring..." : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              disabled={versionPagination.page <= 1}
              onClick={() => setVersionPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-slate-300 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-slate-600">
              Page {versionPagination.page || 1} of {versionPagination.total_pages || 1}
            </span>
            <button
              disabled={(versionPagination.page || 1) >= (versionPagination.total_pages || 1)}
              onClick={() => setVersionPage((prev) => Math.min(versionPagination.total_pages || 1, prev + 1))}
              className="rounded-lg border border-slate-300 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2">
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className="mt-1 text-xs text-slate-700">{value || "-"}</p>
  </div>
);
