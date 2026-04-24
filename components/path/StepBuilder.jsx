import { useTheme } from "@/components/theme/ThemeProvider";
import StepCard from "@/components/path/StepCard";
import { PATH_STEP_TYPE } from "@/types/dashboardModels";

export default function StepBuilder({
  steps,
  modules,
  worksheets,
  printableWorksheets = [],
  onChangeSteps,
}) {
  const updateStep = (index, nextStep) => {
    const next = [...steps];
    next[index] = nextStep;
    onChangeSteps(next);
  };

  const moveStep = (from, to) => {
    const next = [...steps];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChangeSteps(next);
  };

  const deleteStep = (index) => {
    const next = steps.filter((_, itemIndex) => itemIndex !== index);
    onChangeSteps(next);
  };

  const { isLight } = useTheme();
  const panelClass = isLight ? "rounded-2xl border border-slate-200 bg-white p-5" : "rounded-2xl border border-white/10 bg-[#0f1d32] p-5";
  const textClass = isLight ? "text-slate-900" : "text-white";
  const mutedClass = isLight ? "text-slate-500" : "text-slate-400";
  const emptyClass = isLight ? "rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600" : "rounded-xl border border-dashed border-white/20 bg-[#13243d] p-3 text-sm text-slate-400";

  return (
    <section className={panelClass}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className={`text-lg font-semibold ${textClass}`}>Step Builder</h3>
          <p className={`text-sm ${mutedClass}`}>Create ordered steps for the learning journey.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChangeSteps([
              ...steps,
              {
                id: `draft-step-${Math.random().toString(36).slice(2, 9)}`,
                order: steps.length + 1,
                title: "",
                description: "",
                type: PATH_STEP_TYPE.INFO,
                enabledTypes: [PATH_STEP_TYPE.INFO],
                linkedItemId: "",
                linkedItemIds: [],
                linkedModuleIds: [],
                linkedWorksheetIds: [],
                infoContent: "",
              },
            ])
          }
          className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
        >
          + Add Step
        </button>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={{ ...step, order: index + 1 }}
            index={index}
            modules={modules}
            worksheets={worksheets}
            printableWorksheets={printableWorksheets}
            onChange={(nextStep) => updateStep(index, nextStep)}
            onMoveUp={() => moveStep(index, index - 1)}
            onMoveDown={() => moveStep(index, index + 1)}
            onDelete={() => deleteStep(index)}
            disableMoveUp={index === 0}
            disableMoveDown={index === steps.length - 1}
          />
        ))}

        {steps.length === 0 ? (
          <p className={emptyClass}>
            No steps yet. Add your first step.
          </p>
        ) : null}
      </div>
    </section>
  );
}
