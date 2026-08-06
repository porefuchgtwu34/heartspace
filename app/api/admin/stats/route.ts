import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [users, posts, comments, messages, contactPending, matches, banned, advisorMessages, gratitudeEntries, bookmarks] = await Promise.all([
    db.user.count(),
    db.post.count(),
    db.comment.count(),
    db.message.count(),
    db.contactRequest.count({ where: { status: "pending" } }),
    db.match.count(),
    db.user.count({ where: { banned: true } }),
    db.advisorMessage.count({ where: { role: "user" } }),
    db.gratitudeEntry.count(),
    db.bookmark.count(),
  ]);

  // advisor users (distinct users who have talked to Aria)
  const advisorUsers = await db.advisorMessage.groupBy({
    by: ["userId"],
    where: { role: "user" },
    _count: { _all: true },
  });

  // last 7 day signups
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentUsers = await db.user.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  const byDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  recentUsers.forEach((u) => {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (key in byDay) byDay[key]++;
  });

  return NextResponse.json({
    counts: { users, posts, comments, messages, contactPending, matches, banned, advisorMessages, advisorUsers: advisorUsers.length, gratitudeEntries, bookmarks },
    signupsByDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
  });
}
