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
    if (payload.resourceFiles !== undefined) nextPatch.resource_files = payload.resourceFiles;
    if (payload.type !== undefined) nextPatch.type = String(payload.type || "");
    if (payload.price !== undefined) nextPatch.price = payload.price == null ? null : Number(payload.price);
    if (payload.status !== undefined) nextPatch.status = String(payload.status || "");
    if (payload.containerId !== undefined) nextPatch.container_id = payload.containerId || null;
    if (payload.containerTitle !== undefined) nextPatch.container_title = String(payload.containerTitle || "");
    if (payload.containerSubtitle !== undefined) nextPatch.container_subtitle = String(payload.containerSubtitle || "");

    const serverSupabase = await createServerClient();
    let result = await serverSupabase.from("learning_modules").update(nextPatch).eq("id", moduleId);

    if (result.error && result.error.message?.includes("resource_files")) {
      const fallbackPatch = { ...nextPatch };
      delete fallbackPatch.resource_files;
      result = await serverSupabase.from("learning_modules").update(fallbackPatch).eq("id", moduleId);
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message || String(result.error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error || "Unable to update module.") }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminProfile = await requireAdminProfile();
    if (!adminProfile) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = await request.json();
    const nextInsert = {};
    if (payload.moduleName !== undefined) nextInsert.module_name = String(payload.moduleName || "");
    if (payload.topicTitle !== undefined) nextInsert.topic_title = String(payload.topicTitle || "");
    if (payload.resourceFileName !== undefined) nextInsert.resource_file_name = String(payload.resourceFileName || "");
    if (payload.resourceFileData !== undefined) nextInsert.resource_file_data = String(payload.resourceFileData || "");
    if (payload.resourceFileType !== undefined) nextInsert.resource_file_type = String(payload.resourceFileType || "");
    if (payload.resourceFiles !== undefined) nextInsert.resource_files = payload.resourceFiles;
    if (payload.type !== undefined) nextInsert.type = String(payload.type || "");
    if (payload.price !== undefined) nextInsert.price = payload.price == null ? null : Number(payload.price);
    if (payload.status !== undefined) nextInsert.status = String(payload.status || "");
    if (payload.containerId !== undefined) nextInsert.container_id = payload.containerId || null;
    if (payload.containerTitle !== undefined) nextInsert.container_title = String(payload.containerTitle || "");
    if (payload.containerSubtitle !== undefined) nextInsert.container_subtitle = String(payload.containerSubtitle || "");

    const serverSupabase = await createServerClient();
    let result = await serverSupabase
      .from("learning_modules")
      .insert(nextInsert)
      .select(
        "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, resource_files, type, price, status, created_at, container_id, container_title, container_subtitle"
      )
      .single();

    if (result.error && result.error.message?.includes("resource_files")) {
      const fallbackInsert = { ...nextInsert };
      delete fallbackInsert.resource_files;
      result = await serverSupabase
        .from("learning_modules")
        .insert(fallbackInsert)
        .select(
          "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, type, price, status, created_at, container_id, container_title, container_subtitle"
        )
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message || String(result.error) }, { status: 500 });
    }

    return NextResponse.json({ module: result.data });
  } catch (error) {
    return NextResponse.json({ error: String(error || "Unable to create module.") }, { status: 500 });
  }
}
