import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// Request a password reset — generates a token.
// Sends real email when RESEND_API_KEY is set; otherwise returns a preview (demo mode).
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    const normalized = email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email: normalized } });
    // Always return ok to prevent email enumeration
    if (!user) return NextResponse.json({ ok: true, preview: null });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await db.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const origin =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin ||
      "http://localhost:3000";
    const resetUrl = `${origin.replace(/\/$/, "")}/?reset=${token}`;

    const subject = "Reset your HeartSpace password";
    const textBody = `Hi ${user.username},

We received a request to reset your password. Click the link below (valid 30 min):
${resetUrl}

If this wasn't you, you can safely ignore this email.

— The HeartSpace Team`;

    let emailed = false;
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const from = process.env.RESEND_FROM || "HeartSpace <onboarding@resend.dev>";
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [user.email],
            subject,
            text: textBody,
          }),
        });
        emailed = res.ok;
        if (!res.ok) {
          console.error("Resend error", await res.text());
        }
      } catch (err) {
        console.error("Resend send failed", err);
      }
    }

    const preview = `To: ${user.email}\nSubject: ${subject}\n\n${textBody}`;

    // Always include token in response for demo / admin recovery when email is not configured
    return NextResponse.json({
      ok: true,
      emailed,
      preview: emailed ? null : preview,
      // token only returned when email was not sent (demo / recovery path)
      ...(emailed ? {} : { token }),
    });
  } catch (e: any) {
    console.error("reset-request error", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
