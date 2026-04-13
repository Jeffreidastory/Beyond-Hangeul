import Link from "next/link";

const levelColor = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-rose-100 text-rose-700",
};

export default function LessonCard({ lesson, progress }) {
  return (
    <article className="surface-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${levelColor[lesson.level] || "bg-zinc-100 text-zinc-700"}`}>
          {lesson.level}
        </span>
        {progress?.completed && <span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">Completed</span>}
      </div>

      <h3 className="mt-4 text-lg font-bold [font-family:var(--font-space)]">{lesson.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{lesson.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-muted">Score: {progress?.score ?? 0}</p>
        <Link href={`/lessons/${lesson.id}`} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-deep">
          Open Lesson
        </Link>
      </div>
    </article>
  );
}
