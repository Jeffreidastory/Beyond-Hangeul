import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    let data = null;
    let error = null;

    ({ data, error } = await supabase
      .from("learning_modules")
      .select(
        "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, resource_files, type, price, status, created_at"
      )
      .order("created_at", { ascending: false }));

    if (error) {
      if (error.message && error.message.includes("resource_files")) {
        ({ data, error } = await supabase
          .from("learning_modules")
          .select(
            "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, type, price, status, created_at"
          )
          .order("created_at", { ascending: false }));
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to fetch shared modules." }, { status: 500 });
    }

    return NextResponse.json({ modules: data || [] });
  } catch (error) {
    return NextResponse.json({ error: String(error?.message || error || "Unknown error") }, { status: 500 });
  }
}
