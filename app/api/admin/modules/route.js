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

async function broadcastNotification(serverSupabase, notification) {
  const { data: profiles, error: profilesError } = await serverSupabase
    .from("profiles")
    .select("id")
    .eq("role", "user");

  if (profilesError || !Array.isArray(profiles) || !profiles.length) {
    return;
  }

  const rows = profiles.map((profile) => ({
    user_id: profile.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    related_id: notification.relatedId || "",
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  await serverSupabase.from("notifications").insert(rows);
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

    const serverSupabase = await createServerClient();
    const { data: previousModule, error: previousError } = await serverSupabase
      .from("learning_modules")
      .select("module_name, resource_files")
      .eq("id", moduleId)
      .maybeSingle();

    if (previousError) {
      return NextResponse.json({ error: previousError.message || String(previousError) }, { status: 500 });
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

    let result = await serverSupabase.from("learning_modules").update(nextPatch).eq("id", moduleId);

    if (result.error && result.error.message?.includes("resource_files")) {
      const fallbackPatch = { ...nextPatch };
      delete fallbackPatch.resource_files;
      result = await serverSupabase.from("learning_modules").update(fallbackPatch).eq("id", moduleId);
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message || String(result.error) }, { status: 500 });
    }

    const fileUpdateTriggered = payload.resourceFiles !== undefined || payload.resourceFileData !== undefined;
    if (fileUpdateTriggered && previousModule) {
      const previousFiles = Array.isArray(previousModule.resource_files) ? previousModule.resource_files : [];
      const nextFileCount = Array.isArray(payload.resourceFiles) ? payload.resourceFiles.length : previousFiles.length;
      const isNewFile = payload.resourceFiles !== undefined && nextFileCount > previousFiles.length;
      const notificationType = isNewFile ? "module_pdf_added" : "module_pdf_updated";
      const notificationTitle = isNewFile ? "New lesson added" : "Lesson updated";
      const notificationMessage = isNewFile
        ? `New PDF lesson added in ${String(previousModule.module_name || "your module")}.`
        : `A lesson file was updated in ${String(previousModule.module_name || "your module")}.`;

      await broadcastNotification(serverSupabase, {
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        relatedId: moduleId,
      });
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

    const moduleName = String(result.data?.module_name || payload.moduleName || "New module");
    await broadcastNotification(serverSupabase, {
      type: "module_added",
      title: "New module available",
      message: `A new learning module is now available: ${moduleName}.`,
      relatedId: result.data?.id || "",
    });

    return NextResponse.json({ module: result.data });
  } catch (error) {
    return NextResponse.json({ error: String(error || "Unable to create module.") }, { status: 500 });
  }
}
