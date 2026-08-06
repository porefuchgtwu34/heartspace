'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Trash2, Heart, Loader2, MessageCircleHeart, Shield, RefreshCw } from 'lucide-react'
import { useApp } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, timeAgo } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Msg = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }

const STARTERS = [
  "I keep replaying our last conversation. How do I let it go?",
  "I think I have an anxious attachment style. Where do I even start?",
  "We had a fight and I'm not sure if I was wrong.",
  "How do I know if I actually love them or just the idea of them?",
  "I want to set a boundary but I'm scared of being left.",
  "I've been single for a while and I'm starting to feel behind.",
]

export function AdvisorView() {
  const { user, isLoading } = useCurrentUser()
  const { openAuth } = useApp()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [degraded, setDegraded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      setLoadingHistory(false)
      return
    }
    let active = true
    api<Msg[]>('/api/advisor')
      .then((msgs) => {
        if (active) setMessages(msgs)
      })
      .catch(() => {})
      .finally(() => active && setLoadingHistory(false))
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || sending) return
    if (!user) {
      openAuth('login')
      return
    }
    const userMsg: Msg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setSending(true)
    setDegraded(false)

    // Create an empty Aria message that we'll fill in as tokens stream
    const ariaId = `aria-${Date.now()}`
    const ariaMsg: Msg = {
      id: ariaId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, ariaMsg])

    try {
      const res = await fetch('/api/advisor/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Request failed (${res.status})`)
      }
      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.delta) {
              accumulated += payload.delta
              // Update the Aria message in place
              setMessages((m) =>
                m.map((msg) => (msg.id === ariaId ? { ...msg, content: accumulated } : msg))
              )
            }
            if (payload.degraded) setDegraded(true)
            if (payload.done) break
          } catch {
            // ignore parse errors on partial lines
          }
        }
      }
      // If nothing streamed, show a fallback
      if (!accumulated.trim()) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === ariaId
              ? { ...msg, content: "I'm here, and I heard you. Tell me a bit more?" }
              : msg
          )
        )
      }
    } catch (err: any) {
      // Remove the empty Aria message and toast
      setMessages((m) => m.filter((msg) => msg.id !== ariaId))
      toast.error(err.message || 'Aria is having trouble right now.')
    } finally {
      setSending(false)
    }
  }

  async function clearChat() {
    try {
      await api('/api/advisor', { method: 'DELETE' })
      setMessages([])
      toast.success('Conversation cleared.')
    } catch {
      toast.error('Could not clear.')
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="h-10 w-48 shimmer rounded-lg mb-4" />
        <div className="h-64 shimmer rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* ambient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-fuchsia-500/8 via-rose-500/5 to-background" />
      <div className="absolute inset-0 -z-10 opacity-50" style={{ backgroundImage: 'radial-gradient(40% 40% at 20% 10%, oklch(0.85 0.12 340 / 0.18), transparent), radial-gradient(35% 35% at 85% 30%, oklch(0.85 0.1 60 / 0.14), transparent)' }} />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-500 shadow-xl shadow-fuchsia-500/30">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Talk with <span className="text-gradient-rose">Aria</span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Your AI relationship advisor. Warm, non-judgmental, always here. A blend of a thoughtful therapist and a wise friend — for the things on your heart.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="gap-1 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300">
              <MessageCircleHeart className="h-3 w-3" /> Private to you
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-rose-500/10 text-rose-700 dark:text-rose-300">
              <Sparkles className="h-3 w-3" /> AI-powered
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Shield className="h-3 w-3" /> Not a crisis service
            </Badge>
          </div>
        </motion.div>

        {!user ? (
          <Card className="border-fuchsia-500/20">
            <CardContent className="p-10 text-center">
              <Heart className="mx-auto h-10 w-10 text-fuchsia-500 fill-fuchsia-500/20 mb-3" />
              <h3 className="font-display text-xl font-semibold">Sign in to talk with Aria</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Your conversations are private and saved to your account, so you can return to them anytime.
              </p>
              <Button className="mt-5 bg-gradient-to-r from-fuchsia-500 to-rose-600 hover:from-fuchsia-600 hover:to-rose-700 text-white" onClick={() => openAuth('login')}>
                <Sparkles className="h-4 w-4 mr-2" /> Sign in to begin
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border/60 shadow-xl shadow-rose-500/5">
            {/* Messages */}
            <div ref={scrollRef} className="max-h-[52vh] min-h-[320px] overflow-y-auto scroll-soft p-4 sm:p-6 space-y-4">
              {loadingHistory ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={cn('flex', i % 2 ? 'justify-end' : 'justify-start')}>
                      <div className="max-w-[80%]">
                        <div className="h-4 w-20 shimmer rounded mb-2" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-64 shimmer rounded" />
                          <div className="h-3 w-48 shimmer rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-600"
                  >
                    <Sparkles className="h-7 w-7 text-white" />
                  </motion.div>
                  <p className="font-display text-lg font-medium">Hello, I'm Aria. 🌹</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                    Tell me what's on your heart — a worry, a pattern you've noticed, a question about love. I'm here to listen.
                  </p>
                  <div className="mt-5 grid sm:grid-cols-2 gap-2 max-w-lg mx-auto text-left">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm text-left hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5 transition-colors"
                      >
                        "{s}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <MessageBubble key={m.id} msg={m} prev={messages[i - 1]} streaming={sending && m.role === 'assistant' && i === messages.length - 1 && !m.content} />
                  ))}
                  {sending && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                        <span className="h-2 w-2 rounded-full bg-fuchsia-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-rose-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-amber-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
              {degraded && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 text-center">
                  Aria's usual depth is resting — this is a lighter reply. Try sending again in a moment.
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/60 bg-card/50 p-3 sm:p-4">
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="What's on your heart?"
                  rows={1}
                  className="min-h-[44px] max-h-32 resize-none border-border/60 focus-visible:ring-fuchsia-500/40"
                  disabled={sending}
                />
                <Button
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-600 hover:from-fuchsia-600 hover:to-rose-700 text-white shadow-md"
                  onClick={() => send()}
                  disabled={!input.trim() || sending}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Press Enter to send · Shift+Enter for a new line</p>
                {messages.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3 mr-1" /> Clear
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear this conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes your conversation with Aria. You can't undo it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={clearChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Clear conversation
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Trust note */}
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 shrink-0 mt-0.5 text-fuchsia-500" />
          <p>
            <span className="font-medium text-foreground">A note on safety.</span> Aria is an AI, not a licensed therapist or a substitute for one. If you're in crisis or thinking of harming yourself, please reach a local crisis line or a trusted professional. Your conversations are private to your account.
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, prev, streaming }: { msg: Msg; prev?: Msg; streaming?: boolean }) {
  const isUser = msg.role === 'user'
  const showAvatar = !prev || prev.role !== msg.role
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className={cn('w-8 shrink-0', !showAvatar && 'invisible')}>
          {showAvatar && (
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-600 shadow-md">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      )}
      <div className={cn('max-w-[78%] flex flex-col', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white rounded-br-md shadow-md shadow-rose-500/20'
              : 'bg-muted text-foreground rounded-bl-md'
          )}
        >
          {streaming && !msg.content ? (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="h-2 w-2 rounded-full bg-fuchsia-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-rose-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-amber-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <>
              {msg.content}
              {streaming && msg.content && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-fuchsia-500/70 animate-pulse align-text-bottom" />
              )}
            </>
          )}
        </div>
        {showAvatar && (
          <span className="mt-1 px-1 text-[10px] text-muted-foreground">
            {isUser ? 'You' : 'Aria'} · {timeAgo(msg.createdAt)}
          </span>
        )}
      </div>
    </motion.div>
  )
}
