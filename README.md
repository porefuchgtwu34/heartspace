# HeartSpace

A compassionate relationship and wellness platform built with Next.js.

## Features

- AI Relationship Advisor
- Community posts & matching
- Journal & gratitude jar
- Breathing exercises
- Admin dashboard

## Stack

- Next.js (App Router)
- Prisma + PostgreSQL (Neon)
- NextAuth
- Tailwind CSS + shadcn/ui

## Setup

1. Copy `.env.example` to `.env` and fill values
2. `npm install`
3. `npx prisma db push`
4. `npm run dev`

## Deploy

Connected to Vercel. Set env vars in the Vercel dashboard including `DATABASE_URL` (Neon), `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.

Seed admin after deploy:
```
curl -X POST https://your-app.vercel.app/api/seed
```
