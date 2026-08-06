import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { generateMoodInsight } from "@/lib/content";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await db.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content, mood } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Write something first." }, { status: 400 });
  }
  const insight = generateMoodInsight?.(mood, content) ?? null;
  const entry = await db.journalEntry.create({
    data: {
      userId: user.id,
      content: content.trim(),
      mood: mood ?? null,
      insight,
    },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.journalEntry.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
