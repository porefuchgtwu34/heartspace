'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import {
  Shield,
  Users,
  MessageCircle,
  MessagesSquare,
  Mail,
  HeartHandshake,
  Ban,
  LayoutDashboard,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Crown,
  UserCircle2,
  Inbox as InboxIcon,
  Reply,
  Archive,
  CheckCheck,
  Loader2,
  Sparkles,
  Home,
  MessageCircleHeart,
  Cookie,
  Bookmark,
} from 'lucide-react'

import { useApp } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, timeAgo } from '@/lib/api'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'
import { POST_CATEGORIES, MOOD_TAGS } from '@/lib/content'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ============================================================
// Types
// ============================================================

type AdminTab = 'overview' | 'users' | 'posts' | 'inbox'

interface AdminCounts {
  users: number
  posts: number
  comments: number
  messages: number
  contactPending: number
  matches: number
  banned: number
}

interface StatsResponse {
  counts: AdminCounts
  signupsByDay: { date: string; count: number }[]
}

interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  banned: boolean
  createdAt: string
  bio?: string | null
  avatarUrl?: string | null
  _count: { posts: number; messages: number }
}

interface AdminUsersResponse {
  users: AdminUser[]
  total: number
  page: number
  pages: number
}

interface AdminPost {
  id: string
  content: string
  category?: string | null
  mood?: string | null
  createdAt: string
  author: { id: string; username: string }
  _count: { comments: number; reactions: number }
}

interface AdminPostsResponse {
  posts: AdminPost[]
  total: number
  page: number
  pages: number
}

interface ContactRequest {
  id: string
  message: string
  subject?: string | null
  status: string
  adminReply?: string | null
  createdAt: string
  fromUser: { id: string; username: string; email: string; avatarUrl?: string | null }
}

