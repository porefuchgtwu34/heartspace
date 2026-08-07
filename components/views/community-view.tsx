'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, timeAgo, readingTime } from '@/lib/api'
import { UserAvatar } from '@/components/user-avatar'
import { POST_CATEGORIES, MOOD_TAGS, REACTION_EMOJIS } from '@/lib/content'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Heart,
  MessageCircle,
  Search,
  Send,
  Trash2,
  PenLine,
  Sparkles,
  Smile,
  X,
  Users,
  Loader2,
  MessageCircleHeart,
  RefreshCw,
  Bookmark,
  BookOpen,
  Clock,
  Flame,
} from 'lucide-react'

// ---------- Types ----------
type Author = { id: string; username: string; avatarUrl?: string | null }

type Post = {
  id: string
  content: string
  mood: string | null
  category: string
  title: string | null
  likes?: number
  createdAt: string
  author: Author
  _count: { comments: number; reactions: number }
}

type Comment = {
  id: string
  content: string
  createdAt: string
  author: Author
}

// ---------- Helpers ----------
const categoryMeta = (value: string) =>
  POST_CATEGORIES.find((c) => c.value === value) ?? POST_CATEGORIES[0]

const moodMeta = (value: string | null) =>
  value ? MOOD_TAGS.find((m) => m.value === value) : undefined

// Build a compact page list with ellipses, e.g. 1 ... 4 5 6 ... 20
function pageList(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | 'ellipsis')[] = []
  out.push(1)
  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)
  if (left > 2) out.push('ellipsis')
  for (let i = left; i <= right; i++) out.push(i)
  if (right < total - 1) out.push('ellipsis')
  out.push(total)
  return out
}

