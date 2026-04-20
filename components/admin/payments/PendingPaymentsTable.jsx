import { PAYMENT_STATUS } from "@/types/dashboardModels";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function PendingPaymentsTable({ pendingRows = [], onViewProof, onApprove }) {
  const { isLight } = useTheme();

  return (
    <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Pending Payments</h3>
          <p className="text-sm text-slate-400">Review payment proof and grant access quickly.</p>
        </div>
        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">
          {pendingRows.length} Pending
        </span>
      </div>

      <div className={`overflow-x-auto rounded-xl border ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <table className="w-full min-w-170 text-sm">
          <thead className={`${isLight ? "bg-slate-100 text-slate-900" : "bg-[#13243d] text-slate-300"}`}>
            <tr>
              <th className="px-3 py-2 text-left">User Name</th>
              <th className="px-3 py-2 text-left">Module Name</th>
              <th className="px-3 py-2 text-left">Reference</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingRows.length === 0 ? (
              <tr className={`${isLight ? "border-t border-slate-200 bg-white" : "border-t border-white/10 bg-[#0f1d32]"}`}>
                <td className={`px-3 py-6 text-center ${isLight ? "text-slate-500" : "text-slate-400"}`} colSpan={4}>
                  No pending payments.
                </td>
              </tr>
            ) : (
              pendingRows.map((row) => (
                <tr key={row.id} className="border-t border-white/10 bg-[#0f1d32]">
                  <td className="px-3 py-3 text-slate-200">{row.userName}</td>
                  <td className="px-3 py-3 text-slate-200">{row.moduleName}</td>
                  <td className="px-3 py-3 text-slate-200">{row.payment?.reference || "—"}</td>
                  <td className="px-3 py-3 text-slate-300">{row.dateLabel}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onViewProof?.(row.payment)}
                        className="rounded-lg border border-sky-400/40 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/20"
                      >
                        View Proof
                      </button>
                      <button
                        type="button"
                        onClick={() => onApprove?.(row.payment)}
                        disabled={row.payment.status !== PAYMENT_STATUS.PENDING}
                        className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
