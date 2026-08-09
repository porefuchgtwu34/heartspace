import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notify } from "@/lib/notify";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await db.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });

  const { id: postId } = await params;
  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Write something" }, { status: 400 });
  if (content.length > 1000) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const comment = await db.comment.create({
    data: { postId, authorId: user.id, content },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  if (post.authorId !== user.id) {
    await notify({
      userId: post.authorId,
      type: "comment",
      title: "New comment on your post",
      body: `@${user.username}: ${content.slice(0, 120)}`,
      link: `/?view=community&post=${postId}`,
    });
  }

  return NextResponse.json(comment);
}
