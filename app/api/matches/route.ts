import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

function parseInterests(raw?: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(30, Math.max(1, parseInt(url.searchParams.get("limit") ?? "12") || 12));

  // If limit is requested, return discover deck (unswiped users)
  if (url.searchParams.has("limit")) {
    const already = await db.swipe.findMany({
      where: { swiperId: user.id },
      select: { targetId: true },
    });
    const blocked = await db.block.findMany({
      where: {
        OR: [{ blockerId: user.id }, { blockedId: user.id }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const exclude = new Set<string>([
      user.id,
      ...already.map((s) => s.targetId),
      ...blocked.flatMap((b) => [b.blockerId, b.blockedId]),
    ]);

    const candidates = await db.user.findMany({
      where: {
        banned: false,
        id: { notIn: Array.from(exclude) },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        age: true,
        location: true,
        interests: true,
        lookingFor: true,
      },
    });

    return NextResponse.json(
      candidates.map((c) => ({
        ...c,
        interests: parseInterests(c.interests),
      }))
    );
  }

  // Default: list matches
  const matches = await db.match.findMany({
    where: {
      OR: [{ matchAId: user.id }, { matchBId: user.id }],
    },
    include: {
      matchA: { select: { id: true, username: true, avatarUrl: true, bio: true } },
      matchB: { select: { id: true, username: true, avatarUrl: true, bio: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const shaped = matches.map((m) => ({
    id: m.id,
    createdAt: m.createdAt,
    other: m.matchAId === user.id ? m.matchA : m.matchB,
  }));

  return NextResponse.json(shaped);
}
