'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useApp } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { LOVE_QUOTES } from '@/lib/content'
import {
  Heart,
  MessageCircle,
  BookHeart,
  Sparkles,
  Flame,
  Shield,
  Wind,
  ArrowRight,
  Quote,
  Users,
  Lock,
  Star,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Smile,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function HomeView() {
  // Fresh random quote on every page load / reload
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * LOVE_QUOTES.length))
  const [stats, setStats] = useState({ posts: 0 })

  useEffect(() => {
    const id = setInterval(() => setQuoteIdx((i) => (i + 1) % LOVE_QUOTES.length), 6000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    api('/api/posts?page=1').then((r: any) => setStats((s) => ({ ...s, posts: r.total ?? 0 }))).catch(() => {})
  }, [])

  return (
    <div className="relative">
      <Hero />
      <FeaturesStrip />
      {/* Quotes early so mobile visitors see them without long scroll */}
      <QuotesCarousel quoteIdx={quoteIdx} setQuoteIdx={setQuoteIdx} />
      <FeatureGrid />
      <HowItWorks />
      <StatsBand posts={stats.posts} />
      <FinalCTA />
    </div>
  )
}

function Hero() {
  const { navigate, openAuth } = useApp()
  const { user } = useCurrentUser()
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 120, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 18 })

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-rose-500/10 via-fuchsia-500/5 to-background" />
      <div className="absolute inset-0 -z-10 opacity-60" style={{ backgroundImage: 'radial-gradient(60% 50% at 80% 0%, oklch(0.85 0.12 350 / 0.25), transparent), radial-gradient(40% 40% at 10% 20%, oklch(0.85 0.1 60 / 0.2), transparent)' }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10">
          <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" /> A kinder corner of the internet
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            Where hearts <span className="text-gradient-rose">find their people.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
            HeartSpace is a warm, anonymous community for love, relationships, behaviour and psychology.
            Share your story, keep a mood journal, take love quizzes, and connect — all by username, never your real name.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {!user ? (
              <>
                <Button size="lg" className="h-12 px-7 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-xl shadow-rose-500/30 text-base" onClick={() => openAuth('register')}>
                  <Heart className="h-5 w-5 mr-2 fill-white" /> Join the community
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6 rounded-full text-base" onClick={() => navigate('community')}>
                  Explore the feed <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="h-12 px-7 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-xl shadow-rose-500/30 text-base" onClick={() => navigate('community')}>
                  <MessageCircle className="h-5 w-5 mr-2" /> Go to community
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6 rounded-full text-base" onClick={() => navigate('journal')}>
                  <Sparkles className="h-4 w-4 mr-2" /> Open my journal
                </Button>
              </>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-emerald-500" /> Username-only</span>
            <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-500" /> Moderated kindly</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-emerald-500" /> Real people, real hearts</span>
          </div>
        </motion.div>

        <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0) }} style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-rose-500/20 ring-1 ring-rose-500/10">
            <img src="/hero-love.png" alt="Two people sharing a tender moment at golden hour" className="w-full h-[320px] sm:h-[420px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 via-transparent to-transparent" />
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/85 dark:bg-rose-950/80 backdrop-blur-md p-4 shadow-lg">
              <div className="flex items-start gap-2">
                <Quote className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium leading-snug">"Love yourself first and everything else falls into line."</p>
                  <p className="text-xs text-muted-foreground mt-1">— Lucille Ball</p>
                </div>
              </div>
            </motion.div>
          </div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-3 -left-3 rounded-2xl bg-white dark:bg-rose-950 shadow-xl p-3 ring-1 ring-rose-500/10">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15"><Heart className="h-4 w-4 text-rose-500 fill-rose-500/30" /></div>
              <div>
                <p className="text-xs font-semibold leading-none">12k hearts</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">shared today</p>
              </div>
            </div>
          </motion.div>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} className="absolute -bottom-4 -right-3 rounded-2xl bg-white dark:bg-rose-950 shadow-xl p-3 ring-1 ring-fuchsia-500/10">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-fuchsia-500/15"><Brain className="h-4 w-4 text-fuchsia-500" /></div>
              <div>
                <p className="text-xs font-semibold leading-none">Mood insights</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">private & personal</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function FeaturesStrip() {
  const items = [
    { icon: MessageCircle, label: 'Community feed', color: 'text-rose-500' },
    { icon: Sparkles, label: 'Aria AI advisor', color: 'text-fuchsia-500' },
    { icon: Wind, label: 'Breathing Room', color: 'text-teal-500' },
    { icon: BookHeart, label: 'Private DMs', color: 'text-purple-500' },
    { icon: Heart, label: 'Mood journal', color: 'text-amber-500' },
    { icon: Flame, label: 'Discover people', color: 'text-orange-500' },
    { icon: Heart, label: 'Love quizzes', color: 'text-pink-500' },
  ]
  return (
    <section className="border-y border-border/60 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {items.map((it) => {
            const Icon = it.icon
            return (
              <div key={it.label} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors">
                <Icon className={cn('h-4 w-4 shrink-0', it.color)} />
                <span className="text-sm font-medium truncate">{it.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FeatureGrid() {
  const { navigate, openAuth } = useApp()
  const { user } = useCurrentUser()
  const features = [
    { icon: MessageCircle, title: 'Community feed', desc: 'Post anonymously by username. Comment, react with hearts, and give each other real advice. Paginated, searchable, categorized.', tag: 'Public', gradient: 'from-rose-500/15 to-pink-500/5', iconColor: 'text-rose-500 bg-rose-500/15', cta: 'Browse posts', view: 'community' as const },
    { icon: Sparkles, title: 'Aria — AI advisor', desc: 'Talk with Aria, your AI relationship advisor. Warm, non-judgmental, and always here — for the things on your heart you can\'t quite say elsewhere.', tag: 'New · AI', gradient: 'from-fuchsia-500/15 to-rose-500/5', iconColor: 'text-fuchsia-500 bg-fuchsia-500/15', cta: 'Talk with Aria', view: 'advisor' as const, auth: true },
    { icon: BookHeart, title: 'Real-time messaging', desc: 'Chat one-on-one with any registered user — usernames only. Live typing indicators, online presence, read receipts.', tag: 'Private', gradient: 'from-purple-500/15 to-fuchsia-500/5', iconColor: 'text-purple-500 bg-purple-500/15', cta: 'Open messages', view: 'messages' as const, auth: true },
    { icon: Heart, title: 'Mood journal + Gratitude jar', desc: 'A private journal that turns feelings into psychological insight, plus a gratitude jar to collect the small good things. Track your emotional weather over time.', tag: 'Personal', gradient: 'from-amber-500/15 to-orange-500/5', iconColor: 'text-amber-500 bg-amber-500/15', cta: 'Start journaling', view: 'journal' as const, auth: true },
    { icon: Flame, title: 'Discover people', desc: 'A kinder, slower swipe. Find friends, dates, or kindred spirits by shared interests — mutual likes open a conversation.', tag: 'Matching', gradient: 'from-orange-500/15 to-rose-500/5', iconColor: 'text-orange-500 bg-orange-500/15', cta: 'Discover', view: 'discover' as const, auth: true },
    { icon: Wind, title: 'Breathing Room', desc: 'A guided breathing tool with 4-7-8, Box, and Coherent rhythms. One minute of intentional breath can quiet a loud mind.', tag: 'New · Wellness', gradient: 'from-teal-500/15 to-emerald-500/5', iconColor: 'text-teal-500 bg-teal-500/15', cta: 'Breathe now', view: 'breathe' as const },
    { icon: Heart, title: 'Love quizzes', desc: 'Find your love language. Understand your attachment style. Original, thoughtful quizzes with real takeaways.', tag: 'Reflective', gradient: 'from-pink-500/15 to-rose-500/5', iconColor: 'text-pink-500 bg-pink-500/15', cta: 'Take a quiz', view: 'quiz' as const },
    { icon: Shield, title: 'Admin care', desc: 'A real human reads every report. The admin dashboard moderates users, posts, and replies to every message that reaches out.', tag: 'Safe', gradient: 'from-emerald-500/15 to-teal-500/5', iconColor: 'text-emerald-500 bg-emerald-500/15', cta: 'Contact the team', view: null },
  ]
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-3 gap-1.5">Everything in one warm place</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Six ways to tend to your heart</h2>
          <p className="mt-3 text-muted-foreground">From the public feed to your private journal — each feature is built around the same idea: you deserve a softer space to be human.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <Card className={cn('group relative overflow-hidden h-full border-border/60 hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300')}>
                  <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', f.gradient)} />
                  <CardContent className="relative p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn('grid h-12 w-12 place-items-center rounded-2xl', f.iconColor)}><Icon className="h-6 w-6" /></div>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{f.tag}</Badge>
                    </div>
                    <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{f.desc}</p>
                    {f.view && (
                      <button onClick={() => { if (f.auth && !user) openAuth('login'); else if (f.view) navigate(f.view) }} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:gap-2.5 transition-all">
                        {f.cta} <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    {!f.view && (
                      <button onClick={() => useApp.setState({ params: { ...useApp.getState().params, contactOpen: '1' } })} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:gap-2.5 transition-all">
                        {f.cta} <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const { navigate, openAuth } = useApp()
  const { user } = useCurrentUser()
  const steps = [
    { n: '01', icon: PenLine, title: 'Pick a username', desc: 'No real name, no photo required. You are your words here.', color: 'from-rose-500 to-pink-600' },
    { n: '02', icon: Smile, title: 'Share how you feel', desc: 'Post to the community, or pour it into your private mood journal.', color: 'from-fuchsia-500 to-purple-600' },
    { n: '03', icon: Heart, title: 'Find your people', desc: 'React, comment, message, and discover kindred hearts. Grow together.', color: 'from-amber-500 to-rose-500' },
  ]
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-rose-500/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-3">Three gentle steps</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">How HeartSpace works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-border/60 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn('grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg', s.color)}><Icon className="h-6 w-6" /></div>
                      <span className="font-display text-4xl font-bold text-rose-500/15">{s.n}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        <div className="mt-10 text-center">
          {!user ? (
            <Button size="lg" className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-lg shadow-rose-500/30" onClick={() => openAuth('register')}>
              <Heart className="h-4 w-4 mr-2 fill-white" /> Create your free account
            </Button>
          ) : (
            <Button size="lg" className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-lg shadow-rose-500/30" onClick={() => navigate('journal')}>
              <Sparkles className="h-4 w-4 mr-2" /> Open your journal
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

function QuotesCarousel({ quoteIdx, setQuoteIdx }: { quoteIdx: number; setQuoteIdx: (fn: (i: number) => number) => void }) {
  const q = LOVE_QUOTES[quoteIdx]
  return (
    <section className="py-8 sm:py-12 md:py-16 relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 -z-10 opacity-50" style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 50%, oklch(0.85 0.1 350 / 0.15), transparent)' }} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-rose-600/80 dark:text-rose-300/80 mb-3">A thought for your heart</p>
        <motion.div key={quoteIdx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <Quote className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-rose-500/40 mb-3" />
          <blockquote className="font-display text-xl sm:text-2xl md:text-3xl font-medium italic leading-snug px-1">"{q.text}"</blockquote>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">— {q.author}</p>
        </motion.div>
        <div className="mt-5 sm:mt-8 flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Previous quote" onClick={() => setQuoteIdx((i) => (i - 1 + LOVE_QUOTES.length) % LOVE_QUOTES.length)}><ChevronLeft className="h-5 w-5" /></Button>
          <span className="text-xs tabular-nums text-muted-foreground min-w-[4.5rem]">{quoteIdx + 1} / {LOVE_QUOTES.length}</span>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Next quote" onClick={() => setQuoteIdx((i) => (i + 1) % LOVE_QUOTES.length)}><ChevronRight className="h-5 w-5" /></Button>
        </div>
      </div>
    </section>
  )
}

function StatsBand({ posts }: { posts: number }) {
  const stats = [
    { value: `${posts || '—'}`, label: 'stories shared', icon: MessageCircle },
    { value: '6', label: 'ways to connect', icon: Heart },
    { value: '100%', label: 'anonymous by username', icon: Lock },
    { value: '24/7', label: 'moderated with care', icon: Shield },
  ]
  return (
    <section className="py-12 border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="text-center">
                <Icon className="mx-auto h-5 w-5 text-rose-500 mb-2" />
                <p className="font-display text-3xl md:text-4xl font-bold text-gradient-rose">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  const { navigate, openAuth } = useApp()
  const { user } = useCurrentUser()
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 p-8 md:p-14 text-white shadow-2xl shadow-rose-500/30">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1.5px, transparent 1.5px), radial-gradient(circle at 70% 80%, white 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
          <motion.div animate={{ rotate: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-6 -right-6 text-white/20">
            <Heart className="h-32 w-32 fill-white/10" />
          </motion.div>
          <div className="relative">
            <Star className="h-8 w-8 fill-white/30 text-white mb-3" />
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight max-w-xl">Your heart deserves a softer space to land.</h2>
            <p className="mt-3 text-white/85 max-w-lg">Join a community built on usernames, kindness, and the quiet belief that we heal better together.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {!user ? (
                <Button size="lg" variant="secondary" className="rounded-full h-12 px-7 text-base text-rose-600 hover:bg-white" onClick={() => openAuth('register')}>
                  <Heart className="h-5 w-5 mr-2 fill-rose-500 text-rose-500" /> Join free today
                </Button>
              ) : (
                <Button size="lg" variant="secondary" className="rounded-full h-12 px-7 text-base text-rose-600 hover:bg-white" onClick={() => navigate('community')}>
                  <MessageCircle className="h-5 w-5 mr-2" /> Visit the community
                </Button>
              )}
              <Button size="lg" variant="outline" className="rounded-full h-12 px-6 text-base border-white/40 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('quiz')}>
                Take a love quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
