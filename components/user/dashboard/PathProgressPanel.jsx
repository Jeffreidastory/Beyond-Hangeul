export default function PathProgressPanel({
  pathTitle,
  completedSteps,
  totalSteps,
  nextLessonLabel,
  progressPercent,
  isLight,
}) {
  return (
    <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
      <h2 className="text-lg font-semibold">Learning Path Progress</h2>
      <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{pathTitle}</p>

      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className={isLight ? "text-slate-600" : "text-slate-300"}>
            Completed {completedSteps} of {totalSteps} steps
          </span>
          <span className={isLight ? "text-slate-700" : "text-slate-200"}>{progressPercent}%</span>
        </div>
        <div className={`h-2 overflow-hidden rounded-full ${isLight ? "bg-slate-200" : "bg-white/10"}`}>
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className={`mt-4 rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
        <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Next Recommended Lesson</p>
        <p className="mt-1 text-sm font-semibold">{nextLessonLabel}</p>
      </div>
    </section>
  );
}
