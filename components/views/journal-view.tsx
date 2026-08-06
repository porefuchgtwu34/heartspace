'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts'
import { useApp } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, timeAgo } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { MOOD_OPTIONS } from '@/lib/content'
import { GratitudeJar } from '@/components/gratitude-jar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Lock,
  Sparkles,
  Brain,
  Trash2,
  PenLine,
  Heart,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Plus,
  BookHeart,
  Loader2,
  CloudSun,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type JournalEntry = {
  id: string
  mood: string
  moodScore: number
  content: string
  insight: string | null
  tags: string | null
  createdAt: string
}

const MAX_CONTENT = 3000
const SCORE_LABELS: Record<number, string> = {
  1: 'rough',
  2: 'low',
  3: 'heavy',
  4: 'tender',
  5: 'steady',
  6: 'soft',
  7: 'warm',
  8: 'bright',
  9: 'joyful',
  10: 'radiant',
}

function moodMeta(value: string) {
  return MOOD_OPTIONS.find((m) => m.value === value) ?? MOOD_OPTIONS[5]
}

function parseTags(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function JournalView() {
  const { openAuth } = useApp()
  const { user, isLoading: userLoading } = useCurrentUser()

  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<JournalEntry[]>('/api/journal?limit=50')
      setEntries(Array.isArray(data) ? data : [])
    } catch (err: any) {
      // Only toast if it's not an auth error (app-shell will prompt login)
      if (err?.status !== 401) {
        toast.error("Couldn't load your journal.", { description: err?.message })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    load()
  }, [user, load])

  // Stats --------------------------------------------------------------------
  const stats = useMemo(() => {
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const thisWeek = entries.filter((e) => new Date(e.createdAt).getTime() >= weekAgo).length
    const avg =
      entries.length === 0
        ? null
        : entries.reduce((s, e) => s + (e.moodScore || 0), 0) / entries.length
    const counts: Record<string, number> = {}
    for (const e of entries) counts[e.mood] = (counts[e.mood] ?? 0) + 1
    const mostCommon =
      entries.length === 0
        ? null
        : (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null)
    return {
      thisWeek,
      avg: avg == null ? null : Math.round(avg * 10) / 10,
      mostCommon: mostCommon ? moodMeta(mostCommon) : null,
      total: entries.length,
    }
  }, [entries])

  // Save handler -------------------------------------------------------------
  const handleSaved = useCallback((entry: JournalEntry) => {
    setEntries((prev) => [entry, ...prev])
  }, [])

  const handleDeleted = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // Render -------------------------------------------------------------------
  if (userLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
        <JournalSkeleton />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-rose-500/10">
          <BookHeart className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Your private journal</h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Sign in to keep a tender, private record of how your heart moves through the days.
        </p>
        <Button
          className="mt-6 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/30"
          onClick={() => openAuth('login')}
        >
          <Heart className="h-4 w-4 mr-2 fill-white" /> Sign in to journal
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 md:py-12 space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20">
            <Sparkles className="h-3.5 w-3.5" /> Personal space
          </Badge>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Your <span className="text-gradient-rose">mood journal</span>
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          A quiet corner to notice how you feel, name it gently, and watch your emotional weather
          shift over time. Words become insight, one entry at a time.
        </p>
      </motion.header>

      <PrivacyBanner />

      {/* New entry */}
      <NewEntryCard onSaved={handleSaved} disabled={loading} />

      {/* Stats */}
      {entries.length > 0 && <StatsRow stats={stats} />}

      {/* Mood chart */}
      <MoodChart entries={entries} loading={loading} />

      {/* Gratitude jar */}
      <GratitudeJar />

      {/* Entries list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <BookHeart className="h-5 w-5 text-rose-500" /> Past entries
          </h2>
          {entries.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <EntrySkeleton />
            <EntrySkeleton />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDelete={handleDeleted} />
            ))}
          </AnimatePresence>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Privacy banner
// ---------------------------------------------------------------------------

function PrivacyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
    >
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/15">
        <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="text-sm leading-relaxed">
        <span className="font-medium text-emerald-800 dark:text-emerald-300">
          This journal is private.
        </span>{' '}
        <span className="text-muted-foreground">
          Only you can see these entries — not the community, not admins, not anyone else.
        </span>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// New entry card
// ---------------------------------------------------------------------------

function NewEntryCard({
  onSaved,
  disabled,
}: {
  onSaved: (entry: JournalEntry) => void
  disabled?: boolean
}) {
  const [mood, setMood] = useState<string>('')
  const [score, setScore] = useState<number>(5)
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastInsight, setLastInsight] = useState<{ insight: string; mood: string } | null>(null)

  const selectedMood = mood ? moodMeta(mood) : null
  const charsLeft = MAX_CONTENT - content.length

  function selectMood(value: string) {
    const m = moodMeta(value)
    setMood(value)
    setScore(m.score)
  }

  async function save() {
    if (!mood) {
      toast.error('Pick a mood first', { description: 'How are you feeling right now?' })
      return
    }
    if (!content.trim()) {
      toast.error('Write a few words', { description: 'Even one sentence is enough to begin.' })
      return
    }
    setSaving(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .join(',')
      const created = await api<JournalEntry>('/api/journal', {
        method: 'POST',
        json: { mood, moodScore: score, content: content.trim(), tags: tags || null },
      })
      onSaved(created)
      setLastInsight({ insight: created.insight ?? '', mood })
      // reset
      setContent('')
      setTagsInput('')
      setMood('')
      setScore(5)
      toast.success('Entry saved', { description: 'Your reflection is below.' })
    } catch (err: any) {
      toast.error("Couldn't save entry", { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="relative overflow-hidden border-rose-500/20 shadow-lg shadow-rose-500/5">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/5 via-fuchsia-500/5 to-amber-500/5" />
      <CardHeader className="relative">
        <CardTitle className="font-display flex items-center gap-2 text-xl">
          <PenLine className="h-5 w-5 text-rose-500" /> New entry
        </CardTitle>
        <CardDescription>
          How is your heart today? Pick a mood, set a number, and let the words come.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Mood picker */}
        <div className="space-y-2.5">
          <label className="text-sm font-medium">Mood</label>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((m) => {
              const active = m.value === mood
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => selectMood(m.value)}
                  className={cn(
                    'group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                    active
                      ? 'border-transparent text-white shadow-md'
                      : 'border-border bg-background hover:border-rose-500/40 hover:bg-rose-500/5'
                  )}
                  style={
                    active
                      ? { backgroundColor: m.color, boxShadow: `0 6px 16px -6px ${m.color}80` }
                      : undefined
                  }
                >
                  <span className="text-base leading-none">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mood score slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Mood score</label>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={score}
                initial={{ scale: 0.85, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="font-display text-2xl font-bold text-gradient-rose"
              >
                {score}
              </motion.span>
              <span className="text-xs text-muted-foreground lowercase tracking-wide">
                {SCORE_LABELS[score] ?? ''}
              </span>
            </div>
          </div>
          <Slider
            value={[score]}
            min={1}
            max={10}
            step={1}
            onValueChange={(v) => setScore(v[0] ?? 5)}
            className={cn(
              'py-1 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-rose-500 [&_[data-slot=slider-range]]:to-fuchsia-500',
              '[&_[data-slot=slider-thumb]]:border-rose-500 [&_[data-slot=slider-thumb]]:bg-white'
            )}
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>1 · rough</span>
            <span>5 · steady</span>
            <span>10 · radiant</span>
          </div>
        </div>

        {/* Content textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">What's on your mind?</label>
            <span
              className={cn(
                'text-[11px] tabular-nums',
                charsLeft < 100 ? 'text-rose-500' : 'text-muted-foreground'
              )}
            >
              {content.length}/{MAX_CONTENT}
            </span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
            placeholder="Today I noticed…  — write whatever feels true. No editing, no audience."
            className="min-h-32 resize-y leading-relaxed"
            maxLength={MAX_CONTENT}
          />
        </div>

        {/* Tags input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Tags <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="work, partner, sleep, body…  (comma-separated)"
          />
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            We'll generate a gentle reflection when you save.
          </p>
          <Button
            onClick={save}
            disabled={saving || disabled}
            className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/30 hover:from-rose-600 hover:to-fuchsia-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> Save entry
              </>
            )}
          </Button>
        </div>

        {/* Insight callout after save */}
        <AnimatePresence>
          {lastInsight && (
            <motion.div
              key={lastInsight.insight}
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <div className="relative rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-fuchsia-500/5 to-amber-500/10 p-4">
                <div className="pointer-events-none absolute -top-6 -right-6 text-rose-500/10">
                  <Brain className="h-20 w-20" />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-300">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Your reflection
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                    {lastInsight.insight}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setLastInsight(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Mood chart
// ---------------------------------------------------------------------------

function MoodChart({ entries, loading }: { entries: JournalEntry[]; loading: boolean }) {
  const data = useMemo(() => {
    // entries are newest-first; reverse so newest is on the right
    return entries
      .slice(0, 14)
      .reverse()
      .map((e, i) => {
        const d = new Date(e.createdAt)
        return {
          idx: i,
          label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: e.moodScore,
          mood: e.mood,
        }
      })
  }, [entries])

  return (
    <Card className="overflow-hidden border-fuchsia-500/15">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2 text-lg">
          <CloudSun className="h-5 w-5 text-fuchsia-500" /> Your emotional weather
        </CardTitle>
        <CardDescription>
          A soft line of how you've felt across recent entries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-44 w-full rounded-xl" />
        ) : data.length < 2 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rose-500/20 bg-rose-500/5 py-10 px-4 text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10">
              <Sparkles className="h-6 w-6 text-rose-500" />
            </div>
            <p className="font-medium">Journal a little more to see your weather pattern.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Two entries will draw the first gentle line.
            </p>
          </div>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="moodStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 15)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'oklch(0.55 0.02 15)' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={12}
                />
                <YAxis
                  domain={[1, 10]}
                  ticks={[1, 5, 10]}
                  tick={{ fontSize: 11, fill: 'oklch(0.55 0.02 15)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: '#ec4899', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid oklch(0.9 0.05 350)',
                    background: 'oklch(0.99 0.01 15)',
                    boxShadow: '0 8px 24px -8px rgba(236, 72, 153, 0.35)',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'oklch(0.45 0.02 15)', fontWeight: 600 }}
                  formatter={(value: any) => [
                    `${value} / 10  ·  ${SCORE_LABELS[Number(value)] ?? ''}`,
                    'Mood',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="url(#moodStroke)"
                  strokeWidth={2.5}
                  fill="url(#moodFill)"
                  dot={{ r: 3, fill: '#ec4899', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Stats row
// ---------------------------------------------------------------------------

function StatsRow({
  stats,
}: {
  stats: {
    thisWeek: number
    avg: number | null
    mostCommon: { label: string; emoji: string; color: string } | null
    total: number
  }
}) {
  const items = [
    {
      icon: CalendarDays,
      label: 'this week',
      value: String(stats.thisWeek),
      tint: 'text-rose-500 bg-rose-500/10',
    },
    {
      icon: TrendingUp,
      label: 'average mood',
      value: stats.avg == null ? '—' : stats.avg.toFixed(1),
      tint: 'text-fuchsia-500 bg-fuchsia-500/10',
    },
    {
      icon: BarChart3,
      label: 'most common',
      value: stats.mostCommon ? `${stats.mostCommon.emoji} ${stats.mostCommon.label}` : '—',
      tint: 'text-amber-500 bg-amber-500/10',
    },
  ]
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="py-3 gap-2">
              <CardContent className="px-3">
                <div className={cn('mb-2 grid h-7 w-7 place-items-center rounded-lg', it.tint)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="font-display text-lg font-bold leading-none truncate">
                  {it.value}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground lowercase truncate">
                  {it.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-dashed border-rose-500/25 bg-gradient-to-br from-rose-500/5 via-fuchsia-500/5 to-amber-500/5 p-10 text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white dark:bg-rose-950 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/10"
      >
        <Heart className="h-7 w-7 text-rose-500 fill-rose-500/20" />
      </motion.div>
      <h3 className="font-display text-xl font-semibold">Your first page is waiting.</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
        There's no wrong way to start. A single honest sentence is enough. Your future self will be
        glad you wrote it down.
      </p>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Entry card
// ---------------------------------------------------------------------------

function EntryCard({
  entry,
  onDelete,
}: {
  entry: JournalEntry
  onDelete: (id: string) => void
}) {
  const meta = moodMeta(entry.mood)
  const tags = parseTags(entry.tags)
  const [deleting, setDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function confirmDelete() {
    setDeleting(true)
    try {
      await api(`/api/journal?id=${encodeURIComponent(entry.id)}`, { method: 'DELETE' })
      onDelete(entry.id)
      toast.success('Entry removed', { description: 'Your journal has been updated.' })
      setDialogOpen(false)
    } catch (err: any) {
      toast.error("Couldn't delete entry", { description: err?.message })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="group relative overflow-hidden border-border/60 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
        {/* top mood strip */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}40)` }}
        />
        <CardContent className="pt-5 space-y-3">
          {/* header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="grid h-9 w-9 place-items-center rounded-xl text-lg"
                style={{ backgroundColor: `${meta.color}1a` }}
              >
                {meta.emoji}
              </div>
              <div>
                <p className="font-medium leading-tight" style={{ color: meta.color }}>
                  {meta.label}
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MoodScoreBar score={entry.moodScore} color={meta.color} />
              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-500/10"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This can't be undone. The words and their reflection will be gone for good.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmDelete}
                      disabled={deleting}
                      className="bg-rose-500 hover:bg-rose-600 text-white"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting…
                        </>
                      ) : (
                        <>Delete</>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* content */}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {entry.content}
          </p>

          {/* tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, i) => (
                <Badge
                  key={`${t}-${i}`}
                  variant="secondary"
                  className="text-[10px] font-normal bg-rose-500/10 text-rose-700 dark:text-rose-300 border-transparent"
                >
                  #{t}
                </Badge>
              ))}
            </div>
          )}

          {/* insight */}
          {entry.insight && (
            <div className="mt-2 rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-fuchsia-500/5 to-amber-500/5 px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Reflection
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
                {entry.insight}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.article>
  )
}

function MoodScoreBar({ score, color }: { score: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100))
  return (
    <div
      className="hidden sm:flex items-center gap-1.5"
      title={`Mood score: ${score}/10`}
    >
      <div className="relative h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
        {score}
        <span className="text-muted-foreground/60">/10</span>
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function EntrySkeleton() {
  return (
    <Card className="py-5">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-2.5 w-12 rounded-full" />
          </div>
          <div className="ml-auto">
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-11/12 rounded-full" />
        <Skeleton className="h-3 w-3/4 rounded-full" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </CardContent>
    </Card>
  )
}

function JournalSkeleton() {
  return (
    <div className="space-y-8 py-4">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-10 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-5/6 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Card className="py-6">
        <CardContent className="space-y-5">
          <Skeleton className="h-5 w-24 rounded" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </CardContent>
      </Card>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  )
}
