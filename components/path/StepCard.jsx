import { PATH_STEP_TYPE } from "@/types/dashboardModels";

export default function StepCard({
  step,
  index,
  modules,
  worksheets,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  disableMoveUp,
  disableMoveDown,
}) {
  const STEP_TYPE_ORDER = [PATH_STEP_TYPE.MODULE, PATH_STEP_TYPE.WORKSHEET, PATH_STEP_TYPE.INFO];
  const enabledTypes = Array.isArray(step.enabledTypes) && step.enabledTypes.length
    ? step.enabledTypes.filter((type) => STEP_TYPE_ORDER.includes(type))
    : [step.type || PATH_STEP_TYPE.INFO];

  const hasType = (type) => enabledTypes.includes(type);

  const selectedModuleIds = Array.isArray(step.linkedModuleIds)
    ? step.linkedModuleIds.filter(Boolean)
    : step.type === PATH_STEP_TYPE.MODULE
      ? Array.isArray(step.linkedItemIds)
        ? step.linkedItemIds.filter(Boolean)
        : step.linkedItemId
          ? [step.linkedItemId]
          : []
      : [];

  const selectedWorksheetIds = Array.isArray(step.linkedWorksheetIds)
    ? step.linkedWorksheetIds.filter(Boolean)
    : step.type === PATH_STEP_TYPE.WORKSHEET
      ? Array.isArray(step.linkedItemIds)
        ? step.linkedItemIds.filter(Boolean)
        : step.linkedItemId
          ? [step.linkedItemId]
          : []
      : [];

  const syncStep = (nextPatch) => {
    const draft = { ...step, ...nextPatch };
    const normalizedEnabledTypes = (Array.isArray(draft.enabledTypes) ? draft.enabledTypes : enabledTypes)
      .filter((type) => STEP_TYPE_ORDER.includes(type));
    const finalEnabledTypes = normalizedEnabledTypes.length ? normalizedEnabledTypes : [PATH_STEP_TYPE.INFO];

    const nextModuleIds = Array.isArray(draft.linkedModuleIds) ? draft.linkedModuleIds.filter(Boolean) : selectedModuleIds;
    const nextWorksheetIds = Array.isArray(draft.linkedWorksheetIds) ? draft.linkedWorksheetIds.filter(Boolean) : selectedWorksheetIds;

    let nextLinkedItemIds = [];
    if (finalEnabledTypes.includes(PATH_STEP_TYPE.MODULE) && nextModuleIds.length) {
      nextLinkedItemIds = nextModuleIds;
    } else if (finalEnabledTypes.includes(PATH_STEP_TYPE.WORKSHEET) && nextWorksheetIds.length) {
      nextLinkedItemIds = nextWorksheetIds;
    }

    onChange({
      ...draft,
      enabledTypes: finalEnabledTypes,
      type: finalEnabledTypes[0] || PATH_STEP_TYPE.INFO,
      linkedModuleIds: nextModuleIds,
      linkedWorksheetIds: nextWorksheetIds,
      linkedItemIds: nextLinkedItemIds,
      linkedItemId: nextLinkedItemIds[0] || "",
    });
  };

  const toggleWorksheetSelection = (worksheetId) => {
    const hasId = selectedWorksheetIds.includes(worksheetId);
    const nextSelected = hasId
      ? selectedWorksheetIds.filter((id) => id !== worksheetId)
      : [...selectedWorksheetIds, worksheetId];

    syncStep({ linkedWorksheetIds: nextSelected });
  };

  const toggleModuleSelection = (moduleId) => {
    const hasId = selectedModuleIds.includes(moduleId);
    const nextSelected = hasId
      ? selectedModuleIds.filter((id) => id !== moduleId)
      : [...selectedModuleIds, moduleId];

    syncStep({ linkedModuleIds: nextSelected });
  };

  const toggleEnabledType = (type) => {
    const nextTypes = hasType(type)
      ? enabledTypes.filter((item) => item !== type)
      : [...enabledTypes, type];
    syncStep({ enabledTypes: nextTypes });
  };

  return (
    <article className="rounded-xl border border-white/10 bg-[#13243d] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">
          Step {index + 1}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={disableMoveUp}
            className="rounded-lg border border-white/20 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Move Up
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={disableMoveDown}
            className="rounded-lg border border-white/20 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Move Down
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-rose-400/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
          >
            Delete Step
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={step.title}
          onChange={(event) => syncStep({ title: event.target.value })}
          placeholder="Step title"
          className="rounded-xl border border-white/20 bg-[#0f1d32] px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
        />
        <div className="rounded-xl border border-white/20 bg-[#0f1d32] px-3 py-2">
          <p className="mb-1 text-xs text-slate-400">Step Content</p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-100">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasType(PATH_STEP_TYPE.MODULE)}
                onChange={() => toggleEnabledType(PATH_STEP_TYPE.MODULE)}
              />
              Module
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasType(PATH_STEP_TYPE.WORKSHEET)}
                onChange={() => toggleEnabledType(PATH_STEP_TYPE.WORKSHEET)}
              />
              Worksheet
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasType(PATH_STEP_TYPE.INFO)}
                onChange={() => toggleEnabledType(PATH_STEP_TYPE.INFO)}
              />
              Info
            </label>
          </div>
        </div>

        <input
          value={step.description}
          onChange={(event) => syncStep({ description: event.target.value })}
          placeholder="Step description"
          className="md:col-span-2 rounded-xl border border-white/20 bg-[#0f1d32] px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
        />

        {hasType(PATH_STEP_TYPE.MODULE) ? (
          <div className="rounded-xl border border-white/20 bg-[#0f1d32] p-3">
            <p className="mb-2 text-xs text-slate-400">Select module(s)</p>
            <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
              {modules.map((module) => {
                const checked = selectedModuleIds.includes(module.id);
                return (
                  <label key={module.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#13243d] px-2 py-1.5 text-sm text-slate-100">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModuleSelection(module.id)}
                    />
                    <span className="truncate">{module.moduleName}</span>
                  </label>
                );
              })}
              {modules.length === 0 ? <p className="text-xs text-slate-500">No modules available.</p> : null}
            </div>
          </div>
        ) : null}

        {hasType(PATH_STEP_TYPE.WORKSHEET) ? (
          <div className="rounded-xl border border-white/20 bg-[#0f1d32] p-3">
            <p className="mb-2 text-xs text-slate-400">Select worksheet(s)</p>
            <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
              {worksheets.map((sheet) => {
                const checked = selectedWorksheetIds.includes(sheet.id);
                return (
                  <label key={sheet.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#13243d] px-2 py-1.5 text-sm text-slate-100">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWorksheetSelection(sheet.id)}
                    />
                    <span className="truncate">{sheet.title}</span>
                  </label>
                );
              })}
              {worksheets.length === 0 ? <p className="text-xs text-slate-500">No worksheets available.</p> : null}
            </div>
          </div>
        ) : null}

        {hasType(PATH_STEP_TYPE.MODULE) ? (
          <div className="rounded-xl border border-white/10 bg-[#0f1d32] p-3">
            <p className="text-xs text-slate-400">Selected Modules</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedModuleIds.length ? selectedModuleIds.map((id) => {
                const module = modules.find((item) => item.id === id);
                return (
                  <span key={id} className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
                    {module?.moduleName || "Unknown Module"}
                  </span>
                );
              }) : <span className="text-xs text-slate-500">No modules selected.</span>}
            </div>
          </div>
        ) : null}

        {hasType(PATH_STEP_TYPE.WORKSHEET) ? (
          <div className="rounded-xl border border-white/10 bg-[#0f1d32] p-3">
            <p className="text-xs text-slate-400">Selected Worksheets</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedWorksheetIds.length ? selectedWorksheetIds.map((id) => {
                const worksheet = worksheets.find((item) => item.id === id);
                return (
                  <span key={id} className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">
                    {worksheet?.title || "Unknown Worksheet"}
                  </span>
                );
              }) : <span className="text-xs text-slate-500">No worksheets selected.</span>}
            </div>
          </div>
        ) : null}

        {hasType(PATH_STEP_TYPE.INFO) ? (
          <textarea
            value={step.infoContent}
            onChange={(event) => syncStep({ infoContent: event.target.value })}
            rows={3}
            placeholder="Info-only content"
            className="md:col-span-2 rounded-xl border border-white/20 bg-[#0f1d32] px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        ) : null}

        {!(hasType(PATH_STEP_TYPE.MODULE) || hasType(PATH_STEP_TYPE.WORKSHEET) || hasType(PATH_STEP_TYPE.INFO)) ? (
          <>
            <p className="md:col-span-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Select at least one content type.
            </p>
          </>
        ) : null}
      </div>
    </article>
  );
}
