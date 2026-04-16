export default function HeroLearningCard({
  userName,
  isLight,
  studyStreak = 0,
}) {
  return (
    <section
      className={`hero-learning-card rounded-2xl border p-5 shadow-sm ${
        isLight
          ? "border-slate-200 bg-gradient-to-r from-slate-100 via-slate-50 to-white"
          : "border-white/10 bg-gradient-to-r from-[#081424] via-[#112443] to-[#13243d]"
      }`}
      style={{ boxShadow: isLight ? "0 15px 45px rgba(15, 23, 42, 0.08)" : "0 15px 45px rgba(0, 0, 0, 0.35)" }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h1 className={`hero-learning-card__headline mt-3 text-3xl font-semibold tracking-tight ${isLight ? "text-slate-900" : "text-white"} sm:text-4xl`}>
            Welcome back, <span className="text-amber-300">{userName}</span> 👋
          </h1>
          <p className={`hero-learning-card__body mt-3 max-w-2xl text-sm ${isLight ? "text-slate-600" : "text-slate-300"} sm:text-base`}>
            Let’s continue your Korean journey today!
          </p>
        </div>

        <div className={`hero-learning-card__streak flex min-w-45 items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${isLight ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/50" : "border-white/10 bg-white/5 text-slate-200"}`}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 shadow-sm">
              🔥
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Streak</p>
              <p className={`hero-learning-card__streak-value font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{studyStreak}-day streak</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
