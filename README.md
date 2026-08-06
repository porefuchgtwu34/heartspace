# HeartSpace

Warm community for love, relationships & psychology.

**Stack:** Next.js · TypeScript · Prisma (PostgreSQL / Neon) · NextAuth · Tailwind

## Admin

| Field | Value |
|-------|--------|
| Username | `admin` |
| Email | `jackkamogelo83@gmail.com` |
| Password | `admin123` |

## Neon + Vercel

1. In [Vercel](https://vercel.com) → your project → **Environment Variables**, set:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon connection string (`postgresql://...?...sslmode=require`) |
| `NEXTAUTH_SECRET` | Long random string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | For Aria AI |

2. Prisma is set to `provider = "postgresql"` (Neon-ready).

3. After first deploy, seed:

```bash
curl -X POST https://YOUR_APP.vercel.app/api/seed
```

4. Login as **admin** / **admin123**.

## Local

```bash
npm install
cp .env.example .env   # paste Neon URL
npx prisma db push
npm run dev
curl -X POST http://localhost:3000/api/seed
```

## Fixes

- Quotes randomize on every page reload
- Aria works via `OPENAI_API_KEY` / `ZAI_API_KEY`
- Admin email: jackkamogelo83@gmail.com
- Password reset supports Resend when `RESEND_API_KEY` is set
