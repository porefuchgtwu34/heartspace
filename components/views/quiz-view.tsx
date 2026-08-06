'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  History,
  Loader2,
  Lock,
  Quote,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react'

import { useApp } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, timeAgo } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ATTACHMENT_QUIZ,
  ATTACHMENT_RESULTS,
  LOVE_LANGUAGE_QUIZ,
  LOVE_LANGUAGE_RESULTS,
  LOVE_QUOTES,
} from '@/lib/content'

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

type ResultEntry = { label: string; emoji: string; description: string }

interface UnifiedQuestion {
  id: number
  text: string
  options: { text: string; key: string }[]
}

interface UnifiedQuiz {
  id: string
  title: string
  subtitle: string
  kind: 'lang' | 'style'
  emoji: string
  tagline: string
  accent: {
    gradient: string
    ring: string
    chipBg: string
    chipText: string
    iconBg: string
    glow: string
    bar: string
  }
  questions: UnifiedQuestion[]
  results: Record<string, ResultEntry>
}

interface PastResult {
  id: string
  quizType: string
  score: number
  result: string
  description: string | null
  createdAt: string
}

interface QuizResult {
  key: string
  label: string
  emoji: string
  description: string
  count: number
  total: number
  counts: Record<string, number>
}

/* ------------------------------------------------------------------ *
 * Quiz catalog — normalize the two content quizzes into one shape
 * ------------------------------------------------------------------ */

const QUIZZES: UnifiedQuiz[] = [
  {
    id: LOVE_LANGUAGE_QUIZ.id,
    title: LOVE_LANGUAGE_QUIZ.title,
    subtitle: LOVE_LANGUAGE_QUIZ.subtitle,
    kind: 'lang',
    emoji: '💞',
    tagline: '5 questions · about 2 minutes',
    accent: {
      gradient: 'from-rose-500/20 via-pink-500/10 to-fuchsia-500/5',
      ring: 'hover:border-rose-500/40',
      chipBg: 'bg-rose-500/10',
      chipText: 'text-rose-700 dark:text-rose-300',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
      glow: 'shadow-rose-500/30',
      bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
    },
    questions: LOVE_LANGUAGE_QUIZ.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options.map((o) => ({ text: o.text, key: o.lang })),
    })),
    results: LOVE_LANGUAGE_RESULTS,
  },
  {
    id: ATTACHMENT_QUIZ.id,
    title: ATTACHMENT_QUIZ.title,
    subtitle: ATTACHMENT_QUIZ.subtitle,
    kind: 'style',
    emoji: '🧠',
    tagline: '4 questions · about 2 minutes',
    accent: {
      gradient: 'from-fuchsia-500/20 via-purple-500/10 to-rose-500/5',
      ring: 'hover:border-fuchsia-500/40',
      chipBg: 'bg-fuchsia-500/10',
      chipText: 'text-fuchsia-700 dark:text-fuchsia-300',
      iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
      glow: 'shadow-fuchsia-500/30',
      bar: 'bg-gradient-to-r from-fuchsia-500 to-purple-500',
    },
    questions: ATTACHMENT_QUIZ.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options.map((o) => ({ text: o.text, key: o.style })),
    })),
    results: ATTACHMENT_RESULTS,
  },
]

/* ------------------------------------------------------------------ *
 * Main view
 * ------------------------------------------------------------------ */

