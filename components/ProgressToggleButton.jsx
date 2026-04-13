"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function ProgressToggleButton({ lessonId, initialCompleted = false, initialScore = 0 }) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [score, setScore] = useState(initialScore || 0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const saveProgress = async (nextCompleted) => {
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("Please login to update progress.");
      return;
    }

    const { error: upsertError } = await supabase.from("progress").upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: nextCompleted,
        score,
      },
      { onConflict: "user_id,lesson_id" }
    );

    setLoading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setCompleted(nextCompleted);
    setMessage("Progress saved.");
    router.refresh();
  };

  return (
    <div className="surface-card rounded-2xl p-6">
      <h3 className="text-lg font-bold [font-family:var(--font-space)]">Track Progress</h3>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="score" className="mb-1 block text-sm font-medium">
            Score
          </label>
          <input
            id="score"
            type="number"
            value={score}
            onChange={(e) => setScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="w-28 rounded-xl border border-line bg-white px-3 py-2 outline-none ring-brand/40 transition focus:ring"
            min={0}
            max={100}
          />
        </div>

        <button
          type="button"
          onClick={() => saveProgress(!completed)}
          disabled={loading}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Saving..." : completed ? "Mark as Incomplete" : "Mark as Completed"}
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
