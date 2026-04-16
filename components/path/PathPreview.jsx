import { useTheme } from "@/components/theme/ThemeProvider";
import { PATH_STEP_TYPE } from "@/types/dashboardModels";

const typeBadge = {
  [PATH_STEP_TYPE.MODULE]: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  [PATH_STEP_TYPE.WORKSHEET]: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  [PATH_STEP_TYPE.INFO]: "border-sky-400/40 bg-sky-500/10 text-sky-300",
};

export default function PathPreview({ path }) {
  const { isLight } = useTheme();
  const panelClass = isLight ? "rounded-2xl border border-slate-200 bg-white p-5" : "rounded-2xl border border-white/10 bg-[#0f1d32] p-5";
  const titleClass = isLight ? "text-lg font-semibold text-slate-900" : "text-lg font-semibold text-white";
  const bodyClass = isLight ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400";
  const cardClass = isLight ? "rounded-xl border border-slate-200 bg-slate-50 p-3" : "rounded-xl border border-white/10 bg-[#13243d] p-3";
  const emptyClass = isLight ? "rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500" : "rounded-xl border border-dashed border-white/20 bg-[#13243d] p-3 text-sm text-slate-400";

  return (
    <section className={panelClass}>
      <h3 className={titleClass}>Preview</h3>
      <p className={bodyClass}>How users will see this path.</p>

      <div className="mt-4 space-y-3">
        {(path.steps || []).map((step, index) => {
          const enabledTypes = Array.isArray(step.enabledTypes) && step.enabledTypes.length
            ? step.enabledTypes
            : [step.type || PATH_STEP_TYPE.INFO];

          return (
          <article key={step.id || index} className={cardClass}>
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Step {index + 1}: {step.title || "Untitled"}</p>
              <div className="flex flex-wrap justify-end gap-1">
                {enabledTypes.map((type) => (
                  <span key={`${step.id || index}-${type}`} className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${typeBadge[type] || typeBadge.info}`}>
                    {type || "info"}
                  </span>
                ))}
              </div>
            </div>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>{step.description || "No description yet."}</p>
          </article>
        )})}

        {!path.steps?.length ? (
          <p className={emptyClass}>No steps to preview.</p>
        ) : null}
      </div>
    </section>
  );
}
