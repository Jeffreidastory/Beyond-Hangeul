export default function ContinueLearningPanel({
  moduleName,
  currentStepLabel,
  progressSummary,
  onResume,
  isLight,
}) {
  return (
    <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
      <h2 className="text-lg font-semibold">Continue Learning</h2>
      <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
        Pick up where you left off and stay on your study flow.
      </p>

      <div className={`mt-4 rounded-xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
        <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Last Opened Module</p>
        <p className="mt-1 text-lg font-semibold">{moduleName}</p>
        <p className={`mt-2 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{currentStepLabel}</p>
        <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{progressSummary}</p>

        <button
          type="button"
          onClick={onResume}
          className="mt-4 rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-[#0b1728] transition hover:bg-amber-300"
        >
          Resume
        </button>
      </div>
    </section>
  );
}
