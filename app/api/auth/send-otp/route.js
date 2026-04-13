import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { setOtpForEmail } from "@/lib/otpStore";

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        { error: "SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env.local." },
        { status: 500 }
      );
    }

    const otp = createOtp();
    setOtpForEmail(email.toLowerCase(), otp);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to: email,
      subject: "Beyond Hangeul OTP Verification",
      text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send OTP email." }, { status: 500 });
  }
}
