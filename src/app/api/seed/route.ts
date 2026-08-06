import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST() {
  // Seed admin + demo users (idempotent via upsert)
  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await db.user.upsert({
    where: { email: "jackkamogelo83@gmail.com" },
    update: { role: "admin", passwordHash: adminPass },
    create: {
      email: "jackkamogelo83@gmail.com",
      username: "admin",
      displayName: "HeartSpace Admin",
      role: "admin",
      passwordHash: adminPass,
      bio: "Platform administrator",
    },
  });

  const demoUsers = [
    { email: "maya@heartspace.app", username: "maya", displayName: "Maya R.", bio: "Healing out loud.", location: "Johannesburg" },
    { email: "leo@heartspace.app", username: "leo", displayName: "Leo K.", bio: "Learning to stay.", location: "Cape Town" },
    { email: "nina@heartspace.app", username: "nina", displayName: "Nina S.", bio: "Soft edges only.", location: "Durban" },
    { email: "sam@heartspace.app", username: "sam", displayName: "Sam T.", bio: "Questions over conclusions.", location: "Pretoria" },
    { email: "zara@heartspace.app", username: "zara", displayName: "Zara M.", bio: "Romanticizing ordinary days.", location: "Cape Town" },
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

  return NextResponse.json({ ok: true, seeded: created.length, admin: { email: "jackkamogelo83@gmail.com", password: "admin123" } });
}
