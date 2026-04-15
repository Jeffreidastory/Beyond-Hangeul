import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import { promises as fs } from "fs";
import { setOtpForEmail } from "@/lib/otpStore";

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function loadEnvFallback() {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
  ];

  for (const envFile of candidates) {
    try {
      const raw = await fs.readFile(envFile, "utf8");
      return raw
        .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .reduce((acc, line) => {
        const [key, ...rest] = line.split("=");
        if (!key || rest.length === 0) return acc;
        let value = rest.join("=").trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        acc[key] = value;
        return acc;
      }, {});
    } catch {
      continue;
    }
  }

  return {};
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const envFallback = await loadEnvFallback();
    const smtpHost = process.env.SMTP_HOST || envFallback.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || envFallback.SMTP_PORT || 587);
    const smtpUser = (process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.SMTP_FROM || envFallback.SMTP_USER || envFallback.SMTP_USERNAME || envFallback.SMTP_FROM || "").trim();
    const smtpPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || envFallback.SMTP_PASS || envFallback.SMTP_PASSWORD || "").trim();

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
