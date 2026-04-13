import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";

export async function getAdminWorkspaceProps() {
  const adminProfileRow = await requireAdmin();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  const displayName =
    `${user?.user_metadata?.first_name || ""} ${user?.user_metadata?.last_name || ""}`.trim() ||
    adminProfileRow?.email?.split("@")[0] ||
    "Administrator";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD";

  return {
    initialUsers: users || [],
    adminProfile: {
      displayName,
      email: adminProfileRow?.email || user?.email || "admin@beyond-hangeul.local",
      role: adminProfileRow?.role || "admin",
      initials,
    },
  };
}
