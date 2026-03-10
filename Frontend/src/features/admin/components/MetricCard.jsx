import React from "react";

export const MetricCard = ({ icon, title, value, tone }) => {
  const IconComponent = icon;
  const toneClasses = {
    blue: "from-blue-500/20 to-cyan-500/5 border-blue-200/70",
    emerald: "from-emerald-500/20 to-green-500/5 border-emerald-200/70",
    indigo: "from-indigo-500/20 to-blue-500/5 border-indigo-200/70",
    sky: "from-sky-500/20 to-blue-500/5 border-sky-200/70",
    violet: "from-violet-500/20 to-indigo-500/5 border-violet-200/70",
    amber: "from-amber-500/20 to-yellow-500/5 border-amber-200/70",
  };

  return (
    <article className={`rounded-xl border bg-gradient-to-br p-3 ${toneClasses[tone] || toneClasses.blue}`}>
      <div className="flex items-center gap-2">
        <IconComponent className="h-4 w-4 text-slate-700" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{title}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value ?? "-"}</p>
    </article>
  );
};

export const SmallStat = ({ label, value }) => (
  <article className="rounded-xl border border-slate-200 bg-white/70 p-3">
    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-bold">{value ?? "-"}</p>
  </article>
);
