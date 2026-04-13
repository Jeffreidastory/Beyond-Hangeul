"use client";

import { BookmarkCheck, ExternalLink, Trash2 } from "lucide-react";

export default function ResourcesBookmarksTab({ isLight, bookmarks, onOpenItem, onRemove }) {
  return (
    <div className="space-y-4">
      {bookmarks.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${isLight ? "border-slate-300 bg-slate-50 text-slate-600" : "border-white/15 bg-[#13243d] text-slate-300"}`}>
          No saved items yet.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {bookmarks.map((bookmark) => (
            <article
              key={bookmark.id}
              className={`rounded-xl border p-4 transition hover:-translate-y-0.5 ${isLight ? "border-slate-200 bg-white shadow-sm shadow-slate-200/70" : "border-white/10 bg-[#101d30]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    bookmark.type === "module"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                  >
                    {bookmark.type}
                  </p>
                  <h3 className="mt-2 line-clamp-1 text-sm font-semibold">{bookmark.title}</h3>
                  <p className={`mt-1 line-clamp-2 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>{bookmark.description}</p>
                </div>

                <BookmarkCheck size={16} className="text-amber-400" />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenItem(bookmark)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/15 text-slate-200 hover:bg-white/10"}`}
                >
                  <ExternalLink size={13} /> Open
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(bookmark)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
