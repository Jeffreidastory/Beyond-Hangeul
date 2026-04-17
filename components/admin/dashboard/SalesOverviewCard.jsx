import { useTheme } from "@/components/theme/ThemeProvider";

function formatPeso(value) {
  return `P${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SalesOverviewCard({ todayRevenue = 0, weekRevenue = 0, monthRevenue = 0, totalRevenue = 0, isLoading = false }) {
  const { isLight } = useTheme();
  const items = [
    { key: "today", label: "Today Revenue", value: todayRevenue },
    { key: "week", label: "This Week Revenue", value: weekRevenue },
    { key: "month", label: "This Month Revenue", value: monthRevenue },
  ];

  return (
    <section className={`relative overflow-hidden rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
      {isLoading && <span className="pointer-events-none absolute inset-0 bg-white/10 origin-left animate-progress" />}
      <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Sales Overview</h3>
      <p className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Simple summary, ready for chart integration later.</p>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.key} className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
            <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-600" : "text-slate-400"}`}>{item.label}</p>
            {isLoading ? (
              <div className="mt-2 h-10 w-32 rounded-lg bg-slate-300/60 dark:bg-slate-700" />
            ) : (
              <p className={`mt-1 text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{formatPeso(item.value)}</p>
            )}
          </div>
        ))}
      </div>

      <div className={`mt-4 rounded-xl border p-3 ${isLight ? "border-amber-300/30 bg-amber-100" : "border-amber-400/30 bg-amber-500/10"}`}>
        <p className={`text-xs uppercase tracking-wide ${isLight ? "text-amber-700" : "text-amber-200"}`}>Total Revenue</p>
        {isLoading ? (
          <div className="mt-2 h-12 w-40 rounded-lg bg-slate-300/60 dark:bg-slate-700" />
        ) : (
          <p className={`mt-1 text-2xl font-bold ${isLight ? "text-amber-900" : "text-amber-100"}`}>{formatPeso(totalRevenue)}</p>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#07223a] animate-bounce delay-0" />
          <span className="h-2 w-2 rounded-full bg-[#07223a] animate-bounce delay-150" />
          <span className="h-2 w-2 rounded-full bg-[#07223a] animate-bounce delay-300" />
        </div>
      )}
    </section>
  );
}
