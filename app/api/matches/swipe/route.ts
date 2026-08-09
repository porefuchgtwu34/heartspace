import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notify } from "@/lib/notify";

function parseInterests(raw?: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.match.findMany({
    where: { OR: [{ matchAId: user.id }, { matchBId: user.id }] },
    include: {
      matchA: { select: { id: true, username: true, avatarUrl: true, bio: true, interests: true } },
      matchB: { select: { id: true, username: true, avatarUrl: true, bio: true, interests: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const matches = rows.map((m) => {
    const other = m.matchAId === user.id ? m.matchA : m.matchB;
    return {
      id: other.id,
      username: other.username,
      avatarUrl: other.avatarUrl,
      bio: other.bio,
      interests: parseInterests(other.interests),
      matchId: m.id,
      createdAt: m.createdAt,
    };
  });

  return NextResponse.json({ matches });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetId, action } = await req.json();
  if (!targetId || !["like", "pass"].includes(action)) {
    return NextResponse.json({ error: "Invalid swipe" }, { status: 400 });
  }
  if (targetId === user.id) {
    return NextResponse.json({ error: "Cannot swipe yourself" }, { status: 400 });
  }

  const target = await db.user.findFirst({
    where: { id: targetId, banned: false },
    select: { id: true, username: true, avatarUrl: true, bio: true, interests: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await db.swipe.upsert({
    where: { swiperId_targetId: { swiperId: user.id, targetId } },
    create: { swiperId: user.id, targetId, action },
    update: { action },
  });

  if (action !== "like") {
    return NextResponse.json({ matched: false });
  }

  const reciprocal = await db.swipe.findUnique({
    where: { swiperId_targetId: { swiperId: targetId, targetId: user.id } },
  });

  if (!reciprocal || reciprocal.action !== "like") {
    return NextResponse.json({ matched: false });
  }

  const [a, b] = [user.id, targetId].sort();
  const match = await db.match.upsert({
    where: { matchAId_matchBId: { matchAId: a, matchBId: b } },
    create: { matchAId: a, matchBId: b },
    update: {},
  });

  // Ensure conversation exists so Message can open immediately
  const [pA, pB] = [user.id, targetId].sort();
  await db.conversation.upsert({
    where: {
      participantAId_participantBId: { participantAId: pA, participantBId: pB },
    },
    create: { participantAId: pA, participantBId: pB },
    update: {},
  });

  await Promise.all([
    notify({
      userId: targetId,
      type: "match",
      title: "It's a match! 💞",
      body: `@${user.username} liked you back. Say hello?`,
      link: `/?view=messages&with=${user.id}`,
    }),
    notify({
      userId: user.id,
      type: "match",
      title: "It's a match! 💞",
      body: `You and @${target.username} liked each other.`,
      link: `/?view=messages&with=${target.id}`,
    }),
  ]);

  return NextResponse.json({
    matched: true,
    matchId: match.id,
    matchUser: {
      id: target.id,
      username: target.username,
      avatarUrl: target.avatarUrl,
      bio: target.bio,
      interests: parseInterests(target.interests),
    },
  });
}
