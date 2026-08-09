/** Lightweight Resend sender used by auth flows. */

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const from =
    process.env.RESEND_FROM?.trim() || "HeartSpace <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error", res.status, errText);
      return { ok: false, error: `Email provider error (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    console.error("Resend send failed", e);
    return { ok: false, error: "Failed to reach email provider" };
  }
}

export function appOrigin(reqOrigin?: string | null) {
  const origin =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    reqOrigin ||
    "http://localhost:3000";
  return origin.replace(/\/$/, "");
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}

export function verificationEmailHtml(opts: {
  username: string;
  verifyUrl: string;
}) {
  const { username, verifyUrl } = opts;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#faf5f7;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #fce7f3;">
        <tr>
          <td style="background:linear-gradient(135deg,#f43f5e,#d946ef);padding:28px 24px;color:#fff;">
            <div style="font-size:20px;font-weight:700;">HeartSpace</div>
            <div style="font-size:13px;opacity:0.9;margin-top:4px;">Confirm your email</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;color:#1f2937;line-height:1.55;font-size:15px;">
            <p style="margin:0 0 12px;">Hi <strong>@${escapeHtml(username)}</strong>,</p>
            <p style="margin:0 0 16px;">Thanks for joining HeartSpace. Please confirm your email so we know this inbox is yours. This link expires in <strong>24 hours</strong>.</p>
            <p style="margin:0 0 24px;text-align:center;">
              <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#f43f5e,#d946ef);color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;">Verify email</a>
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Or paste this link into your browser:</p>
            <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#9f1239;">${escapeHtml(verifyUrl)}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;">If you didn&rsquo;t create an account, you can ignore this email.</p>
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
}
