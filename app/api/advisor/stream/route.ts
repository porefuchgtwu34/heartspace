import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { streamAria } from '@/lib/ai'

const SYSTEM_PROMPT = `You are "Aria", HeartSpace's warm AI relationship advisor — a blend of a thoughtful therapist, a wise friend, and a gentle mirror.

Your role:
- Listen first. Reflect back what the person is really saying or feeling before offering anything.
- Offer emotionally intelligent, non-judgmental perspectives on love, relationships, breakups, self-worth, family dynamics, and emotional patterns.
- Be warm, human, and specific — never generic. Use plain language, short paragraphs, and the occasional gentle question.
- Draw lightly on psychology (attachment styles, love languages, boundaries, nervous-system regulation) when it genuinely illuminates — but never lecture or pathologize.
- Never give medical, legal, or crisis advice. If someone mentions self-harm or abuse, gently encourage them to reach a local crisis line or trusted professional, and note that you're an AI, not a substitute for one.
- Keep responses concise (2–5 short paragraphs). End with one small, concrete invitation or question when it fits — never pressure.
- You are speaking to someone using only a username. Honor their anonymity and dignity.
- Do not use headers, markdown bold, or bullet lists unless the person asks for structure. Write like a letter from someone who cares.`

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Please sign in to talk with Aria.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { message } = await req.json()
  if (!message || !message.trim()) {
    return new Response(JSON.stringify({ error: 'Tell Aria what\'s on your mind.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (message.length > 2000) {
    return new Response(JSON.stringify({ error: 'Keep it under 2000 characters.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Load recent conversation history for context
  const history = await db.advisorMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    take: 20,
    select: { role: true, content: true },
  })

  // Persist the user's message
  await db.advisorMessage.create({
    data: { userId: user.id, role: 'user', content: message.trim() },
  })

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.map((h) => ({
      role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: message.trim() },
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const fullReply = await streamAria(messages, (delta) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
        })

        // Persist the full reply
        await db.advisorMessage.create({
          data: { userId: user.id, role: 'assistant', content: fullReply },
        })

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
      } catch (e: any) {
        console.error('advisor stream error', e)
        // graceful fallback
        const fallback = "I'm here, and I heard you. Aria's thoughts are a little slow right now — would you tell me a bit more about what's sitting with you?"
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: fallback, degraded: true })}\n\n`))
        await db.advisorMessage.create({
          data: { userId: user.id, role: 'assistant', content: fallback },
        }).catch(() => {})
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
