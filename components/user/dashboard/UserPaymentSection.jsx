"use client";

import { useMemo } from "react";
import { PAYMENT_STATUS } from "@/types/dashboardModels";

export default function UserPaymentSection({
  plans,
  methods,
  selectedPlanId,
  selectedMethodId,
  paymentModalOpen,
  latestRequest,
  subscription,
  referenceNumber,
  proofImage,
  onSelectPlan,
  onOpenModal,
  onCloseModal,
  onSelectMethod,
  onReferenceChange,
  onUploadProof,
  onSubmitProof,
  notice,
  isLight,
}) {
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || plans[0] || null,
    [plans, selectedPlanId],
  );

  const rawStatus = subscription?.status || latestRequest?.status || "inactive";
  const status = rawStatus === PAYMENT_STATUS.APPROVED ? "active" : rawStatus;
  const isActive = status === "active";
  const isPending = status === PAYMENT_STATUS.PENDING;
  const isRejected = status === PAYMENT_STATUS.REJECTED;

  const statusTone = {
    active: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    pending: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    rejected: "border-rose-400/40 bg-rose-500/10 text-rose-300",
    inactive: "border-slate-500/40 bg-slate-600/10 text-slate-300",
  };

  const statusLabel = {
    active: "Subscribed",
    pending: "Pending Review",
    rejected: "Rejected",
    inactive: "No Submission",
  };

  const planLabel = selectedPlan?.label || "Choose a plan";
  const planPrice = selectedPlan?.price != null ? `₱${selectedPlan.price} / ${selectedPlan.billingCycle}` : "—";
  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === subscription?.planId) || selectedPlan,
    [plans, subscription?.planId, selectedPlan],
  );
  const currentPlanLabel = subscription?.planLabel || planLabel;
  const currentPlanPrice = activePlan?.price != null ? `₱${activePlan.price} / ${activePlan.billingCycle}` : planPrice;

  const requestSubmittedAt = latestRequest?.submittedAt ? new Date(latestRequest.submittedAt).toLocaleString() : null;
  const expiryDate = subscription?.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : null;

  return (
    <main className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
      <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-2xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Premium Subscription</h2>
            <p className={`mt-2 max-w-2xl text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              Pick the plan that fits your Korean learning pace, send proof, and get Premium access once approved.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${statusTone[status]}`}>
            <span>{statusLabel[status]}</span>
            {isActive && expiryDate ? <span className="text-slate-200">Expires {expiryDate}</span> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Pricing Plans</h3>
              <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                Monthly and yearly subscriptions with the same premium features.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl border p-5 transition ${
                  plan.id === selectedPlanId
                    ? "border-amber-400 bg-amber-500/10"
                    : isLight
                    ? "border-slate-200 bg-white"
                    : "border-white/10 bg-[#0f1627]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-amber-300">{plan.name}</p>
                    <p className="mt-3 text-3xl font-bold text-white">₱{plan.price}</p>
                    <p className="text-sm text-slate-400">/ {plan.billingCycle}</p>
                  </div>
                  {plan.featured ? (
                    <div className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">
                      Best Value
                    </div>
                  ) : null}
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-300">{plan.description}</p>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPlan(plan.id);
                    onOpenModal();
                  }}
                  className="mt-6 w-full rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0b1728] transition hover:bg-amber-300"
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
          <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Subscription Summary</h3>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1627]"}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Current Plan</p>
                  <p className="mt-2 text-base font-semibold text-white">{currentPlanLabel}</p>
                  <p className="mt-1 text-slate-400">{currentPlanPrice}</p>
                </div>
                {isActive ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">
                    Subscribed
                  </span>
                ) : null}
              </div>
            </div>

            {latestRequest ? (
              <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1627]"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Latest Submission</p>
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusTone[latestRequest.status] || statusTone.inactive}`}>
                    {latestRequest.status === PAYMENT_STATUS.APPROVED ? "Approved" : latestRequest.status === PAYMENT_STATUS.PENDING ? "Pending" : latestRequest.status === PAYMENT_STATUS.REJECTED ? "Rejected" : "Unknown"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-100">{latestRequest.planLabel}</p>
                <p className="mt-2 text-sm text-slate-400">Submitted: {requestSubmittedAt}</p>
                <p className="mt-2 text-sm text-slate-400">Reference: {latestRequest.reference || "None"}</p>
              </div>
            ) : (
              <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1627]"}`}>
                <p className="text-sm text-slate-300">No payment proof submitted yet. Select a plan and upload proof to begin.</p>
              </div>
            )}

            {subscription?.status === "active" && expiryDate ? (
              <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1627]"}`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Active until</p>
                <p className="mt-2 text-base font-semibold text-white">{expiryDate}</p>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      {paymentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Submit Payment Proof</h3>
                <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>Upload your screenshot and reference number for faster approval.</p>
              </div>
              <button
                type="button"
                onClick={onCloseModal}
                className={`rounded-full px-3 py-2 text-sm ${isLight ? "bg-slate-100 text-slate-700" : "bg-white/10 text-slate-200"}`}
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1627]"}`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Selected Plan</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedPlan?.name}</p>
                <p className="mt-1 text-sm text-slate-400">{planPrice}</p>
                <p className="mt-4 text-sm text-slate-300">{selectedPlan?.description}</p>
              </div>
              <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1627]"}`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Accepted Methods</p>
                <div className="mt-3 space-y-3">
                  {methods.map((method) => (
                    <div key={method.id} className={`rounded-2xl border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{method.name}</p>
                          <p className="text-sm text-slate-400">{method.type}</p>
                        </div>
                        {selectedMethodId === method.id ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">Selected</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-300">Name: {method.accountName}</p>
                      <p className="text-sm text-slate-300">Account: {method.accountNumber}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#13243d]"}`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Select payment method</p>
                <select
                  value={selectedMethodId}
                  onChange={(event) => onSelectMethod(event.target.value)}
                  className={`mt-3 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#0f1d32] text-slate-100"}`}
                >
                  {methods.map((method) => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>

              <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#13243d]"}`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Reference Number</p>
                <input
                  value={referenceNumber}
                  onChange={(event) => onReferenceChange(event.target.value)}
                  placeholder="Optional reference number"
                  className={`mt-3 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#0f1d32] text-slate-100"}`}
                />
              </div>

              <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#13243d]"}`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Upload Proof</p>
                <label className={`mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-3 py-4 text-sm ${isLight ? "border-slate-300 bg-slate-50 text-slate-700" : "border-white/20 bg-[#0f1627] text-slate-300"}`}>
                  Click to upload screenshot
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => onUploadProof(event.target.files?.[0])}
                  />
                </label>
                {proofImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={proofImage} alt="Payment proof preview" className="mt-4 h-56 w-full rounded-2xl border border-white/10 object-contain" />
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onSubmitProof}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0b1728] hover:bg-amber-300"
                >
                  Submit Payment Proof
                </button>
                <button
                  type="button"
                  onClick={onCloseModal}
                  className={`rounded-xl border px-4 py-2 text-sm ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 text-slate-200 hover:bg-white/10"}`}
                >
                  Cancel
                </button>
              </div>

              {notice ? <p className="text-sm text-emerald-400">{notice}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
