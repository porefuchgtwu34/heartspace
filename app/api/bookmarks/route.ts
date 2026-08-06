import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bookmarks = await db.bookmark.findMany({
    where: { userId: user.id },
    include: {
      post: {
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { comments: true, reactions: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookmarks);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  const b = await db.bookmark.upsert({
    where: { userId_postId: { userId: user.id, postId } },
    update: {},
    create: { userId: user.id, postId },
  });
  return NextResponse.json(b);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const postId = new URL(req.url).searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  await db.bookmark.deleteMany({ where: { userId: user.id, postId } });
  return NextResponse.json({ ok: true });
}
