import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notify } from "@/lib/notify";

const schema = z.object({
  targetType: z.enum(["post", "user", "comment"]),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(200),
  details: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to report" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid report" },
      { status: 400 }
    );
  }

  const { targetType, targetId, reason, details } = parsed.data;

  const report = await db.report.create({
    data: {
      reporterId: user.id,
      targetType,
      targetId,
      reason,
      details: details ?? null,
    },
  });

  // Notify admins
  const admins = await db.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      notify({
        userId: a.id,
        type: "report",
        title: "New content report",
        body: `${targetType} reported: ${reason}`,
        link: "/?view=admin",
      })
    )
  );

  return NextResponse.json({ ok: true, id: report.id });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const reports = await db.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      reporter: { select: { id: true, username: true } },
    },
  });
  return NextResponse.json(reports);
}
