import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

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
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sessionUser = await getCurrentUser();
    const isOwn = sessionUser?.id === id;

    const [reactionsReceived, matchesA, matchesB, journalEntries, comments] =
      await Promise.all([
        db.reaction.count({ where: { post: { authorId: id } } }),
        db.match.count({ where: { matchAId: id } }),
        db.match.count({ where: { matchBId: id } }),
        isOwn
          ? db.journalEntry.count({ where: { userId: id } })
          : Promise.resolve(0),
        db.comment.count({ where: { authorId: id } }),
      ]);

    return NextResponse.json({
      reactionsReceived,
      matches: matchesA + matchesB,
      journalEntries: isOwn ? journalEntries : 0,
      comments,
    });
  } catch (e) {
    console.error("GET /api/users/[id]/stats", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
