import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { generateMoodInsight } from "@/lib/content";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "50"));
  const entries = await db.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { mood, moodScore, content, tags } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Write a few words about your day." }, { status: 400 });
  }
  if (!mood) return NextResponse.json({ error: "Pick a mood." }, { status: 400 });
  const score = Math.max(1, Math.min(10, Number(moodScore) || 5));
  const insight = generateMoodInsight(mood, score, content);
  const entry = await db.journalEntry.create({
    data: {
      userId: user.id,
      mood,
      moodScore: score,
      content: content.trim(),
      insight,
      tags: tags ?? null,
    },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const entry = await db.journalEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.journalEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
