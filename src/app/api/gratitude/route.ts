import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await db.gratitudeEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { content } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Write something you're grateful for." }, { status: 400 });
  }
  const entry = await db.gratitudeEntry.create({
    data: { userId: user.id, content: content.trim().slice(0, 500) },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.gratitudeEntry.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
