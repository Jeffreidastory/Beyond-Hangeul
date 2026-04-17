import { useTheme } from "@/components/theme/ThemeProvider";

export default function ModuleOverviewCard({ freeCount = 0, premiumCount = 0, mostPurchased = "-", isLoading = false }) {
  const { isLight } = useTheme();
  return (
    <section className={`relative overflow-hidden rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
      {isLoading && <span className="pointer-events-none absolute inset-0 bg-white/10 origin-left animate-progress" />}
      <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Module Overview</h3>
      <p className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Distribution and best-performing module.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isLight ? "border-emerald-300/40 bg-emerald-100 text-emerald-700" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"}`}>
          {isLoading ? <span className="inline-block h-5 w-12 rounded-full bg-slate-300/60 dark:bg-slate-700" /> : `Free: ${freeCount}`}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isLight ? "border-amber-300/40 bg-amber-100 text-amber-800" : "border-amber-400/40 bg-amber-500/10 text-amber-300"}`}>
          {isLoading ? <span className="inline-block h-5 w-14 rounded-full bg-slate-300/60 dark:bg-slate-700" /> : `Premium: ${premiumCount}`}
        </span>
      </div>

      <div className={`mt-4 rounded-xl border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
        <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Most Purchased</p>
        {isLoading ? (
          <div className="mt-1 h-6 w-32 rounded-lg bg-slate-300/60 dark:bg-slate-700" />
        ) : (
          <p className={`mt-1 text-base font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{mostPurchased}</p>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#07223a] animate-bounce delay-0" />
          <span className="h-2 w-2 rounded-full bg-[#07223a] animate-bounce delay-150" />
          <span className="h-2 w-2 rounded-full bg-[#07223a] animate-bounce delay-300" />
        </div>
      )}
    </section>
  );
}
