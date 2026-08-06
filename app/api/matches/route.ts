import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    other: m.matchAId === user.id ? m.matchB : m.matchA,
  }));

  return NextResponse.json(shaped);
}