export function QuizView() {
  const { navigate, openAuth, setComposeOpen } = useApp()
  const { user, isLoading: userLoading } = useCurrentUser()

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [direction, setDirection] = useState(1)
  const [phase, setPhase] = useState<'picker' | 'quiz' | 'result'>('picker')
  const [advancing, setAdvancing] = useState(false)

  const [past, setPast] = useState<PastResult[]>([])
  const [pastLoading, setPastLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const activeQuiz = useMemo(
    () => QUIZZES.find((q) => q.id === activeQuizId) ?? null,
    [activeQuizId]
  )

  /* ----- load past results (auth-gated) ----- */
  useEffect(() => {
    if (userLoading) return
    if (!user) {
      setPast([])
      setPastLoading(false)
      return
    }
    setPastLoading(true)
    api<PastResult[]>('/api/quiz')
      .then((r) => setPast(Array.isArray(r) ? r : []))
      .catch(() => setPast([]))
      .finally(() => setPastLoading(false))
  }, [user, userLoading])

  /* ----- quiz flow handlers ----- */
  const startQuiz = useCallback((q: UnifiedQuiz) => {
    setActiveQuizId(q.id)
    setQuestionIdx(0)
    setAnswers([])
    setDirection(1)
    setAdvancing(false)
    setSaved(false)
    setSaveError(null)
    setPhase('quiz')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const exitToPicker = useCallback(() => {
    setActiveQuizId(null)
    setPhase('picker')
    setAnswers([])
    setAdvancing(false)
    setSaved(false)
    setSaveError(null)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleSelect = useCallback(
    (key: string) => {
      if (advancing || !activeQuiz) return
      setAdvancing(true)
      setAnswers((prev) => {
        const next = [...prev]
        next[questionIdx] = key
        return next
      })
      const isLast = questionIdx === activeQuiz.questions.length - 1
      window.setTimeout(() => {
        if (isLast) {
          setPhase('result')
        } else {
          setDirection(1)
          setQuestionIdx((i) => i + 1)
        }
        setAdvancing(false)
      }, 300)
    },
    [advancing, activeQuiz, questionIdx]
  )

  const goBack = useCallback(() => {
    if (questionIdx === 0) {
      exitToPicker()
      return
    }
    setDirection(-1)
    setQuestionIdx((i) => Math.max(0, i - 1))
  }, [questionIdx, exitToPicker])

  const currentAnswer = answers[questionIdx] ?? null

  /* ----- result computation ----- */
  const result = useMemo<QuizResult | null>(() => {
    if (!activeQuiz || phase !== 'result') return null
    const counts: Record<string, number> = {}
    for (const k of answers) if (k) counts[k] = (counts[k] ?? 0) + 1
    // pick the highest tally; tie-break by the quiz's declared result order
    let bestKey: string | null = null
    let bestCount = -1
    for (const key of Object.keys(activeQuiz.results)) {
      const c = counts[key] ?? 0
      if (c > bestCount) {
        bestCount = c
        bestKey = key
      }
    }
    if (!bestKey || !activeQuiz.results[bestKey]) return null
    const r = activeQuiz.results[bestKey]
    return {
      key: bestKey,
      label: r.label,
      emoji: r.emoji,
      description: r.description,
      count: bestCount,
      total: activeQuiz.questions.length,
      counts,
    }
  }, [activeQuiz, phase, answers])

  /* ----- save result when reaching the result screen ----- */
  useEffect(() => {
    if (phase !== 'result' || !activeQuiz || !result) return
    if (saved || saving || saveError) return
    if (!user) return
    setSaving(true)
    const answersObj: Record<string, string> = {}
    answers.forEach((k, i) => {
      if (k) answersObj[`q${i + 1}`] = k
    })
    api('/api/quiz', {
      method: 'POST',
      json: {
        quizType: activeQuiz.id,
        answers: answersObj,
        score: result.count,
        result: result.label,
        description: result.description,
      },
    })
      .then(() => {
        setSaved(true)
        toast.success('Saved to your profile', {
          description: 'You can revisit it under Your history.',
        })
        // optimistic local insert
        setPast((prev) => [
          {
            id: `opt-${Date.now()}`,
            quizType: activeQuiz.id,
            score: result.count,
            result: result.label,
            description: result.description,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      })
      .catch((e: any) => {
        setSaveError(e?.message ?? 'Could not save')
        toast.error('Could not save result', { description: e?.message })
      })
      .finally(() => setSaving(false))
  }, [phase, activeQuiz, result, saved, saving, saveError, user, answers])

  /* ----- share to community ----- */
  const shareToCommunity = useCallback(() => {
    if (!activeQuiz || !result) return
    const snippet = `I just took the "${activeQuiz.title}" quiz — my result: ${result.label} ${result.emoji}. ${result.description.slice(0, 140)}…`
    setComposeOpen(true)
    navigate('community', { compose: '1', composeText: snippet })
    toast.success('Opening the composer…', {
      description: 'Share your result with the community ✨',
    })
  }, [activeQuiz, result, navigate, setComposeOpen])

  /* ----- render phases ----- */
  if (phase === 'quiz' && activeQuiz) {
    return (
      <QuizFlow
        quiz={activeQuiz}
        questionIdx={questionIdx}
        direction={direction}
        currentAnswer={currentAnswer}
        advancing={advancing}
        onSelect={handleSelect}
        onBack={goBack}
        onExit={exitToPicker}
      />
    )
  }

  if (phase === 'result' && activeQuiz && result) {
    return (
      <ResultView
        quiz={activeQuiz}
        result={result}
        isLoggedIn={!!user}
        saving={saving}
        saved={saved}
        onRetake={() => startQuiz(activeQuiz)}
        onShare={shareToCommunity}
        onExit={exitToPicker}
        onSignIn={() => openAuth('login')}
      />
    )
  }

  return (
    <Picker
      past={past}
      pastLoading={pastLoading && !!user}
      isLoggedIn={!!user}
      onStart={startQuiz}
      onSignIn={() => openAuth('login')}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Picker — landing screen with the two quiz cards + daily quote
 * ------------------------------------------------------------------ */

function Picker({
  past,
  pastLoading,
  isLoggedIn,
  onStart,
  onSignIn,
}: {
  past: PastResult[]
  pastLoading: boolean
  isLoggedIn: boolean
  onStart: (q: UnifiedQuiz) => void
  onSignIn: () => void
}) {
  const [quoteIdx, setQuoteIdx] = useState(0)

  // deterministic "daily" quote + gentle auto-rotate
  useEffect(() => {
    const dayIndex = Math.floor(Date.now() / 86_400_000) % LOVE_QUOTES.length
    setQuoteIdx(dayIndex)
    const id = setInterval(
      () => setQuoteIdx((i) => (i + 1) % LOVE_QUOTES.length),
      8000
    )
    return () => clearInterval(id)
  }, [])

  const lastByType = useMemo(() => {
    const map: Record<string, PastResult> = {}
    for (const p of past) if (!map[p.quizType]) map[p.quizType] = p
    return map
  }, [past])

  return (
    <div className="relative">
      {/* ambient hero background */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[380px] bg-gradient-to-b from-rose-500/12 via-fuchsia-500/6 to-transparent" />
      <div
        className="absolute inset-x-0 top-0 -z-10 h-[380px] opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(50% 50% at 30% 0%, oklch(0.85 0.12 350 / 0.22), transparent), radial-gradient(40% 40% at 80% 18%, oklch(0.85 0.1 330 / 0.18), transparent)',
        }}
      />

      {/* heading */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-12 pb-6 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Badge
            variant="secondary"
            className="mb-3 gap-1.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 px-3 py-1"
          >
            <Sparkles className="h-3.5 w-3.5" /> Reflect & grow
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Love <span className="text-gradient-rose">Quizzes</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Thoughtful, original quizzes to help you understand how you give and
            receive love — and why you bond the way you do.
          </p>
        </motion.div>
      </section>

      {/* quiz cards */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-10">
        <div className="grid gap-5 sm:grid-cols-2">
          {QUIZZES.map((q, i) => {
            const last = lastByType[q.id]
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <Card
                  className={cn(
                    'group relative overflow-hidden h-full border-border/60 transition-all duration-300 hover:shadow-xl',
                    q.accent.ring,
                    q.accent.glow
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-70',
                      q.accent.gradient
                    )}
                  />
                  <CardContent className="relative p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-3">
                      <motion.div
                        whileHover={{ scale: 1.06, rotate: -4 }}
                        className={cn(
                          'grid h-16 w-16 place-items-center rounded-2xl text-3xl shadow-lg',
                          q.accent.iconBg
                        )}
                      >
                        <span>{q.emoji}</span>
                      </motion.div>
                      {last && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'gap-1.5 px-2.5 py-1 text-[11px] border-rose-500/30',
                            q.accent.chipBg,
                            q.accent.chipText
                          )}
                        >
                          <History className="h-3 w-3" /> Last: {last.result}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-semibold leading-tight">
                      {q.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {q.subtitle}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground/80">
                      {q.tagline}
                    </p>
                    <div className="mt-6 flex-1" />
                    <Button
                      onClick={() => onStart(q)}
                      className={cn(
                        'w-full rounded-full h-11 text-base text-white shadow-lg',
                        q.accent.iconBg,
                        q.accent.glow
                      )}
                    >
                      {last ? 'Take again' : 'Start'}{' '}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* daily quote */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-10">
        <Card className="relative overflow-hidden border-rose-500/20 bg-gradient-to-br from-rose-500/8 via-pink-500/4 to-fuchsia-500/8">
          <CardContent className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/15">
                <Quote className="h-6 w-6 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <Badge
                  variant="secondary"
                  className="mb-2 text-[10px] uppercase tracking-wider"
                >
                  Daily quote
                </Badge>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quoteIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4 }}
                  >
                    <blockquote className="font-display text-lg sm:text-xl italic leading-snug">
                      “{LOVE_QUOTES[quoteIdx].text}”
                    </blockquote>
                    <p className="mt-2 text-sm text-muted-foreground">
                      — {LOVE_QUOTES[quoteIdx].author}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex gap-1.5 self-end sm:self-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                  aria-label="Previous quote"
                  onClick={() =>
                    setQuoteIdx((i) => (i - 1 + LOVE_QUOTES.length) % LOVE_QUOTES.length)
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                  aria-label="Next quote"
                  onClick={() => setQuoteIdx((i) => (i + 1) % LOVE_QUOTES.length)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* history / auth cta */}
      {isLoggedIn ? (
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-rose-500" /> Your history
            </h2>
            {!pastLoading && past.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {past.length} {past.length === 1 ? 'result' : 'results'} saved
              </span>
            )}
          </div>

          {pastLoading ? (
            <Card className="border-dashed">
              <CardContent className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                Loading your past results…
              </CardContent>
            </Card>
          ) : past.length === 0 ? (
            <Card className="border-dashed border-rose-500/20">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10">
                  <Heart className="h-6 w-6 text-rose-500" />
                </div>
                <p className="font-display text-lg font-medium">No results yet</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                  Take a quiz above to start your journey of self-discovery.
                  Your most recent result for each quiz will show up here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(lastByType).map(([type, r]) => {
                const quiz = QUIZZES.find((q) => q.id === type)
                if (!quiz) return null
                return (
                  <Card
                    key={type}
                    className="border-border/60 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div
                        className={cn(
                          'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl',
                          quiz.accent.iconBg
                        )}
                      >
                        <span>{quiz.emoji}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {quiz.title}
                        </p>
                        <p className="font-display font-semibold truncate">
                          {r.result}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {timeAgo(r.createdAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-rose-600 hover:text-rose-700"
                        onClick={() => onStart(quiz)}
                      >
                        Retake <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
          <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/8 to-fuchsia-500/8">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/15">
                <Lock className="h-6 w-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold">
                  Want to keep your results?
                </p>
                <p className="text-sm text-muted-foreground">
                  Sign in to save every quiz result to your profile and revisit
                  them anytime.
                </p>
              </div>
              <Button
                className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/30"
                onClick={onSignIn}
              >
                Sign in
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * QuizFlow — the question-by-question panel
 * ------------------------------------------------------------------ */

const questionVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

function QuizFlow({
  quiz,
  questionIdx,
  direction,
  currentAnswer,
  advancing,
  onSelect,
  onBack,
  onExit,
}: {
  quiz: UnifiedQuiz
  questionIdx: number
  direction: number
  currentAnswer: string | null
  advancing: boolean
  onSelect: (key: string) => void
  onBack: () => void
  onExit: () => void
}) {
  const total = quiz.questions.length
  const question = quiz.questions[questionIdx]
  const completed = questionIdx + (currentAnswer ? 1 : 0)
  const progressPct = (completed / total) * 100

  return (
    <div className="relative min-h-[80vh] flex flex-col">
      <div className="absolute inset-x-0 top-0 -z-10 h-[280px] bg-gradient-to-b from-rose-500/10 to-transparent" />
      <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6 py-8 flex-1 flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <span className="text-base shrink-0">{quiz.emoji}</span>
            <span className="font-medium truncate">{quiz.title}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onExit}
          >
            Exit
          </Button>
        </div>

        {/* progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>
              Question {questionIdx + 1} of {total}
            </span>
            <span>{Math.round(progressPct)}% complete</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-rose-500/15">
            <motion.div
              className={cn('h-full rounded-full', quiz.accent.bar)}
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* question */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={question.id}
              custom={direction}
              variants={questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: 'easeInOut' }}
            >
              <div className="mb-6">
                <Badge
                  variant="secondary"
                  className={cn('mb-3', quiz.accent.chipBg, quiz.accent.chipText)}
                >
                  Q{questionIdx + 1}
                </Badge>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
                  {question.text}
                </h2>
              </div>

              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  const isSelected = currentAnswer === opt.key
                  return (
                    <motion.button
                      key={opt.key + '-' + i}
                      type="button"
                      disabled={advancing}
                      onClick={() => onSelect(opt.key)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        'group w-full text-left rounded-2xl border p-4 sm:p-5 transition-all duration-200',
                        'flex items-center gap-3',
                        isSelected
                          ? 'border-rose-500/50 bg-rose-500/10 ring-2 ring-rose-500/30 shadow-md'
                          : 'border-border/70 bg-card hover:border-rose-500/40 hover:bg-rose-500/5 hover:shadow-md',
                        advancing && !isSelected && 'opacity-50'
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors',
                          isSelected
                            ? cn('border-transparent text-white', quiz.accent.iconBg)
                            : 'border-border text-muted-foreground group-hover:border-rose-500/40 group-hover:text-rose-600'
                        )}
                      >
                        {isSelected ? (
                          <Heart className="h-3.5 w-3.5 fill-white" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      <span
                        className={cn(
                          'flex-1 text-sm sm:text-base leading-snug',
                          isSelected ? 'font-medium' : 'font-normal'
                        )}
                      >
                        {opt.text}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* footer hint */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          {advancing
            ? 'Saving your answer…'
            : 'Pick the answer that feels most true — there are no wrong ones.'}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * ResultView — celebratory results card with confetti + breakdown
 * ------------------------------------------------------------------ */

function ResultView({
  quiz,
  result,
  isLoggedIn,
  saving,
  saved,
  onRetake,
  onShare,
  onExit,
  onSignIn,
}: {
  quiz: UnifiedQuiz
  result: QuizResult
  isLoggedIn: boolean
  saving: boolean
  saved: boolean
  onRetake: () => void
  onShare: () => void
  onExit: () => void
  onSignIn: () => void
}) {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-12">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-rose-500/12 via-fuchsia-500/6 to-transparent" />
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(50% 40% at 50% 30%, oklch(0.85 0.12 350 / 0.2), transparent)',
        }}
      />

      <Confetti />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-[720px] px-4 sm:px-6"
      >
        <Card
          className={cn(
            'relative overflow-hidden border-rose-500/30 shadow-2xl',
            quiz.accent.glow
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-80',
              quiz.accent.gradient
            )}
          />
          <CardContent className="relative p-6 sm:p-10 text-center">
            {/* emoji + sparkles */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
              className="mx-auto mb-5 relative w-28 h-28"
            >
              <div
                className={cn(
                  'absolute inset-0 grid place-items-center rounded-full bg-gradient-to-br text-6xl shadow-xl',
                  quiz.accent.iconBg
                )}
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="drop-shadow-lg"
                >
                  {result.emoji}
                </motion.span>
              </div>
              <motion.div
                className="absolute -top-2 -right-2 text-rose-400"
                animate={{ rotate: [0, 30, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="h-6 w-6 fill-rose-400/40" />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-3 text-fuchsia-400"
                animate={{ rotate: [0, -25, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 0.4 }}
              >
                <Star className="h-5 w-5 fill-fuchsia-400/40" />
              </motion.div>
            </motion.div>

            <Badge
              variant="secondary"
              className={cn('mb-3', quiz.accent.chipBg, quiz.accent.chipText)}
            >
              Your result
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
              <span className="text-gradient-rose">{result.label}</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
              {result.description}
            </p>

            {/* breakdown chips */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {Object.entries(quiz.results).map(([key, r]) => {
                const c = result.counts[key] ?? 0
                const pct = result.total
                  ? Math.round((c / result.total) * 100)
                  : 0
                const isWinner = key === result.key
                const shortLabel = r.label.split(/[-–]/)[0].split(' ').slice(0, 2).join(' ')
                return (
                  <div
                    key={key}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs',
                      isWinner
                        ? cn('border-transparent', quiz.accent.chipBg, quiz.accent.chipText)
                        : 'border-border/60 text-muted-foreground bg-card/60'
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span className="font-medium">{shortLabel}</span>
                    <span className="opacity-70">
                      {c} · {pct}%
                    </span>
                  </div>
                )
              })}
            </div>

            {/* save status / auth cta */}
            <div className="mt-7">
              {isLoggedIn ? (
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-rose-500" />{' '}
                      Saving to your profile…
                    </>
                  ) : saved ? (
                    <>
                      <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />{' '}
                      Saved to your profile
                    </>
                  ) : (
                    <span className="opacity-70">
                      Retake to try again, or share your result below.
                    </span>
                  )}
                </div>
              ) : (
                <div className="inline-flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="h-4 w-4 text-rose-500" />
                    <span>Sign in to save your results.</span>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"
                    onClick={onSignIn}
                  >
                    Sign in
                  </Button>
                </div>
              )}
            </div>

            {/* actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-full h-11 px-5 w-full sm:w-auto"
                onClick={onRetake}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" /> Retake quiz
              </Button>
              <Button
                className={cn(
                  'rounded-full h-11 px-6 w-full sm:w-auto text-white shadow-lg',
                  quiz.accent.iconBg,
                  quiz.accent.glow
                )}
                onClick={onShare}
              >
                <Share2 className="h-4 w-4 mr-1.5" /> Share to community
              </Button>
            </div>
            <button
              onClick={onExit}
              className="mt-5 text-sm text-muted-foreground hover:text-rose-600 transition-colors"
            >
              Back to all quizzes
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Confetti — sparkle burst on result reveal
 * ------------------------------------------------------------------ */

function Confetti() {
  const particles = useMemo(() => {
    const emojis = ['✨', '💖', '🌸', '💫', '🌟', '💕', '🩷']
    const N = 22
    return Array.from({ length: N }, (_, i) => {
      const angle = (Math.PI * 2 * i) / N + (Math.random() - 0.5) * 0.4
      const dist = 140 + Math.random() * 170
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 40,
        delay: Math.random() * 0.3,
        emoji: emojis[i % emojis.length],
        scale: 0.7 + Math.random() * 0.9,
        rotate: (Math.random() - 0.5) * 140,
      }
    })
  }, [])

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-visible pt-40"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: p.x,
            y: p.y,
            scale: [0, p.scale, p.scale, 0],
            rotate: p.rotate,
          }}
          transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
          className="absolute text-2xl"
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  )
}
