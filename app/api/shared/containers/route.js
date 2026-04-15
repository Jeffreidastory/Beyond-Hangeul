import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("learning_containers")
      .select("id, title, subtitle, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Shared containers route query failed:", error?.message || error);
      return NextResponse.json({ containers: [] });
    }

    return NextResponse.json({ containers: data || [] });
  } catch (error) {
    console.warn("Shared containers route exception:", error?.message || error);
    return NextResponse.json({ containers: [] });
  }
}
