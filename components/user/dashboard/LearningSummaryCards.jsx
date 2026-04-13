function SummaryCard({ label, value, hint, icon, isLight }) {
  return (
    <article className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${isLight ? "border-slate-200 bg-slate-50 hover:bg-white" : "border-white/10 bg-[#13243d] hover:border-white/20"}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className={`text-xs uppercase tracking-wide ${isLight ? "text-amber-600" : "text-amber-400"}`}>{label}</p>
        <span className="text-lg" aria-hidden="true">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {hint ? <p className={`mt-1 text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>{hint}</p> : null}
    </article>
  );
}

export default function LearningSummaryCards({ items, isLight }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <SummaryCard key={item.label} {...item} isLight={isLight} />
      ))}
    </div>
  );
}
