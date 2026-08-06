import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const existing = await db.user.count();
  const force = new URL(req.url).searchParams.get("force") === "1";
  if (existing > 0 && !force) {
    return NextResponse.json({ ok: true, message: "Already seeded", count: existing });
  }

  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await db.user.upsert({
    where: { email: "jackkamogelo83@gmail.com" },
    update: { role: "admin", passwordHash: adminPass },
    create: {
      username: "admin",
      email: "jackkamogelo83@gmail.com",
      passwordHash: adminPass,
      role: "admin",
      bio: "HeartSpace community steward",
    },
  });

  const demoUsers = [
    { username: "luna", email: "luna@example.com", bio: "Poet, dreamer", interests: "Books,Music", lookingFor: "friendship", age: 27, location: "Cape Town" },
    { username: "marco", email: "marco@example.com", bio: "Coffee snob", interests: "Coffee,Hiking", lookingFor: "relationship", age: 31, location: "Johannesburg" },
    { username: "aria", email: "aria@example.com", bio: "Therapist in training", interests: "Meditation,Writing", lookingFor: "networking", age: 29, location: "Durban" },
    { username: "leo", email: "leo@example.com", bio: "Dog dad", interests: "Dogs,Fitness", lookingFor: "dating", age: 26, location: "Pretoria" },
    { username: "sage", email: "sage@example.com", bio: "Quiet storms", interests: "Art,Nature", lookingFor: "relationship", age: 33, location: "Cape Town" },
  ];

  const created = [admin];
  for (const u of demoUsers) {
    const pass = await bcrypt.hash("password123", 10);
    const user = await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: pass },
    });
    created.push(user);
  }

  const samplePosts = [
    { authorIdx: 1, content: "Spent the evening re-reading old letters. Funny how a person can become a season of your life.", mood: "reflective", category: "story" },
    { authorIdx: 2, content: "Therapy breakthrough: asking for what I need is being honest.", mood: "hopeful", category: "self-love" },
    { authorIdx: 3, content: "Three months post-breakup. Today I laughed so hard I cried.", mood: "hopeful", category: "breakup" },
    { authorIdx: 4, content: "How do you tell the difference between butterflies and anxiety?", mood: "confused", category: "advice" },
    { authorIdx: 1, content: "Love is paying attention. Who are you paying attention to today?", mood: "grateful", category: "relationship" },
    { authorIdx: 5, content: "Made dinner for one, lit a candle. Romanticizing my own life felt radical.", mood: "happy", category: "self-love" },
  ];

  for (const p of samplePosts) {
    await db.post.create({
      data: {
        authorId: created[p.authorIdx].id,
        content: p.content,
        mood: p.mood,
        category: p.category,
      },
    });
  }

  return NextResponse.json({ ok: true, seeded: created.length, admin: { username: "admin", password: "admin123" } });
}
