"use client";

import { useMemo, useState } from "react";
import { FileStack, NotebookPen, Search, Sparkles, Star } from "lucide-react";
import ResourcesFilesTab from "@/components/user/resources/ResourcesFilesTab";
import ResourcesNotesTab from "@/components/user/resources/ResourcesNotesTab";
import ResourcesBookmarksTab from "@/components/user/resources/ResourcesBookmarksTab";
import ResourcesReferencesTab from "@/components/user/resources/ResourcesReferencesTab";

const tabItems = [
  { key: "files", label: "Files", icon: FileStack },
  { key: "notes", label: "Notes", icon: NotebookPen },
  { key: "bookmarks", label: "Bookmarks", icon: Star },
  { key: "references", label: "References", icon: Sparkles },
];

const getFileKind = (fileType) => {
  const type = String(fileType || "").toLowerCase();
  if (type.includes("pdf")) return "pdf";
  if (type.includes("word") || type.includes("doc")) return "doc";
  if (type.includes("image")) return "image";
  return "other";
};

export default function UserResourcesHub({
  isLight,
  resources,
  modules,
  worksheets,
  notice,
  onUploadFile,
  onPreviewFile,
  onDownloadFile,
  onRenameFile,
  onDeleteFile,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onOpenBookmark,
  onRemoveBookmark,
}) {
  const [activeTab, setActiveTab] = useState("files");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");

  const filteredFiles = useMemo(() => {
    return (resources.files || []).filter((file) => {
      const keyword = query.trim().toLowerCase();
      const matchesQuery = !keyword || String(file.fileName || "").toLowerCase().includes(keyword);
      if (!matchesQuery) return false;
      if (fileTypeFilter === "all") return true;
      return getFileKind(file.fileType) === fileTypeFilter;
    });
  }, [fileTypeFilter, query, resources.files]);

  const filteredNotes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return resources.notes || [];
    return (resources.notes || []).filter((note) => {
      return String(note.title || "").toLowerCase().includes(keyword) || String(note.content || "").toLowerCase().includes(keyword);
    });
  }, [query, resources.notes]);

  const enhancedBookmarks = useMemo(() => {
    return (resources.bookmarks || []).map((bookmark) => {
      const lookupId = String(bookmark.itemId);
      if (bookmark.type === "module") {
        const module = modules?.find((item) => String(item.id) === lookupId);
        return {
          ...bookmark,
          title: bookmark.title || module?.moduleName || "Module",
          description: bookmark.description || module?.topicTitle || "Saved module",
        };
      }
      if (bookmark.type === "worksheet") {
        const worksheet = worksheets?.find((item) => String(item.id) === lookupId);
        return {
          ...bookmark,
          title: bookmark.title || worksheet?.title || "Worksheet",
          description: bookmark.description || worksheet?.description || "Saved worksheet",
        };
      }
      return bookmark;
    });
  }, [resources.bookmarks, modules, worksheets]);

  const filteredBookmarks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return enhancedBookmarks;
    return enhancedBookmarks.filter((bookmark) => {
      return String(bookmark.title || "").toLowerCase().includes(keyword) || String(bookmark.description || "").toLowerCase().includes(keyword);
    });
  }, [query, enhancedBookmarks]);

  const filteredReferences = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return resources.references || [];
    return (resources.references || []).filter((reference) => {
      return String(reference.title || "").toLowerCase().includes(keyword) || String(reference.description || "").toLowerCase().includes(keyword);
    });
  }, [query, resources.references]);

  return (
    <main className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
      <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-xl font-bold">Resources</h2>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>Manage your learning materials</p>
          </div>

          <div className={`ml-auto flex min-w-60 items-center rounded-full border px-3 py-2 ${isLight ? "border-slate-200 bg-white" : "border-white/15 bg-[#0f1d32]"}`}>
            <Search size={14} className={isLight ? "text-slate-500" : "text-slate-400"} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files, notes, bookmarks..."
              className={`ml-2 w-full bg-transparent text-sm outline-none ${isLight ? "text-slate-800 placeholder:text-slate-500" : "text-slate-100 placeholder:text-slate-400"}`}
            />
          </div>
        </div>

        <div className={`mt-4 inline-flex rounded-full p-1 text-sm ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition ${
                  activeTab === tab.key
                    ? "bg-amber-400 font-semibold text-[#0b1728]"
                    : isLight
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {notice ? <p className={`mt-3 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>{notice}</p> : null}
      </section>

      {activeTab === "files" ? (
        <ResourcesFilesTab
          isLight={isLight}
          files={filteredFiles}
          viewMode={viewMode}
          fileTypeFilter={fileTypeFilter}
          onSetViewMode={setViewMode}
          onSetFileTypeFilter={setFileTypeFilter}
          onUpload={onUploadFile}
          onPreview={onPreviewFile}
          onDownload={onDownloadFile}
          onRename={onRenameFile}
          onDelete={onDeleteFile}
        />
      ) : null}

      {activeTab === "notes" ? (
        <ResourcesNotesTab
          isLight={isLight}
          notes={filteredNotes}
          onCreate={onCreateNote}
          onUpdate={onUpdateNote}
          onDelete={onDeleteNote}
        />
      ) : null}

      {activeTab === "bookmarks" ? (
        <ResourcesBookmarksTab
          isLight={isLight}
          bookmarks={filteredBookmarks}
          onOpenItem={onOpenBookmark}
          onRemove={onRemoveBookmark}
        />
      ) : null}

      {activeTab === "references" ? (
        <ResourcesReferencesTab isLight={isLight} references={filteredReferences} />
      ) : null}
    </main>
  );
}
