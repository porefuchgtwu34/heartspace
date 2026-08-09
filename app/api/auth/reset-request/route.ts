import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { appOrigin, escapeHtml, sendEmail } from "@/lib/email";

/**
 * Request a password reset.
 * Always returns a generic success payload (no email enumeration).
 * When RESEND_API_KEY is set, sends a real email — never returns the token in production.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const email =
      typeof body === "object" && body && "email" in body
        ? String((body as { email: unknown }).email ?? "")
        : "";

    if (!email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email: normalized } });

    // Always return ok to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        ok: true,
        emailed: false,
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    // Invalidate previous unused tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await db.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const base = appOrigin(req.nextUrl.origin);
    const resetUrl = `${base}/?reset=${token}`;

    const subject = "Reset your HeartSpace password";
    const textBody = `Hi ${user.username},

We received a request to reset your HeartSpace password.

Open this link within 30 minutes to choose a new password:
${resetUrl}

If you did not ask for this, you can ignore this email — your password will stay the same.

— The HeartSpace Team`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#faf5f7;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #fce7f3;">
        <tr>
          <td style="background:linear-gradient(135deg,#f43f5e,#d946ef);padding:28px 24px;color:#fff;">
            <div style="font-size:20px;font-weight:700;">HeartSpace</div>
            <div style="font-size:13px;opacity:0.9;margin-top:4px;">Password reset</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;color:#1f2937;line-height:1.55;font-size:15px;">
            <p style="margin:0 0 12px;">Hi <strong>@${escapeHtml(user.username)}</strong>,</p>
            <p style="margin:0 0 16px;">We received a request to reset your password. Click the button below — this link expires in <strong>30 minutes</strong>.</p>
            <p style="margin:0 0 24px;text-align:center;">
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#f43f5e,#d946ef);color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;">Reset password</a>
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Or paste this link into your browser:</p>
            <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#9f1239;">${escapeHtml(resetUrl)}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;">If you didn&rsquo;t ask for this, you can ignore this email. Your password will not change.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background:#fdf2f8;font-size:12px;color:#9ca3af;text-align:center;">
            — The HeartSpace Team
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const sent = await sendEmail({
      to: user.email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    if (!sent.ok) {
      console.error("Password reset email failed:", sent.error);
    }

    // Never expose tokens in production. Dev-only fallback when email fails.
    const isProd = process.env.NODE_ENV === "production";
    const allowDevPreview = !isProd && !sent.ok;

    return NextResponse.json({
      ok: true,
      emailed: sent.ok,
      message: sent.ok
        ? "Check your inbox for a reset link (and spam folder just in case)."
        : isProd
          ? "If that email is registered, a reset link has been sent."
          : `Email not sent (${sent.error || "not configured"}). Dev preview included below.`,
      ...(allowDevPreview
        ? {
            preview: `To: ${user.email}\nSubject: ${subject}\n\n${textBody}`,
            token,
            emailError: sent.error,
          }
        : {}),
    });
  } catch (e: unknown) {
    console.error("reset-request error", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
