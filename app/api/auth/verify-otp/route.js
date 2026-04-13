import { NextResponse } from "next/server";
import { verifyOtpForEmail } from "@/lib/otpStore";

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    const result = verifyOtpForEmail(email.toLowerCase(), String(otp).trim());

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "OTP verification failed." }, { status: 500 });
  }
}
