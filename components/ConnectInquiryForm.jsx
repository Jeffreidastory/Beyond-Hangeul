"use client";

import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

export default function ConnectInquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to send message.");
      }

      setStatus("Message sent successfully. We will get back to you soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="box-border w-full min-h-[48px] rounded-xl border border-amber-400/45 bg-[#111114] px-4 py-3 text-base text-white placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(255,191,0,0.18)]"
      />

      <input
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="box-border w-full min-h-[48px] rounded-xl border border-amber-400/45 bg-[#111114] px-4 py-3 text-base text-white placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(255,191,0,0.18)]"
      />

      <select
        required
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="box-border w-full min-h-[48px] rounded-xl border border-amber-400/45 bg-[#111114] px-4 py-3 text-base text-white outline-none transition focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(255,191,0,0.18)]"
      >
        <option value="" disabled>
          Subject
        </option>
        <option value="Lesson Inquiry">Lesson Inquiry</option>
        <option value="Collaboration">Collaboration</option>
      </select>

      <textarea
        placeholder="Message"
        rows={4}
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="box-border w-full min-h-[140px] rounded-xl border border-amber-400/45 bg-[#111114] px-4 py-3 text-base text-white placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(255,191,0,0.18)]"
      />

      {error && <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">{error}</p>}
      {status && <p className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100">{status}</p>}

      <button
        type="submit"
        disabled={loading}
        className="box-border inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFBF00] px-4 py-3.5 text-base font-bold tracking-wide text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <FaPaperPlane size={14} />
        {loading ? "SENDING..." : "SEND MESSAGE"}
      </button>
    </form>
  );
}
