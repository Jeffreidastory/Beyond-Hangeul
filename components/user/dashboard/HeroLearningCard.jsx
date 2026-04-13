export default function HeroLearningCard({
  userName,
  isLight,
}) {
  return (
    <section
      className={`rounded-2xl border p-5 ${
        isLight
          ? "border-slate-200 bg-gradient-to-r from-white to-slate-50"
          : "border-white/10 bg-gradient-to-r from-[#13243d] to-[#1a2f4d]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            Welcome back, <span className="text-amber-400">{userName}</span>
          </h1>
        </div>
      </div>
    </section>
  );
}
