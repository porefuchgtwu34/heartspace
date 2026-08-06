import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const matches = await db.match.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: {
      userA: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true } },
      userB: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const result = matches.map((m) => ({
    id: m.id,
    createdAt: m.createdAt,
    partner: m.userAId === user.id ? m.userB : m.userA,
  }));
  return NextResponse.json(result);
}
