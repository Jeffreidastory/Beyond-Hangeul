import UserDashboardView from "@/components/UserDashboardView";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function loadInitialLearningData(userId) {
  const supabase = await createClient();

  const [modulesResult, accessResult, paymentsResult, containersResult, worksheetProgressResult, moduleProgressResult] =
    await Promise.all([
      supabase
        .from("learning_modules")
        .select(
          "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, type, price, status, created_at, container_id, container_title, container_subtitle"
        )
        .order("created_at", { ascending: true }),
      supabase
        .from("user_module_access")
        .select("id, user_id, module_id, status, granted_at")
        .eq("user_id", userId),
      supabase
        .from("payment_records")
        .select("id, user_id, user_email, user_name, module_id, amount, method, proof_image, status, submitted_at, approved_at")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("learning_containers")
        .select("id, title, subtitle, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("worksheet_progress")
        .select("user_id, worksheet_id, quiz_percent, writing_percent, quiz_complete, created_at, updated_at")
        .eq("user_id", userId),
      supabase
        .from("module_progress")
        .select("user_id, module_id, progress_percent, completed, created_at, updated_at")
        .eq("user_id", userId),
    ]);

  const modules = (modulesResult.data || []).map((row) => ({
    id: row.id,
    moduleName: row.module_name,
    topicTitle: row.topic_title,
    resourceFileName: row.resource_file_name || "",
    resourceFileData: row.resource_file_data || "",
    resourceFileType: row.resource_file_type || "",
    type: row.type || "free",
    price: row.price == null ? null : Number(row.price),
    status: row.status || "active",
    createdAt: row.created_at,
    containerId: row.container_id || "",
    containerTitle: row.container_title || "",
    containerSubtitle: row.container_subtitle || "",
  }));

  const accessMap = new Map(
    (accessResult.data || [])
      .filter((access) => access.user_id === userId)
      .map((access) => [access.module_id, access.status])
  );

  const payments = (paymentsResult.data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    moduleId: row.module_id,
    amount: row.amount,
    method: row.method,
    proofImage: row.proof_image,
    status: row.status,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
  }));

  const hasOneTimeApproved = payments.some((payment) => payment.status === "approved");

  const modulesWithAccess = modules.map((module) => {
    const isFree = module.type === "free";
    const hasPremiumUnlock = hasOneTimeApproved && module.type === "paid";
    const isInactive = (module.status || "active") !== "active";
    const accessStatus = isInactive
      ? "locked"
      : isFree
      ? "unlocked"
      : hasPremiumUnlock
      ? "unlocked"
      : accessMap.get(module.id) === "unlocked"
      ? "unlocked"
      : "locked";

    return {
      ...module,
      accessStatus,
      isInactive,
      isLocked: accessStatus === "locked",
    };
  });

  const containers = (containersResult.data || []).map((row) => ({
    id: row.id,
    title: row.title || "Untitled Container",
    subtitle: row.subtitle || "",
    createdAt: row.created_at,
  }));

  const worksheetScores = (worksheetProgressResult.data || []).reduce((acc, row) => {
    acc[row.worksheet_id] = {
      quizPercent: row.quiz_percent,
      writingPercent: row.writing_percent,
      quizComplete: row.quiz_complete,
      updatedAt: row.updated_at,
    };
    return acc;
  }, {});

  const moduleProgress = (moduleProgressResult.data || []).reduce((acc, row) => {
    acc[row.module_id] = {
      progressPercent: row.progress_percent,
      completed: row.completed,
      updatedAt: row.updated_at,
    };
    return acc;
  }, {});

  return {
    modules: modulesWithAccess,
    containers,
    worksheets: [],
    payments,
    moduleProgress,
    worksheetScores,
    activeLearningPath: null,
    learningPaths: [],
    pathItems: [],
  };
}

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

  const completedDayKeys = Array.from(
    new Set(
      progressRows
        .filter((item) => item.completed && item.created_at)
        .map((item) => {
          const date = new Date(item.created_at);
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

  const userName =
    `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() ||
    profile?.email?.split("@")[0] ||
    "Learner";

  const recentActivity = progressRows.slice(0, 5).map((item) => ({
    id: item.id,
    label: `${item.completed ? "Completed" : "Updated"} ${item.lessons?.title || "a lesson"} with score ${item.score || 0}%`,
  }));

  const initialLearningData = await loadInitialLearningData(user.id);

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
          studyStreak,
        }}
        recentActivity={recentActivity}
        initialLearningData={initialLearningData}
      />
    </>
  );
}
