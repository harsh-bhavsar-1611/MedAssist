import React, { useMemo } from "react";
import { Users, BadgeCheck, ShieldCheck, MessageCircle, Activity, FileJson } from "lucide-react";
import { MetricCard } from "./MetricCard";

export const OverviewTab = ({ overview, loadingOverview, loadOverview }) => {
  const metrics = useMemo(() => overview?.metrics || {}, [overview]);

  return (
    <section className="space-y-4">
      <div className="frost-panel rounded-2xl p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Overview</h2>
          <button onClick={loadOverview} className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold">
            {loadingOverview ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard icon={Users} title="Total Users" value={metrics.total_users} tone="blue" />
          <MetricCard icon={BadgeCheck} title="Active Users" value={metrics.active_users} tone="emerald" />
          <MetricCard icon={ShieldCheck} title="Active Admins" value={metrics.active_admin_users} tone="indigo" />
          <MetricCard icon={MessageCircle} title="Total Messages" value={metrics.total_messages} tone="sky" />
          <MetricCard icon={Activity} title="Bot Messages" value={metrics.bot_messages} tone="violet" />
          <MetricCard icon={FileJson} title="Medical Entries" value={metrics.medical_entries} tone="amber" />
        </div>
      </div>
    </section>
  );
};
