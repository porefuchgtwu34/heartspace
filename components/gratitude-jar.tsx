'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, Plus, Trash2, Sparkles, X, TrendingUp } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, timeAgo } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Entry = { id: string; content: string; category: string; createdAt: string }

const CATEGORIES = [
  { value: 'person', label: 'A person', emoji: '🫶' },
  { value: 'moment', label: 'A moment', emoji: '✨' },
  { value: 'self', label: 'Myself', emoji: '🌱' },
  { value: 'general', label: 'Something else', emoji: '💛' },
]

const PROMPTS = [
  'One tiny thing that made today softer…',
  'Someone who showed up for you recently…',
  'A strength you noticed in yourself this week…',
  'A small beauty you almost walked past…',
  'A conversation that left you warmer…',
]

export function GratitudeJar() {
  const { user } = useCurrentUser()
  const [entries, setEntries] = useState<Entry[]>([])
  const [stats, setStats] = useState({ total: 0, thisWeek: 0 })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [saving, setSaving] = useState(false)
  const [promptIdx, setPromptIdx] = useState(0)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let active = true
    api<{ entries: Entry[]; stats: { total: number; thisWeek: number } }>('/api/gratitude')
      .then((res) => {
        if (!active) return
        setEntries(res.entries)
        setStats(res.stats)
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user])

  async function save() {
    if (!content.trim()) {
      toast.error('Name one thing.')
      return
    }
    setSaving(true)
    try {
      const entry = await api<Entry>('/api/gratitude', {
        method: 'POST',
        json: { content: content.trim(), category },
      })
      setEntries((e) => [entry, ...e])
      setStats((s) => ({ total: s.total + 1, thisWeek: s.thisWeek + 1 }))
      setContent('')
      setCategory('general')
      setOpen(false)
      setPromptIdx((i) => (i + 1) % PROMPTS.length)
      toast.success('Added to your jar 🌟')
    } catch (err: any) {
      toast.error(err.message || 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/gratitude?id=${id}`, { method: 'DELETE' })
      setEntries((e) => e.filter((x) => x.id !== id))
      setStats((s) => ({ total: Math.max(0, s.total - 1), thisWeek: Math.max(0, s.thisWeek - 1) }))
    } catch {
      toast.error('Could not remove.')
    }
  }

  return (
    <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />
      <CardContent className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
              <Cookie className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold leading-tight">Gratitude Jar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Small things, named often, change everything.</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/30"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <Sparkles className="h-3 w-3" /> {stats.total} {stats.total === 1 ? 'note' : 'notes'} collected
          </Badge>
          {stats.thisWeek > 0 && (
            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-3 w-3" /> {stats.thisWeek} this week
            </Badge>
          )}
        </div>

        {/* Entries */}
        {loading ? (
          <div className="mt-4 grid gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 shimmer rounded-xl" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-amber-500/30 p-6 text-center">
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-2"
            >
              <Cookie className="h-8 w-8 text-amber-500/50" />
            </motion.div>
            <p className="text-sm text-muted-foreground">Your jar is empty. Drop in your first note of thanks.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-2 max-h-[360px] overflow-y-auto scroll-soft pr-1">
            <AnimatePresence initial={false}>
              {entries.map((e) => {
                const cat = CATEGORIES.find((c) => c.value === e.category) ?? CATEGORIES[3]
                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, height: 0 }}
                    className="group flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/80 p-3 hover:border-amber-500/40 transition-colors"
                  >
                    <span className="text-lg leading-none mt-0.5">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{e.content}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(e.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => remove(e.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      {/* Composer dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-card border border-border/60 shadow-2xl overflow-hidden"
            >
              <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
                <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <Cookie className="h-5 w-5" />
                  <h3 className="font-display text-lg font-semibold">Add to your jar</h3>
                </div>
                <p className="mt-1 text-sm text-white/85">{PROMPTS[promptIdx]}</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                        category === c.value
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                          : 'bg-muted text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700'
                      )}
                    >
                      <span>{c.emoji}</span> {c.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  autoFocus
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="I'm grateful for…"
                  rows={3}
                  maxLength={280}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{content.length}/280</span>
                  <Button
                    onClick={save}
                    disabled={!content.trim() || saving}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" /> Drop it in
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
