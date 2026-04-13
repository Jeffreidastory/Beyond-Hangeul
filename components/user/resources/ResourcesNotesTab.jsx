"use client";

import { useMemo, useState } from "react";
import { MoreVertical, Pencil, Plus, Trash2, X } from "lucide-react";

const formatDate = (isoDate) => {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function NoteActionMenu({ isLight, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`rounded-lg p-2 ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
        aria-label="Note actions"
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div className={`absolute right-0 z-20 mt-1 w-32 rounded-xl border p-1 shadow-xl ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#122033]"}`}>
          <button
            type="button"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NoteModal({ isLight, mode, initialTitle, initialContent, onClose, onSave }) {
  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState(initialContent || "");
  const [error, setError] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{mode === "edit" ? "Edit Note" : "New Note"}</h3>
          <button type="button" onClick={onClose} className={`rounded-lg p-2 ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#13243d] text-slate-100"}`}
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={10}
            placeholder="Write your learning note here..."
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#13243d] text-slate-100"}`}
          />
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-lg border px-3 py-2 text-xs ${isLight ? "border-slate-300 hover:bg-slate-100" : "border-white/15 hover:bg-white/10"}`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!title.trim()) {
                setError("Title is required.");
                return;
              }
              onSave({ title: title.trim(), content: content.trim() });
            }}
            className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-[#0b1728] hover:bg-amber-300"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewNoteModal({ isLight, note, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{note.title}</h3>
            <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Updated {formatDate(note.updatedAt)}</p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-lg p-2 ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}>
            <X size={16} />
          </button>
        </div>

        <div className={`max-h-90 overflow-y-auto rounded-xl border p-4 text-sm leading-relaxed ${isLight ? "border-slate-200 bg-slate-50 text-slate-800" : "border-white/10 bg-[#13243d] text-slate-200"}`}>
          {note.content || "No content yet."}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-lg border px-3 py-2 text-xs ${isLight ? "border-slate-300 hover:bg-slate-100" : "border-white/15 hover:bg-white/10"}`}>
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-[#0b1728] hover:bg-amber-300"
          >
            Edit Note
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResourcesNotesTab({ isLight, notes, onCreate, onUpdate, onDelete }) {
  const [modalState, setModalState] = useState({ open: false, mode: "create", note: null });
  const [viewNote, setViewNote] = useState(null);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()),
    [notes]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>Capture ideas, vocabulary, and study reflections.</p>
        <button
          type="button"
          onClick={() => setModalState({ open: true, mode: "create", note: null })}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-[#0b1728] hover:bg-amber-300"
        >
          <Plus size={14} /> New Note
        </button>
      </div>

      {sortedNotes.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${isLight ? "border-slate-300 bg-slate-50 text-slate-600" : "border-white/15 bg-[#13243d] text-slate-300"}`}>
          No notes yet. Create your first note.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sortedNotes.map((note) => (
            <article
              key={note.id}
              onClick={() => setViewNote(note)}
              className={`rounded-xl border p-4 transition hover:-translate-y-0.5 ${isLight ? "border-slate-200 bg-white shadow-sm shadow-slate-200/70" : "border-white/10 bg-[#101d30]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-semibold">{note.title}</h3>
                  <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Updated {formatDate(note.updatedAt)}</p>
                </div>
                <NoteActionMenu
                  isLight={isLight}
                  onEdit={() => setModalState({ open: true, mode: "edit", note })}
                  onDelete={() => onDelete(note)}
                />
              </div>
              <p className={`mt-3 line-clamp-5 text-sm leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>{note.content || "No content yet."}</p>
            </article>
          ))}
        </div>
      )}

      {modalState.open ? (
        <NoteModal
          isLight={isLight}
          mode={modalState.mode}
          initialTitle={modalState.note?.title || ""}
          initialContent={modalState.note?.content || ""}
          onClose={() => setModalState({ open: false, mode: "create", note: null })}
          onSave={(payload) => {
            if (modalState.mode === "edit" && modalState.note) {
              onUpdate(modalState.note, payload);
            } else {
              onCreate(payload);
            }
            setModalState({ open: false, mode: "create", note: null });
          }}
        />
      ) : null}

      {viewNote ? (
        <ViewNoteModal
          isLight={isLight}
          note={viewNote}
          onClose={() => setViewNote(null)}
          onEdit={() => {
            setModalState({ open: true, mode: "edit", note: viewNote });
            setViewNote(null);
          }}
        />
      ) : null}
    </div>
  );
}
