'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wind, Play, Pause, RotateCcw, Heart, Leaf, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest'

type Pattern = {
  id: string
  name: string
  subtitle: string
  phases: { phase: Phase; seconds: number }[]
  color: string
  ringColor: string
  description: string
}

const PATTERNS: Pattern[] = [
  {
    id: '478',
    name: '4-7-8 Calm',
    subtitle: 'For anxiety & sleep',
    phases: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 7 },
      { phase: 'exhale', seconds: 8 },
    ],
    color: 'from-rose-400 via-pink-500 to-fuchsia-600',
    ringColor: 'ring-rose-500/30',
    description: 'A classic calming breath. The long exhale signals safety to your nervous system.',
  },
  {
    id: 'box',
    name: 'Box Breath',
    subtitle: 'For focus & steadiness',
    phases: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 4 },
      { phase: 'exhale', seconds: 4 },
      { phase: 'rest', seconds: 4 },
    ],
    color: 'from-teal-400 via-emerald-500 to-green-600',
    ringColor: 'ring-emerald-500/30',
    description: 'Used by Navy SEALs to stay steady under pressure. Equal in, hold, out, hold.',
  },
  {
    id: 'coherent',
    name: 'Coherent 5-5',
    subtitle: 'For balance & heart rate',
    phases: [
      { phase: 'inhale', seconds: 5 },
      { phase: 'exhale', seconds: 5 },
    ],
    color: 'from-amber-400 via-orange-500 to-rose-500',
    ringColor: 'ring-amber-500/30',
    description: 'Resonance breathing at ~6 breaths/min. Gently balances your heart-rate variability.',
  },
]

const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  rest: 'Rest',
}

const PHASE_VERBS: Record<Phase, string> = {
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
  rest: 'Pause',
}

