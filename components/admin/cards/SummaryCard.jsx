export default function SummaryCard({ icon, label, value, hint, tone = "slate" }) {
  const toneStyles = {
    slate: "border-white/10 bg-[#13243d]",
    amber: "border-amber-400/30 bg-amber-500/10",
    emerald: "border-emerald-400/30 bg-emerald-500/10",
    sky: "border-sky-400/30 bg-sky-500/10",
  };

  return (
    <article className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-white/30 ${toneStyles[tone] || toneStyles.slate}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
        <span className="text-xs text-slate-400">Overview</span>
      </div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </article>
  );
}
