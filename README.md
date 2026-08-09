# HeartSpace

A compassionate relationship and wellness platform built with Next.js.

## Features

- AI Relationship Advisor (Aria) with conversation history
- Community posts, comments, reactions, bookmarks, reports
- Discover matching + mutual-match notifications
- Journal, daily check-in, mood charts, gratitude jar
- Breathing exercises & quizzes
- Admin dashboard

## Stack

- Next.js (App Router)
- Prisma + PostgreSQL (Neon)
- NextAuth
- Tailwind CSS + shadcn/ui
- Resend (password-reset email)

## Setup

1. Copy `.env.example` to `.env` and fill values
2. `npm install`
3. `npx prisma db push`
4. `npm run dev`

### Important env vars

| Variable | Purpose |
|----------|--------|
| `DATABASE_URL` | Neon Postgres |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Auth |
| `OPENAI_API_KEY` or `ZAI_API_KEY` | Aria AI |
| `RESEND_API_KEY` / `RESEND_FROM` | Password-reset emails |
| `SEED_SECRET` | Protects `POST /api/seed` in production |

## Deploy (Vercel)

Set the env vars above. Build runs `prisma generate && prisma db push && next build`.

Seed once (production requires secret):

```bash
curl -X POST "https://your-app.vercel.app/api/seed" \
  -H "x-seed-secret: $SEED_SECRET"
```

## Version

`0.3.0` — cleanup, community depth APIs, social loop (notifications + match\u2192DM), wellness check-in.
