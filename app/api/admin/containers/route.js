import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabaseServer";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

function getServiceClient() {
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseClient(url, serviceRoleKey);
}

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

    const serviceClient = getServiceClient();
    const { data, error } = await serviceClient
      .from("learning_containers")
      .insert({ title, subtitle, created_at: payload.createdAt || new Date().toISOString() })
      .select("id, title, subtitle, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

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

    const serviceClient = getServiceClient();
    const { error } = await serviceClient.from("learning_containers").update(nextPatch).eq("id", containerId);
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

    const serviceClient = getServiceClient();
    const { error } = await serviceClient.from("learning_containers").delete().eq("id", containerId);
    if (error) {
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error || "Unable to delete container.") }, { status: 500 });
  }
}
