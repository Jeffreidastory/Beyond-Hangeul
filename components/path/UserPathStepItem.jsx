import { useTheme } from "@/components/theme/ThemeProvider";
import { PATH_STEP_TYPE } from "@/types/dashboardModels";

export default function UserPathStepItem({ step, index, status, onViewDetails }) {
  const { isLight } = useTheme();
  const typeBadge = {
    [PATH_STEP_TYPE.MODULE]: isLight
      ? "border-amber-300 bg-amber-100 text-amber-900"
      : "border-amber-400/40 bg-amber-500/10 text-amber-200",
    [PATH_STEP_TYPE.WORKSHEET]: isLight
      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
      : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
    [PATH_STEP_TYPE.INFO]: isLight
      ? "border-sky-300 bg-sky-100 text-sky-900"
      : "border-sky-400/40 bg-sky-500/10 text-sky-200",
  };
  const enabledTypes = Array.isArray(step.enabledTypes) && step.enabledTypes.length
    ? step.enabledTypes
    : [step.type || PATH_STEP_TYPE.INFO];

  const statusTone =
    status === "completed"
      ? "border-emerald-400/35 bg-emerald-500/10"
      : status === "current"
        ? "border-amber-400/45 bg-amber-500/10"
        : isLight
          ? "border-slate-200 bg-slate-50"
          : "border-white/10 bg-[#13243d]/70 opacity-80";

  return (
    <article className={`rounded-xl border p-4 ${statusTone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${isLight ? "border-slate-300 bg-slate-100 text-slate-700" : "border-white/20 bg-[#0f1d32] text-slate-200"}`}>Step {index + 1}</span>
          <div className="flex flex-wrap items-center gap-1">
            {enabledTypes.map((type) => (
              <span key={`${step.id || index}-${type}`} className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${typeBadge[type] || typeBadge[PATH_STEP_TYPE.INFO]}`}>
                {type || "info"}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xs text-slate-400">
          {status === "completed" ? "Completed" : status === "current" ? "Current" : "Locked"}
        </span>
      </div>

      <h3 className={`mt-2 text-base font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{step.title || "Untitled Step"}</h3>
      <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{step.description || step.infoContent || "No details yet."}</p>

      <div className="mt-3">
        <button
          type="button"
          onClick={onViewDetails}
          className={`inline-flex rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold ${isLight ? "text-sky-700" : "text-sky-200"} hover:bg-sky-500/20`}
        >
          View Details
        </button>
      </div>
    </article>
  );
}
