import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where: any = {};
  if (status && status !== "all") where.status = status;
  const requests = await db.contactRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      fromUser: { select: { id: true, username: true, email: true, avatarUrl: true } },
    },
  });
  return NextResponse.json(requests);
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, status, adminReply } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const data: any = {};
  if (status) data.status = status;
  if (typeof adminReply === "string") data.adminReply = adminReply;
  const updated = await db.contactRequest.update({ where: { id }, data });
  return NextResponse.json(updated);
}
