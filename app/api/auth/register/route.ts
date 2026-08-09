import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/credentials";
import {
  appOrigin,
  sendEmail,
  verificationEmailHtml,
} from "@/lib/email";

const BCRYPT_ROUNDS = 12;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { username, email, password, bio } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();
    const lowerUsername = username.toLowerCase().trim();

    if (lowerUsername === password.toLowerCase()) {
      return NextResponse.json(
        { error: "Password cannot be the same as your username" },
        { status: 400 }
      );
    }

    const existing = await db.user.findFirst({
      where: { OR: [{ email: lowerEmail }, { username: lowerUsername }] },
    });
    if (existing) {
      if (existing.email === lowerEmail) {
        return NextResponse.json(
          { error: "An account with that email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "That username is taken." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await db.user.create({
      data: {
        username: lowerUsername,
        email: lowerEmail,
        passwordHash,
        bio: bio?.trim() || null,
        emailVerified: null,
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await db.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const origin = appOrigin(req.nextUrl.origin);
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

    const isProd = process.env.NODE_ENV === "production";

    return NextResponse.json({
      ok: true,
      userId: user.id,
      requiresVerification: true,
      emailed: sent.ok,
      message: sent.ok
        ? "Account created. Check your email to verify before signing in."
        : "Account created. We could not send email — use resend verification after setting RESEND_API_KEY.",
      ...(!sent.ok && !isProd
        ? { previewToken: token, emailError: sent.error }
        : {}),
    });
  } catch (e: unknown) {
    console.error("register error", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
