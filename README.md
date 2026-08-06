# HeartSpace 🌹

A warm, anonymous community for love, relationships, behaviour and psychology.

**Stack:** Next.js 16 · TypeScript · Prisma · NextAuth · Tailwind · shadcn/ui

## Features

- Community feed (posts, comments, reactions, search)
- Aria — AI relationship advisor
- Mood journal & gratitude jar
- Love quizzes (love languages, attachment)
- Discover / matching
- Real-time messaging (Socket.io mini-service)
- Breathing wellness room
- Admin dashboard (users, posts, inbox)

## Quick start (local)

```bash
npm install
cp .env.example .env
# edit .env — set NEXTAUTH_SECRET and DATABASE_URL
npx prisma db push
# seed demo data (optional)
curl -X POST http://localhost:3000/api/seed
npm run dev
```

**Admin login**
- Username: `admin`
- Email: `jackkamogelo83@gmail.com`
- Password: `admin123`

## Deploy to Vercel

1. Import this GitHub repo in [Vercel](https://vercel.com/new).
2. Set environment variables:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Prefer **Postgres** (Neon / Vercel Postgres / Supabase). SQLite does not work on Vercel serverless. |
| `NEXTAUTH_SECRET` | Yes | Random long string |
| `NEXTAUTH_URL` | Yes | Your production URL, e.g. `https://heartspace.vercel.app` |
| `OPENAI_API_KEY` | For Aria | Or `ZAI_API_KEY` + optional `ZAI_BASE_URL` / `AI_MODEL` |
| `RESEND_API_KEY` | Optional | Real password-reset emails |

3. After first deploy, run seed once:

```bash
curl -X POST https://YOUR_APP.vercel.app/api/seed
```

4. If using Postgres, change `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then redeploy (or run `npx prisma db push` against the production URL).

## Password reset

- In-app: Login → Forgot? → enter `jackkamogelo83@gmail.com`
- With `RESEND_API_KEY`, a real email is sent.
- Without it, the API returns a one-time token/preview so you can complete the reset in the UI.

## Notes

- Quotes on the home page pick a **new random quote on every reload**.
- Aria works with any OpenAI-compatible API key — no local `.z-ai-config` required on Vercel.
- Structure of the app is unchanged from the original scaffold.
