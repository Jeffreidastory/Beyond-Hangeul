import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import SignOutButton from "@/components/SignOutButton";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    role = profile?.role || "user";
  }

  return (
    <header
      data-global-navbar="true"
      className={user ? "border-b border-line bg-[#fffaf0]/90 backdrop-blur" : "border-b border-white/20 bg-[#031425]/90 backdrop-blur"}
    >
      <nav
        className={`flex w-full items-center py-4 [font-family:var(--font-nav)] ${
          user ? "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" : "px-4 sm:px-6 lg:px-3"
        }`}
      >
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight [font-family:var(--font-body)]"
        >
          <span className={user ? "text-foreground" : "text-white"}>Beyond </span>
          <span className="text-amber-400">Hangeul</span>
        </Link>

        <div className="ml-auto flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="rounded-lg px-3 py-2 transition hover:bg-[#fff1dc]">
                Dashboard
              </Link>
              <Link href="/lessons" className="rounded-lg px-3 py-2 transition hover:bg-[#fff1dc]">
                Lessons
              </Link>
              <Link href="/profile" className="rounded-lg px-3 py-2 transition hover:bg-[#fff1dc]">
                Profile
              </Link>
              {role === "admin" && (
                <Link href="/admin" className="rounded-lg bg-brand/10 px-3 py-2 font-semibold text-brand hover:bg-brand/20">
                  Admin
                </Link>
              )}
              <SignOutButton compact redirectTo="/" />
            </>
          ) : (
            <>
              <div className="mr-3 hidden items-center gap-6 text-white/80 md:flex">
                <Link href="/" className="font-medium text-white">Home</Link>
                <Link href="/#about" className="font-medium hover:text-white">About</Link>
                <Link href="/#reviews" className="font-medium hover:text-white">Reviews</Link>
                <Link href="/#contact" className="font-medium hover:text-white">Connect</Link>
              </div>
              <Link
                href="/auth/login"
                className="rounded-md bg-[#f6b21f] px-6 py-3 text-sm font-bold tracking-wide text-[#07223a] transition hover:bg-[#ffc43d]"
              >
                SIGN IN
              </Link>
              <Link
                href="/auth/register"
                className="rounded-md border border-white/30 bg-[#0a2237] px-6 py-3 text-sm font-bold tracking-wide text-white transition hover:bg-[#11324f]"
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
