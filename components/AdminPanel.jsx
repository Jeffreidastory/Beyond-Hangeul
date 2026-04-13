"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const defaultLesson = {
  title: "",
  description: "",
  level: "beginner",
};

const defaultVocab = {
  lesson_id: "",
  korean_word: "",
  english_meaning: "",
  pronunciation: "",
};

export default function AdminPanel({ initialLessons = [], initialUsers = [] }) {
  const [lessons, setLessons] = useState(initialLessons);
  const [users, setUsers] = useState(initialUsers);
  const [newLesson, setNewLesson] = useState(defaultLesson);
  const [vocab, setVocab] = useState(defaultVocab);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    const supabase = getSupabaseBrowserClient();
    const [{ data: lessonsData, error: lessonsError }, { data: usersData, error: usersError }] = await Promise.all([
      supabase.from("lessons").select("id, title, description, level, created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: false }),
    ]);

    if (lessonsError || usersError) {
      setError(lessonsError?.message || usersError?.message || "Failed loading data.");
      return;
    }

    setLessons(lessonsData || []);
    setUsers(usersData || []);
  };

  const createLesson = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    const supabase = getSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("lessons").insert(newLesson);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setStatus("Lesson created.");
    setNewLesson(defaultLesson);
    loadData();
  };

  const updateLesson = async (id, field, value) => {
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase.from("lessons").update({ [field]: value }).eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStatus("Lesson updated.");
    setLessons((prev) => prev.map((lesson) => (lesson.id === id ? { ...lesson, [field]: value } : lesson)));
  };

  const deleteLesson = async (id) => {
    setError("");
    setStatus("");

    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from("lessons").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setStatus("Lesson deleted.");
    setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
  };

  const addVocabulary = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    const supabase = getSupabaseBrowserClient();
    const { error: vocabError } = await supabase.from("vocabulary").insert(vocab);

    if (vocabError) {
      setError(vocabError.message);
      return;
    }

    setStatus("Vocabulary added.");
    setVocab(defaultVocab);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-6">
        <h1 className="text-2xl font-bold [font-family:var(--font-space)]">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage lessons, vocabulary, and learners.</p>
        {status && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-bold [font-family:var(--font-space)]">Create Lesson</h2>
        <form onSubmit={createLesson} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Lesson title"
            value={newLesson.title}
            onChange={(e) => setNewLesson((prev) => ({ ...prev, title: e.target.value }))}
            className="rounded-xl border border-line bg-white px-3 py-2 outline-none ring-brand/40 focus:ring"
            required
          />
          <select
            value={newLesson.level}
            onChange={(e) => setNewLesson((prev) => ({ ...prev, level: e.target.value }))}
            className="rounded-xl border border-line bg-white px-3 py-2 outline-none ring-brand/40 focus:ring"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <textarea
            placeholder="Description"
            value={newLesson.description}
            onChange={(e) => setNewLesson((prev) => ({ ...prev, description: e.target.value }))}
            className="sm:col-span-2 rounded-xl border border-line bg-white px-3 py-2 outline-none ring-brand/40 focus:ring"
            rows={3}
            required
          />
          <button className="w-fit rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-deep" type="submit">
            Create Lesson
          </button>
        </form>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-bold [font-family:var(--font-space)]">Edit or Delete Lessons</h2>
        <div className="mt-4 space-y-3">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="rounded-xl border border-line bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={lesson.title}
                  onChange={(e) =>
                    setLessons((prev) => prev.map((item) => (item.id === lesson.id ? { ...item, title: e.target.value } : item)))
                  }
                  onBlur={(e) => updateLesson(lesson.id, "title", e.target.value)}
                  className="rounded-lg border border-line px-3 py-2"
                />
                <select
                  value={lesson.level}
                  onChange={(e) => updateLesson(lesson.id, "level", e.target.value)}
                  className="rounded-lg border border-line px-3 py-2"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <textarea
                  value={lesson.description}
                  onChange={(e) =>
                    setLessons((prev) => prev.map((item) => (item.id === lesson.id ? { ...item, description: e.target.value } : item)))
                  }
                  onBlur={(e) => updateLesson(lesson.id, "description", e.target.value)}
                  className="sm:col-span-2 rounded-lg border border-line px-3 py-2"
                  rows={2}
                />
              </div>
              <button
                type="button"
                onClick={() => deleteLesson(lesson.id)}
                className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete Lesson
              </button>
            </div>
          ))}
          {lessons.length === 0 && <p className="text-sm text-ink-muted">No lessons yet.</p>}
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-bold [font-family:var(--font-space)]">Add Vocabulary</h2>
        <form onSubmit={addVocabulary} className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            value={vocab.lesson_id}
            onChange={(e) => setVocab((prev) => ({ ...prev, lesson_id: e.target.value }))}
            className="sm:col-span-2 rounded-xl border border-line bg-white px-3 py-2"
            required
          >
            <option value="">Select lesson</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
          <input
            placeholder="Korean word"
            value={vocab.korean_word}
            onChange={(e) => setVocab((prev) => ({ ...prev, korean_word: e.target.value }))}
            className="rounded-xl border border-line bg-white px-3 py-2"
            required
          />
          <input
            placeholder="English meaning"
            value={vocab.english_meaning}
            onChange={(e) => setVocab((prev) => ({ ...prev, english_meaning: e.target.value }))}
            className="rounded-xl border border-line bg-white px-3 py-2"
            required
          />
          <input
            placeholder="Pronunciation"
            value={vocab.pronunciation}
            onChange={(e) => setVocab((prev) => ({ ...prev, pronunciation: e.target.value }))}
            className="sm:col-span-2 rounded-xl border border-line bg-white px-3 py-2"
            required
          />
          <button type="submit" className="w-fit rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-deep">
            Add Vocabulary
          </button>
        </form>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-bold [font-family:var(--font-space)]">Users</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-[#fff3e1] text-left">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-line bg-white">
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
