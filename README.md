# HeartSpace

A warm, anonymous community for love, relationships, behaviour and psychology.

**Stack:** Next.js 16 · TypeScript · Prisma · NextAuth · Tailwind · shadcn/ui

## Features

- Community feed (posts, comments, reactions, search)
- **Aria** — AI relationship advisor (OpenAI-compatible)
- Mood journal & gratitude jar
- Love quizzes (love languages, attachment)
- Discover / matching
- Breathing wellness room
- Admin dashboard (users, posts, inbox)

## Admin account

| Field | Value |
|-------|--------|
| Username | `admin` |
| Email | `jackkamogelo83@gmail.com` |
| Password | `admin123` |

Password reset: use **Forgot?** on the login modal with the admin email.  
If `RESEND_API_KEY` is set, a real email is sent; otherwise the API returns a token/preview for demo recovery.

## Fixes in this version

- **Quotes** refresh to a random quote on every page reload
- **Aria AI** works on Vercel via `OPENAI_API_KEY` or `ZAI_API_KEY` (no local `.z-ai-config` file)
- Admin email set to `jackkamogelo83@gmail.com`
- Password reset supports Resend when configured

## Deploy to Vercel

1. Push the full project source to this repo (or import from the `HEARTSPACE.tar` archive).
2. Go to [vercel.com/new](https://vercel.com/new) and import **porefuchgtwu34/heartspace**.
3. Set environment variables:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Use **Postgres** (Neon / Vercel Postgres / Supabase). SQLite does not work on serverless. |
| `NEXTAUTH_SECRET` | Yes | Long random string |
| `NEXTAUTH_URL` | Yes | e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | For Aria | Or `ZAI_API_KEY` + optional `AI_MODEL` |
| `RESEND_API_KEY` | Optional | Real password-reset emails |

4. For Postgres, set in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

5. After first deploy, seed demo data:

```bash
curl -X POST https://YOUR_APP.vercel.app/api/seed
```

## Local development

```bash
npm install
cp .env.example .env
# edit DATABASE_URL, NEXTAUTH_SECRET
npx prisma db push
npm run dev
# optional seed:
curl -X POST http://localhost:3000/api/seed
```

## Structure

App structure is unchanged from the original scaffold. Only transport/config for AI, quotes, seed email, and deploy scripts were adjusted.
