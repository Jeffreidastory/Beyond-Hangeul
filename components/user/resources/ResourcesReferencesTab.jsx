"use client";

import { BookOpenText, X } from "lucide-react";
import { useState } from "react";

export default function ResourcesReferencesTab({ isLight, references }) {
  const [activeReference, setActiveReference] = useState(null);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {references.map((reference) => (
          <article
            key={reference.id}
            className={`rounded-xl border p-4 transition hover:-translate-y-0.5 ${isLight ? "border-slate-200 bg-white shadow-sm shadow-slate-200/70" : "border-white/10 bg-[#101d30]"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{reference.title}</h3>
                <p className={`mt-2 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>{reference.description}</p>
              </div>
              <BookOpenText size={16} className="text-amber-400" />
            </div>
            <button
              type="button"
              onClick={() => setActiveReference(reference)}
              className={`mt-4 rounded-lg border px-3 py-1.5 text-xs font-semibold ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/15 text-slate-200 hover:bg-white/10"}`}
            >
              Open Reference
            </button>
          </article>
        ))}
      </div>

      {activeReference ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{activeReference.title}</h3>
              <button
                type="button"
                onClick={() => setActiveReference(null)}
                className={`rounded-lg p-2 ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
              >
                <X size={16} />
              </button>
            </div>
            <p className={`text-sm leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>{activeReference.content}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
