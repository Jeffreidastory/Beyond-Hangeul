"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function LoginForm() {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="pt-1 text-center">
        <h2 className="text-4xl font-bold text-white [font-family:var(--font-headline)]">Welcome Back</h2>
        <p className="mt-2 text-xl font-medium text-white/80">Sign in to your account</p>
      </div>

      <div>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Username"
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder:text-slate-300 outline-none ring-2 ring-transparent transition focus:border-white/30 focus:ring-white/20"
        />
      </div>

      <div className="relative">
        <input
          id="login-password"
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-base text-white placeholder:text-slate-300 outline-none ring-2 ring-transparent transition focus:border-white/30 focus:ring-white/20"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-200/90 transition hover:bg-white/10 hover:text-white"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label htmlFor="remember-me" className="inline-flex items-center gap-2 text-white/85">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-white/40 bg-transparent text-amber-400"
          />
          Remember me
        </label>
        <button type="button" className="font-semibold text-violet-300 hover:text-violet-200">
          Forgot Password?
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[#f6b21f] px-4 py-3 text-2xl font-semibold text-[#07223a] transition hover:bg-[#ffc43d] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>

      <p className="pt-3 text-center text-base text-white/85">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="font-semibold text-[#5fa3ff] hover:text-[#8ab9ff]">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
