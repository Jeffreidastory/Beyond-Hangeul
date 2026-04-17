"use client";

import { useEffect, useMemo, useState } from "react";
import { PAYMENT_METHOD_TYPES, PAYMENT_STATUS } from "@/types/dashboardModels";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  addPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  getPaymentPlans,
  getPaymentRequests,
  savePaymentMethods,
  savePaymentPlans,
  updatePaymentMethod,
  updatePaymentRequestStatus,
} from "@/services/paymentStore";

const tabItems = [
  { key: "requests", label: "Payment Requests" },
  { key: "pricing", label: "Pricing Settings" },
  { key: "methods", label: "Payment Methods" },
];

function StatusBadge({ status }) {
  const tones = {
    pending: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    approved: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    rejected: "border-rose-400/40 bg-rose-500/10 text-rose-300",
    active: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  };
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tones[status] || "border-slate-600 bg-slate-800 text-slate-200"}`}>{status?.toUpperCase()}</span>;
}

export default function PaymentManagementPanel() {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState("requests");
  const [plans, setPlans] = useState(() => getPaymentPlans());
  const [methods, setMethods] = useState(() => getPaymentMethods());
  const [requests, setRequests] = useState(() => getPaymentRequests());
  const [pricingForm, setPricingForm] = useState(() =>
    getPaymentPlans().reduce((acc, plan) => {
      acc[`${plan.id}-price`] = plan.price;
      acc[`${plan.id}-label`] = plan.label;
      acc[`${plan.id}-description`] = plan.description;
      return acc;
    }, {}),
  );
  const [methodForm, setMethodForm] = useState({ name: "", accountName: "", accountNumber: "", type: PAYMENT_METHOD_TYPES.E_WALLET });
  const [editingMethodId, setEditingMethodId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (!event.key) return;
      if (event.key.startsWith("payment:") || event.key.startsWith("users:")) {
        const nextPlans = getPaymentPlans();
        const nextMethods = getPaymentMethods();
        const nextRequests = getPaymentRequests();
        setPlans(nextPlans);
        setMethods(nextMethods);
        setRequests(nextRequests);
        setPricingForm(
          nextPlans.reduce((acc, plan) => {
            acc[`${plan.id}-price`] = plan.price;
            acc[`${plan.id}-label`] = plan.label;
            acc[`${plan.id}-description`] = plan.description;
            return acc;
          }, {}),
        );
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
    return undefined;
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === PAYMENT_STATUS.PENDING),
    [requests],
  );

  const handlePricingInputChange = (key, value) => {
    setPricingForm((prev) => ({ ...prev, [key]: value }));
  };

  const savePricingChanges = () => {
    const updatedPlans = plans.map((plan) => ({
      ...plan,
      price: Number(pricingForm[`${plan.id}-price`] || plan.price),
      label: String(pricingForm[`${plan.id}-label`] || plan.label),
      description: String(pricingForm[`${plan.id}-description`] || plan.description),
    }));
    savePaymentPlans(updatedPlans);
    setPlans(updatedPlans);
    setStatusMessage("Pricing settings updated.");
  };

  const startEditMethod = (method) => {
    setEditingMethodId(method.id);
    setMethodForm({
      name: method.name,
      accountName: method.accountName,
      accountNumber: method.accountNumber,
      type: method.type,
    });
  };

  const cancelEditMethod = () => {
    setEditingMethodId(null);
    setMethodForm({ name: "", accountName: "", accountNumber: "", type: PAYMENT_METHOD_TYPES.E_WALLET });
  };

  const saveMethod = () => {
    if (!methodForm.name.trim() || !methodForm.accountName.trim() || !methodForm.accountNumber.trim()) {
      setStatusMessage("Payment method name, account name, and account number are required.");
      return;
    }

    if (editingMethodId) {
      const updated = updatePaymentMethod(editingMethodId, {
        name: methodForm.name,
        accountName: methodForm.accountName,
        accountNumber: methodForm.accountNumber,
        type: methodForm.type,
        label: methodForm.name,
      });
      setMethods(getPaymentMethods());
      setStatusMessage(`Updated payment method ${updated?.name || "method"}.`);
    } else {
      const added = addPaymentMethod({
        name: methodForm.name,
        accountName: methodForm.accountName,
        accountNumber: methodForm.accountNumber,
        type: methodForm.type,
      });
      setMethods(getPaymentMethods());
      setStatusMessage(`Added payment method ${added.name}.`);
    }

    cancelEditMethod();
  };

  const removeMethod = (methodId) => {
    deletePaymentMethod(methodId);
    setMethods(getPaymentMethods());
    setStatusMessage("Payment method removed.");
  };

  const handleRequestAction = (requestId, status) => {
    updatePaymentRequestStatus(requestId, status);
    setRequests(getPaymentRequests());
    setStatusMessage(`Request ${status === PAYMENT_STATUS.APPROVED ? "approved" : "rejected"}.`);
  };

  return (
    <main className={`space-y-5 rounded-2xl p-5 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
      <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Payment Management</h2>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              Approve payment proofs, update pricing, and maintain accepted payment methods.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === item.key
                    ? "bg-amber-400 text-[#0b1728]"
                    : isLight
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {statusMessage ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {statusMessage}
          </div>
        ) : null}
      </section>

      {activeTab === "requests" && (
        <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Payment Requests</h3>
              <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Approve or reject pending proof submissions and keep premium access up to date.
              </p>
            </div>
            <StatusBadge status="active" />
          </div>

          <div className={`overflow-x-auto rounded-2xl border ${isLight ? "border-slate-200" : "border-white/10"}`}>
            <table className="w-full min-w-[900px] text-sm">
              <thead className={`${isLight ? "bg-slate-100 text-slate-900" : "bg-[#13243d] text-slate-300"}`}>
                <tr>
                  <th className="px-3 py-3 text-left">User</th>
                  <th className="px-3 py-3 text-left">Plan</th>
                  <th className="px-3 py-3 text-left">Amount</th>
                  <th className="px-3 py-3 text-left">Reference</th>
                  <th className="px-3 py-3 text-left">Submitted</th>
                  <th className="px-3 py-3 text-left">Proof</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td className={`px-3 py-6 text-center ${isLight ? "text-slate-500" : "text-slate-400"}`} colSpan={8}>
                      No payment requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className={`${isLight ? "bg-white" : "bg-[#0f1d32]"} border-t border-white/10`}>
                      <td className="px-3 py-3 text-slate-200">
                        <div className="font-semibold text-emerald-300">{request.userName}</div>
                        <div className="text-xs text-slate-400">{request.userEmail}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-200">{request.planLabel}</td>
                      <td className="px-3 py-3 text-slate-200">₱{request.amount.toFixed(2)}</td>
                      <td className="px-3 py-3 text-slate-200">{request.reference || "—"}</td>
                      <td className="px-3 py-3 text-slate-200">{new Date(request.submittedAt).toLocaleDateString()}</td>
                      <td className="px-3 py-3 text-slate-200">
                        {request.proofImage ? (
                          <a
                            href={request.proofImage}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-300 underline"
                          >
                            View
                          </a>
                        ) : (
                          "No proof"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleRequestAction(request.id, PAYMENT_STATUS.APPROVED)}
                            disabled={request.status !== PAYMENT_STATUS.PENDING}
                            className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(request.id, PAYMENT_STATUS.REJECTED)}
                            disabled={request.status !== PAYMENT_STATUS.PENDING}
                            className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reject
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
      )}

      {activeTab === "pricing" && (
        <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
          <div className="mb-4">
            <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Pricing Settings</h3>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Update prices and plan labels for the subscription plans. Changes apply immediately.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.id} className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-amber-300">{plan.name}</h4>
                    <p className="mt-1 text-sm text-slate-400">{plan.billingCycle === "year" ? "Best Value" : "Monthly billing"}</p>
                  </div>
                  {plan.featured ? (
                    <span className="rounded-full bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-300">
                      Best Value
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-semibold text-slate-200">Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    value={pricingForm[`${plan.id}-price`] ?? plan.price}
                    onChange={(event) => handlePricingInputChange(`${plan.id}-price`, event.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#0f1d32] text-slate-100"}`}
                  />

                  <label className="block text-sm font-semibold text-slate-200">Plan label</label>
                  <input
                    type="text"
                    value={pricingForm[`${plan.id}-label`] ?? plan.label}
                    onChange={(event) => handlePricingInputChange(`${plan.id}-label`, event.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#0f1d32] text-slate-100"}`}
                  />

                  <label className="block text-sm font-semibold text-slate-200">Description</label>
                  <textarea
                    value={pricingForm[`${plan.id}-description`] ?? plan.description}
                    onChange={(event) => handlePricingInputChange(`${plan.id}-description`, event.target.value)}
                    rows={3}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#0f1d32] text-slate-100"}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={savePricingChanges}
            className="mt-6 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0b1728] transition hover:bg-amber-300"
          >
            Save Pricing
          </button>
        </section>
      )}

      {activeTab === "methods" && (
        <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
          <div className="mb-4">
            <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Payment Methods</h3>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Add or update accepted payment methods for the user-facing instructions modal.
            </p>
          </div>

          <div className="grid gap-4">
            <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-200">
                  Method name
                  <input
                    value={methodForm.name}
                    onChange={(event) => setMethodForm((prev) => ({ ...prev, name: event.target.value }))}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#0f1d32] text-slate-100"}`}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-200">
                  Type
                  <select
                    value={methodForm.type}
                    onChange={(event) => setMethodForm((prev) => ({ ...prev, type: event.target.value }))}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#0f1d32] text-slate-100"}`}
                  >
                    <option value={PAYMENT_METHOD_TYPES.E_WALLET}>e-wallet</option>
                    <option value={PAYMENT_METHOD_TYPES.BANK}>bank</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mt-4">
                <label className="block text-sm font-semibold text-slate-200">
                  Account name
                  <input
                    value={methodForm.accountName}
                    onChange={(event) => setMethodForm((prev) => ({ ...prev, accountName: event.target.value }))}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#0f1d32] text-slate-100"}`}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-200">
                  Account number
                  <input
                    value={methodForm.accountNumber}
                    onChange={(event) => setMethodForm((prev) => ({ ...prev, accountNumber: event.target.value }))}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#0f1d32] text-slate-100"}`}
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveMethod}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0b1728] hover:bg-amber-300"
                >
                  {editingMethodId ? "Save Changes" : "Add Payment Method"}
                </button>
                {editingMethodId ? (
                  <button
                    type="button"
                    onClick={cancelEditMethod}
                    className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>

            <div className={`overflow-x-auto rounded-3xl border ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
              <table className="w-full min-w-[740px] text-sm">
                <thead className={`${isLight ? "bg-slate-100 text-slate-900" : "bg-[#13243d] text-slate-300"}`}>
                  <tr>
                    <th className="px-3 py-3 text-left">Method</th>
                    <th className="px-3 py-3 text-left">Account Name</th>
                    <th className="px-3 py-3 text-left">Account Number</th>
                    <th className="px-3 py-3 text-left">Type</th>
                    <th className="px-3 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.length === 0 ? (
                    <tr>
                      <td className={`px-3 py-6 text-center ${isLight ? "text-slate-500" : "text-slate-400"}`} colSpan={5}>
                        No payment methods configured.
                      </td>
                    </tr>
                  ) : (
                    methods.map((method) => (
                      <tr key={method.id} className={`border-t ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
                        <td className="px-3 py-3 text-slate-200">{method.name}</td>
                        <td className="px-3 py-3 text-slate-200">{method.accountName}</td>
                        <td className="px-3 py-3 text-slate-200">{method.accountNumber}</td>
                        <td className="px-3 py-3 text-slate-200">{method.type}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditMethod(method)}
                              className="rounded-lg border border-slate-500/70 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMethod(method.id)}
                              className="rounded-lg border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
