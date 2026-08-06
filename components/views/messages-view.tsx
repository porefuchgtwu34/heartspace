'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, type Socket } from 'socket.io-client'
import { useApp } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, timeAgo } from '@/lib/api'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Send,
  Search,
  PenSquare,
  Heart,
  MessageCircleHeart,
  Users,
  X,
  Loader2,
} from 'lucide-react'

// ---- Types ----
interface OtherUser {
  id: string
  username: string
  avatarUrl?: string | null
  bio?: string | null
}

interface LastMessage {
  id: string
  content: string
  senderId: string
  createdAt: string
  read: boolean
}

interface Conversation {
  id: string
  other: OtherUser
  lastMessage: LastMessage | null
  updatedAt: string
  unread: number
}

interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  sender: { id: string; username: string; avatarUrl?: string | null }
  content: string
  read: boolean
  createdAt: string
}

interface SearchUser {
  id: string
  username: string
  avatarUrl?: string | null
  bio?: string | null
}

interface IncomingSocketMessage {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  content: string
  createdAt: string
}

// ---- Helpers ----
function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatDateSeparator(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---- Main Component ----
export function MessagesView() {
  const { params, navigate } = useApp()
  const { user, isLoading: userLoading } = useCurrentUser()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convLoading, setConvLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({})
  const [presence, setPresence] = useState<Record<string, boolean>>({})
  const [showChatMobile, setShowChatMobile] = useState(false)
  const [newMsgOpen, setNewMsgOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef<string | null>(null)
  const conversationsRef = useRef<Conversation[]>([])
  const lastTypingSentRef = useRef<number>(0)
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingClearTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const processedAutoOpenRef = useRef<string>('')
  const didInitialLoadRef = useRef(false)

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  )

  // ---- Load conversations (optionally silent) ----
  const loadConversations = useCallback(
    async (withUserId?: string, silent = false) => {
      if (!silent) setConvLoading(true)
      try {
        const url = withUserId
          ? `/api/conversations?with=${encodeURIComponent(withUserId)}`
          : '/api/conversations'
        const data = await api<Conversation[]>(url)
        setConversations(data)
        return data
      } catch (e: any) {
        if (!silent) toast.error(e?.message || 'Failed to load conversations')
        return []
      } finally {
        if (!silent) setConvLoading(false)
      }
    },
    []
  )

  // ---- Initial load + handle params.with / params.conv (and future param changes) ----
  useEffect(() => {
    if (!user) return
    const w = params.with
    const c = params.conv
    const key = w ? `with:${w}` : c ? `conv:${c}` : ''

    if (key) {
      if (processedAutoOpenRef.current === key) return
      processedAutoOpenRef.current = key
      if (w) {
        loadConversations(w).then((list) => {
          const target = list.find((x) => x.other.id === w)
          if (target) {
            setActiveId(target.id)
            setShowChatMobile(true)
          }
        })
      } else if (c) {
        if (!conversationsRef.current.find((x) => x.id === c)) {
          loadConversations()
        }
        setActiveId(c)
        setShowChatMobile(true)
      }
    } else if (!didInitialLoadRef.current) {
      didInitialLoadRef.current = true
      loadConversations()
    }
  }, [user, params.with, params.conv, loadConversations])

  // ---- Socket setup ----
  useEffect(() => {
    if (!user) return
    const socket = io('/?XTransformPort=3003', { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    const onConnect = () => {
      socket.emit('identify', { userId: user.id, username: user.username })
      const ids = conversationsRef.current.map((c) => c.other.id)
      if (ids.length) socket.emit('request-presence', ids)
    }

    const onReceiveMessage = (msg: IncomingSocketMessage) => {
      const currentActive = activeIdRef.current
      const isMine = msg.senderId === user.id

      // Append to open conversation if it's not ours (we already added locally)
      if (msg.conversationId === currentActive && !isMine) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev
          return [
            ...prev,
            {
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              sender: { id: msg.senderId, username: msg.senderUsername, avatarUrl: null },
              content: msg.content,
              read: true,
              createdAt: msg.createdAt,
            },
          ]
        })
      }

      // Update conversation list lastMessage + unread
      setConversations((prev) => {
        let found = false
        const next = prev.map((c) => {
          if (c.id !== msg.conversationId) return c
          found = true
          const isOpen = msg.conversationId === currentActive
          return {
            ...c,
            lastMessage: {
              id: msg.id,
              content: msg.content,
              senderId: msg.senderId,
              createdAt: msg.createdAt,
              read: isOpen || isMine,
            },
            updatedAt: msg.createdAt,
            unread: isOpen || isMine ? 0 : c.unread + 1,
          }
        })
        if (!found && !isMine) {
          // Brand new conversation — silently refresh the list
          loadConversations(undefined, true)
        }
        return next
      })
    }

    const onTyping = (payload: {
      conversationId: string
      userId: string
      username: string
      isTyping: boolean
    }) => {
      if (payload.userId === user.id) return
      setTypingMap((prev) => ({ ...prev, [payload.conversationId]: payload.isTyping }))
      if (typingClearTimersRef.current[payload.conversationId]) {
        clearTimeout(typingClearTimersRef.current[payload.conversationId])
      }
      if (payload.isTyping) {
        typingClearTimersRef.current[payload.conversationId] = setTimeout(() => {
          setTypingMap((prev) => ({ ...prev, [payload.conversationId]: false }))
        }, 5000)
      }
    }

    const onPresence = (payload: { userId: string; username: string; online: boolean }) => {
      setPresence((prev) => ({ ...prev, [payload.userId]: payload.online }))
    }

    const onPresenceBatch = (batch: Record<string, boolean>) => {
      setPresence((prev) => ({ ...prev, ...batch }))
    }

    socket.on('connect', onConnect)
    socket.on('receive-message', onReceiveMessage)
    socket.on('typing', onTyping)
    socket.on('presence', onPresence)
    socket.on('presence-batch', onPresenceBatch)

    return () => {
      socket.off('connect', onConnect)
      socket.off('receive-message', onReceiveMessage)
      socket.off('typing', onTyping)
      socket.off('presence', onPresence)
      socket.off('presence-batch', onPresenceBatch)
      socket.disconnect()
      socketRef.current = null
      Object.values(typingClearTimersRef.current).forEach(clearTimeout)
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
    }
  }, [user, loadConversations])

  // Re-request presence when conversations list changes
  useEffect(() => {
    const socket = socketRef.current
    if (!socket?.connected || !conversations.length) return
    socket.emit('request-presence', conversations.map((c) => c.other.id))
  }, [conversations])

  // ---- Join/leave conversation room ----
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !activeId) return
    socket.emit('join-conversation', activeId)
    return () => {
      socket.emit('leave-conversation', activeId)
    }
  }, [activeId])

  // ---- Load messages when activeId changes ----
  useEffect(() => {
    if (!activeId) {
      setMessages([])
      return
    }
    let cancelled = false
    setMessagesLoading(true)
    api<ChatMessage[]>(`/api/conversations/${activeId}/messages`)
      .then((data) => {
        if (cancelled) return
        setMessages(data)
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, unread: 0 } : c))
        )
      })
      .catch((e: any) => {
        if (!cancelled) toast.error(e?.message || 'Failed to load messages')
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeId])

  // ---- Auto-scroll on new messages ----
  useEffect(() => {
    const el = messagesScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, messagesLoading])

  // ---- Typing emitter (debounced) ----
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      const socket = socketRef.current
      if (!socket || !user || !activeId) return
      const now = Date.now()
      if (!isTyping || now - lastTypingSentRef.current > 1000) {
        socket.emit('typing', {
          conversationId: activeId,
          userId: user.id,
          username: user.username,
          isTyping,
        })
        if (isTyping) lastTypingSentRef.current = now
      }
    },
    [user, activeId]
  )

  const onDraftChange = (v: string) => {
    setDraft(v)
    if (!user || !activeId) return
    if (v.trim()) {
      emitTyping(true)
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
      typingStopTimerRef.current = setTimeout(() => emitTyping(false), 2000)
    } else {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
      emitTyping(false)
    }
  }

  // ---- Send message ----
  const send = async () => {
    const content = draft.trim()
    if (!content || !activeId || !user || sending) return
    setSending(true)
    setDraft('')
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
    emitTyping(false)
    try {
      const msg = await api<ChatMessage>(`/api/conversations/${activeId}/messages`, {
        method: 'POST',
        json: { content },
      })
      setMessages((prev) => [...prev, msg])
      setConversations((prev) => {
        if (!prev.find((c) => c.id === activeId)) return prev
        return prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                lastMessage: {
                  id: msg.id,
                  content: msg.content,
                  senderId: msg.senderId,
                  createdAt: msg.createdAt,
                  read: true,
                },
                updatedAt: msg.createdAt,
                unread: 0,
              }
            : c
        )
      })
      socketRef.current?.emit('send-message', {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderUsername: user.username,
        content: msg.content,
        createdAt: msg.createdAt,
      })
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send message')
      setDraft(content)
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // ---- Select conversation ----
  const selectConversation = (id: string) => {
    if (id === activeId) {
      setShowChatMobile(true)
      return
    }
    setActiveId(id)
    setShowChatMobile(true)
  }

  const backToList = () => setShowChatMobile(false)

  // ---- New message flow ----
  const startConversationWith = (userId: string) => {
    setNewMsgOpen(false)
    navigate('messages', { with: userId })
    loadConversations(userId).then((list) => {
      const target = list.find((x) => x.other.id === userId)
      if (target) {
        setActiveId(target.id)
        setShowChatMobile(true)
      }
      processedAutoOpenRef.current = `with:${userId}`
    })
  }

  // ---- Filtered list ----
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter((c) => c.other.username.toLowerCase().includes(q))
  }, [conversations, search])

  const otherTyping = activeConv ? typingMap[activeConv.id] : false
  const otherOnline = activeConv ? presence[activeConv.other.id] : undefined

  // ---- Render ----
  if (userLoading) {
    return <MessagesSkeleton />
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <Heart className="mx-auto h-12 w-12 text-rose-500/40 mb-4" />
        <h2 className="font-display text-2xl font-semibold">Sign in to message</h2>
        <p className="mt-2 text-muted-foreground">
          HeartSpace DMs are private and warm. Sign in to start a conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="flex h-[calc(100dvh-6rem)] md:h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm">
        {/* Conversation list pane */}
        <aside
          className={cn(
            'w-full md:w-80 lg:w-96 shrink-0 flex-col border-r border-border/60 bg-background/50',
            showChatMobile ? 'hidden md:flex' : 'flex'
          )}
        >
          <ConversationListHeader
            search={search}
            setSearch={setSearch}
            onNewMessage={() => setNewMsgOpen(true)}
          />
          <div className="flex-1 overflow-y-auto scroll-soft">
            {convLoading ? (
              <ConversationListSkeleton />
            ) : filteredConversations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="mx-auto h-8 w-8 text-rose-500/40 mb-3" />
                <p className="text-sm font-medium">
                  {search ? 'No matches found.' : 'No conversations yet.'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {search
                    ? 'Try a different username.'
                    : 'Tap the pencil to start your first chat.'}
                </p>
              </div>
            ) : (
              <ul className="py-1">
                {filteredConversations.map((c) => (
                  <ConversationListItem
                    key={c.id}
                    conversation={c}
                    active={c.id === activeId}
                    online={presence[c.other.id]}
                    onClick={() => selectConversation(c.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Chat pane */}
        <section
          className={cn(
            'flex-1 flex-col bg-gradient-to-b from-background to-rose-500/[0.03]',
            showChatMobile ? 'flex' : 'hidden md:flex'
          )}
        >
          {activeConv ? (
            <>
              <ChatHeader
                conversation={activeConv}
                online={otherOnline}
                typing={!!otherTyping}
                onBack={backToList}
              />
              <div
                ref={messagesScrollRef}
                className="flex-1 overflow-y-auto scroll-soft px-3 sm:px-5 py-4"
              >
                {messagesLoading ? (
                  <MessageListSkeleton />
                ) : messages.length === 0 ? (
                  <EmptyChat name={activeConv.other.username} />
                ) : (
                  <MessageList messages={messages} currentUserId={user.id} />
                )}
              </div>
              <ChatInput
                draft={draft}
                onChange={onDraftChange}
                onKeyDown={onKeyDown}
                onSend={send}
                sending={sending}
              />
            </>
          ) : (
            <EmptyChatHero />
          )}
        </section>
      </div>

      <NewMessageDialog
        open={newMsgOpen}
        onOpenChange={setNewMsgOpen}
        onPick={startConversationWith}
      />
    </div>
  )
}

// ---- Conversation list header ----
function ConversationListHeader({
  search,
  setSearch,
  onNewMessage,
}: {
  search: string
  setSearch: (v: string) => void
  onNewMessage: () => void
}) {
  return (
    <div className="p-3 border-b border-border/60 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold leading-none">Messages</h2>
          <p className="text-[11px] text-muted-foreground mt-1">Whisper to a kindred heart.</p>
        </div>
        <Button
          size="sm"
          onClick={onNewMessage}
          className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-sm shadow-rose-500/30 gap-1.5"
        >
          <PenSquare className="h-3.5 w-3.5" /> New
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username..."
          className="pl-8 h-9 bg-background"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ---- Conversation list item ----
function ConversationListItem({
  conversation,
  active,
  online,
  onClick,
}: {
  conversation: Conversation
  active: boolean
  online?: boolean
  onClick: () => void
}) {
  const { other, lastMessage } = conversation
  const preview = lastMessage
    ? `${lastMessage.senderId === other.id ? '' : 'You: '}${lastMessage.content}`
    : 'Say hello 👋'
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
          active ? 'bg-rose-500/10' : 'hover:bg-muted/60'
        )}
      >
        <UserAvatar
          username={other.username}
          avatarUrl={other.avatarUrl}
          size="md"
          online={online}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'font-medium truncate',
                active ? 'text-rose-700 dark:text-rose-300' : 'text-foreground'
              )}
            >
              @{other.username}
            </span>
            {lastMessage && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {timeAgo(lastMessage.createdAt)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span
              className={cn(
                'text-xs truncate',
                conversation.unread > 0 && !active
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {preview}
            </span>
            {conversation.unread > 0 && !active && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shrink-0">
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}

// ---- Chat header ----
function ChatHeader({
  conversation,
  online,
  typing,
  onBack,
}: {
  conversation: Conversation
  online?: boolean
  typing: boolean
  onBack: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-3 sm:px-5 py-3 border-b border-border/60 bg-card/60 backdrop-blur-sm">
      <button
        onClick={onBack}
        className="md:hidden -ml-1 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
        aria-label="Back to conversations"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <UserAvatar
        username={conversation.other.username}
        avatarUrl={conversation.other.avatarUrl}
        size="md"
        online={online}
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-display font-semibold truncate leading-none">
          @{conversation.other.username}
        </h3>
        <div className="mt-1 h-4 flex items-center">
          <AnimatePresence mode="wait" initial={false}>
            {typing ? (
              <motion.span
                key="typing"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-rose-600 dark:text-rose-400 inline-flex items-center gap-1"
              >
                <span className="flex gap-0.5">
                  <span
                    className="h-1 w-1 rounded-full bg-rose-500 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-1 w-1 rounded-full bg-rose-500 animate-bounce"
                    style={{ animationDelay: '120ms' }}
                  />
                  <span
                    className="h-1 w-1 rounded-full bg-rose-500 animate-bounce"
                    style={{ animationDelay: '240ms' }}
                  />
                </span>
                typing…
              </motion.span>
            ) : (
              <motion.span
                key="status"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-muted-foreground inline-flex items-center gap-1"
              >
                {online ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online
                  </>
                ) : (
                  <>Offline</>
                )}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ---- Message list (with date separators) ----
function MessageList({
  messages,
  currentUserId,
}: {
  messages: ChatMessage[]
  currentUserId: string
}) {
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: ChatMessage[] }[] = []
    let lastKey = ''
    for (const m of messages) {
      const d = new Date(m.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (key !== lastKey) {
        out.push({ key, label: formatDateSeparator(d), items: [m] })
        lastKey = key
      } else {
        out[out.length - 1].items.push(m)
      }
    }
    return out
  }, [messages])

  return (
    <div className="space-y-1.5">
      {groups.map((g) => (
        <div key={g.key} className="space-y-1.5">
          <div className="sticky top-0 z-10 my-2 flex justify-center">
            <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm shadow-sm">
              {g.label}
            </span>
          </div>
          {g.items.map((m, idx) => {
            const mine = m.senderId === currentUserId
            const prev = g.items[idx - 1]
            const showAvatar = !mine && (!prev || prev.senderId !== m.senderId)
            return (
              <MessageBubble
                key={m.id}
                message={m}
                mine={mine}
                showAvatar={showAvatar}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

function MessageBubble({
  message,
  mine,
  showAvatar,
}: {
  message: ChatMessage
  mine: boolean
  showAvatar: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn('flex items-end gap-2', mine ? 'flex-row-reverse' : 'flex-row')}
    >
      <div className="w-8 shrink-0">
        {showAvatar && (
          <UserAvatar
            username={message.sender.username}
            avatarUrl={message.sender.avatarUrl}
            size="xs"
          />
        )}
      </div>
      <div
        className={cn(
          'max-w-[78%] sm:max-w-[68%] flex flex-col',
          mine ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm break-words shadow-sm whitespace-pre-wrap',
            mine
              ? 'bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white rounded-br-md'
              : 'bg-card border border-border/60 text-card-foreground rounded-bl-md'
          )}
        >
          {message.content}
        </div>
        <span className="mt-1 px-1 text-[10px] text-muted-foreground/70">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.div>
  )
}

// ---- Chat input ----
function ChatInput({
  draft,
  onChange,
  onKeyDown,
  onSend,
  sending,
}: {
  draft: string
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  sending: boolean
}) {
  return (
    <div className="border-t border-border/60 bg-card/60 backdrop-blur-sm p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 transition focus-within:ring-2 focus-within:ring-rose-500/30 focus-within:border-rose-500/40">
        <Textarea
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write something kind…"
          rows={1}
          className="min-h-9 max-h-32 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-transparent text-sm"
        />
        <Button
          size="icon"
          onClick={onSend}
          disabled={!draft.trim() || sending}
          className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-md shadow-rose-500/30 disabled:opacity-40 disabled:shadow-none transition-transform hover:scale-105 active:scale-95"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  )
}

// ---- Empty states ----
function EmptyChatHero() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 blur-2xl bg-rose-500/20 rounded-full" />
        <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-rose-500/15 to-fuchsia-500/10 ring-1 ring-rose-500/20">
          <MessageCircleHeart className="h-10 w-10 text-rose-500" />
        </div>
      </motion.div>
      <h3 className="font-display text-2xl font-semibold">
        Choose a heart to write to <span className="inline-block">💕</span>
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Pick a conversation from the left, or start a new one. Every message here is private and
        yours.
      </p>
    </div>
  )
}

function EmptyChat({ name }: { name: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-rose-500/5 px-6 py-5 ring-1 ring-rose-500/15"
      >
        <Heart className="mx-auto h-7 w-7 text-rose-500 fill-rose-500/20" />
        <p className="mt-2 text-sm">
          This is the start of your conversation with{' '}
          <span className="font-semibold text-rose-600 dark:text-rose-400">@{name}</span>.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Say hello 👋</p>
      </motion.div>
    </div>
  )
}

// ---- New message dialog ----
function NewMessageDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onPick: (userId: string) => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchUser[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setQ('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api<SearchUser[]>(`/api/users?q=${encodeURIComponent(q.trim())}`)
        setResults(data)
      } catch (e: any) {
        toast.error(e?.message || 'Failed to search users')
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <PenSquare className="h-4 w-4 text-rose-500" /> New message
          </DialogTitle>
          <DialogDescription>
            Search for someone by username to start a private conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. lavender_dreams"
            className="pl-9"
          />
        </div>
        <div className="max-h-72 overflow-y-auto scroll-soft -mx-1">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Users className="mx-auto h-7 w-7 text-rose-500/40 mb-2" />
              <p className="text-sm">
                {q ? `No one found for "${q}".` : 'Start typing to find someone.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5 p-1">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => onPick(u.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-rose-500/10 transition-colors"
                  >
                    <UserAvatar username={u.username} avatarUrl={u.avatarUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">@{u.username}</p>
                      {u.bio && (
                        <p className="text-xs text-muted-foreground truncate">{u.bio}</p>
                      )}
                    </div>
                    <Send className="h-3.5 w-3.5 text-rose-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---- Skeletons ----
function MessagesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="flex h-[calc(100dvh-6rem)] md:h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-border/60">
        <div className="hidden md:block w-80 border-r border-border/60 p-3 space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-full rounded-md" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-40" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border/60 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={i % 2 === 0 ? 'flex justify-start' : 'flex justify-end'}
              >
                <Skeleton
                  className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-56')}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ConversationListSkeleton() {
  return (
    <div className="p-3 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MessageListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={i % 2 === 0 ? 'flex justify-start' : 'flex justify-end'}>
          <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-56')} />
        </div>
      ))}
    </div>
  )
}
