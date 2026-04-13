"use client";

import { useMemo, useRef, useState } from "react";
import {
  Download,
  Eye,
  FileImage,
  FileText,
  FileType,
  FolderOpen,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const formatBytes = (bytes) => {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (isoDate) => {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getFileKind = (fileType) => {
  const type = String(fileType || "").toLowerCase();
  if (type.includes("pdf")) return "PDF";
  if (type.includes("word") || type.includes("doc")) return "DOC";
  if (type.includes("image")) return "IMAGE";
  return "FILE";
};

const getFileIcon = (fileType) => {
  const kind = getFileKind(fileType);
  if (kind === "IMAGE") return FileImage;
  if (kind === "PDF") return FileType;
  return FileText;
};

function FileActionMenu({ isLight, onPreview, onDownload, onRename, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`rounded-lg p-2 transition ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
        aria-label="File actions"
      >
        <MoreVertical size={16} />
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-20 mt-1 w-36 rounded-xl border p-1 shadow-xl ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#122033]"}`}
        >
          <button
            type="button"
            onClick={() => {
              onPreview();
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
          >
            <Eye size={13} /> Preview
          </button>
          <button
            type="button"
            onClick={() => {
              onDownload();
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
          >
            <Download size={13} /> Download
          </button>
          <button
            type="button"
            onClick={() => {
              onRename();
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
          >
            <Pencil size={13} /> Rename
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

export default function ResourcesFilesTab({
  isLight,
  files,
  viewMode,
  fileTypeFilter,
  onSetViewMode,
  onSetFileTypeFilter,
  onUpload,
  onPreview,
  onDownload,
  onRename,
  onDelete,
}) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const filePickerRef = useRef(null);

  const imagePreview = useMemo(() => {
    if (!pendingFile || !pendingFile.type.startsWith("image/")) return "";
    return URL.createObjectURL(pendingFile);
  }, [pendingFile]);

  const setFileFromInput = (file) => {
    if (!file) return;
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setUploadError("Unsupported file type. Please upload PDF, DOC, DOCX, JPG, or PNG.");
      return;
    }
    setUploadError("");
    setPendingFile(file);
  };

  const submitUpload = async () => {
    if (!pendingFile) {
      setUploadError("Select a file to upload.");
      return;
    }

    const result = await onUpload(pendingFile);
    if (result?.error) {
      setUploadError(result.error);
      return;
    }

    setPendingFile(null);
    setUploadError("");
    setIsUploadOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className={`inline-flex rounded-full p-1 text-xs ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
          {[
            { key: "grid", label: "Grid" },
            { key: "list", label: "List" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onSetViewMode(option.key)}
              className={`rounded-full px-3 py-1.5 ${
                viewMode === option.key
                  ? "bg-amber-400 text-[#0b1728]"
                  : isLight
                    ? "text-slate-700 hover:bg-slate-200"
                    : "text-slate-300 hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <select
          value={fileTypeFilter}
          onChange={(event) => onSetFileTypeFilter(event.target.value)}
          className={`rounded-lg border px-3 py-2 text-xs outline-none ${
            isLight
              ? "border-slate-300 bg-white text-slate-800"
              : "border-white/15 bg-[#13243d] text-slate-100"
          }`}
        >
          <option value="all">All types</option>
          <option value="pdf">PDF</option>
          <option value="doc">DOC/DOCX</option>
          <option value="image">Images</option>
        </select>

        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-[#0b1728] hover:bg-amber-300"
        >
          <Plus size={14} /> Upload File
        </button>
      </div>

      {files.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${isLight ? "border-slate-300 bg-slate-50 text-slate-600" : "border-white/15 bg-[#13243d] text-slate-300"}`}>
          No files yet. Upload your first resource.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.fileType);
            return (
              <article
                key={file.id}
                className={`rounded-xl border p-3 transition hover:-translate-y-0.5 ${isLight ? "border-slate-200 bg-white shadow-sm shadow-slate-200/70" : "border-white/10 bg-[#101d30]"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${isLight ? "bg-slate-100" : "bg-white/10"}`}>
                      <FileIcon size={16} />
                    </div>
                    <div>
                      <p className="line-clamp-1 text-sm font-semibold">{file.fileName}</p>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{getFileKind(file.fileType)}</p>
                    </div>
                  </div>

                  <FileActionMenu
                    isLight={isLight}
                    onPreview={() => onPreview(file)}
                    onDownload={() => onDownload(file)}
                    onRename={() => onRename(file)}
                    onDelete={() => onDelete(file)}
                  />
                </div>

                <div className={`mt-3 flex items-center justify-between text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  <span>{formatBytes(file.fileSize)}</span>
                  <span>{formatDate(file.uploadedAt)}</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={`overflow-hidden rounded-2xl border ${isLight ? "border-slate-200" : "border-white/10"}`}>
          {files.map((file) => {
            const FileIcon = getFileIcon(file.fileType);
            return (
              <div
                key={file.id}
                className={`flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#101d30]"}`}
              >
                <FileIcon size={16} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.fileName}</p>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {getFileKind(file.fileType)} • {formatBytes(file.fileSize)} • {formatDate(file.uploadedAt)}
                  </p>
                </div>
                <FileActionMenu
                  isLight={isLight}
                  onPreview={() => onPreview(file)}
                  onDownload={() => onDownload(file)}
                  onRename={() => onRename(file)}
                  onDelete={() => onDelete(file)}
                />
              </div>
            );
          })}
        </div>
      )}

      {isUploadOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-xl rounded-2xl border p-5 shadow-2xl ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Upload Resource File</h3>
              <button
                type="button"
                onClick={() => {
                  setIsUploadOpen(false);
                  setPendingFile(null);
                  setUploadError("");
                }}
                className={`rounded-lg p-2 ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
              >
                <X size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => filePickerRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const nextFile = event.dataTransfer.files?.[0];
                setFileFromInput(nextFile);
              }}
              className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center ${isLight ? "border-slate-300 bg-slate-50" : "border-white/15 bg-[#13243d]"}`}
            >
              <Upload size={18} className="mb-2" />
              <p className="text-sm font-semibold">Drag and drop your file here</p>
              <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>or click to browse PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
            </button>

            <input
              ref={filePickerRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              className="hidden"
              onChange={(event) => setFileFromInput(event.target.files?.[0])}
            />

            {pendingFile ? (
              <div className={`mt-4 rounded-xl border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
                <p className="text-sm font-semibold">{pendingFile.name}</p>
                <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {getFileKind(pendingFile.type)} • {formatBytes(pendingFile.size)}
                </p>
                {imagePreview ? (
                  <img src={imagePreview} alt="Upload preview" className="mt-3 h-36 w-full rounded-lg object-cover" />
                ) : (
                  <div className={`mt-3 flex h-24 items-center justify-center rounded-lg ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
                    <FolderOpen size={18} />
                  </div>
                )}
              </div>
            ) : null}

            {uploadError ? <p className="mt-3 text-xs text-rose-400">{uploadError}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsUploadOpen(false);
                  setPendingFile(null);
                  setUploadError("");
                }}
                className={`rounded-lg border px-3 py-2 text-xs ${isLight ? "border-slate-300 hover:bg-slate-100" : "border-white/15 hover:bg-white/10"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitUpload}
                className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-[#0b1728] hover:bg-amber-300"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
