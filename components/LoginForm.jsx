"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [autoLogin, setAutoLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      const isAdmin = profile?.role === "admin";

      setAutoLogin(!isAdmin);
    };

    void checkSession();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const hasSession = Boolean(session?.user);
    const profileResult = session?.user
      ? await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle()
      : { data: { profile: null } };
    const isAdminSession = profileResult.data?.role === "admin";

    setAutoLogin(hasSession && !isAdminSession);
    setLoading(true);

    if (hasSession && !isAdminSession) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      await router.push("/dashboard");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    await router.push("/dashboard");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white font-headline">Welcome back</h2>
        <p className="mt-2 text-sm text-white/70">Please enter your detail to sign in.</p>
      </div>

      <div>
        <label htmlFor="login-email" className="mb-2 inline-block text-sm font-medium text-white/70">
          E-Mail Address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email..."
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder:text-slate-300 outline-none ring-2 ring-transparent transition focus:border-white/30 focus:ring-white/20"
        />
      </div>

      <div className="relative">
        <label htmlFor="login-password" className="mb-2 inline-block text-sm font-medium text-white/70">
          Password
        </label>
        <input
          id="login-password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 pr-14 text-base text-white placeholder:text-slate-300 outline-none ring-2 ring-transparent transition focus:border-white/30 focus:ring-white/20"
        />
        {password ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-200/90 transition hover:bg-white/15 hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
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
        className="relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f6b21f] px-4 text-xl font-semibold text-[#07223a] transition hover:bg-[#ffc43d] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading && autoLogin && <span className="absolute inset-0 bg-[#ffed99]/70 origin-left animate-progress" />}

        {!loading && <span className="relative z-10">Sign In</span>}

        {loading && autoLogin ? (
          <span className="relative z-10 inline-flex items-center justify-center">
            <span className="invisible">Sign In</span>
            <span className="absolute inset-x-0 flex items-center justify-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-0" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-150" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-300" />
            </span>
          </span>
        ) : loading ? (
          <span className="relative z-10">Signing In...</span>
        ) : null}
      </button>

      <p className="pt-3 text-center text-base text-white/85">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="font-semibold text-amber-400 hover:text-amber-300">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
