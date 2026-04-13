import { PATH_STATUS } from "@/types/dashboardModels";

export default function PathDetailsCard({ value, onChange }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
      <h3 className="text-lg font-semibold text-white">Path Details</h3>
      <p className="mt-1 text-sm text-slate-400">Define the learning flow shown to all users.</p>

      <div className="mt-4 grid gap-3">
        <input
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
          placeholder="Path title"
          className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
        />

        <textarea
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          rows={3}
          placeholder="Path description"
          className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
        />

        <select
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value })}
          className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
        >
          <option value={PATH_STATUS.ACTIVE}>Active</option>
          <option value={PATH_STATUS.DRAFT}>Draft</option>
        </select>
      </div>
    </section>
  );
}
