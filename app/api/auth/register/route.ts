import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/credentials";

const BCRYPT_ROUNDS = 12;

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

    // Username cannot equal password (case-insensitive)
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
      },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: unknown) {
    console.error("register error", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
