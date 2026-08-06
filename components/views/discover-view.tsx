'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useApp } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, avatarGradient } from '@/lib/api'
import { UserAvatar } from '@/components/user-avatar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { DATING_PROMPTS, INTEREST_OPTIONS } from '@/lib/content'
import {
  Heart,
  X,
  MapPin,
  Sparkles,
  MessageCircle,
  RefreshCw,
  Users,
  Flame,
} from 'lucide-react'

type Direction = 'left' | 'right'

interface Candidate {
  id: string
  username: string
  bio?: string | null
  avatarUrl?: string | null
  age?: number | null
  location?: string | null
  interests?: string[] | null
  lookingFor?: string | null
}

interface MatchUser {
  id: string
  username: string
  avatarUrl?: string | null
  bio?: string | null
  interests?: string[] | null
}

const SWIPE_THRESHOLD = 100
const SWIPE_VELOCITY = 500

export function DiscoverView() {
  const { navigate } = useApp()
  const { user, isLoading } = useCurrentUser()

  const [tab, setTab] = useState<'discover' | 'matches'>('discover')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [matches, setMatches] = useState<MatchUser[]>([])
  const [loadingDeck, setLoadingDeck] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [direction, setDirection] = useState<Direction>('right')
  const [swiping, setSwiping] = useState(false)
  const [matchCelebrate, setMatchCelebrate] = useState<MatchUser | null>(null)
  const [promptIdx, setPromptIdx] = useState(0)

  // Rotate the dating-prompt tip below the deck
  useEffect(() => {
    const id = setInterval(
      () => setPromptIdx((i) => (i + 1) % DATING_PROMPTS.length),
      7000
    )
    return () => clearInterval(id)
  }, [])

  const loadDeck = useCallback(async () => {
    setLoadingDeck(true)
    try {
      const data = await api<Candidate[]>('/api/matches?limit=10')
      setCandidates(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.error(e?.message || 'Could not load candidates.')
    } finally {
      setLoadingDeck(false)
    }
  }, [])

  const loadMatches = useCallback(async () => {
    setLoadingMatches(true)
    try {
      const data = await api<{ matches: MatchUser[] }>('/api/matches/swipe')
      setMatches(Array.isArray(data?.matches) ? data.matches : [])
    } catch {
      /* silent */
    } finally {
      setLoadingMatches(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadDeck()
      loadMatches()
    }
  }, [user, loadDeck, loadMatches])

  const performSwipe = useCallback(
    (targetId: string, action: 'like' | 'pass') => {
      api<{ matched: boolean; matchUser?: MatchUser }>(
        '/api/matches/swipe',
        { method: 'POST', json: { targetId, action } }
      )
        .then((res) => {
          if (res?.matched && res.matchUser) {
            setMatchCelebrate(res.matchUser)
            loadMatches()
          }
        })
        .catch((err) => {
          toast.error(err?.message || 'Swipe failed.')
        })
    },
    [loadMatches]
  )

  const handleSwipe = useCallback(
    (dir: Direction) => {
      if (swiping || candidates.length === 0) return
      const top = candidates[0]
      setDirection(dir)
      setSwiping(true)
      performSwipe(top.id, dir === 'right' ? 'like' : 'pass')
      // Defer removal to next frame so AnimatePresence reads the fresh
      // `direction` value when computing the exit animation.
      requestAnimationFrame(() => {
        setCandidates((prev) => prev.slice(1))
        window.setTimeout(() => setSwiping(false), 380)
      })
    },
    [swiping, candidates, performSwipe]
  )

  // Keyboard support: ← = pass, → = like
  useEffect(() => {
    if (tab !== 'discover') return
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      )
        return
      if (candidates.length === 0 || swiping) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleSwipe('left')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleSwipe('right')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, candidates.length, swiping, handleSwipe])

  return (
    <div className="relative min-h-[calc(100vh-7rem)] pb-20">
      {/* Ambient warm backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-rose-500/10 via-fuchsia-500/5 to-background" />
      <div
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(50% 40% at 80% 0%, oklch(0.85 0.12 350 / 0.18), transparent), radial-gradient(40% 40% at 10% 30%, oklch(0.85 0.1 60 / 0.16), transparent)',
        }}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 md:pt-14">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge
            variant="secondary"
            className="mb-3 gap-1.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 px-3 py-1"
          >
            <Flame className="h-3.5 w-3.5" /> Discover
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Find kindred <span className="text-gradient-rose">hearts.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Swipe kindly — every like is a small act of hope.
          </p>
        </div>

        {/* Tab segment */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 rounded-full bg-muted/70 p-1 ring-1 ring-border/60 shadow-sm">
            <TabButton
              active={tab === 'discover'}
              onClick={() => setTab('discover')}
              icon={Flame}
              label="Discover"
            />
            <TabButton
              active={tab === 'matches'}
              onClick={() => setTab('matches')}
              icon={Heart}
              label={`Matches${matches.length ? ` (${matches.length})` : ''}`}
            />
          </div>
        </div>

        {tab === 'discover' ? (
          <DiscoverTab
            candidates={candidates}
            loading={loadingDeck || isLoading}
            direction={direction}
            onSwipe={handleSwipe}
            swiping={swiping}
            onReload={loadDeck}
            onViewMatches={() => setTab('matches')}
            promptIdx={promptIdx}
          />
        ) : (
          <MatchesTab
            matches={matches}
            loading={loadingMatches}
            onMessage={(uid) => navigate('messages', { with: uid })}
            onDiscover={() => setTab('discover')}
          />
        )}
      </div>

      {/* Match celebration modal */}
      <Dialog
        open={!!matchCelebrate}
        onOpenChange={(o) => !o && setMatchCelebrate(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-md overflow-hidden border-0 p-0"
        >
          <DialogTitle className="sr-only">It's a match!</DialogTitle>
          <DialogDescription className="sr-only">
            You and the other person both liked each other.
          </DialogDescription>
          {matchCelebrate && (
            <MatchCelebration
              meUsername={user?.username}
              matchUser={matchCelebrate}
              onSayHello={() => {
                const uid = matchCelebrate.id
                setMatchCelebrate(null)
                navigate('messages', { with: uid })
              }}
              onKeepSwiping={() => setMatchCelebrate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------ Tab Button ------------------------------ */

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full px-4 sm:px-5 py-2 text-sm font-medium transition-colors',
        active ? 'text-white' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {active && (
        <motion.span
          layoutId="discover-tab-pill"
          className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 shadow-md shadow-rose-500/30"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

/* ----------------------------- Discover Tab ----------------------------- */

function DiscoverTab({
  candidates,
  loading,
  direction,
  onSwipe,
  swiping,
  onReload,
  onViewMatches,
  promptIdx,
}: {
  candidates: Candidate[]
  loading: boolean
  direction: Direction
  onSwipe: (dir: Direction) => void
  swiping: boolean
  onReload: () => void
  onViewMatches: () => void
  promptIdx: number
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <DeckSkeleton />
        <ActionButtons disabled onPass={() => {}} onLike={() => {}} />
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <EmptyDeck
        onReload={onReload}
        onViewMatches={onViewMatches}
        promptIdx={promptIdx}
      />
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[360px] h-[500px] sm:h-[540px]">
        <AnimatePresence>
          {candidates.slice(0, 3).map((c, i) => (
            <SwipeCard
              key={c.id}
              candidate={c}
              isTop={i === 0}
              index={i}
              direction={direction}
              onSwipe={onSwipe}
            />
          ))}
        </AnimatePresence>
      </div>

      <ActionButtons
        disabled={swiping || candidates.length === 0}
        onPass={() => onSwipe('left')}
        onLike={() => onSwipe('right')}
      />

      <PromptTip promptIdx={promptIdx} />
    </div>
  )
}

/* ------------------------------ Swipe Card ------------------------------ */

function SwipeCard({
  candidate,
  isTop,
  index,
  direction,
  onSwipe,
}: {
  candidate: Candidate
  isTop: boolean
  index: number
  direction: Direction
  onSwipe: (dir: Direction) => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-16, 16])
  const likeOpacity = useTransform(x, [20, 110], [0, 1])
  const nopeOpacity = useTransform(x, [-110, -20], [1, 0])

  const stackScale = 1 - index * 0.05
  const stackY = index * 14
  const stackOpacity = index === 0 ? 1 : index === 1 ? 0.7 : 0.35

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      dragMomentum={false}
      style={{ x, rotate, zIndex: 10 - index }}
      initial={{ scale: stackScale, y: stackY, opacity: stackOpacity }}
      animate={{ scale: stackScale, y: stackY, opacity: stackOpacity }}
      exit={{
        x: direction === 'right' ? 480 : -480,
        rotate: direction === 'right' ? 26 : -26,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeIn' },
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      onDragEnd={(_, info) => {
        if (
          info.offset.x > SWIPE_THRESHOLD ||
          info.velocity.x > SWIPE_VELOCITY
        ) {
          onSwipe('right')
        } else if (
          info.offset.x < -SWIPE_THRESHOLD ||
          info.velocity.x < -SWIPE_VELOCITY
        ) {
          onSwipe('left')
        }
      }}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl bg-card shadow-2xl shadow-rose-900/10 ring-1 ring-rose-500/10">
        {/* LIKE / NOPE stamps */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-6 left-6 z-20 -rotate-12 rounded-xl border-4 border-emerald-400 px-4 py-1.5 font-display text-2xl font-extrabold tracking-wider text-emerald-500"
            >
              LIKE
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-6 right-6 z-20 rotate-12 rounded-xl border-4 border-rose-400 px-4 py-1.5 font-display text-2xl font-extrabold tracking-wider text-rose-500"
            >
              NOPE
            </motion.div>
          </>
        )}

        {/* Gradient header */}
        <div
          className={cn(
            'relative h-44 shrink-0 bg-gradient-to-br',
            avatarGradient(candidate.username)
          )}
        >
          {candidate.avatarUrl && (
            <img
              src={candidate.avatarUrl}
              alt={candidate.username}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {candidate.lookingFor && (
            <div className="absolute top-3 right-3">
              <Badge className="border-0 bg-white/90 text-rose-700 shadow-sm hover:bg-white/90">
                <Sparkles className="mr-1 h-3 w-3" /> {candidate.lookingFor}
              </Badge>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="relative -mt-12 flex flex-1 flex-col px-5 pb-5">
          <div className="flex items-end justify-between">
            <div className="rounded-full ring-4 ring-card">
              <UserAvatar
                username={candidate.username}
                avatarUrl={candidate.avatarUrl}
                size="xl"
              />
            </div>
            {candidate.age != null && (
              <div className="mb-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                {candidate.age} yrs
              </div>
            )}
          </div>

          <div className="mt-3">
            <h3 className="font-display text-xl font-semibold leading-tight">
              @{candidate.username}
            </h3>
            {candidate.location && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" /> {candidate.location}
              </p>
            )}
          </div>

          {candidate.bio && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/80">
              {candidate.bio}
            </p>
          )}

          {candidate.interests && candidate.interests.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
              {candidate.interests.slice(0, 6).map((it) => (
                <Badge
                  key={it}
                  variant="secondary"
                  className="text-[11px] font-medium"
                >
                  {it}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ---------------------------- Action Buttons ---------------------------- */

function ActionButtons({
  disabled,
  onPass,
  onLike,
}: {
  disabled: boolean
  onPass: () => void
  onLike: () => void
}) {
  return (
    <div className="mt-8 flex items-center gap-6">
      <button
        onClick={onPass}
        disabled={disabled}
        aria-label="Pass"
        className="group grid h-16 w-16 place-items-center rounded-full bg-card text-rose-500 shadow-lg shadow-rose-500/10 ring-2 ring-rose-200 transition-all hover:scale-105 hover:ring-rose-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <X className="h-7 w-7 transition-transform group-hover:scale-110" />
      </button>
      <button
        onClick={onLike}
        disabled={disabled}
        aria-label="Like"
        className="group grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white shadow-xl shadow-rose-500/40 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Heart className="h-9 w-9 fill-white transition-transform group-hover:scale-110 heartbeat" />
      </button>
    </div>
  )
}

/* ----------------------------- Prompt Tip ------------------------------ */

function PromptTip({ promptIdx }: { promptIdx: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={promptIdx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }}
        className="mx-auto mt-8 max-w-md text-center"
      >
        <p className="mb-1.5 text-xs uppercase tracking-wider text-muted-foreground/70">
          If you match, try asking
        </p>
        <p className="text-sm italic text-foreground/80">
          “{DATING_PROMPTS[promptIdx]}”
        </p>
      </motion.div>
    </AnimatePresence>
  )
}

/* ----------------------------- Empty Deck ------------------------------ */

function EmptyDeck({
  onReload,
  onViewMatches,
  promptIdx,
}: {
  onReload: () => void
  onViewMatches: () => void
  promptIdx: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md py-6 text-center"
    >
      <div className="relative mx-auto mb-6 h-32 w-32">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400/30 to-fuchsia-500/30 blur-2xl" />
        <div className="relative grid h-full w-full place-items-center rounded-full bg-card shadow-xl ring-1 ring-rose-500/20">
          <Heart className="h-14 w-14 fill-rose-500/20 text-rose-500" />
        </div>
      </div>

      <h3 className="font-display text-2xl font-semibold">
        You've seen everyone for now
      </h3>
      <p className="mt-2 text-muted-foreground">
        Come back soon — new hearts join every day. 💛
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">
          People you'll vibe with often share:
        </span>
        {INTEREST_OPTIONS.slice(0, 6).map((it) => (
          <Badge key={it} variant="outline" className="text-[11px]">
            {it}
          </Badge>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" className="rounded-full" onClick={onReload}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
        <Button
          className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white hover:from-rose-600 hover:to-fuchsia-700"
          onClick={onViewMatches}
        >
          <Heart className="mr-2 h-4 w-4 fill-white" /> View matches
        </Button>
      </div>

      <div className="mt-8 rounded-2xl bg-muted/60 p-4 text-left">
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          While you wait, a prompt to sit with:
        </p>
        <p className="text-sm italic text-foreground/80">
          “{DATING_PROMPTS[promptIdx]}”
        </p>
      </div>
    </motion.div>
  )
}

/* ---------------------------- Deck Skeleton ---------------------------- */

function DeckSkeleton() {
  return (
    <div className="relative h-[500px] w-full max-w-[360px] sm:h-[540px]">
      {[2, 1, 0].map((i) => (
        <div
          key={i}
          className="absolute inset-0 overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border"
          style={{
            transform: `scale(${1 - i * 0.05}) translateY(${i * 14}px)`,
            opacity: i === 0 ? 1 : i === 1 ? 0.6 : 0.3,
            zIndex: 10 - i,
          }}
        >
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <div className="flex items-end gap-3">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-14 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------ Matches Tab ----------------------------- */

function MatchesTab({
  matches,
  loading,
  onMessage,
  onDiscover,
}: {
  matches: MatchUser[]
  loading: boolean
  onMessage: (uid: string) => void
  onDiscover: () => void
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-border/60">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="mt-3 h-8 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md py-6 text-center"
      >
        <div className="relative mx-auto mb-5 h-28 w-28">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-400/30 to-rose-500/30 blur-2xl" />
          <div className="relative grid h-full w-full place-items-center rounded-full bg-card shadow-xl ring-1 ring-fuchsia-500/20">
            <Users className="h-12 w-12 text-fuchsia-500" />
          </div>
        </div>
        <h3 className="font-display text-2xl font-semibold">No matches yet</h3>
        <p className="mt-2 text-muted-foreground">
          Start swiping in Discover — when someone likes you back, they'll
          appear here. 💞
        </p>
        <Button
          className="mt-6 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white hover:from-rose-600 hover:to-fuchsia-700"
          onClick={onDiscover}
        >
          <Flame className="mr-2 h-4 w-4" /> Go discover
        </Button>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{matches.length}</span>{' '}
          mutual {matches.length === 1 ? 'match' : 'matches'}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="group h-full border-border/60 transition-all hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    username={m.username}
                    avatarUrl={m.avatarUrl}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="truncate font-display font-semibold">
                        @{m.username}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-rose-500/10 text-[10px] text-rose-700 dark:text-rose-300"
                      >
                        <Heart className="h-2.5 w-2.5 fill-current" /> Match
                      </Badge>
                    </div>
                    {m.bio && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {m.bio}
                      </p>
                    )}
                  </div>
                </div>

                {m.interests && m.interests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.interests.slice(0, 3).map((it) => (
                      <Badge
                        key={it}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {it}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  size="sm"
                  className="mt-4 w-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white hover:from-rose-600 hover:to-fuchsia-700"
                  onClick={() => onMessage(m.id)}
                >
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Message
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------ Match Celebration Modal ---------------------- */

function MatchCelebration({
  meUsername,
  matchUser,
  onSayHello,
  onKeepSwiping,
}: {
  meUsername?: string
  matchUser: MatchUser
  onSayHello: () => void
  onKeepSwiping: () => void
}) {
  return (
    <div className="relative overflow-hidden">
      {/* gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, white 1.5px, transparent 1.5px), radial-gradient(circle at 70% 80%, white 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* floating hearts */}
      <FloatingHeart className="left-6 top-6" delay={0} />
      <FloatingHeart className="right-8 top-10" delay={0.4} />
      <FloatingHeart className="bottom-24 left-10" delay={0.8} />
      <FloatingHeart className="bottom-28 right-6" delay={1.2} />

      <div className="relative px-6 pb-7 pt-10 text-center text-white">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.05 }}
          className="mx-auto mb-3"
        >
          <Heart className="h-12 w-12 fill-white/30 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-display text-3xl font-bold"
        >
          It's a match! 💞
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-1 text-sm text-white/90"
        >
          You and @{matchUser.username} both liked each other.
        </motion.p>

        {/* Two avatars overlapping */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 14 }}
          className="mt-7 flex items-center justify-center"
        >
          <div className="rounded-full shadow-lg ring-4 ring-white/40">
            {meUsername ? (
              <UserAvatar username={meUsername} size="xl" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white/30">
                <Heart className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <div className="-ml-6 rounded-full shadow-lg ring-4 ring-white/40">
            <UserAvatar
              username={matchUser.username}
              avatarUrl={matchUser.avatarUrl}
              size="xl"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col gap-2"
        >
          <Button
            size="lg"
            className="w-full rounded-full bg-white text-rose-600 shadow-lg hover:bg-white/90"
            onClick={onSayHello}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Say hello
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-full border-white/40 text-white hover:bg-white/10 hover:text-white"
            onClick={onKeepSwiping}
          >
            Keep swiping
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

function FloatingHeart({
  className,
  delay,
}: {
  className?: string
  delay: number
}) {
  return (
    <motion.div
      className={cn('pointer-events-none absolute', className)}
      initial={{ opacity: 0, y: 0, scale: 0.6 }}
      animate={{
        opacity: [0, 1, 0],
        y: [-10, -40],
        scale: [0.6, 1, 0.8],
      }}
      transition={{ duration: 2.6, repeat: Infinity, delay, ease: 'easeOut' }}
    >
      <Heart className="h-5 w-5 fill-white/40 text-white" />
    </motion.div>
  )
}
