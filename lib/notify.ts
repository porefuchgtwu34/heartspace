import { db } from "@/lib/db";

export async function notify(opts: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    return await db.notification.create({
      data: {
        userId: opts.userId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        link: opts.link ?? null,
      },
    });
  } catch (e) {
    console.error("notify failed", e);
    return null;
  }
}
