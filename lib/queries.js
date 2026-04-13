import { createClient } from "@/lib/supabaseServer";

export async function fetchLessons() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, description, level, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function insertOrUpdateProgress({ userId, lessonId, completed, score }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("progress")
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        completed,
        score,
      },
      { onConflict: "user_id,lesson_id" }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
