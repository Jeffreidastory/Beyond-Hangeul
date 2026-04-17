import { useTheme } from "@/components/theme/ThemeProvider";

export default function QuickActionsCard({ actions = [], isLoading = false }) {
  const { isLight } = useTheme();
  return (
    <section className={`relative overflow-hidden rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
      {isLoading && <span className="pointer-events-none absolute inset-0 bg-white/10 origin-left animate-progress" />}
      <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Quick Actions</h3>
      <p className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Jump to common admin tasks in one click.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-slate-100" : "border-white/15 bg-[#13243d]"}`}
              >
                <div className="h-3 w-3 rounded-full bg-slate-300/60 dark:bg-slate-700" />
                <div className="mt-3 h-4 w-24 rounded-lg bg-slate-300/60 dark:bg-slate-700" />
              </div>
            ))
          : actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={action.onClick}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${isLight ? "border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200" : "border-white/15 bg-[#13243d] text-slate-100 hover:border-amber-300/60 hover:bg-[#1a2d48]"}`}
              >
                <span className="text-lg" aria-hidden="true">
                  {action.icon}
                </span>
                <span>{action.label}</span>
              </button>
            ))}
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
