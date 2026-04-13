"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignOutButton({ compact = false, redirectTo = "/" }) {
  const router = useRouter();

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <button
      onClick={signOut}
      className={
        compact
          ? "rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-[#fff1dc]"
          : "rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-deep"
      }
      type="button"
    >
      Sign Out
    </button>
  );
}
