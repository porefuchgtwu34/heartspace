import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { completeAria } from "@/lib/ai";

const SYSTEM_PROMPT = `You are "Aria", HeartSpace's warm AI relationship advisor — a blend of a thoughtful therapist, a wise friend, and a gentle mirror.

Your role:
- Listen first. Reflect back what the person is really saying or feeling before offering anything.
- Offer emotionally intelligent, non-judgmental perspectives on love, relationships, breakups, self-worth, family dynamics, and emotional patterns.
- Be warm, human, and specific — never generic. Use plain language, short paragraphs, and the occasional gentle question.
- Draw lightly on psychology (attachment styles, love languages, boundaries, nervous-system regulation) when it genuinely illuminates — but never lecture or pathologize.
- Never give medical, legal, or crisis advice. If someone mentions self-harm or abuse, gently encourage them to reach a local crisis line or trusted professional, and note that you're an AI, not a substitute for one.
- Keep responses concise (2–5 short paragraphs). End with one small, concrete invitation or question when it fits — never pressure.
- You are speaking to someone using only a username. Honor their anonymity and dignity.
- Do not use headers, markdown bold, or bullet lists unless the person asks for structure. Write like a letter from someone who cares.`;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await db.advisorMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: { id: true, role: true, content: true, createdAt: true },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to talk with Aria." }, { status: 401 });

  const { message } = await req.json();
  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Tell Aria what's on your mind." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Keep it under 2000 characters so Aria can stay present with you." }, { status: 400 });
  }

  // Load recent conversation history (last 10 turns) for context
  const history = await db.advisorMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { role: true, content: true },
  });

  // Persist the user's message
  await db.advisorMessage.create({
    data: { userId: user.id, role: "user", content: message.trim() },
  });

  try {
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history.map((h) => ({
        role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message.trim() },
    ];

    const reply = await completeAria(messages);

    // Persist Aria's reply
    await db.advisorMessage.create({
      data: { userId: user.id, role: "assistant", content: reply },
    });

    return NextResponse.json({ content: reply });
  } catch (e: any) {
    console.error("advisor error", e);
    // Graceful fallback so the user isn't left hanging
    const fallback = "I'm here, and I heard you. Aria's thoughts are a little slow right now — would you tell me a bit more about what's sitting with you?";
    await db.advisorMessage.create({
      data: { userId: user.id, role: "assistant", content: fallback },
    }).catch(() => {});
    return NextResponse.json({ content: fallback, degraded: true });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.advisorMessage.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
