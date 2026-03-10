import React from "react";
import { Database, FileJson, Wrench } from "lucide-react";

export const HealthTab = ({ health, loadingHealth, probeModel, setProbeModel, loadHealth }) => {
  return (
    <section className="frost-panel rounded-2xl p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-xl font-bold">System Health</h2>
        <label className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-2 py-1 text-xs">
          <input type="checkbox" checked={probeModel} onChange={(event) => setProbeModel(event.target.checked)} />
          Run model probe
        </label>
        <button onClick={() => loadHealth(probeModel)} className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm font-semibold">
          {loadingHealth ? "Checking..." : "Check Health"}
        </button>
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <p className={`text-sm font-bold ${health?.status === "healthy" ? "text-emerald-700" : "text-amber-700"}`}>
          Overall: {(health?.status || "-").toUpperCase()}
        </p>
        <p className="mt-1 text-xs text-slate-600">Fallback replies: {health?.response_quality?.fallback_reply_count ?? "-"}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <HealthCard title="Database" icon={Database} check={health?.checks?.database} />
        <HealthCard title="Medical JSON" icon={FileJson} check={health?.checks?.medical_json} />
        <HealthCard title="Model Config" icon={Wrench} check={health?.checks?.model_config} />
      </div>

      {health?.probe && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Live Model Probe</p>
          <p className={`mt-2 text-sm font-semibold ${health.probe.ok ? "text-emerald-700" : "text-red-700"}`}>
            {health.probe.ok ? "Success" : "Failed"}
          </p>
          <p className="mt-1 text-sm text-slate-700">{health.probe.detail}</p>
        </div>
      )}
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recent Errors</p>
        {!health?.recent_errors?.length ? (
          <p className="mt-2 text-sm text-slate-500">No recent admin/system errors logged.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {health.recent_errors.map((err) => (
              <article key={err.id} className="rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-2">
                <p className="text-xs font-semibold text-red-700">{err.action}</p>
                <p className="text-[11px] text-red-600">{err.created_at ? new Date(err.created_at).toLocaleString() : "-"}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const HealthCard = ({ title, icon, check }) => {
  const IconComponent = icon;
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex items-center gap-2">
        <IconComponent className="h-4 w-4 text-slate-600" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className={`mt-2 text-sm font-bold ${check?.ok ? "text-emerald-700" : "text-red-700"}`}>{check?.ok ? "OK" : "Issue"}</p>
      <p className="mt-1 text-xs text-slate-600">{check?.detail || "-"}</p>
    </article>
  );
};

export const AuditTab = ({ auditLogs, auditLoading, auditPage, setAuditPage, auditPagination, loadAuditLogs }) => {
  return (
    <section className="frost-panel rounded-2xl p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Audit Logs</h2>
        <button onClick={() => loadAuditLogs(auditPage)} className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm font-semibold">
          {auditLoading ? "Loading..." : "Refresh"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/70">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 align-top">
                <td className="px-3 py-2 text-xs">{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                <td className="px-3 py-2 text-xs">{log.actor_email || "system"}</td>
                <td className="px-3 py-2 text-xs font-semibold">{log.action}</td>
                <td className="px-3 py-2 text-xs">{log.entity_type}:{log.entity_id || "-"}</td>
                <td className="px-3 py-2 text-xs">
                  <pre className="max-w-[420px] overflow-x-auto whitespace-pre-wrap text-[11px]">{JSON.stringify(log.details || {}, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          disabled={auditPagination.page <= 1}
          onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
          className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-xs text-slate-600">
          Page {auditPagination.page || 1} of {auditPagination.total_pages || 1}
        </span>
        <button
          disabled={(auditPagination.page || 1) >= (auditPagination.total_pages || 1)}
          onClick={() => setAuditPage((prev) => Math.min(auditPagination.total_pages || 1, prev + 1))}
          className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
};
