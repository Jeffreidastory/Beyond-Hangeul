"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import PathHeader from "@/components/path/PathHeader";
import PathDetailsCard from "@/components/path/PathDetailsCard";
import StepBuilder from "@/components/path/StepBuilder";
import PathPreview from "@/components/path/PathPreview";
import { PATH_STATUS } from "@/types/dashboardModels";
import {
  deleteLearningPathShared,
  listLearningPathsShared,
  saveLearningPathShared,
} from "@/services/dashboardDataService";
import { useRealtimeTables } from "@/services/realtime/useRealtimeTables";

const buildEmptyPathDraft = () => ({
  id: "",
  title: "",
  description: "",
  status: PATH_STATUS.DRAFT,
  steps: [],
  createdAt: "",
});

export default function AdminPathManagement({ modules = [], worksheets = [], onSaved }) {
  const [paths, setPaths] = useState([]);
  const [selectedPathId, setSelectedPathId] = useState("");
  const [draft, setDraft] = useState(buildEmptyPathDraft());
  const [notice, setNotice] = useState("");

  const refreshPaths = async () => {
    const allPaths = (await listLearningPathsShared()).sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    setPaths(allPaths);

    if (!allPaths.length) {
      setSelectedPathId("");
      setDraft(buildEmptyPathDraft());
      return;
    }

    const hasSelected = allPaths.some((path) => path.id === selectedPathId);
    const selectedPath = hasSelected ? allPaths.find((path) => path.id === selectedPathId) : allPaths[0];
    if (selectedPath) {
      setSelectedPathId(selectedPath.id);
      setDraft({ ...selectedPath, steps: [...(selectedPath.steps || [])] });
    }
  };

  useEffect(() => {
    void refreshPaths();
  }, []);

  useRealtimeTables({
    tables: ["learning_paths", "learning_path_steps"],
    channelName: "admin-path-management",
    onChange: () => {
      void refreshPaths();
    },
  });

  const stepCountLabel = useMemo(() => `${draft.steps?.length || 0} step${draft.steps?.length === 1 ? "" : "s"}`,
    [draft.steps]
  );

  const saveDraft = async () => {
    const title = draft.title.trim();
    if (!title) {
      setNotice("Path title is required.");
      return;
    }

    const normalizedSteps = (draft.steps || []).map((step, index) => ({ ...step, order: index + 1 }));
    const nextPath = await saveLearningPathShared({ ...draft, title, steps: normalizedSteps });
    setNotice("Path saved successfully.");
    setSelectedPathId(nextPath.id);
    await refreshPaths();
    onSaved?.();
  };

  const createPath = () => {
    setSelectedPathId("");
    setDraft(buildEmptyPathDraft());
    setNotice("");
  };

  const editPath = (path) => {
    setSelectedPathId(path.id);
    setDraft({ ...path, steps: [...(path.steps || [])] });
    setNotice("");
  };

  const removePath = async (pathId) => {
    await deleteLearningPathShared(pathId);
    setNotice("Path deleted.");
    await refreshPaths();
    onSaved?.();
  };

  const { isLight } = useTheme();
  const sectionClass = isLight ? "rounded-2xl border border-slate-200 bg-white p-5" : "rounded-2xl border border-white/10 bg-[#0f1d32] p-5";
  const cardClass = isLight ? "rounded-xl border border-slate-200 bg-slate-50 p-3" : "rounded-xl border border-white/10 bg-[#13243d] p-3";
  const tableHeadClass = isLight ? "bg-slate-100 text-slate-900" : "bg-[#13243d] text-slate-300";
  const rowClass = isLight ? "border-t border-slate-200 bg-white" : "border-t border-white/10 bg-[#0f1d32]";

  return (
    <div className="space-y-5">
      <section className={sectionClass}>
        <PathHeader
          title="Path Management"
          subtitle="Manage the learning flow shown to all users"
          actionLabel="+ Create Path"
          onAction={createPath}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <PathDetailsCard value={draft} onChange={setDraft} />
          <StepBuilder
            steps={draft.steps || []}
            modules={modules}
            worksheets={worksheets}
            onChangeSteps={(nextSteps) => setDraft((prev) => ({ ...prev, steps: nextSteps }))}
          />

          <section className={sectionClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={isLight ? "text-sm text-slate-600" : "text-sm text-slate-400"}>{stepCountLabel}</p>
              <button
                type="button"
                onClick={saveDraft}
                className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0b1728] hover:bg-amber-300"
              >
                Save Path Structure
              </button>
            </div>
            {notice ? <p className="mt-3 text-sm text-emerald-300">{notice}</p> : null}
          </section>

          <section className={sectionClass}>
            <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Saved Paths</h3>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Scalable list view ready for multiple paths.</p>

            <div className={`mt-4 overflow-x-auto rounded-xl border ${isLight ? "border-slate-200" : "border-white/10"}`}>
              <table className="w-full min-w-180 text-sm">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-3 py-2 text-left">Path Name</th>
                    <th className="px-3 py-2 text-left">Step Count</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Last Updated</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paths.map((path) => (
                    <tr key={path.id} className={rowClass}>
                      <td className={isLight ? "px-3 py-2 text-slate-900" : "px-3 py-2 text-slate-100"}>{path.title}</td>
                      <td className={isLight ? "px-3 py-2 text-slate-700" : "px-3 py-2 text-slate-300"}>{path.steps?.length || 0}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                            path.status === PATH_STATUS.ACTIVE
                              ? isLight ? "border-emerald-300/40 bg-emerald-100 text-emerald-700" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                              : isLight ? "border-slate-300/40 bg-slate-100 text-slate-700" : "border-slate-500/40 bg-slate-600/10 text-slate-300"
                          }`}
                        >
                          {path.status === PATH_STATUS.ACTIVE ? "Active" : "Draft"}
                        </span>
                      </td>
                      <td className={isLight ? "px-3 py-2 text-slate-700" : "px-3 py-2 text-slate-300"}>{new Date(path.updatedAt || path.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editPath(path)}
                            className={`rounded-lg border px-2 py-1 text-xs ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 text-slate-200 hover:bg-white/10"}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removePath(path.id)}
                            className="rounded-lg border border-rose-400/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paths.length === 0 ? (
                    <tr className={rowClass}>
                      <td colSpan={5} className={isLight ? "px-3 py-5 text-center text-slate-500" : "px-3 py-5 text-center text-slate-400"}>
                        No paths created yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <PathPreview path={draft} />
      </div>
    </div>
  );
}
