import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const PAGE_SIZE = 8;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const category = url.searchParams.get("category") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;
  const authorId = url.searchParams.get("authorId") ?? undefined;
  const sort = url.searchParams.get("sort") ?? "newest";

  const where: any = {};
  if (category && category !== "all") where.category = category;
  if (authorId) where.authorId = authorId;
  if (search) where.content = { contains: search };

  let orderBy: any = { createdAt: "desc" };
  if (sort === "top") orderBy = { reactions: { _count: "desc" } };
  else if (sort === "discussed") orderBy = { comments: { _count: "desc" } };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    }),
    db.post.count({ where }),
  ]);

  return NextResponse.json({
    posts,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    sort,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in to post." }, { status: 401 });

    const { content, mood, category, title } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Write something first." }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "Posts must be under 2000 characters." }, { status: 400 });
    }
    const post = await db.post.create({
      data: {
        authorId: user.id,
        content: content.trim(),
        mood: mood ?? null,
        category: category ?? "general",
        title: title?.trim() || null,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });
    return NextResponse.json(post);
  } catch (e: any) {
    console.error("create post error", e);
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}
