export default function ModuleOverviewCard({ freeCount = 0, premiumCount = 0, mostPurchased = "-" }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
      <h3 className="text-lg font-semibold text-white">Module Overview</h3>
      <p className="mt-1 text-sm text-slate-400">Distribution and best-performing module.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          Free: {freeCount}
        </span>
        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
          Premium: {premiumCount}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-[#13243d] p-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Most Purchased</p>
        <p className="mt-1 text-base font-semibold text-white">{mostPurchased}</p>
      </div>
    </section>
  );
}
