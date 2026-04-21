"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function AuthNavbar({ page = "login" }) {
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const isMountedRef = useRef(true);

  const action =
    page === "register"
      ? { href: "/auth/login", label: "Sign in" }
      : page === "login"
      ? { href: "/auth/register", label: "Sign up" }
      : null;

  const handleActionClick = async (event) => {
    event.preventDefault();
    if (!action) return;
    setIsActionLoading(true);
    try {
      await router.push(action.href);
    } finally {
      if (isMountedRef.current) {
        setIsActionLoading(false);
      }
    }
  };

  useEffect(() => {
    if (page !== "login") return;

    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    const tryRedirect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      if (session?.user) {
        setIsAutoLoggingIn(true);
        await router.replace("/dashboard");
      }
    };

    void tryRedirect();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setIsAutoLoggingIn(true);
        await router.replace("/dashboard");
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, [page, router]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#031425]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-bold tracking-tight [font-family:var(--font-body)]">
          <span className="text-white">Beyond </span>
          <span className="text-amber-400">Hangeul</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-base font-semibold text-white/90 transition hover:text-white"
          >
            Home
          </Link>
          {action ? (
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isActionLoading || isAutoLoggingIn}
              className="relative inline-flex overflow-hidden rounded-full bg-[#f6b21f] px-5 py-2.5 text-base font-semibold text-[#07223a] transition hover:bg-[#ffc43d] disabled:cursor-wait disabled:opacity-80"
            >
              {(isActionLoading || isAutoLoggingIn) && (
                <span className="pointer-events-none absolute inset-0 bg-[#ffed99]/70 origin-left animate-progress" />
              )}
              <span className="relative z-10 inline-flex items-center gap-2">
                {(isActionLoading || isAutoLoggingIn) ? (
                  <>
                    <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading...
                  </>
                ) : (
                  action.label
                )}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
