import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Seeds an admin + demo content if the DB is empty. Idempotent.
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
    { username: "luna", email: "luna@example.com", bio: "Poet, dreamer, recovering overthinker", interests: "Books,Music,Yoga", lookingFor: "friendship", age: 27, location: "Cape Town" },
    { username: "marco", email: "marco@example.com", bio: "Coffee snob. Believes in second chances.", interests: "Coffee,Hiking,Photography", lookingFor: "relationship", age: 31, location: "Johannesburg" },
    { username: "aria", email: "aria@example.com", bio: "Therapist in training. Be kind to yourself today.", interests: "Meditation,Writing,Philosophy", lookingFor: "networking", age: 29, location: "Durban" },
    { username: "leo", email: "leo@example.com", bio: "Dog dad. Learning to love out loud.", interests: "Dogs,Fitness,Movies", lookingFor: "dating", age: 26, location: "Pretoria" },
    { username: "sage", email: "sage@example.com", bio: "Quiet storms and soft landings.", interests: "Art,Nature,Cooking", lookingFor: "relationship", age: 33, location: "Cape Town" },
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
    { authorIdx: 2, content: "Therapy breakthrough today: asking for what I need isn't being difficult. It's being honest.", mood: "hopeful", category: "self-love" },
    { authorIdx: 3, content: "Three months post-breakup. Today I laughed so hard I cried, and for the first time it wasn't followed by grief.", mood: "hopeful", category: "breakup" },
    { authorIdx: 4, content: "Question for the community: how do you tell the difference between butterflies and anxiety?", mood: "confused", category: "advice" },
    { authorIdx: 1, content: "My grandmother said love is paying attention. Who are you paying attention to today?", mood: "grateful", category: "relationship" },
    { authorIdx: 5, content: "Made dinner for one tonight, set the table properly, lit a candle. Romanticizing my own life felt radical.", mood: "happy", category: "self-love" },
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

  const firstPost = await db.post.findFirst({ orderBy: { createdAt: "asc" } });
  if (firstPost) {
    await db.comment.create({ data: { postId: firstPost.id, authorId: created[3].id, content: "Oh, completely. I keep ticket stubs from 2019. No regrets." } });
    await db.comment.create({ data: { postId: firstPost.id, authorId: created[2].id, content: "There's no should with grief timelines. Keep what you need." } });
  }

  return NextResponse.json({ ok: true, seeded: created.length, admin: { username: "admin", password: "admin123" } });
}
