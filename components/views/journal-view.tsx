'use client'

import { DailyCheckIn } from '@/components/daily-checkin'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { BookHeart, Loader2, TrendingUp } from 'lucide-react'

export function JournalView() {
  const { openAuth } = useApp()
  const { user, isLoading } = useCurrentUser()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mood, setMood] = useState('calm')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await api<any>('/api/journal')
      setEntries(Array.isArray(res) ? res : res.entries || [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const chartData = useMemo(() => {
    return [...entries]
      .slice()
      .reverse()
      .slice(-14)
      .map((e) => ({
        date: new Date(e.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        score: e.moodScore ?? 5,
      }))
  }, [entries])

  async function saveEntry() {
    if (!content.trim()) {
      toast.error('Write a few words first')
      return
    }
    const opt = MOOD_OPTIONS.find((m) => m.value === mood) || MOOD_OPTIONS[1]
    setSaving(true)
    try {
      await api('/api/journal', {
        method: 'POST',
        json: { mood: opt.value, moodScore: opt.score, content: content.trim() },
      })
      setContent('')
      toast.success('Saved to your journal')
      load()
    } catch (e: any) {
      toast.error(e?.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <BookHeart className="mx-auto h-10 w-10 text-rose-500 mb-3" />
        <h2 className="font-display text-2xl font-semibold">Your private journal</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Sign in to check in and track how your heart is doing.
        </p>
        <Button className="mt-6 rounded-full" onClick={() => openAuth('login')}>
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 md:py-12 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Journal</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mood check-ins, notes, and the weather of your heart.
        </p>
      </div>

      <DailyCheckIn />

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-rose-500" /> Mood trend
          </CardTitle>
          <CardDescription>Last journal entries</CardDescription>
        </CardHeader>
        <CardContent className="h-48">
          {chartData.length < 2 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Add a few entries to see your chart.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#f43f5e"
                  fill="#f43f5e33"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">New entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium border transition',
                  mood === m.value
                    ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white border-transparent'
                    : 'bg-background border-border/60 hover:bg-muted'
                )}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 4000))}
            rows={4}
            placeholder="What is sitting with you today?"
          />
          <Button
            onClick={saveEntry}
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save entry
          </Button>
        </CardContent>
      </Card>

      <GratitudeJar />

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">Recent entries</h3>
        {loading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        ) : (
          entries.slice(0, 20).map((e) => (
            <Card key={e.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{e.mood}</span>
                  <span>{timeAgo(e.createdAt)}</span>
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{e.content}</p>
                {e.insight && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{e.insight}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
