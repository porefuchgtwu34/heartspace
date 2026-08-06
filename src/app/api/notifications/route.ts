import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, all } = await req.json();
  if (all) {
    await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
