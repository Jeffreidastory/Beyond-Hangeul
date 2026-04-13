import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

export async function getCurrentUserWithProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase.from("profiles").select("id, email, role, created_at").eq("id", user.id).maybeSingle();

  return { user, profile };
}

export async function requireAdmin() {
  const { profile } = await getCurrentUserWithProfile();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return profile;
}
