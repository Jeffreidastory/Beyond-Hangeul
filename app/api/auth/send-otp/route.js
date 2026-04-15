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

    const otp = createOtp();
    setOtpForEmail(email.toLowerCase(), otp);

    if (!smtpUser || !smtpPass) {
      console.warn(`SMTP is not configured; generated OTP for ${email}: ${otp}`);
      return NextResponse.json({
        ok: true,
        warning: "SMTP is not configured. OTP was generated on the server. Use the OTP from the server log during development.",
      });
    }

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
