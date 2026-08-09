import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
      _count: { select: { comments: true, reactions: true } },
    },
  });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.authorId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
