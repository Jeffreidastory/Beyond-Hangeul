import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabaseServer";

async function requireAdminProfile() {
  const serverSupabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await serverSupabase.auth.getUser();

  if (userError || !user?.id) {
    return null;
  }

  const { data: profile, error: profileError } = await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    return null;
  }

  return profile;
}

export async function PATCH(request) {
  try {
    const adminProfile = await requireAdminProfile();
    if (!adminProfile) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = await request.json();
    const moduleId = String(payload.id || "").trim();

    if (!moduleId) {
      return NextResponse.json({ error: "Module id is required." }, { status: 400 });
    }

    const nextPatch = {};
    if (payload.moduleName !== undefined) nextPatch.module_name = String(payload.moduleName || "");
    if (payload.topicTitle !== undefined) nextPatch.topic_title = String(payload.topicTitle || "");
    if (payload.resourceFileName !== undefined) nextPatch.resource_file_name = String(payload.resourceFileName || "");
    if (payload.resourceFileData !== undefined) nextPatch.resource_file_data = String(payload.resourceFileData || "");
    if (payload.resourceFileType !== undefined) nextPatch.resource_file_type = String(payload.resourceFileType || "");
    if (payload.type !== undefined) nextPatch.type = String(payload.type || "");
    if (payload.price !== undefined) nextPatch.price = payload.price == null ? null : Number(payload.price);
    if (payload.status !== undefined) nextPatch.status = String(payload.status || "");
    if (payload.containerId !== undefined) nextPatch.container_id = payload.containerId || null;
    if (payload.containerTitle !== undefined) nextPatch.container_title = String(payload.containerTitle || "");
    if (payload.containerSubtitle !== undefined) nextPatch.container_subtitle = String(payload.containerSubtitle || "");

    const serverSupabase = await createServerClient();
    const { error } = await serverSupabase.from("learning_modules").update(nextPatch).eq("id", moduleId);

    if (error) {
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error || "Unable to update module.") }, { status: 500 });
  }
}
