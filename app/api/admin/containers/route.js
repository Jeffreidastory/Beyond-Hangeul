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

export async function POST(request) {
  try {
    const adminProfile = await requireAdminProfile();
    if (!adminProfile) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = await request.json();
    const title = String(payload.title || "").trim();
    const subtitle = String(payload.subtitle || "").trim();

    if (!title) {
      return NextResponse.json({ error: "Container title is required." }, { status: 400 });
    }

    const serverSupabase = await createServerClient();
    const { data, error } = await serverSupabase
      .from("learning_containers")
      .insert({ title, subtitle, created_at: payload.createdAt || new Date().toISOString() })
      .select("id, title, subtitle, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    await broadcastNotification(serverSupabase, {
      type: "container_added",
      title: "New learning module available",
      message: `A new learning module is now available: ${title}.`,
      relatedId: data?.id || "",
    });

    return NextResponse.json({ container: data });
  } catch (error) {
    return NextResponse.json({ error: String(error || "Unable to create container.") }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const adminProfile = await requireAdminProfile();
    if (!adminProfile) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = await request.json();
    const containerId = String(payload.id || "").trim();
    const title = payload.title !== undefined ? String(payload.title || "").trim() : undefined;
    const subtitle = payload.subtitle !== undefined ? String(payload.subtitle || "").trim() : undefined;

    if (!containerId) {
      return NextResponse.json({ error: "Container id is required." }, { status: 400 });
    }

    if (title === undefined && subtitle === undefined) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const nextPatch = {};
    if (title !== undefined) nextPatch.title = title;
    if (subtitle !== undefined) nextPatch.subtitle = subtitle;

    const serverSupabase = await createServerClient();
    const { error } = await serverSupabase.from("learning_containers").update(nextPatch).eq("id", containerId);
    if (error) {
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error || "Unable to update container.") }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const adminProfile = await requireAdminProfile();
    if (!adminProfile) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = await request.json();
    const containerId = String(payload.id || "").trim();
    if (!containerId) {
      return NextResponse.json({ error: "Container id is required." }, { status: 400 });
    }

    const serverSupabase = await createServerClient();
    const { error } = await serverSupabase.from("learning_containers").delete().eq("id", containerId);
    if (error) {
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error || "Unable to delete container.") }, { status: 500 });
  }
}
