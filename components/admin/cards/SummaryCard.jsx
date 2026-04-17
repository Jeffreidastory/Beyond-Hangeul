import { useTheme } from "@/components/theme/ThemeProvider";

export default function SummaryCard({ icon, label, value, hint, tone = "slate", isLoading = false }) {
  const { isLight } = useTheme();
  const toneStyles = {
    slate: isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#13243d]",
    amber: isLight ? "border-amber-300/30 bg-amber-100" : "border-amber-400/30 bg-amber-500/10",
    emerald: isLight ? "border-emerald-300/30 bg-emerald-100" : "border-emerald-400/30 bg-emerald-500/10",
    sky: isLight ? "border-sky-300/30 bg-sky-100" : "border-sky-400/30 bg-sky-500/10",
  };

  return (
    <article className={`relative overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 ${isLight ? "hover:border-slate-300" : "hover:border-white/30"} ${toneStyles[tone] || toneStyles.slate}`}>
      {isLoading && <span className="pointer-events-none absolute inset-0 bg-white/10 origin-left animate-progress" />}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
        <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Overview</span>
      </div>
      <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-600" : "text-slate-400"}`}>{label}</p>
      <div className={`mt-2 ${isLight ? "text-slate-900" : "text-white"}`}>
        {isLoading ? (
          <div className="h-12 w-24 rounded-lg bg-slate-300/60 dark:bg-slate-700" />
        ) : (
          <p className="text-3xl font-bold">{value}</p>
        )}
      </div>
      {isLoading ? (
        <div className="mt-4 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#07223a] animate-bounce delay-0" />
          <span className="h-2 w-2 rounded-full bg-[#07223a] animate-bounce delay-150" />
          <span className="h-2 w-2 rounded-full bg-[#07223a] animate-bounce delay-300" />
        </div>
      ) : (
        hint ? <p className={`mt-2 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{hint}</p> : null
      )}
    </article>
  );
}
