import Link from "next/link";

export default function Sidebar({ role = "user" }) {
  return (
    <aside className="surface-card h-fit rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">Navigation</p>
      <ul className="mt-3 space-y-2 text-sm">
        <li>
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 hover:bg-[#fff1dc]">
            Dashboard
          </Link>
        </li>
        <li>
          <Link href="/lessons" className="block rounded-lg px-3 py-2 hover:bg-[#fff1dc]">
            Lessons
          </Link>
        </li>
        <li>
          <Link href="/profile" className="block rounded-lg px-3 py-2 hover:bg-[#fff1dc]">
            Profile
          </Link>
        </li>
        {role === "admin" && (
          <li>
            <Link href="/admin" className="block rounded-lg bg-brand/10 px-3 py-2 font-semibold text-brand hover:bg-brand/20">
              Admin Dashboard
            </Link>
          </li>
        )}
      </ul>
    </aside>
  );
}
