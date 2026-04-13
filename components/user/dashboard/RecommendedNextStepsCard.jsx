export default function RecommendedNextStepsCard({ items = [], title = "Recommended Next Steps", isLight }) {
  return (
    <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={`rounded-lg px-3 py-2 transition ${isLight ? "bg-slate-100 text-amber-700 hover:bg-slate-200" : "bg-white/5 text-amber-300 hover:bg-white/10"}`}>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
