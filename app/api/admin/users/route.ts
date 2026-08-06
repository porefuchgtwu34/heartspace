import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const q = url.searchParams.get("q") ?? "";
  const pageSize = 15;
  const where: any = {};
  if (q) where.OR = [{ username: { contains: q.toLowerCase() } }, { email: { contains: q.toLowerCase() } }];
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, username: true, email: true, role: true, banned: true, createdAt: true,
        bio: true, avatarUrl: true,
        _count: { select: { posts: true, messages: true } },
      },
    }),
    db.user.count({ where }),
  ]);
  return NextResponse.json({ users, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) });
}

// Ban / unban / promote / delete
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, action } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  if (action === "ban") {
    await db.user.update({ where: { id }, data: { banned: true } });
  } else if (action === "unban") {
    await db.user.update({ where: { id }, data: { banned: false } });
  } else if (action === "promote") {
    await db.user.update({ where: { id }, data: { role: "admin" } });
  } else if (action === "demote") {
    await db.user.update({ where: { id }, data: { role: "user" } });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
