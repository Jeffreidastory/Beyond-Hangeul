"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const FIXED_ADMIN_USERNAME = "admin01";
const FIXED_ADMIN_PASSWORD = "BHadmin@24";
const FIXED_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_LOGIN_EMAIL || "admin01@beyond-hangeul.local";

export default function AdminLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (username !== FIXED_ADMIN_USERNAME || password !== FIXED_ADMIN_PASSWORD) {
      setError("Invalid admin credentials.");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: FIXED_ADMIN_EMAIL,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(
        "Admin sign-in failed. Ensure the admin auth user exists in Supabase and has role admin in profiles."
      );
      return;
    }

    await router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="admin-username" className="mb-1 block text-sm font-medium text-white/85">
          Username
        </label>
        <input
          id="admin-username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white outline-none ring-2 ring-transparent transition focus:border-white/30 focus:ring-white/20"
        />
      </div>

      <div className="relative">
        <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-white/85">
          Password
        </label>
        <input
          id="admin-password"
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 pr-14 text-base text-white outline-none ring-2 ring-transparent transition focus:border-white/30 focus:ring-white/20"
        />
        {password ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-200/90 transition hover:bg-white/15 hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>

      {error && <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f6b21f] px-4 text-xl font-semibold text-[#07223a] transition hover:bg-[#ffc43d] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading && <span className="absolute inset-0 bg-[#ffed99]/70 origin-left animate-progress" />}

        <span className="relative z-10 inline-flex items-center justify-center">
          {loading ? (
            <>
              <span className="invisible">Admin Sign In</span>
              <span className="absolute inset-x-0 flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-0" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-150" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-300" />
              </span>
            </>
          ) : (
            "Admin Sign In"
          )}
        </span>
      </button>
    </form>
  );
}
