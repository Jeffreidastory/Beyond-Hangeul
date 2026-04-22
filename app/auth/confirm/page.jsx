"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthNavbar from "@/components/AuthNavbar";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const STATUS = {
  CHECKING: "checking",
  SUCCESS: "success",
  ERROR: "error",
};

function normalizeNextPath(nextPath) {
  const value = String(nextPath || "").trim();
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

function decodeMessage(message) {
  try {
    return decodeURIComponent(message);
  } catch {
    return String(message || "");
  }
}

export default function ConfirmSignupPage() {
  const { isLight } = useTheme();
  const [status, setStatus] = useState(STATUS.CHECKING);
  const [title, setTitle] = useState("Confirming your account...");
  const [description, setDescription] = useState("Please wait while we verify your signup link.");
  const [primaryHref, setPrimaryHref] = useState("/auth/login");
  const [primaryLabel, setPrimaryLabel] = useState("Sign in");
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;
    if (typeof window === "undefined") return;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const nextPath = normalizeNextPath(params.get("next"));
      const authError = params.get("error_description") || params.get("error");

      if (authError) {
        setStatus(STATUS.ERROR);
        setTitle("This confirmation link is invalid");
        setDescription(decodeMessage(authError));
        return;
      }

      if (!code && (!tokenHash || !type)) {
        setStatus(STATUS.ERROR);
        setTitle("This link was already used or is incomplete");
        setDescription("If your account is already confirmed, just sign in. Otherwise, use the latest email.");
        setPrimaryHref("/auth/login");
        setPrimaryLabel("Go to Sign in");
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        let error = null;

        if (code) {
          const result = await supabase.auth.exchangeCodeForSession(code);
          error = result.error;
        } else {
          const result = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          error = result.error;
        }

        if (error) {
          setStatus(STATUS.ERROR);
          setTitle("We could not confirm your signup");
          setDescription(error.message || "Please request a new confirmation email and try again.");
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setPrimaryHref(nextPath);
          setPrimaryLabel("Continue to Dashboard");
        } else {
          setPrimaryHref("/auth/login");
          setPrimaryLabel("Sign in");
        }

        setStatus(STATUS.SUCCESS);
        setTitle("Your email is confirmed");
        setDescription("Welcome to Beyond Hangeul. Your account is ready.");
      } catch {
        setStatus(STATUS.ERROR);
        setTitle("Something went wrong");
        setDescription("Please open the latest confirmation email and try again.");
      }
    };

    void run();
  }, []);

  const pageBg = isLight ? "bg-[#eef3ff] text-slate-900" : "bg-[#031425] text-white";
  const panelBg = isLight ? "border-slate-200 bg-white/95" : "border-white/20 bg-[#0a1e35]/80";

  return (
    <section className={`fade-rise relative left-1/2 right-1/2 -mx-[50vw] min-h-screen w-screen overflow-hidden ${pageBg}`}>
      <style>{`
        body > main {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          max-width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
      `}</style>
      <AuthNavbar page="register" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-10 h-80 w-80 rounded-full bg-[#0b4f8a]/35 blur-3xl" />
        <div className="absolute bottom-10 left-14 h-72 w-72 rounded-full bg-[#0f77c6]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,10,22,0.95),rgba(3,19,39,0.84))]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-7xl items-center justify-center px-4 pb-6 pt-20 sm:px-6 lg:px-8">
        <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl backdrop-blur-sm sm:p-8 ${panelBg}`}>
          <div className="mb-5 flex justify-center">
            {status === STATUS.CHECKING ? (
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-amber-400" />
            ) : status === STATUS.SUCCESS ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-300">
                OK
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-2xl text-red-300">
                !
              </div>
            )}
          </div>

          <h1 className={`text-center text-2xl font-semibold font-headline ${isLight ? "text-slate-900" : "text-white"}`}>
            {title}
          </h1>
          <p className={`mt-3 text-center text-sm ${isLight ? "text-slate-600" : "text-white/75"}`}>{description}</p>

          <div className="mt-6 space-y-3">
            {status === STATUS.CHECKING ? (
              <div className={`h-10 w-full animate-pulse rounded-xl ${isLight ? "bg-slate-200" : "bg-white/10"}`} />
            ) : (
              <Link
                href={primaryHref}
                className="block w-full rounded-xl bg-[#f6b21f] px-4 py-2 text-center font-semibold text-[#07223a] transition hover:bg-[#ffc43d]"
              >
                {primaryLabel}
              </Link>
            )}

            <Link
              href="/auth/register"
              className={`block w-full rounded-xl border px-4 py-2 text-center font-semibold transition ${
                isLight
                  ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
                  : "border-white/20 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              Back to Sign up
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