// ---------- Main View ----------
export function CommunityView() {
  const { params, openAuth, composeOpen, setComposeOpen } = useApp()
  const { user, isAdmin } = useCurrentUser()

  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<string>('newest')
  const [loading, setLoading] = useState(true)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  // Per-post set of emojis the current user has reacted with (client-side optimistic state)
  const [reacted, setReacted] = useState<Record<string, Set<string>>>({})
  // Per-post bookmark state (client-side optimistic)
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({})
  const [searchInput, setSearchInput] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deepLinkedRef = useRef<string | null>(null)

  const fetchPosts = useCallback(async (p: number, cat: string, q: string, s: string) => {
    setLoading(true)
    try {
      const url = new URL('/api/posts', window.location.origin)
      url.searchParams.set('page', String(p))
      if (cat && cat !== 'all') url.searchParams.set('category', cat)
      if (q.trim()) url.searchParams.set('q', q.trim())
      if (s && s !== 'newest') url.searchParams.set('sort', s)
      const res = await api(url.pathname + '?' + url.searchParams.toString())
      setPosts(res.posts || [])
      setTotal(res.total || 0)
      setPage(res.page || p)
      setPages(res.pages || 1)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + category / sort / query changes
  useEffect(() => {
    fetchPosts(1, category, query, sort)
  }, [category, sort, query, fetchPosts])

  // Debounced search → updates query (which triggers the fetch effect above)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      if (searchInput !== query) {
        setQuery(searchInput)
        setPage(1)
      }
    }, 350)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchInput, query])

  // Deep-link: when params.post is set, fetch & highlight
  useEffect(() => {
    const postId = params.post
    if (!postId || deepLinkedRef.current === postId) return
    deepLinkedRef.current = postId
    api(`/api/posts/${postId}`)
      .then((post: any) => {
        setPosts((prev) => {
          if (prev.find((p) => p.id === post.id)) return prev
          return [post, ...prev]
        })
        setExpandedComments((prev) => ({ ...prev, [post.id]: true }))
        setTimeout(() => {
          const el = document.getElementById(`post-${post.id}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('ring-2', 'ring-rose-500', 'ring-offset-2', 'ring-offset-background')
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-rose-500', 'ring-offset-2', 'ring-offset-background')
            }, 2800)
          }
        }, 250)
      })
      .catch(() => {
        toast.error('Could not find that post — it may have been removed.')
      })
  }, [params.post])

  const handleCategory = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  const handlePage = (p: number) => {
    if (p < 1 || p > pages) return
    setPage(p)
    fetchPosts(p, category, query, sort)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSort = (s: string) => {
    setSort(s)
    setPage(1)
  }

  const handleNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev])
    setTotal((t) => t + 1)
    setComposeOpen(false)
    toast.success('Your heart is out there. 💗')
  }

  // Load the current user's bookmarked post IDs once on mount
  useEffect(() => {
    if (!user) return
    api<any[]>('/api/bookmarks')
      .then((rows) => {
        const map: Record<string, boolean> = {}
        rows.forEach((r) => { map[r.id] = true })
        setBookmarked(map)
      })
      .catch(() => {})
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    try {
      await api(`/api/posts/${id}`, { method: 'DELETE' })
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setTotal((t) => Math.max(0, t - 1))
      toast.success('Post deleted.')
    } catch (e: any) {
      toast.error(e.message || 'Could not delete post')
    }
  }

  const handleReact = async (post: Post, emoji: string) => {
    if (!user) {
      openAuth('login')
      return
    }
    const current = reacted[post.id] ?? new Set<string>()
    const has = current.has(emoji)
    const next = new Set(current)
    if (has) next.delete(emoji)
    else next.add(emoji)
    setReacted((prev) => ({ ...prev, [post.id]: next }))
    // optimistic count update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, _count: { ...p._count, reactions: Math.max(0, p._count.reactions + (has ? -1 : 1)) } }
          : p
      )
    )
    try {
      await api(`/api/posts/${post.id}`, {
        method: 'PATCH',
        json: has ? { emoji, removeEmoji: true } : { emoji },
      })
    } catch (e: any) {
      // rollback
      setReacted((prev) => ({ ...prev, [post.id]: current }))
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, _count: { ...p._count, reactions: Math.max(0, p._count.reactions + (has ? 1 : -1)) } }
            : p
        )
      )
      if (e.status === 401) openAuth('login')
      else toast.error(e.message || 'Could not react')
    }
  }

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }))
  }

  const handleToggleBookmark = async (post: Post) => {
    if (!user) {
      openAuth('login')
      return
    }
    const wasBookmarked = !!bookmarked[post.id]
    // optimistic
    setBookmarked((prev) => ({ ...prev, [post.id]: !wasBookmarked }))
    try {
      const res = await api<{ bookmarked: boolean }>('/api/bookmarks', {
        method: 'POST',
        json: { postId: post.id },
      })
      setBookmarked((prev) => ({ ...prev, [post.id]: !!res.bookmarked }))
      toast.success(res.bookmarked ? 'Saved to your bookmarks.' : 'Removed from bookmarks.')
    } catch (e: any) {
      // rollback
      setBookmarked((prev) => ({ ...prev, [post.id]: wasBookmarked }))
      if (e.status === 401) openAuth('login')
      else toast.error(e.message || 'Could not update bookmark')
    }
  }

  const onCommentAdded = (postId: string, comment: Comment) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p
      )
    )
  }

  const showingFrom = total === 0 ? 0 : (page - 1) * 8 + 1
  const showingTo = Math.min(page * 8, total)
  const pl = useMemo(() => pageList(page, pages), [page, pages])

  return (
    <div className="relative min-h-[60vh]">
      {/* warm wash background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-rose-500/5 via-fuchsia-500/[0.03] to-transparent" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(50% 60% at 80% 0%, oklch(0.85 0.12 350 / 0.22), transparent), radial-gradient(40% 50% at 10% 20%, oklch(0.85 0.1 60 / 0.18), transparent)',
        }}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-20">
        <Header
          onShare={() => {
            if (!user) openAuth('login')
            else setComposeOpen(true)
          }}
          total={total}
        />

        <Composer
          open={composeOpen}
          onOpenChange={setComposeOpen}
          onPosted={handleNewPost}
          onAuthNeeded={() => openAuth('login')}
          isLoggedIn={!!user}
          defaultCategory={category !== 'all' ? category : 'general'}
        />

        <FiltersBar
          category={category}
          onCategory={handleCategory}
          searchInput={searchInput}
          onSearch={setSearchInput}
          sort={sort}
          onSort={handleSort}
        />

        {loading ? (
          <PostListSkeleton />
        ) : posts.length === 0 ? (
          <EmptyState
            onShare={() => {
              if (!user) openAuth('login')
              else setComposeOpen(true)
            }}
          />
        ) : (
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32, delay: Math.min(i * 0.04, 0.24) }}
                >
                  <PostCard
                    post={post}
                    canDelete={!!user && (user.id === post.author.id || isAdmin)}
                    reactedEmojis={reacted[post.id] ?? new Set()}
                    onReact={(emoji) => handleReact(post, emoji)}
                    onDelete={() => handleDelete(post.id)}
                    commentsOpen={!!expandedComments[post.id]}
                    onToggleComments={() => toggleComments(post.id)}
                    onCommentAdded={(c) => onCommentAdded(post.id, c)}
                    isLoggedIn={!!user}
                    onAuthNeeded={() => openAuth('login')}
                    currentUserId={user?.id}
                    isBookmarked={!!bookmarked[post.id]}
                    onToggleBookmark={() => handleToggleBookmark(post)}
                    canBookmark={!!user}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{showingFrom}</span>–
              <span className="font-medium text-foreground">{showingTo}</span> of{' '}
              <span className="font-medium text-foreground">{total}</span>
            </p>
            {pages > 1 && (
              <Pagination className="justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePage(page - 1)}
                      className={cn(page === 1 && 'pointer-events-none opacity-40', 'cursor-pointer')}
                    />
                  </PaginationItem>
                  {pl.map((p, idx) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`e-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={p === page}
                          onClick={() => handlePage(p)}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePage(page + 1)}
                      className={cn(page === pages && 'pointer-events-none opacity-40', 'cursor-pointer')}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Header ----------
function Header({ onShare, total }: { onShare: () => void; total: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Badge variant="secondary" className="mb-3 gap-1.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" /> The community feed
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Community
          </h1>
          <p className="mt-2 text-muted-foreground max-w-lg leading-relaxed">
            A warm space to share what's on your heart. Stories, advice, and kindness — by username, never your real name.
          </p>
          {total > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400">
              <Users className="h-3.5 w-3.5" />
              {total} {total === 1 ? 'story' : 'stories'} shared so far
            </p>
          )}
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Button
          onClick={onShare}
          size="lg"
          className="h-12 px-6 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-xl shadow-rose-500/30 text-base"
        >
          <Heart className="h-5 w-5 mr-2 fill-white" />
          Share your heart
        </Button>
      </motion.div>
    </div>
  )
}

// ---------- Composer ----------
function Composer({
  open,
  onOpenChange,
  onPosted,
  onAuthNeeded,
  isLoggedIn,
  defaultCategory,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onPosted: (p: Post) => void
  onAuthNeeded: () => void
  isLoggedIn: boolean
  defaultCategory: string
}) {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(defaultCategory)
  const [mood, setMood] = useState<string>('none')
  const [showTitle, setShowTitle] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setCategory(defaultCategory)
  }, [defaultCategory])

  useEffect(() => {
    if (open && isLoggedIn && taRef.current) {
      setTimeout(() => taRef.current?.focus(), 60)
    }
  }, [open, isLoggedIn])

  const reset = () => {
    setContent('')
    setTitle('')
    setMood('none')
    setShowTitle(false)
  }

  const submit = async () => {
    if (!isLoggedIn) {
      onAuthNeeded()
      return
    }
    if (!content.trim()) {
      toast.error('Write something first.')
      return
    }
    if (content.length > 2000) {
      toast.error('Posts must be under 2000 characters.')
      return
    }
    setSubmitting(true)
    try {
      const created = await api<Post>('/api/posts', {
        method: 'POST',
        json: {
          content: content.trim(),
          title: title.trim() || undefined,
          category,
          mood: mood === 'none' ? undefined : mood,
        },
      })
      onPosted(created)
      reset()
    } catch (e: any) {
      if (e.status === 401) onAuthNeeded()
      else toast.error(e.message || 'Could not post. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <Card className="border-rose-500/20 shadow-lg shadow-rose-500/10 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-rose-500/[0.04] via-transparent to-fuchsia-500/[0.04]" />
            <CardContent className="relative p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white shadow-md shadow-rose-500/30">
                    <PenLine className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold leading-none">Share what's on your heart</p>
                    <p className="text-xs text-muted-foreground mt-1">Be kind. Be honest. Be you.</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close composer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <AnimatePresence initial={false}>
                {showTitle && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="An optional title…"
                      maxLength={120}
                      className="h-10"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Textarea
                  ref={taRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                  placeholder="What's stirring in you today? Share a story, ask for advice, or just be heard…"
                  className="min-h-[140px] resize-y text-[15px] leading-relaxed pr-2"
                />
                <div className="mt-1.5 flex items-center justify-end">
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      content.length > 1800 ? 'text-rose-500' : 'text-muted-foreground'
                    )}
                  >
                    {content.length}/2000
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 w-[160px] gap-1.5">
                    <span className="text-base leading-none">{categoryMeta(category).emoji}</span>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="mr-1.5">{c.emoji}</span>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="h-9 w-[160px] gap-1.5">
                    <Smile className="h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="mr-1.5">—</span>No mood
                    </SelectItem>
                    {MOOD_TAGS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="mr-1.5">{m.emoji}</span>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={() => setShowTitle((v) => !v)}
                >
                  <PenLine className="h-4 w-4 mr-1.5" />
                  {showTitle ? 'Remove title' : 'Add title'}
                </Button>

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="h-9"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submit}
                    disabled={submitting || !content.trim()}
                    className="h-9 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-md shadow-rose-500/30"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-1.5" />
                    )}
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------- Filters Bar ----------
function FiltersBar({
  category,
  onCategory,
  searchInput,
  onSearch,
  sort,
  onSort,
}: {
  category: string
  onCategory: (c: string) => void
  searchInput: string
  onSearch: (s: string) => void
  sort: string
  onSort: (s: string) => void
}) {
  const sortOptions = [
    { value: 'newest', label: 'Newest', icon: Clock },
    { value: 'top', label: 'Top', icon: Flame },
    { value: 'discussed', label: 'Discussed', icon: MessageCircle },
  ]
  return (
    <div className="mt-8 -mx-4 sm:mx-0 sm:rounded-2xl bg-card/70 backdrop-blur-sm border border-border/60 px-3 sm:px-4 py-3 sticky top-2 z-20 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search stories, words, feelings…"
            className="h-10 pl-9 pr-9 rounded-full bg-background/80"
          />
          {searchInput && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto scroll-soft pb-1 -mb-1">
          <FilterChip
            active={category === 'all'}
            onClick={() => onCategory('all')}
            emoji="✨"
            label="All"
          />
          {POST_CATEGORIES.map((c) => (
            <FilterChip
              key={c.value}
              active={category === c.value}
              onClick={() => onCategory(c.value)}
              emoji={c.emoji}
              label={c.label}
            />
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Sort</span>
          <div className="flex items-center gap-1 rounded-full bg-muted/60 p-0.5">
            {sortOptions.map((opt) => {
              const Icon = opt.icon
              const active = sort === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => onSort(opt.value)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                    active
                      ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean
  onClick: () => void
  emoji: string
  label: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all',
        active
          ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white border-transparent shadow-md shadow-rose-500/30'
          : 'bg-background/60 border-border/60 text-muted-foreground hover:text-foreground hover:border-rose-500/30 hover:bg-rose-500/5'
      )}
    >
      <span className="text-base leading-none">{emoji}</span>
      {label}
    </motion.button>
  )
}

// ---------- Post Card ----------
function PostCard({
  post,
  canDelete,
  reactedEmojis,
  onReact,
  onDelete,
  commentsOpen,
  onToggleComments,
  onCommentAdded,
  isLoggedIn,
  onAuthNeeded,
  currentUserId,
  isBookmarked,
  onToggleBookmark,
  canBookmark,
}: {
  post: Post
  canDelete: boolean
  reactedEmojis: Set<string>
  onReact: (emoji: string) => void
  onDelete: () => void
  commentsOpen: boolean
  onToggleComments: () => void
  onCommentAdded: (c: Comment) => void
  isLoggedIn: boolean
  onAuthNeeded: () => void
  currentUserId?: string
  isBookmarked?: boolean
  onToggleBookmark?: () => void
  canBookmark?: boolean
}) {
  const cat = categoryMeta(post.category)
  const mood = moodMeta(post.mood)
  const reactionCount = post._count?.reactions ?? post.likes ?? 0

  return (
    <Card
      id={`post-${post.id}`}
      className="group relative overflow-hidden border-border/60 hover:border-rose-500/30 hover:shadow-xl hover:shadow-rose-500/[0.07] transition-all duration-300 scroll-mt-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500/0 via-rose-500/30 to-fuchsia-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <UserAvatar username={post.author.username} avatarUrl={post.author.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[15px] leading-none truncate">
                @{post.author.username}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
              {(post.content?.length ?? 0) > 160 && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    {readingTime(post.content)}
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className={cn('gap-1 px-2 py-0.5 rounded-full', cat.color)}>
                <span className="text-[11px] leading-none">{cat.emoji}</span>
                {cat.label}
              </Badge>
              {mood && (
                <Badge variant="outline" className="gap-1 px-2 py-0.5 rounded-full text-muted-foreground">
                  <span className="text-[11px] leading-none">{mood.emoji}</span>
                  {mood.label}
                </Badge>
              )}
            </div>
          </div>
          {canBookmark && onToggleBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full transition-colors',
                isBookmarked
                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-500/10'
                  : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'
              )}
              onClick={onToggleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Save post'}
            >
              <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-amber-500')} />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
              onClick={onDelete}
              aria-label="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Body */}
        <div>
          {post.title && (
            <h3 className="font-display text-xl font-semibold leading-snug mb-2 text-foreground">
              {post.title}
            </h3>
          )}
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
            {post.content}
          </p>
        </div>

        {/* Reactions row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {REACTION_EMOJIS.map((emoji) => {
            const isOn = reactedEmojis.has(emoji)
            return (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.12, y: -1 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => onReact(emoji)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm border transition-colors',
                  isOn
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                    : 'bg-background/60 border-border/60 text-muted-foreground hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-foreground'
                )}
                aria-label={`React with ${emoji}`}
                aria-pressed={isOn}
              >
                <motion.span
                  key={isOn ? 'on' : 'off'}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="text-base leading-none"
                >
                  {emoji}
                </motion.span>
              </motion.button>
            )
          })}
          <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className={cn('h-3.5 w-3.5', reactionCount > 0 && 'fill-rose-500 text-rose-500')} />
            {reactionCount}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant={commentsOpen ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 rounded-full gap-1.5',
                commentsOpen && 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15'
              )}
              onClick={onToggleComments}
            >
              <MessageCircle className={cn('h-4 w-4', commentsOpen && 'fill-rose-500/20')} />
              <span className="text-sm">{post._count?.comments ?? 0}</span>
              <span className="hidden sm:inline">{commentsOpen ? 'Hide' : 'Comment'}</span>
            </Button>
          </div>
        </div>

        {/* Comments thread */}
        <AnimatePresence initial={false}>
          {commentsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <CommentThread
                postId={post.id}
                onCommentAdded={onCommentAdded}
                isLoggedIn={isLoggedIn}
                onAuthNeeded={onAuthNeeded}
                currentUserId={currentUserId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// ---------- Comment Thread ----------
function CommentThread({
  postId,
  onCommentAdded,
  isLoggedIn,
  onAuthNeeded,
  currentUserId,
}: {
  postId: string
  onCommentAdded: (c: Comment) => void
  isLoggedIn: boolean
  onAuthNeeded: () => void
  currentUserId?: string
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api<Comment[]>(`/api/posts/${postId}/comments`)
      setComments(res || [])
    } catch (e: any) {
      toast.error(e.message || 'Could not load comments')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // auto-scroll to bottom on new comment
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comments.length])

  const submit = async () => {
    if (!isLoggedIn) {
      onAuthNeeded()
      return
    }
    const text = draft.trim()
    if (!text) return
    setSubmitting(true)
    try {
      const created = await api<Comment>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        json: { content: text },
      })
      setComments((prev) => [...prev, created])
      onCommentAdded(created)
      setDraft('')
      toast.success('Comment posted 💬')
    } catch (e: any) {
      if (e.status === 401) onAuthNeeded()
      else toast.error(e.message || 'Could not post comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border/50 bg-muted/30 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {loading ? 'Loading comments…' : `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
        </p>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchComments} aria-label="Refresh comments">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="max-h-[320px] overflow-y-auto scroll-soft pr-1">
        <div ref={scrollRef} className="space-y-3">
          {loading ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-6 text-center">
              <MessageCircleHeart className="mx-auto h-8 w-8 text-rose-500/40 mb-2" />
              <p className="text-sm text-muted-foreground">Be the first to reply with kindness.</p>
            </div>
          ) : (
            comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2.5"
              >
                <UserAvatar username={c.author.username} avatarUrl={c.author.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl rounded-tl-sm bg-background border border-border/40 px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold">
                        @{c.author.username}
                      </span>
                      {currentUserId === c.author.id && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 rounded-full text-rose-600 border-rose-500/30">
                          you
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                      {c.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="mt-3 flex items-end gap-2">
        <Textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={isLoggedIn ? 'Write a kind reply…  (⌘+Enter to send)' : 'Sign in to leave a reply…'}
          disabled={!isLoggedIn}
          className="min-h-[44px] max-h-32 resize-y text-sm bg-background"
        />
        <Button
          onClick={submit}
          disabled={submitting || !draft.trim() || !isLoggedIn}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-md shadow-rose-500/30"
          aria-label="Send comment"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

// ---------- Empty State ----------
function EmptyState({ onShare }: { onShare: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-12"
    >
      <Card className="relative overflow-hidden border-dashed border-rose-500/30">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-rose-500/[0.06] via-transparent to-fuchsia-500/[0.06]" />
        <CardContent className="p-10 text-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white shadow-xl shadow-rose-500/30"
          >
            <Heart className="h-8 w-8 fill-white/30" />
          </motion.div>
          <h3 className="font-display text-2xl font-semibold">
            A blank page, waiting for a heart
          </h3>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto leading-relaxed">
            No stories here yet. This is a quiet corner — you could be the one to fill it with something kind.
          </p>
          <Button
            onClick={onShare}
            className="mt-6 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-lg shadow-rose-500/30 h-11 px-6"
          >
            <Heart className="h-4 w-4 mr-2 fill-white" />
            Start the first post
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------- Skeleton ----------
function PostListSkeleton() {
  return (
    <div className="mt-6 space-y-5">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="border-border/60">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              {[0, 1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-7 w-9 rounded-full" />
              ))}
              <Skeleton className="ml-auto h-8 w-24 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
