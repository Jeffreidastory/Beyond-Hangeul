"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function RegisterForm() {
  const textFieldClass =
    "w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder:text-slate-300 outline-none ring-2 ring-transparent transition focus:border-white/30 focus:ring-white/20";

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const requestOtp = async () => {
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Failed to send OTP.");
    }

    return payload;
  };

  const verifyOtp = async () => {
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "OTP verification failed.");
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (step === 1) {
      if (!firstName || !lastName || !country || !province || !city) {
        setError("Complete all Step 1 fields.");
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!email || !password || !confirmPassword) {
        setError("Complete all Step 2 fields.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Password and match password must be identical.");
        return;
      }

      setLoading(true);
      try {
        const payload = await requestOtp();
        setStep(3);
        setMessage(
          payload?.warning
            ? payload.warning
            : "OTP sent to your email."
        );
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }

      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    try {
      await verifyOtp();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            address_country: country,
            address_province: province,
            address_city: city,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setMessage("Registration successful. Check your email to confirm your account.");
    } catch (signUpFlowError) {
      setError(signUpFlowError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-base font-semibold ${step === 1 ? "text-amber-400" : "text-zinc-400"}`}>1</span>
            <span className={`text-sm font-semibold ${step === 1 ? "text-amber-400" : step > 1 ? "text-white" : "text-zinc-400"}`}>
              Account
            </span>
          </div>

          <div className={`h-[2px] w-10 sm:w-14 ${step >= 2 ? "bg-[#f2b527]" : "bg-zinc-200"}`} />

          <div className="flex items-center gap-2">
            <span className={`text-base font-semibold ${step === 2 ? "text-amber-400" : "text-zinc-400"}`}>2</span>
            <span className={`text-sm font-semibold ${step === 2 ? "text-amber-400" : step > 2 ? "text-white" : "text-zinc-400"}`}>
              Details
            </span>
          </div>

          <div className={`h-[2px] w-10 sm:w-14 ${step >= 3 ? "bg-[#f2b527]" : "bg-zinc-200"}`} />

          <div className="flex items-center gap-2">
            <span className={`text-base font-semibold ${step === 3 ? "text-amber-400" : "text-zinc-400"}`}>3</span>
            <span className={`text-sm font-semibold ${step === 3 ? "text-amber-400" : "text-zinc-400"}`}>
              Verify
            </span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first-name" className="mb-1 block text-sm font-medium">
                First name
              </label>
              <input
                id="first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={textFieldClass}
              />
            </div>
            <div>
              <label htmlFor="last-name" className="mb-1 block text-sm font-medium">
                Last name
              </label>
              <input
                id="last-name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={textFieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="country" className="mb-1 block text-sm font-medium">
              Address - Country
            </label>
            <input
              id="country"
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={textFieldClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="province" className="mb-1 block text-sm font-medium">
                Address - Province
              </label>
              <input
                id="province"
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className={textFieldClass}
              />
            </div>
            <div>
              <label htmlFor="city" className="mb-1 block text-sm font-medium">
                Address - City
              </label>
              <input
                id="city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={textFieldClass}
              />
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <label htmlFor="register-email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={textFieldClass}
            />
          </div>
          <div>
            <label htmlFor="register-password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={textFieldClass}
            />
          </div>
          <div>
            <label htmlFor="register-match-password" className="mb-1 block text-sm font-medium">
              Match password
            </label>
            <input
              id="register-match-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={textFieldClass}
            />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div>
            <label htmlFor="otp-code" className="mb-1 block text-sm font-medium">
              OTP verification code
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={textFieldClass}
              placeholder="Enter 6-digit OTP"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              setError("");
              setMessage("");
              setLoading(true);
              try {
                await requestOtp();
                setMessage("A new OTP has been sent.");
              } catch (resendError) {
                setError(resendError.message);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[#fff4e8]"
          >
            Resend OTP
          </button>
        </>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              setStep((currentStep) => Math.max(1, currentStep - 1));
            }}
            className="w-full rounded-xl border border-line bg-white px-4 py-2 font-semibold text-foreground transition hover:bg-[#fff4e8]"
          >
            Back
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#f6b21f] px-4 py-2 font-semibold text-[#07223a] transition hover:bg-[#ffc43d] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Please wait..." : step < 3 ? "Continue" : "Verify and Register"}
        </button>
      </div>

      <p className="text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-amber-400 hover:text-amber-300">
          Login
        </Link>
      </p>
    </form>
  );
}
