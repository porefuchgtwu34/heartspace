import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const where: any = { banned: false };
  if (q) {
    where.OR = [
      { username: { contains: q.toLowerCase() } },
      { bio: { contains: q } },
    ];
  }
  const users = await db.user.findMany({
    where,
    take: 30,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      bio: true,
      avatarUrl: true,
      age: true,
      location: true,
      interests: true,
      lookingFor: true,
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}
