import { PATH_STEP_TYPE } from "@/types/dashboardModels";

const typeBadge = {
  [PATH_STEP_TYPE.MODULE]: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  [PATH_STEP_TYPE.WORKSHEET]: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  [PATH_STEP_TYPE.INFO]: "border-sky-400/40 bg-sky-500/10 text-sky-300",
};

export default function PathPreview({ path }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
      <h3 className="text-lg font-semibold text-white">Preview</h3>
      <p className="mt-1 text-sm text-slate-400">How users will see this path.</p>

      <div className="mt-4 space-y-3">
        {(path.steps || []).map((step, index) => {
          const enabledTypes = Array.isArray(step.enabledTypes) && step.enabledTypes.length
            ? step.enabledTypes
            : [step.type || PATH_STEP_TYPE.INFO];

          return (
          <article key={step.id || index} className="rounded-xl border border-white/10 bg-[#13243d] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">Step {index + 1}: {step.title || "Untitled"}</p>
              <div className="flex flex-wrap justify-end gap-1">
                {enabledTypes.map((type) => (
                  <span key={`${step.id || index}-${type}`} className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${typeBadge[type] || typeBadge.info}`}>
                    {type || "info"}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-300">{step.description || "No description yet."}</p>
          </article>
        )})}

        {!path.steps?.length ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-[#13243d] p-3 text-sm text-slate-400">No steps to preview.</p>
        ) : null}
      </div>
    </section>
  );
}