export function BreatheView() {
  const { navigate } = useApp()
  const [patternIdx, setPatternIdx] = useState(0)
  const pattern = PATTERNS[patternIdx]

  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(pattern.phases[0].seconds)
  const [cycleCount, setCycleCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentPhase = pattern.phases[phaseIdx]

  // Timer logic
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1
        // advance phase
        setPhaseIdx((prev) => {
          const next = (prev + 1) % pattern.phases.length
          if (next === 0) setCycleCount((c) => c + 1)
          return next
        })
        return 0 // will be reset by the phase-change effect below
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, pattern])

  // When phase changes, reset secondsLeft to the new phase's duration
  useEffect(() => {
    setSecondsLeft(currentPhase.seconds)
  }, [phaseIdx, currentPhase])

  function start() {
    setRunning(true)
  }
  function pause() {
    setRunning(false)
  }
  function reset() {
    setRunning(false)
    setPhaseIdx(0)
    setSecondsLeft(pattern.phases[0].seconds)
    setCycleCount(0)
  }
  function selectPattern(i: number) {
    setPatternIdx(i)
    setRunning(false)
    setPhaseIdx(0)
    setCycleCount(0)
    setSecondsLeft(PATTERNS[i].phases[0].seconds)
  }

  // Ring scale based on phase
  const ringScale =
    currentPhase.phase === 'inhale' ? 1
    : currentPhase.phase === 'exhale' ? 0.55
    : 0.78 // hold / rest hold their position

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* ambient backdrop that shifts with the pattern */}
      <div className={cn('absolute inset-0 -z-10 bg-gradient-to-b opacity-20 transition-colors duration-1000', pattern.color)} />
      <div className="absolute inset-0 -z-10 opacity-60" style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 30%, oklch(0.85 0.1 350 / 0.15), transparent)' }} />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-rose-500 shadow-xl shadow-emerald-500/30">
            <Wind className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            The <span className="text-gradient-rose">Breathing Room</span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            A minute of intentional breath can quiet a loud mind. Pick a rhythm, follow the circle, and let your nervous system settle.
          </p>
        </motion.div>

        {/* Pattern selector */}
        <div className="mb-8 grid sm:grid-cols-3 gap-3">
          {PATTERNS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => selectPattern(i)}
              className={cn(
                'text-left rounded-2xl border p-4 transition-all',
                patternIdx === i
                  ? 'border-rose-500/40 bg-card shadow-lg shadow-rose-500/5 -translate-y-0.5'
                  : 'border-border/60 bg-card/50 hover:border-rose-500/20 hover:bg-card'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn('h-2.5 w-2.5 rounded-full bg-gradient-to-br', p.color)} />
                <span className="font-display font-semibold text-sm">{p.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{p.subtitle}</p>
            </button>
          ))}
        </div>

        {/* Breathing circle */}
        <Card className={cn('relative overflow-hidden border-border/60 shadow-xl', pattern.ringColor)}>
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-5', pattern.color)} />
          <CardContent className="relative p-6 sm:p-10 flex flex-col items-center">
            {/* Pattern name + description */}
            <div className="text-center mb-6">
              <h2 className="font-display text-xl font-semibold">{pattern.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{pattern.description}</p>
            </div>

            {/* The breathing circle */}
            <div className="relative grid place-items-center h-64 w-64 sm:h-72 sm:w-72 my-4">
              {/* outer glow */}
              <div className={cn('absolute inset-0 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-transform', pattern.color)} style={{ transform: `scale(${ringScale + 0.3})` }} />
              {/* concentric rings */}
              <div className="absolute inset-0 rounded-full border border-border/40" />
              <div className="absolute inset-8 rounded-full border border-border/30" />
              <div className="absolute inset-16 rounded-full border border-border/20" />
              {/* the animated circle */}
              <motion.div
                animate={{ scale: ringScale }}
                transition={{ duration: currentPhase.seconds, ease: 'easeInOut' }}
                className={cn('relative grid place-items-center h-48 w-48 sm:h-56 sm:w-56 rounded-full bg-gradient-to-br shadow-2xl', pattern.color)}
              >
                <div className="absolute inset-2 rounded-full bg-background/10 backdrop-blur-sm" />
                <div className="relative text-center text-white">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPhase.phase + phaseIdx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="font-display text-2xl font-bold">{PHASE_LABELS[currentPhase.phase]}</p>
                      <p className="mt-1 text-5xl font-bold tabular-nums">{secondsLeft}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Cycle counter + controls */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <Leaf className="h-3 w-3" /> {cycleCount} {cycleCount === 1 ? 'cycle' : 'cycles'} complete
                </Badge>
                {cycleCount >= 3 && (
                  <Badge variant="secondary" className="gap-1 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                    <Sparkles className="h-3 w-3" /> Beautiful work
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!running ? (
                  <Button onClick={start} size="lg" className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-lg shadow-rose-500/30 h-12 px-8">
                    <Play className="h-5 w-5 mr-2 fill-white" /> {cycleCount > 0 ? 'Resume' : 'Begin'}
                  </Button>
                ) : (
                  <Button onClick={pause} size="lg" variant="outline" className="rounded-full h-12 px-8">
                    <Pause className="h-5 w-5 mr-2" /> Pause
                  </Button>
                )}
                <Button onClick={reset} size="lg" variant="ghost" className="rounded-full h-12 w-12 p-0" aria-label="Reset">
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>

              {/* Phase progress dots */}
              <div className="flex items-center gap-1.5 mt-1">
                {pattern.phases.map((p, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === phaseIdx ? 'w-8 bg-gradient-to-r ' + pattern.color : i < phaseIdx ? 'w-4 bg-muted-foreground/40' : 'w-4 bg-muted'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {PHASE_VERBS[currentPhase.phase]} · {pattern.phases.map((p) => p.seconds).join('-')} rhythm
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gentle encouragement */}
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
          <p>
            <span className="font-medium text-foreground">A gentle note.</span> There's no "right" number of cycles. Even one conscious breath is a kindness to your body. If your mind wanders, that's not failure — noticing is the practice.
          </p>
        </div>

        {/* Quick nav to other wellness tools */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('journal')}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Open mood journal
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('advisor')}>
            <Wind className="h-3.5 w-3.5 mr-1.5" /> Talk with Aria
          </Button>
        </div>
      </div>
    </div>
  )
}