// ============================================================
// Helpers
// ============================================================

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  read: { label: 'Read', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
  replied: { label: 'Replied', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground' },
}

function statusMeta(s: string) {
  return STATUS_META[s] ?? { label: s, color: 'bg-muted text-muted-foreground' }
}

function categoryMeta(value?: string | null) {
  return POST_CATEGORIES.find((c) => c.value === value) ?? POST_CATEGORIES[0]
}

function moodMeta(value?: string | null) {
  return MOOD_TAGS.find((m) => m.value === value)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ============================================================
// Root view
// ============================================================

export function AdminView() {
  const { params, navigate } = useApp()
  const { isAdmin, isLoading } = useCurrentUser()

  // Derive the active tab directly from URL params (single source of truth).
  const tab: AdminTab = (['overview', 'users', 'posts', 'inbox'].includes(params.tab)
    ? (params.tab as AdminTab)
    : 'overview')

  function onTabChange(next: string) {
    navigate('admin', { tab: next })
  }

  // Loading state for session
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // Guard
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-rose-500/20 shadow-xl shadow-rose-500/5">
            <div className="h-2 bg-gradient-to-r from-rose-500 to-fuchsia-600" />
            <CardContent className="py-14 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/10 text-rose-500 mb-5">
                <Shield className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-bold">Admins only</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                This is the moderation console for HeartSpace admins. If you believe you should have
                access, contact the team.
              </p>
              <Button
                onClick={() => navigate('home')}
                className="mt-6 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-lg shadow-rose-500/25"
              >
                <Home className="h-4 w-4 mr-1.5" /> Back to home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/25">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Moderate users, posts, and inbox messages with care.</p>
        </div>
      </motion.div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList className="bg-muted/60 h-auto p-1 rounded-xl flex-wrap">
          <TabsTrigger value="overview" className="rounded-lg gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg gap-1.5">
            <Users className="h-3.5 w-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded-lg gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" /> Posts
          </TabsTrigger>
          <TabsTrigger value="inbox" className="rounded-lg gap-1.5">
            <InboxIcon className="h-3.5 w-3.5" /> Inbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
          <PostsTab />
        </TabsContent>
        <TabsContent value="inbox" className="mt-6">
          <InboxTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// Overview tab
// ============================================================

function OverviewTab() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<StatsResponse>('/api/admin/stats')
      setStats(data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <OverviewSkeleton />
  if (error || !stats) {
    return (
      <TabEmpty
        title="Couldn't load overview"
        description={error ?? 'Unknown error'}
        onRetry={load}
      />
    )
  }

  const cards = [
    { key: 'users', label: 'Total users', value: stats.counts.users, icon: Users, tint: 'text-rose-500 bg-rose-500/10' },
    { key: 'posts', label: 'Posts', value: stats.counts.posts, icon: MessageCircle, tint: 'text-pink-500 bg-pink-500/10' },
    { key: 'comments', label: 'Comments', value: stats.counts.comments, icon: MessagesSquare, tint: 'text-fuchsia-500 bg-fuchsia-500/10' },
    { key: 'messages', label: 'Messages', value: stats.counts.messages, icon: Mail, tint: 'text-violet-500 bg-violet-500/10' },
    { key: 'advisorMessages', label: 'Aria conversations', value: stats.counts.advisorMessages ?? 0, icon: MessageCircleHeart, tint: 'text-fuchsia-500 bg-fuchsia-500/10' },
    { key: 'advisorUsers', label: 'Aria users', value: stats.counts.advisorUsers ?? 0, icon: Sparkles, tint: 'text-purple-500 bg-purple-500/10' },
    { key: 'gratitudeEntries', label: 'Gratitude notes', value: stats.counts.gratitudeEntries ?? 0, icon: Cookie, tint: 'text-amber-500 bg-amber-500/10' },
    { key: 'bookmarks', label: 'Bookmarks', value: stats.counts.bookmarks ?? 0, icon: Bookmark, tint: 'text-orange-500 bg-orange-500/10' },
    { key: 'contactPending', label: 'Pending inbox', value: stats.counts.contactPending, icon: InboxIcon, tint: 'text-amber-500 bg-amber-500/10' },
    { key: 'matches', label: 'Matches', value: stats.counts.matches, icon: HeartHandshake, tint: 'text-orange-500 bg-orange-500/10' },
    { key: 'banned', label: 'Banned users', value: stats.counts.banned, icon: Ban, tint: 'text-red-500 bg-red-500/10' },
  ]

  const chartData = stats.signupsByDay.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="border-border/60 hover:shadow-md hover:border-rose-500/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={cn('grid h-9 w-9 place-items-center rounded-xl', c.tint)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">live</span>
                  </div>
                  <p className="mt-3 font-display text-2xl font-bold leading-none">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{c.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Signups chart */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-rose-500" /> Signups — last 7 days
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">New hearts joining the community.</p>
            </div>
            <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
              Total: {chartData.reduce((a, b) => a + b.count, 0)}
            </Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.05 350 / 0.3)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'oklch(0.5 0.03 350)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: 'oklch(0.5 0.03 350)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'oklch(0.85 0.1 350 / 0.15)' }}
                  contentStyle={{
                    background: 'oklch(1 0.01 60)',
                    border: '1px solid oklch(0.9 0.02 40)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'oklch(0.22 0.04 350)',
                  }}
                  labelStyle={{ color: 'oklch(0.5 0.03 350)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill="url(#signupGradient)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

// ============================================================
// Users tab
// ============================================================

function UsersTab() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<AdminUsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/admin/users?page=${page}${debouncedQ ? `&q=${encodeURIComponent(debouncedQ)}` : ''}`
      const res = await api<AdminUsersResponse>(url)
      setData(res)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQ])

  useEffect(() => {
    load()
  }, [load])

  async function act(id: string, action: 'ban' | 'unban' | 'promote' | 'demote') {
    setBusyId(id)
    try {
      await api('/api/admin/users', { method: 'PATCH', json: { id, action } })
      toast.success(
        action === 'ban' ? 'User banned' :
        action === 'unban' ? 'User unbanned' :
        action === 'promote' ? 'Promoted to admin' :
        'Demoted to user'
      )
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  async function doDelete(id: string) {
    setBusyId(id)
    try {
      await api(`/api/admin/users?id=${id}`, { method: 'DELETE' })
      toast.success('User deleted')
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by username or email…"
          className="pl-9 rounded-full"
        />
      </div>

      {loading ? (
        <UsersSkeleton />
      ) : error ? (
        <TabEmpty title="Couldn't load users" description={error} onRetry={load} />
      ) : !data || data.users.length === 0 ? (
        <TabEmpty
          title="No users found"
          description={debouncedQ ? `No matches for "${debouncedQ}".` : 'There are no users yet.'}
          icon={<UserCircle2 className="h-8 w-8" />}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Posts</TableHead>
                  <TableHead className="text-center">Messages</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar username={u.username} avatarUrl={u.avatarUrl} size="sm" />
                        <span className="font-medium">@{u.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1">
                          <Crown className="h-3 w-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.banned ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" /> Banned
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{u._count.posts}</TableCell>
                    <TableCell className="text-center">{u._count.messages}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{fmtDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right pr-4">
                      <UserRowActions
                        user={u}
                        busy={busyId === u.id}
                        onAct={act}
                        onDelete={() => setDeleteTarget(u)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data.users.map((u) => (
              <Card key={u.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar username={u.username} avatarUrl={u.avatarUrl} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">@{u.username}</span>
                        {u.role === 'admin' && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1">
                            <Crown className="h-3 w-3" /> Admin
                          </Badge>
                        )}
                        {u.banned && (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="h-3 w-3" /> Banned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{u._count.posts} posts</span>
                        <span>{u._count.messages} msgs</span>
                        <span>Joined {fmtDate(u.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <UserRowActions
                      user={u}
                      busy={busyId === u.id}
                      onAct={act}
                      onDelete={() => setDeleteTarget(u)}
                      compact
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onChange={setPage}
          />
        </>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete @{deleteTarget?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the user and cascades their content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && doDelete(deleteTarget.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busyId === deleteTarget?.id ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserRowActions({
  user,
  busy,
  onAct,
  onDelete,
  compact,
}: {
  user: AdminUser
  busy: boolean
  onAct: (id: string, action: 'ban' | 'unban' | 'promote' | 'demote') => void
  onDelete: () => void
  compact?: boolean
}) {
  const btn = cn(compact && 'flex-1')
  return (
    <div className={cn('inline-flex items-center gap-1.5', compact && 'w-full')}>
      <Button
        size="sm"
        variant={user.banned ? 'outline' : 'secondary'}
        disabled={busy}
        onClick={() => onAct(user.id, user.banned ? 'unban' : 'ban')}
        className={cn('h-8 gap-1', btn)}
      >
        {user.banned ? <ArrowUp className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
        {user.banned ? 'Unban' : 'Ban'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onAct(user.id, user.role === 'admin' ? 'demote' : 'promote')}
        className={cn('h-8 gap-1', btn)}
      >
        {user.role === 'admin' ? <ArrowDown className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
        {user.role === 'admin' ? 'Demote' : 'Promote'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={onDelete}
        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function UsersSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="hidden md:block border-border/60">
        <CardContent className="p-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border-b border-border/40 last:border-0">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40 ml-auto" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="md:hidden space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Posts tab
// ============================================================

function PostsTab() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<AdminPostsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<AdminPostsResponse>(`/api/admin/posts?page=${page}`)
      setData(res)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  async function doDelete(id: string) {
    setBusyId(id)
    try {
      await api(`/api/admin/posts?id=${id}`, { method: 'DELETE' })
      toast.success('Post deleted')
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <PostsSkeleton />
  if (error) return <TabEmpty title="Couldn't load posts" description={error} onRetry={load} />
  if (!data || data.posts.length === 0) {
    return (
      <TabEmpty
        title="No posts yet"
        description="The community feed is quiet."
        icon={<MessageCircle className="h-8 w-8" />}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.total} total posts</p>
      </div>
      <div className="space-y-3 max-h-[680px] overflow-y-auto scroll-soft pr-1">
        {data.posts.map((p, idx) => {
          const cat = categoryMeta(p.category)
          const mood = moodMeta(p.mood)
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.25) }}
            >
              <Card className="border-border/60 hover:border-rose-500/30 hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-semibold">
                        {p.author.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">@{p.author.username}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(p.createdAt)} · {timeAgo(p.createdAt)}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === p.id}
                      onClick={() => setDeleteTarget(p)}
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', cat.color)}>
                      <span>{cat.emoji}</span> {cat.label}
                    </span>
                    {mood && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground">
                        <span>{mood.emoji}</span> {mood.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">{p.content}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" /> {p._count.comments}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <HeartHandshake className="h-3.5 w-3.5" /> {p._count.reactions}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
      <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the post and its comments/reactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && doDelete(deleteTarget.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busyId === deleteTarget?.id ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Delete post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PostsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="border-border/60">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// Inbox tab
// ============================================================

function InboxTab() {
  const [status, setStatus] = useState<string>('all')
  const [items, setItems] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/admin/contact?status=${status}`
      const res = await api<ContactRequest[]>(url)
      setItems(res)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  // Auto-select first item on load
  useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0].id)
    if (selectedId && !items.find((i) => i.id === selectedId)) {
      setSelectedId(items[0]?.id ?? null)
    }
  }, [items, selectedId])

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  )

  // Reset reply text when selection changes
  useEffect(() => {
    setReplyText(selected?.adminReply ?? '')
  }, [selectedId, selected?.adminReply])

  async function patch(id: string, payload: { status?: string; adminReply?: string }, successMsg: string) {
    setBusy(true)
    try {
      await api('/api/admin/contact', { method: 'PATCH', json: { id, ...payload } })
      toast.success(successMsg)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  async function sendReply() {
    if (!selected) return
    if (!replyText.trim()) {
      toast.error('Write a reply first')
      return
    }
    await patch(selected.id, { adminReply: replyText.trim(), status: 'replied' }, 'Reply sent')
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{items.length} message{items.length === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <InboxSkeleton />
      ) : error ? (
        <TabEmpty title="Couldn't load inbox" description={error} onRetry={load} />
      ) : items.length === 0 ? (
        <TabEmpty
          title="Inbox is empty"
          description="No contact requests in this view."
          icon={<InboxIcon className="h-8 w-8" />}
        />
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          {/* List */}
          <div className="max-h-[640px] overflow-y-auto scroll-soft lg:pr-1 space-y-2 order-1">
            {items.map((c) => {
              const sm = statusMeta(c.status)
              const active = c.id === selectedId
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-3 transition-all',
                    active
                      ? 'border-rose-500/40 bg-rose-500/5 shadow-sm'
                      : 'border-border/60 hover:border-rose-500/30 hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <UserAvatar username={c.fromUser.username} avatarUrl={c.fromUser.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">@{c.fromUser.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.subject || c.fromUser.email}</p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium', sm.color)}>
                      {sm.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{c.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</p>
                </button>
              )
            })}
          </div>

          {/* Detail */}
          {selected && (
            <Card className="border-border/60 order-2 lg:sticky lg:top-4 lg:self-start">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <UserAvatar username={selected.fromUser.username} avatarUrl={selected.fromUser.avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">@{selected.fromUser.username}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusMeta(selected.status).color)}>
                        {statusMeta(selected.status).label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{selected.fromUser.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(selected.createdAt)} · {timeAgo(selected.createdAt)}</p>
                  </div>
                </div>

                {selected.subject && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Subject</p>
                    <p className="font-medium mt-0.5">{selected.subject}</p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Message</p>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap rounded-lg bg-muted/40 p-3 border border-border/60">
                    {selected.message}
                  </p>
                </div>

                {/* Reply */}
                <div className="mt-4 space-y-2">
                  <Label htmlFor="reply" className="flex items-center gap-1.5">
                    <Reply className="h-3.5 w-3.5" /> Admin reply
                  </Label>
                  <Textarea
                    id="reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="Write a warm, helpful reply…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={sendReply}
                      disabled={busy}
                      className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white"
                    >
                      {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Reply className="h-4 w-4 mr-1.5" />}
                      Send reply
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || selected.status === 'read'}
                      onClick={() => patch(selected.id, { status: 'read' }, 'Marked as read')}
                      className="rounded-full"
                    >
                      <CheckCheck className="h-4 w-4 mr-1.5" /> Mark read
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => patch(selected.id, { status: 'archived' }, 'Archived')}
                      className="rounded-full"
                    >
                      <Archive className="h-4 w-4 mr-1.5" /> Archive
                    </Button>
                  </div>
                </div>

                {selected.adminReply && (
                  <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCheck className="h-3.5 w-3.5" /> Previous reply
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{selected.adminReply}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function InboxSkeleton() {
  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4">
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}

// ============================================================
// Shared bits
// ============================================================

function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number
  pages: number
  total: number
  onChange: (p: number) => void
}) {
  if (pages <= 1) {
    return (
      <p className="text-xs text-muted-foreground text-center">
        Showing {total} of {total}
      </p>
    )
  }
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="h-8 rounded-full"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="h-8 rounded-full"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function TabEmpty({
  title,
  description,
  onRetry,
  icon,
}: {
  title: string
  description?: string
  onRetry?: () => void
  icon?: React.ReactNode
}) {
  return (
    <Card className="border-dashed border-border/60">
      <CardContent className="py-14 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4">
          {icon ?? <InboxIcon className="h-8 w-8" />}
        </div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">{description}</p>}
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-4 rounded-full">
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
