import { useState } from "react";
import Link from "next/link";
import UserPathStepItem from "@/components/path/UserPathStepItem";
import { useTheme } from "@/components/theme/ThemeProvider";
import { PATH_STEP_TYPE } from "@/types/dashboardModels";

export default function UserPathTimeline({ path, modules = [], worksheets = [], moduleProgress = {}, worksheetScores = {} }) {
  const { isLight } = useTheme();
  const [viewModalData, setViewModalData] = useState(null);
  const moduleMap = new Map(modules.map((module) => [module.id, module]));
  const worksheetMap = new Map(worksheets.map((sheet) => [sheet.id, sheet]));
  const stepList = path?.steps || [];

  const stepCompletion = stepList.map((step) => {
    const enabledTypes = Array.isArray(step.enabledTypes) && step.enabledTypes.length
      ? step.enabledTypes
      : [step.type || PATH_STEP_TYPE.INFO];

    const linkedModuleIds = Array.isArray(step.linkedModuleIds)
      ? step.linkedModuleIds.filter(Boolean)
      : step.type === PATH_STEP_TYPE.MODULE
        ? (Array.isArray(step.linkedItemIds) ? step.linkedItemIds.filter(Boolean) : (step.linkedItemId ? [step.linkedItemId] : []))
        : [];

    const linkedWorksheetIds = Array.isArray(step.linkedWorksheetIds)
      ? step.linkedWorksheetIds.filter(Boolean)
      : step.type === PATH_STEP_TYPE.WORKSHEET
        ? (Array.isArray(step.linkedItemIds) ? step.linkedItemIds.filter(Boolean) : (step.linkedItemId ? [step.linkedItemId] : []))
        : [];

    const moduleRequirementMet = enabledTypes.includes(PATH_STEP_TYPE.MODULE)
      ? linkedModuleIds.length > 0 && linkedModuleIds.every((moduleId) => {
          const progress = moduleProgress[moduleId];
          return Boolean(progress?.completed) || Number(progress?.progressPercent || 0) >= 100;
        })
      : true;

    const worksheetRequirementMet = enabledTypes.includes(PATH_STEP_TYPE.WORKSHEET)
      ? linkedWorksheetIds.length > 0 && linkedWorksheetIds.every((worksheetId) => {
          const score = worksheetScores[worksheetId];
          return Boolean(score?.quizComplete);
        })
      : true;

    return moduleRequirementMet && worksheetRequirementMet;
  });

  const firstIncompleteIndex = stepCompletion.findIndex((isDone) => !isDone);
  const currentUnlockedIndex = firstIncompleteIndex === -1 ? stepList.length : firstIncompleteIndex;

  return (
    <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
      <h1 className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{path?.title || "Learning Path"}</h1>
      <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>{path?.description || "No active path published yet."}</p>

      <div className="mt-4 space-y-3">
        {stepList.map((step, index) => {
          const status = stepCompletion[index] ? "completed" : index === currentUnlockedIndex ? "current" : "locked";
          const enabledTypes = Array.isArray(step.enabledTypes) && step.enabledTypes.length
            ? step.enabledTypes
            : [step.type || PATH_STEP_TYPE.INFO];

          const preferredModuleIds = Array.isArray(step.linkedModuleIds)
            ? step.linkedModuleIds
            : step.type === PATH_STEP_TYPE.MODULE
              ? Array.isArray(step.linkedItemIds)
                ? step.linkedItemIds
                : step.linkedItemId
                  ? [step.linkedItemId]
                  : []
              : [];

          const preferredWorksheetIds = Array.isArray(step.linkedWorksheetIds)
            ? step.linkedWorksheetIds
            : step.type === PATH_STEP_TYPE.WORKSHEET
              ? Array.isArray(step.linkedItemIds)
                ? step.linkedItemIds
                : step.linkedItemId
                  ? [step.linkedItemId]
                  : []
              : [];

          const moduleLinkId =
            preferredModuleIds[0] ||
            step.linkedItemId ||
            "";
          const worksheetLinkId =
            preferredWorksheetIds[0] ||
            step.linkedItemId ||
            "";

          return (
            <div key={step.id || index} className="relative pl-6">
              <span className="absolute left-0 top-5 h-2 w-2 rounded-full bg-amber-300" />
              {index < (path.steps?.length || 0) - 1 ? (
                <span className="absolute left-0.5 top-7 h-[calc(100%+0.5rem)] w-px bg-white/15" />
              ) : null}
              <UserPathStepItem
                step={step}
                index={index}
                status={status}
                onViewDetails={() => {
                  const selectedModules = preferredModuleIds
                    .map((moduleId) => {
                      const module = moduleMap.get(moduleId);
                      if (!module) return null;
                      return {
                        id: module.id,
                        title: module.moduleName,
                        href: `/dashboard?tab=modules&module=${module.id}`,
                        locked: Boolean(module.isLocked),
                      };
                    })
                    .filter(Boolean);
                  const selectedWorksheets = preferredWorksheetIds
                    .map((worksheetId) => {
                      const worksheet = worksheetMap.get(worksheetId);
                      if (!worksheet) return null;
                      return {
                        id: worksheet.id,
                        title: worksheet.title,
                        href: `/dashboard?tab=worksheets&worksheet=${worksheet.id}`,
                        locked: false,
                      };
                    })
                    .filter(Boolean);

                  setViewModalData({
                    step,
                    selectedModules,
                    selectedWorksheets,
                    infoText: step.infoContent || step.description || "",
                  });
                }}
              />
            </div>
          );
        })}

        {!path?.steps?.length ? (
          <p className={`rounded-xl border border-dashed p-3 text-sm ${isLight ? "border-slate-300 bg-slate-50 text-slate-600" : "border-white/20 bg-[#13243d] text-slate-400"}`}>No path steps available yet.</p>
        ) : null}
      </div>

      {viewModalData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-2xl rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Step Details</h3>
                <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{viewModalData.step?.title || "Untitled Step"}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewModalData(null)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-500 text-slate-200 hover:bg-white/10"}`}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <section className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
                <p className="text-xs uppercase tracking-wide text-amber-300">Modules</p>
                <div className={`mt-2 space-y-1 text-sm ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  {viewModalData.selectedModules.length ? viewModalData.selectedModules.map((module) => (
                    module.locked ? (
                      <span key={module.id} className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-rose-200">
                        <span aria-hidden="true">🔒</span>
                        {module.title}
                      </span>
                    ) : (
                      <Link key={module.id} href={module.href} className={`inline-flex rounded-md border px-2 py-1 ${isLight ? "border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400" : "border-white/20 bg-[#0f1d32] text-slate-100 hover:border-amber-300"}`}>
                        {module.title}
                      </Link>
                    )
                  )) : <p className={isLight ? "text-slate-500" : "text-slate-400"}>No modules selected.</p>}
                </div>
              </section>

              <section className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
                <p className="text-xs uppercase tracking-wide text-emerald-300">Worksheets</p>
                <div className={`mt-2 space-y-1 text-sm ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  {viewModalData.selectedWorksheets.length ? viewModalData.selectedWorksheets.map((sheet) => (
                    <Link key={sheet.id} href={sheet.href} className={`inline-flex rounded-md border px-2 py-1 ${isLight ? "border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400" : "border-white/20 bg-[#0f1d32] text-slate-100 hover:border-amber-300"}`}>
                      {sheet.title}
                    </Link>
                  )) : <p className={isLight ? "text-slate-500" : "text-slate-400"}>No worksheets selected.</p>}
                </div>
              </section>

              <section className={`rounded-xl border p-3 md:col-span-2 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
                <p className="text-xs uppercase tracking-wide text-sky-300">Info</p>
                <p className={`mt-2 text-sm ${isLight ? "text-slate-800" : "text-slate-200"}`}>{viewModalData.infoText || "No info content."}</p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
