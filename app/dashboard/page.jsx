import UserDashboardView from "@/components/UserDashboardView";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUserWithProfile();
  const supabase = await createClient();

  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("lessons").select("id, title, level").order("created_at", { ascending: false }),
    supabase
      .from("progress")
      .select("id, lesson_id, completed, score, created_at, lessons(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const progressRows = progress || [];
  const completedCount = progressRows.filter((item) => item.completed).length;
  const avgScore =
    progressRows.length > 0
      ? Math.round(progressRows.reduce((acc, item) => acc + (item.score || 0), 0) / progressRows.length)
      : 0;
  const userName =
    `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() ||
    profile?.email?.split("@")[0] ||
    "Learner";

  const recentActivity = progressRows.slice(0, 5).map((item) => ({
    id: item.id,
    label: `${item.completed ? "Completed" : "Updated"} ${item.lessons?.title || "a lesson"} with score ${item.score || 0}%`,
  }));

  return (
    <>
      <style>{`
        header[data-global-navbar="true"] {
          display: none;
        }

        body > main {
          margin: 0 !important;
          max-width: none !important;
          padding: 0 !important;
          min-height: 100vh;
        }

        body {
          overflow-x: hidden;
        }
      `}</style>

      <UserDashboardView
        userId={user.id}
        userName={userName}
        userEmail={profile?.email || user.email}
        stats={{
          enrolledModules: (lessons || []).length,
          completedLessons: completedCount,
          averageScore: avgScore,
        }}
        recentActivity={recentActivity}
      />
    </>
  );
}
