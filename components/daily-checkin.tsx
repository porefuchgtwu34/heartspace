'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Flame, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { MOOD_OPTIONS } from '@/lib/content'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export function DailyCheckIn() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [today, setToday] = useState<any>(null)
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState<{ day: string; moodScore: number }[]>([])
  const [mood, setMood] = useState('calm')
  const [note, setNote] = useState('')

  useEffect(() => {
    let active = true
    api<any>('/api/checkin?days=14')
      .then((res) => {
        if (!active) return
        setToday(res.today)
        setStreak(res.streak ?? 0)
        setHistory(res.history ?? [])
        if (res.today) {
          setMood(res.today.mood)
          setNote(res.today.note || '')
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  async function save() {
    const opt = MOOD_OPTIONS.find((m) => m.value === mood) || MOOD_OPTIONS[1]
    setSaving(true)
    try {
      const entry = await api('/api/checkin', {
        method: 'POST',
        json: { mood: opt.value, moodScore: opt.score, note: note.trim() || undefined },
      })
      setToday(entry)
      toast.success(today ? 'Check-in updated' : 'Checked in — be gentle with yourself today')
      const res = await api<any>('/api/checkin?days=14')
      setStreak(res.streak ?? 0)
      setHistory(res.history ?? [])
    } catch (e: any) {
      toast.error(e?.message || 'Could not save check-in')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-8 grid place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const maxScore = 10
  const bars = history.slice(-14)

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold">Daily check-in</h3>
            <p className="text-xs text-muted-foreground">One honest mood. That is enough.</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs font-medium">
            <Flame className="h-3.5 w-3.5" /> {streak} day streak
          </div>
        </div>

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
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          placeholder="Optional note (private)"
          rows={2}
        />

        <Button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {today ? 'Update today' : 'Check in'}
        </Button>

        {bars.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Your last {bars.length} check-ins</p>
            <div className="flex items-end gap-1 h-16">
              {bars.map((h) => (
                <div
                  key={h.day}
                  title={`${h.day}: ${h.moodScore}/10`}
                  className="flex-1 rounded-t bg-gradient-to-t from-rose-500 to-fuchsia-400 opacity-80"
                  style={{ height: `${Math.max(8, (h.moodScore / maxScore) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
