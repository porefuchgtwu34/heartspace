import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const publicSelect = {
  id: true,
  username: true,
  bio: true,
  avatarUrl: true,
  age: true,
  location: true,
  interests: true,
  lookingFor: true,
  createdAt: true,
} as const;

const patchSchema = z.object({
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().max(2048).optional(),
  age: z.number().int().min(13).max(120).optional().nullable(),
  location: z.string().max(80).optional(),
  interests: z.string().max(500).optional(),
  lookingFor: z
    .enum(["friendship", "dating", "relationship", "networking"])
    .optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { id, banned: false },
      select: publicSelect,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e) {
    console.error("GET /api/users/[id]", e);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await params;
    if (sessionUser.id !== id && sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    const p = parsed.data;
    if (p.bio !== undefined) data.bio = p.bio.trim() || null;
    if (p.avatarUrl !== undefined) data.avatarUrl = p.avatarUrl.trim() || null;
    if (p.age !== undefined) data.age = p.age;
    if (p.location !== undefined) data.location = p.location.trim() || null;
    if (p.interests !== undefined) data.interests = p.interests.trim() || null;
    if (p.lookingFor !== undefined) data.lookingFor = p.lookingFor;

    const updated = await db.user.update({
      where: { id },
      data,
      select: publicSelect,
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/users/[id]", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
