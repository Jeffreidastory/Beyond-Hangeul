import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function decodeJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
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

function getUploadFailureMessage(errorMessage, bucket) {
  const text = String(errorMessage || "Upload failed.");
  if (/Bucket not found/i.test(text)) {
    return `Storage bucket '${bucket}' was not found. Create it in Supabase Storage.`;
  }
  if (/new row violates row-level security|row-level security|permission denied|not allowed|forbidden/i.test(text)) {
    return `Upload blocked by Storage policy for bucket '${bucket}'. Add authenticated insert policy or use a valid service role key.`;
  }
  return text;
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const allowedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedImageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp", "tiff"];
    const isImageType = String(file.type || "").startsWith("image/");
    const extension = String(file.name || "").split('.').pop().toLowerCase();
    const isAllowedImageExtension = allowedImageExtensions.includes(extension);

    if (!allowedMime.includes(file.type) && !isImageType && !isAllowedImageExtension) {
      return NextResponse.json({ error: "Only PDF, DOCX, and image files are supported." }, { status: 400 });
    }

    const bucket = process.env.NEXT_PUBLIC_SUPABASE_MODULES_BUCKET || "module-files";
    const uniqueId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const safeFileName = String(file.name || "module-file").replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `modules/${uniqueId}-${safeFileName}`;

    let storageClient = null;
    let primaryError = "";

    try {
      storageClient = getAdminStorageClient();
    } catch (error) {
      primaryError = error?.message || "Service role storage client is unavailable.";
      storageClient = supabase;
    }

    let uploadError = null;
    ({ error: uploadError } = await storageClient.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    }));

    if (uploadError && storageClient !== supabase) {
      const fallbackResult = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      uploadError = fallbackResult.error || null;
      storageClient = supabase;
    }

    if (uploadError) {
      const errorMessage = getUploadFailureMessage(uploadError.message, bucket);
      return NextResponse.json(
        {
          error: primaryError ? `${errorMessage} (${primaryError})` : errorMessage,
        },
        { status: 500 }
      );
    }

    const { data } = storageClient.storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = data?.publicUrl || "";

    if (!publicUrl) {
      return NextResponse.json({ error: "Failed to resolve uploaded file URL." }, { status: 500 });
    }

    return NextResponse.json({ publicUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unable to upload module file." },
      { status: 500 }
    );
  }
}
