import { PAYMENT_STATUS } from "@/types/dashboardModels";

export default function PaymentProofModal({ payment, moduleName, onClose, onApprove }) {
  if (!payment) return null;

  const previewImage = payment.proofImage || payment.receiptImage || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
        <h3 className="text-lg font-semibold text-white">Premium Access Payment Proof</h3>
        <div className="mt-3 grid gap-2 text-sm text-slate-300">
          <p>User: {payment.userName || payment.userEmail}</p>
          <p>Module: {moduleName || "Unknown Module"}</p>
          <p>Amount: ₱{Number(payment.amount || 150).toFixed(2)}</p>
          <p>Method: {payment.method || "GCash"}</p>
          <p>Verification Status: {payment.status}</p>
          <p>Submitted: {payment.submittedAt ? new Date(payment.submittedAt).toLocaleString() : "-"}</p>
        </div>

        {previewImage ? (
          <img src={previewImage} alt="Payment proof" className="mt-4 max-h-95 w-full rounded-xl border border-white/10 object-contain" />
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-white/20 bg-[#13243d] p-4 text-sm text-slate-400">
            No proof image uploaded.
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-100">
            Close
          </button>
          {payment.status !== PAYMENT_STATUS.APPROVED && (
            <button
              type="button"
              onClick={onApprove}
              className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
            >
              Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
