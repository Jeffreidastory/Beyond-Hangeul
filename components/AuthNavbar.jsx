"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BHLogo from "@/app/images/BH-logo.png";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function AuthNavbar({ page = "login" }) {
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const router = useRouter();

  const action =
    page === "register"
      ? { href: "/auth/login", label: "Sign in" }
      : page === "login"
      ? { href: "/auth/register", label: "Sign up" }
      : null;

  const handleActionClick = async (event) => {
    event.preventDefault();

    if (page === "register") {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      const isAdmin = profile?.role === "admin";

      if (isAdmin) {
        router.push("/auth/login");
        return;
      }

      setLoadingSignIn(true);
      await new Promise((resolve) => setTimeout(resolve, 40));
      router.push("/dashboard");
      return;
    }

    router.push(action.href);
  };

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
              disabled={loadingSignIn}
              className="relative rounded-full bg-[#f6b21f] px-5 py-2.5 text-base font-semibold text-[#07223a] transition hover:bg-[#ffc43d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingSignIn && <span className="absolute inset-0 bg-[#ffed99]/70 origin-left animate-progress" />}
              <span className="relative z-10 inline-flex items-center justify-center">
                {loadingSignIn ? (
                  <>
                    <span className="invisible">{action.label}</span>
                    <span className="absolute inset-x-0 flex items-center justify-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-0" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-150" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-300" />
                    </span>
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
