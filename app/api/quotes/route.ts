import { NextResponse } from "next/server";
import { LOVE_QUOTES } from "@/lib/content";

export async function GET() {
  const i = Math.floor(Math.random() * LOVE_QUOTES.length);
  return NextResponse.json({
    quote: LOVE_QUOTES[i],
    all: LOVE_QUOTES,
  });
}
