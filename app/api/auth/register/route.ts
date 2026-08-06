import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  bio: z.string().max(280).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { username, email, password, bio } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();
    const lowerUsername = username.toLowerCase().trim();

    const existing = await db.user.findFirst({
      where: { OR: [{ email: lowerEmail }, { username: lowerUsername }] },
    });
    if (existing) {
      if (existing.email === lowerEmail) {
        return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: "That username is taken." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        username: lowerUsername,
        email: lowerEmail,
        passwordHash,
        bio: bio ?? null,
      },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    console.error("register error", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
