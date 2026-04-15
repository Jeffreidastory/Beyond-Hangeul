import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function decodeJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getProjectRefFromUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host.split(".")[0] || "";
  } catch {
    return "";
  }
}

function getAdminStorageClient() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const urlRef = getProjectRefFromUrl(url);
  const tokenPayload = decodeJwtPayload(serviceRoleKey);
  const tokenRef = String(tokenPayload?.ref || "").trim();
  if (urlRef && tokenRef && urlRef !== tokenRef) {
    throw new Error("Supabase URL and SUPABASE_SERVICE_ROLE_KEY belong to different projects.");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const path = String(url.searchParams.get("path") || "").trim();
    if (!path) {
      return NextResponse.json({ error: "Missing path query parameter." }, { status: 400 });
    }
    if (path.includes("..")) {
      return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
    }

    const bucket = process.env.NEXT_PUBLIC_SUPABASE_MODULES_BUCKET || "module-files";
    const storageClient = getAdminStorageClient();
    const { data, error } = await storageClient.storage.from(bucket).createSignedUrl(path, 60 * 15);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || "Unable to create a signed module file URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unable to create file access URL." },
      { status: 500 }
    );
  }
}
