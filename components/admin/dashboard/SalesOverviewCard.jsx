function formatPeso(value) {
  return `P${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SalesOverviewCard({ todayRevenue = 0, weekRevenue = 0, monthRevenue = 0, totalRevenue = 0 }) {
  const items = [
    { key: "today", label: "Today Revenue", value: todayRevenue },
    { key: "week", label: "This Week Revenue", value: weekRevenue },
    { key: "month", label: "This Month Revenue", value: monthRevenue },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
      <h3 className="text-lg font-semibold text-white">Sales Overview</h3>
      <p className="mt-1 text-sm text-slate-400">Simple summary, ready for chart integration later.</p>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.key} className="rounded-xl border border-white/10 bg-[#13243d] p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-white">{formatPeso(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
        <p className="text-xs uppercase tracking-wide text-amber-200">Total Revenue</p>
        <p className="mt-1 text-2xl font-bold text-amber-100">{formatPeso(totalRevenue)}</p>
      </div>
    </section>
  );
}
