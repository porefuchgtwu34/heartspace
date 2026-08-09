import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  mood: z.string().min(1).max(40),
  moodScore: z.number().int().min(1).max(10),
  note: z.string().max(500).optional(),
});

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = Math.min(90, Math.max(7, parseInt(new URL(req.url).searchParams.get("days") ?? "30") || 30));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [today, history, journal] = await Promise.all([
    db.dailyCheckIn.findUnique({
      where: { userId_day: { userId: user.id, day: todayKey() } },
    }),
    db.dailyCheckIn.findMany({
      where: { userId: user.id, createdAt: { gte: since } },
      orderBy: { day: "asc" },
    }),
    db.journalEntry.findMany({
      where: { userId: user.id, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { mood: true, moodScore: true, createdAt: true },
    }),
  ]);

  // Streak: consecutive days ending today or yesterday
  let streak = 0;
  const daySet = new Set(history.map((h) => h.day));
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    if (daySet.has(key)) streak++;
    else if (i > 0) break;
  }

  return NextResponse.json({
    today,
    streak,
    history,
    journalSeries: journal.map((j) => ({
      date: j.createdAt.toISOString().slice(0, 10),
      mood: j.mood,
      score: j.moodScore,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid check-in" },
      { status: 400 }
    );
  }

  const day = todayKey();
  const entry = await db.dailyCheckIn.upsert({
    where: { userId_day: { userId: user.id, day } },
    create: {
      userId: user.id,
      day,
      mood: parsed.data.mood,
      moodScore: parsed.data.moodScore,
      note: parsed.data.note?.trim() || null,
    },
    update: {
      mood: parsed.data.mood,
      moodScore: parsed.data.moodScore,
      note: parsed.data.note?.trim() || null,
    },
  });

  return NextResponse.json(entry);
}
