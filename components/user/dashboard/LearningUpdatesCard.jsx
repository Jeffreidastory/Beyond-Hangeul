export default function LearningUpdatesCard({ updates = [], isLight }) {
  return (
    <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
      <h3 className="font-semibold">Learning Updates</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {updates.map((update) => (
          <li key={update.id} className={`rounded-lg px-3 py-2 transition ${isLight ? "bg-slate-100 text-amber-700 hover:bg-slate-200" : "bg-white/5 text-amber-300 hover:bg-white/10"}`}>
            {update.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
