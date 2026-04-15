"use client";

import Image from "next/image";
import Link from "next/link";
import BHLogo from "@/app/images/BH-logo.png";

export default function AuthNavbar({ page = "login" }) {
  const action =
    page === "register"
      ? { href: "/auth/login", label: "Sign in" }
      : page === "login"
      ? { href: "/auth/register", label: "Sign up" }
      : null;

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
            <Link
              href={action.href}
              className="rounded-full bg-[#f6b21f] px-5 py-2.5 text-base font-semibold text-[#07223a] transition hover:bg-[#ffc43d]"
            >
              {action.label}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
