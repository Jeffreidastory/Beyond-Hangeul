import { notFound } from "next/navigation";
import ProgressToggleButton from "@/components/ProgressToggleButton";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function LessonDetailPage({ params }) {
  const { id } = await params;
  const { user } = await getCurrentUserWithProfile();
  const supabase = await createClient();

  const [{ data: lesson }, { data: vocab }, { data: progressRow }] = await Promise.all([
    supabase.from("lessons").select("id, title, description, level").eq("id", id).single(),
    supabase.from("vocabulary").select("id, korean_word, english_meaning, pronunciation").eq("lesson_id", id),
    supabase.from("progress").select("id, completed, score").eq("user_id", user.id).eq("lesson_id", id).maybeSingle(),
  ]);

  if (!lesson) {
    notFound();
  }

  return (
    <section className="fade-rise space-y-5">
      <div className="surface-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-wider text-ink-muted">{lesson.level}</p>
        <h1 className="mt-2 text-3xl font-bold [font-family:var(--font-space)]">{lesson.title}</h1>
        <p className="mt-3 text-sm text-ink-muted">{lesson.description}</p>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-bold [font-family:var(--font-space)]">Vocabulary</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-[#fff3e1] text-left">
              <tr>
                <th className="px-4 py-3">Korean</th>
                <th className="px-4 py-3">Pronunciation</th>
                <th className="px-4 py-3">English</th>
              </tr>
            </thead>
            <tbody>
              {(vocab || []).map((word) => (
                <tr key={word.id} className="border-t border-line bg-white">
                  <td className="px-4 py-3 font-semibold">{word.korean_word}</td>
                  <td className="px-4 py-3 text-ink-muted">{word.pronunciation}</td>
                  <td className="px-4 py-3">{word.english_meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(vocab || []).length === 0 && <p className="mt-3 text-sm text-ink-muted">No vocabulary added yet.</p>}
      </div>

      <ProgressToggleButton
        lessonId={lesson.id}
        initialCompleted={Boolean(progressRow?.completed)}
        initialScore={progressRow?.score || 0}
      />
    </section>
  );
}
