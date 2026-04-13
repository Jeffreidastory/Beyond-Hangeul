export default function PathHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0b1728] transition hover:bg-amber-300"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
