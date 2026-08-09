import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import {
  appOrigin,
  sendEmail,
  verificationEmailHtml,
} from "@/lib/email";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

async function issueAndSendVerification(
  user: { id: string; email: string; username: string },
  origin: string
) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Invalidate previous unused tokens
  await db.emailVerificationToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  await db.emailVerificationToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const verifyUrl = `${origin}/?verify=${token}`;
  const subject = "Verify your HeartSpace email";
  const text = `Hi ${user.username},

Confirm your email by opening this link (valid 24 hours):
${verifyUrl}

If you did not create a HeartSpace account, you can ignore this message.

— The HeartSpace Team`;

  const sent = await sendEmail({
    to: user.email,
    subject,
    text,
    html: verificationEmailHtml({ username: user.username, verifyUrl }),
  });

  return { sent, token, verifyUrl };
}

/** Confirm email via token (query or JSON body). */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token")?.trim();
  return verifyToken(token);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Resend verification email
  if (body.email && !body.token) {
    const email = String(body.email).toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email } });

    // Always generic response (no enumeration)
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If that email needs verification, a new link has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        ok: true,
        alreadyVerified: true,
        message: "This email is already verified. You can sign in.",
      });
    }

    const origin = appOrigin(req.nextUrl.origin);
    const { sent, token } = await issueAndSendVerification(user, origin);
    const isProd = process.env.NODE_ENV === "production";

    return NextResponse.json({
      ok: true,
      emailed: sent.ok,
      message: sent.ok
        ? "Check your inbox for a new verification link."
        : "If that email needs verification, a new link has been sent.",
      ...(!sent.ok && !isProd
        ? {
            previewToken: token,
            emailError: sent.error,
          }
        : {}),
    });
  }

  return verifyToken(
    typeof body.token === "string" ? body.token.trim() : undefined
  );
}

async function verifyToken(token?: string | null) {
  if (!token) {
    return NextResponse.json({ error: "Missing verification token." }, { status: 400 });
  }

  const row = await db.emailVerificationToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, username: true, emailVerified: true } } },
  });

  if (!row || row.used) {
    return NextResponse.json(
      { error: "This verification link is invalid or already used." },
      { status: 400 }
    );
  }

  if (row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This verification link has expired. Request a new one." },
      { status: 400 }
    );
  }

  if (row.user.emailVerified) {
    await db.emailVerificationToken.update({
      where: { id: row.id },
      data: { used: true },
    });
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      message: "Email already verified. You can sign in.",
    });
  }

  await db.$transaction([
    db.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() },
    }),
    db.emailVerificationToken.update({
      where: { id: row.id },
      data: { used: true },
    }),
    db.emailVerificationToken.updateMany({
      where: { userId: row.userId, used: false },
      data: { used: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    message: "Email verified! You can sign in now.",
    username: row.user.username,
  });
}

/** Used by register route */
export async function createVerificationForUser(
  user: { id: string; email: string; username: string },
  origin: string
) {
  return issueAndSendVerification(user, origin);
}
