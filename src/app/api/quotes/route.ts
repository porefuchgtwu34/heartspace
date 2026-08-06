import { NextResponse } from "next/server";
import { QUOTES } from "@/lib/content";

export async function GET() {
  const idx = Math.floor(Math.random() * QUOTES.length);
  return NextResponse.json({ quote: QUOTES[idx], index: idx });
}
