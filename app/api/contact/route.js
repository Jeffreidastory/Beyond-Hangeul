import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const CONTACT_TO_EMAIL = "jffrsnfeliciano0000@gmail.com";

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
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

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const safeSubject = String(subject).slice(0, 120);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to: CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `Beyond Hangeul Inquiry: ${safeSubject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <h2>Beyond Hangeul Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${String(message).replace(/\n/g, "<br />")}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to send message right now." }, { status: 500 });
  }
}
