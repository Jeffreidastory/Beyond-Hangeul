import LessonCard from "@/components/LessonCard";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const { user } = await getCurrentUserWithProfile();
  const supabase = await createClient();

  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("lessons").select("id, title, description, level, created_at").order("created_at", { ascending: false }),
    supabase.from("progress").select("lesson_id, completed, score").eq("user_id", user.id),
  ]);

  const progressMap = new Map((progress || []).map((item) => [item.lesson_id, item]));

  return (
    <section className="fade-rise space-y-5">
      <h1 className="text-3xl font-bold [font-family:var(--font-space)]">Lessons</h1>
      <p className="text-sm text-ink-muted">Explore each lesson and mark your progress as you study.</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(lessons || []).map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} progress={progressMap.get(lesson.id)} />
        ))}
      </div>

      {(lessons || []).length === 0 && <p className="text-sm text-ink-muted">No lessons available yet.</p>}
    </section>
  );
}
