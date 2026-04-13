import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import ProfileOverviewEditor from "@/components/ProfileOverviewEditor";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";
import { BookOpen, CheckSquare, Compass, Flag, Home, Landmark, Library } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserWithProfile();
  const supabase = await createClient();

  const { data: progress } = await supabase
    .from("progress")
    .select("id, completed, score, created_at, lessons(title, level)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const progressRows = progress || [];
  const completedRows = progressRows.filter((item) => item.completed);
  const modulesCompleted = completedRows.length;
  const averageScore =
    progressRows.length > 0
      ? Math.round(progressRows.reduce((acc, item) => acc + Number(item.score || 0), 0) / progressRows.length)
      : 0;
  const worksheetsFinished = completedRows.filter((item) => {
    const level = String(item.lessons?.level || "").toLowerCase();
    const title = String(item.lessons?.title || "");
    return level === "worksheet" || /worksheet/i.test(title);
  }).length;

  const completedDayKeys = Array.from(
    new Set(
      completedRows
        .map((item) => {
          const raw = item.created_at;
          if (!raw) return null;
          const date = new Date(raw);
          if (Number.isNaN(date.getTime())) return null;
          return date.toISOString().slice(0, 10);
        })
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  let studyStreak = 0;
  if (completedDayKeys.length > 0) {
    studyStreak = 1;
    let previousDate = new Date(`${completedDayKeys[0]}T00:00:00.000Z`);

    for (let index = 1; index < completedDayKeys.length; index += 1) {
      const currentDate = new Date(`${completedDayKeys[index]}T00:00:00.000Z`);
      const dayDifference = Math.round((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDifference !== 1) {
        break;
      }
      studyStreak += 1;
      previousDate = currentDate;
    }
  }

  const derivedCurrentPathStep = modulesCompleted > 0 ? `Step ${modulesCompleted + 1}` : "Step 1";

  const displayName =
    `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() ||
    profile?.email?.split("@")[0] ||
    "Learner";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  const normalizedId = (user.id || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const uniqueUid = normalizedId
    ? `BH-${normalizedId.slice(0, 4)}-${normalizedId.slice(4, 10)}`
    : "BH-USER-000000";

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

  const hasPremiumAccess = Boolean(user.user_metadata?.premium_access);

  const sideNavItems = [
    { label: "Home", href: "/dashboard?tab=home", icon: Home },
    { label: "Modules", href: "/dashboard?tab=modules", icon: BookOpen },
    { label: "Worksheets", href: "/dashboard?tab=worksheets", icon: CheckSquare },
    { label: "Path", href: "/dashboard?tab=path", icon: Compass },
    { label: "Goal", href: "/dashboard?tab=goal", icon: Flag },
    { label: "Payment", href: "/dashboard?tab=payment", icon: Landmark },
    { label: "Resources", href: "/dashboard?tab=resources", icon: Library },
  ];

  return (
    <section className="profile-root h-screen w-full overflow-hidden bg-[#07111f] text-slate-100">
      <style>{`
        header[data-global-navbar="true"] {
          display: none;
        }

        body > main {
          margin: 0 !important;
          max-width: none !important;
          min-height: 100vh;
          padding: 0 !important;
        }

        body {
          overflow-x: hidden;
        }

        :root[data-profile-theme="light"] .profile-root {
          background: #eef3ff;
          color: #0f172a;
        }

        :root[data-profile-theme="light"] .profile-sidebar {
          background: #ffffff;
          border-color: #dbe5f5;
        }

        :root[data-profile-theme="light"] .profile-sidebar a {
          color: #334155;
        }

        :root[data-profile-theme="light"] .profile-brand-primary {
          color: #0f172a !important;
        }

        :root[data-profile-theme="light"] .profile-brand-accent {
          color: #b45309 !important;
        }

        :root[data-profile-theme="light"] .profile-sidebar a:hover {
          background: #eef4ff;
        }

        :root[data-profile-theme="light"] .profile-account {
          background: #ffffff;
          border-color: #dbe5f5;
          color: #0f172a;
        }

        :root[data-profile-theme="light"] .profile-account .text-white {
          color: #0f172a !important;
        }

        :root[data-profile-theme="light"] .profile-account .profile-uid-accent {
          color: #b45309 !important;
        }

        :root[data-profile-theme="light"] .profile-account .profile-account-muted {
          color: #64748b;
        }

        :root[data-profile-theme="light"] .profile-account .profile-account-divider {
          border-color: #e2e8f0;
        }
      `}</style>

      <div className="mx-auto flex h-full w-full max-w-400">
        <aside className="profile-sidebar group sticky top-0 hidden h-screen w-20 shrink-0 overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#0b1728] transition-[width] duration-300 hover:w-64 lg:block">
          <div className="px-4 pb-4 pt-6">
            <p className="text-sm font-bold tracking-tight leading-tight">
              <span className="profile-brand-primary block text-white">Beyond</span>
              <span className="profile-brand-accent block text-[#fbbf24]">Hangeul</span>
            </p>
          </div>

          <nav className="space-y-1 px-3">
            {sideNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <main className="space-y-6">
              <ProfileOverviewEditor
                displayName={displayName}
                userEmail={profile?.email || user.email}
                role={profile?.role || "user"}
                uniqueUid={uniqueUid}
                initials={initials}
                initialMetadata={user.user_metadata || {}}
                profileStats={{
                  modulesCompleted,
                  currentPathStep: String(user.user_metadata?.current_path_step || derivedCurrentPathStep),
                  worksheetsFinished,
                  averageScore,
                  studyStreak,
                }}
              />
            </main>

            <aside className="space-y-4 self-start xl:pt-0">
              <section className="profile-account rounded-2xl border border-white/10 bg-[#0f1d32] p-5 shadow-sm xl:sticky xl:top-8">
                <h3 className="text-2xl font-bold">Account</h3>
                <div className="mt-5 space-y-4 text-sm">
                  <div className="profile-account-divider border-b border-white/10 pb-3">
                    <p className="profile-account-muted text-xs uppercase tracking-wide text-slate-400">Joined</p>
                    <p className="mt-1 font-semibold text-white">{joinedDate}</p>
                  </div>

                  <div className="profile-account-divider border-b border-white/10 pb-3">
                    <p className="profile-account-muted text-xs uppercase tracking-wide text-slate-400">Role</p>
                    <p className="mt-1 font-semibold capitalize text-white">{profile?.role || "user"}</p>
                  </div>

                  <div className="profile-account-divider border-b border-white/10 pb-3">
                    <p className="profile-account-muted text-xs uppercase tracking-wide text-slate-400">Email</p>
                    <p className="mt-1 break-all font-semibold text-white">{profile?.email || user.email}</p>
                  </div>

                  <div className="profile-account-divider border-b border-white/10 pb-3">
                    <p className="profile-account-muted text-xs uppercase tracking-wide text-slate-400">UID</p>
                    <p className="profile-uid-accent mt-1 font-semibold text-[#fcd34d]">{uniqueUid}</p>
                  </div>

                  <div className="profile-account-divider border-b border-white/10 pb-3">
                    <p className="profile-account-muted text-xs uppercase tracking-wide text-slate-400">Premium Access</p>
                    <p className="mt-1 font-semibold text-white">{hasPremiumAccess ? "Active" : "Free Plan"}</p>
                  </div>

                  <div className="profile-account-divider border-b border-white/10 pb-3">
                    <p className="profile-account-muted text-xs uppercase tracking-wide text-slate-400">Theme Status</p>
                    <p className="mt-1 font-semibold text-white">Synced with app preferences</p>
                  </div>
                </div>

                <div className="mt-5">
                  <SignOutButton redirectTo="/" />
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
