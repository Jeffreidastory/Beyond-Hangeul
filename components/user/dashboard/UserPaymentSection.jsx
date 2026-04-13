"use client";

import { useMemo, useState } from "react";
import gcashQr from "@/app/images/gcash-qr.png";
import gotymeQr from "@/app/images/gotyme-qr.jpg";

export default function UserPaymentSection({
  selectedModule,
  paymentStatus,
  paymentMethod,
  onChangeMethod,
  receiptImage,
  onUploadProof,
  onSubmit,
  notice,
  isLight,
}) {
  const [qrModal, setQrModal] = useState(null);
  const isApproved = paymentStatus === "approved";
  const isPending = paymentStatus === "pending";
  const isSubmissionLocked = isApproved || isPending;
  const statusTone = {
    not_submitted: "border-slate-500/40 bg-slate-600/10 text-slate-300",
    pending: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    approved: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    rejected: "border-rose-400/40 bg-rose-500/10 text-rose-300",
  };

  const statusLabel = {
    not_submitted: "Not Submitted",
    pending: "Pending Verification",
    approved: "Approved",
    rejected: "Rejected",
  };

  const qrByMethod = useMemo(
    () => ({
      GCash: {
        src: gcashQr.src,
        alt: "GCash QR",
        name: "Aira Mae Araneta",
        number: "09089740724",
      },
      GoTyme: {
        src: gotymeQr.src,
        alt: "GoTyme QR",
        name: "Jefferson Feliciano",
        number: "09944767382",
      },
    }),
    []
  );

  const openQrModal = (method) => {
    setQrModal(method);
  };

  const closeQrModal = () => {
    setQrModal(null);
  };

  const activeQr = qrModal ? qrByMethod[qrModal] : null;

  return (
    <main className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
      <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
        <h2 className="text-xl font-bold">Payment</h2>
        <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          Submit your payment proof to unlock all premium modules with one-time access.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
          <h3 className="text-lg font-semibold">Premium Access Payment</h3>
          <div className="mt-3 space-y-3">
            <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
              <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Selected Module</p>
              <p className="mt-1 text-sm font-semibold">All Premium Modules (One-Time Access)</p>
              {selectedModule?.moduleName ? (
                <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Triggered from: {selectedModule.moduleName}
                </p>
              ) : null}
            </div>

            <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
              <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Verification Status</p>
              <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusTone[paymentStatus] || statusTone.not_submitted}`}>
                {statusLabel[paymentStatus] || statusLabel.not_submitted}
              </span>
            </div>

            <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
              <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Payment Instructions</p>
              <ul className={`mt-2 space-y-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                <li>1. Send payment to GCash or GoTyme.</li>
                <li>2. Upload screenshot/proof of payment.</li>
                <li>3. Wait for admin approval to unlock access.</li>
              </ul>
            </div>

            <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
              <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Payment Methods</p>
              <div className={`mt-2 grid gap-3 text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                <div className={`relative rounded-lg border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
                  <button
                    type="button"
                    onClick={() => openQrModal("GCash")}
                    className="absolute right-3 top-3 rounded-md bg-amber-400 px-2 py-1 text-[11px] font-semibold text-[#0b1728] transition hover:bg-amber-300"
                  >
                    View QR
                  </button>
                  <p className="mt-8 font-semibold text-amber-300">GCash</p>
                  <p className="mt-1">Name: Aira Mae Araneta</p>
                  <p>Number: 09089740724</p>
                </div>

                <div className={`relative rounded-lg border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
                  <button
                    type="button"
                    onClick={() => openQrModal("GoTyme")}
                    className="absolute right-3 top-3 rounded-md bg-amber-400 px-2 py-1 text-[11px] font-semibold text-[#0b1728] transition hover:bg-amber-300"
                  >
                    View QR
                  </button>
                  <p className="mt-8 font-semibold text-amber-300">GoTyme</p>
                  <p className="mt-1">Name: Jefferson Feliciano</p>
                  <p>Number: 09944767382</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
          <h3 className="text-lg font-semibold">Upload Receipt</h3>
          <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>Upload clear payment proof image before submitting.</p>

          <div className="mt-3 space-y-3">
            <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
              <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Price</p>
              <p className="mt-1 text-3xl font-bold text-amber-300">₱150.00</p>
            </div>

            <select
              value={paymentMethod}
              onChange={(event) => onChangeMethod(event.target.value)}
              disabled={isSubmissionLocked}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                isLight
                  ? "border-slate-300 bg-white text-slate-900 focus:border-amber-500"
                  : "border-white/15 bg-[#0f1d32] text-slate-100 focus:border-amber-400"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="GCash">GCash</option>
              <option value="GoTyme">GoTyme</option>
            </select>

            <label className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-3 py-3 text-sm ${isLight ? "border-slate-300 bg-white" : "border-white/20 bg-[#0f1d32]"}`}>
              Upload Payment Proof
              <input
                type="file"
                accept="image/*"
                disabled={isSubmissionLocked}
                className="hidden"
                onChange={(event) => onUploadProof(event.target.files?.[0])}
              />
            </label>

            {receiptImage ? <img src={receiptImage} alt="Receipt preview" className="h-48 w-full rounded-xl border border-white/10 object-contain" /> : null}

            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmissionLocked}
              className="w-full rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-[#0b1728] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApproved ? "Payment Already Approved" : isPending ? "Waiting For Verification" : "Submit Payment"}
            </button>

            {isApproved ? (
              <p className="text-xs text-emerald-300">
                Premium access is already approved. Contact admin only if a payment reset is needed.
              </p>
            ) : null}



            {notice ? <p className="text-sm text-emerald-400">{notice}</p> : null}
          </div>
        </section>
      </div>

      {activeQr ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${qrModal} QR code`}
          onClick={closeQrModal}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-4 shadow-2xl ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-semibold">{qrModal} QR Code</h4>
              <button
                type="button"
                onClick={closeQrModal}
                className={`rounded-md px-2 py-1 text-xs ${isLight ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-white/10 text-slate-200 hover:bg-white/20"}`}
              >
                Close
              </button>
            </div>

            <img
              src={activeQr.src}
              alt={activeQr.alt}
              className="h-auto max-h-95 w-full rounded-xl border border-white/10 object-contain"
            />

            <div className={`mt-3 text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              <p>Name: {activeQr.name}</p>
              <p>Number: {activeQr.number}</p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
