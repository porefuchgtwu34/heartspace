'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Heart,
  MapPin,
  CalendarDays,
  Pencil,
  MessageCircle,
  Sparkles,
  BookHeart,
  MessagesSquare,
  HeartHandshake,
  Search,
  Loader2,
  UserCircle2,
  Bookmark,
} from 'lucide-react'

import { useApp } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api, timeAgo } from '@/lib/api'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'
import { INTEREST_OPTIONS, POST_CATEGORIES, MOOD_TAGS } from '@/lib/content'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProfilePost {
  id: string
  content: string
  category?: string | null
  mood?: string | null
  createdAt: string
  _count?: { comments?: number; reactions?: number }
}

interface ProfileData {
  id: string
  username: string
  bio?: string | null
  avatarUrl?: string | null
  age?: number | null
  location?: string | null
  interests?: string | null
  lookingFor?: string | null
  createdAt: string
  posts?: ProfilePost[]
}

const LOOKING_FOR_OPTIONS = [
  { value: 'friendship', label: 'Friendship', emoji: '🤝' },
  { value: 'dating', label: 'Dating', emoji: '🌹' },
  { value: 'relationship', label: 'Relationship', emoji: '💞' },
  { value: 'networking', label: 'Networking', emoji: '✨' },
]

function parseInterests(raw?: string | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function interestColor(interest: string): string {
  const palettes = [
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200',
    'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
  ]
  let h = 0
  for (let i = 0; i < interest.length; i++) h = (h * 31 + interest.charCodeAt(i)) >>> 0
  return palettes[h % palettes.length]
}

function categoryMeta(value?: string | null) {
  return POST_CATEGORIES.find((c) => c.value === value) ?? POST_CATEGORIES[0]
}

function moodMeta(value?: string | null) {
  return MOOD_TAGS.find((m) => m.value === value)
}

function lookingForMeta(value?: string | null) {
  return LOOKING_FOR_OPTIONS.find((o) => o.value === value)
}

export function ProfileView() {
  const { params, navigate, openAuth } = useApp()
  const { user, isLoading: userLoading } = useCurrentUser()

  const targetId = params.id && params.id !== user?.id ? params.id : user?.id
  const isOwn = !params.id || params.id === user?.id

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [posts, setPosts] = useState<ProfilePost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsTotal, setPostsTotal] = useState(0)

  // Aggregate profile stats (reactions received, matches, journal entries)
  const [stats, setStats] = useState<{ reactionsReceived: number; matches: number; journalEntries: number; comments: number } | null>(null)

  // Saved (bookmarked) posts — only for own profile
  const [saved, setSaved] = useState<ProfilePost[]>([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedLoaded, setSavedLoaded] = useState(false)

  const [editOpen, setEditOpen] = useState(false)

  const loadProfile = useCallback(async (id: string) => {
    setProfileLoading(true)
    setProfileError(null)
    try {
      const data = await api<ProfileData>(`/api/users/${id}`)
      setProfile(data)
    } catch (e: any) {
      setProfileError(e?.message ?? 'Failed to load profile')
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const loadPosts = useCallback(async (id: string) => {
    setPostsLoading(true)
    try {
      const res = await api<{ posts: ProfilePost[]; total: number }>(
        `/api/posts?authorId=${id}&page=1`
      )
      setPosts(res.posts ?? [])
      setPostsTotal(res.total ?? 0)
    } catch {
      setPosts([])
    } finally {
      setPostsLoading(false)
    }
  }, [])

  const loadStats = useCallback(async (id: string) => {
    try {
      const s = await api<{ reactionsReceived: number; matches: number; journalEntries: number; comments: number }>(`/api/users/${id}/stats`)
      setStats(s)
    } catch {
      setStats(null)
    }
  }, [])

  const loadSaved = useCallback(async () => {
    setSavedLoading(true)
    try {
      const rows = await api<ProfilePost[]>('/api/bookmarks')
      setSaved(rows ?? [])
    } catch {
      setSaved([])
    } finally {
      setSavedLoading(false)
      setSavedLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!targetId) return
    loadProfile(targetId)
    loadPosts(targetId)
    loadStats(targetId)
  }, [targetId, loadProfile, loadPosts, loadStats])

  // Lazy-load saved posts when own profile is viewed (load once)
  useEffect(() => {
    if (isOwn && user && !savedLoaded && !savedLoading) {
      loadSaved()
    }
  }, [isOwn, user, savedLoaded, savedLoading, loadSaved])

  // ---- Loading / not-signed-in guards ----
  if (userLoading || (!user && !params.id)) {
    return <ProfileSkeleton />
  }
  if (!targetId) {
    return (
      <EmptyState
        icon={<UserCircle2 className="h-8 w-8" />}
        title="Sign in to view profiles"
        description="Log in to see your profile and connect with other hearts."
        action={
          <Button onClick={() => openAuth('login')} className="rounded-full">
            Sign in
          </Button>
        }
      />
    )
  }

  if (profileError) {
    return (
      <EmptyState
        icon={<Heart className="h-8 w-8" />}
        title="We couldn't load this profile"
        description={profileError}
        action={
          <Button variant="outline" onClick={() => loadProfile(targetId)} className="rounded-full">
            Try again
          </Button>
        }
      />
    )
  }

  if (profileLoading || !profile) {
    return <ProfileSkeleton />
  }

  const interests = parseInterests(profile.interests)
  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
  const lf = lookingForMeta(profile.lookingFor)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 md:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="relative overflow-hidden border-border/60 shadow-xl shadow-rose-500/5">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-rose-500/20 via-fuchsia-500/15 to-amber-400/15" />
          <CardContent className="relative pt-10 pb-6 px-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              <div className="relative -mt-6">
                <div className="rounded-full ring-4 ring-background">
                  <UserAvatar username={profile.username} avatarUrl={profile.avatarUrl} size="xl" className="h-24 w-24 text-2xl" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight truncate">
                    @{profile.username}
                  </h1>
                  {lf && (
                    <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 rounded-full gap-1">
                      <span>{lf.emoji}</span>
                      {lf.label}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> Joined {memberSince}
                  </span>
                  {profile.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {profile.location}
                    </span>
                  )}
                  {profile.age != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-medium">{profile.age}</span> yrs
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 sm:ml-auto">
                {isOwn ? (
                  <Button
                    onClick={() => setEditOpen(true)}
                    className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-lg shadow-rose-500/25"
                  >
                    <Pencil className="h-4 w-4 mr-1.5" /> Edit profile
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('messages', { with: profile.id })}
                    className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-lg shadow-rose-500/25"
                  >
                    <MessageCircle className="h-4 w-4 mr-1.5" /> Message
                  </Button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio ? (
              <p className="mt-5 text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-5 text-sm italic text-muted-foreground">
                {isOwn
                  ? 'Your bio is empty — tell the community a little about your heart.'
                  : 'This heart is still finding their words.'}
              </p>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {interests.map((it) => (
                  <span
                    key={it}
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      interestColor(it)
                    )}
                  >
                    {it}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatCard
          icon={<MessageCircle className="h-4 w-4" />}
          value={postsTotal}
          label="Posts"
          tint="text-rose-500 bg-rose-500/10"
        />
        <StatCard
          icon={<Heart className="h-4 w-4" />}
          value={stats ? stats.reactionsReceived : '—'}
          label="Reactions"
          tint="text-pink-500 bg-pink-500/10"
        />
        <StatCard
          icon={<HeartHandshake className="h-4 w-4" />}
          value={stats ? stats.matches : '—'}
          label="Matches"
          tint="text-fuchsia-500 bg-fuchsia-500/10"
        />
        <StatCard
          icon={<BookHeart className="h-4 w-4" />}
          value={isOwn && stats ? stats.journalEntries : '—'}
          label="Journal"
          tint="text-amber-500 bg-amber-500/10"
        />
      </motion.div>

      {/* Posts + Saved tabs */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-8"
      >
        <Tabs defaultValue="posts">
          <TabsList className={cn('grid w-full max-w-sm', isOwn ? 'grid-cols-2' : 'grid-cols-1')}>
            <TabsTrigger value="posts" className="gap-1.5">
              <MessagesSquare className="h-4 w-4" /> Posts
              <span className="ml-1 text-xs text-muted-foreground">{postsTotal}</span>
            </TabsTrigger>
            {isOwn && (
              <TabsTrigger value="saved" className="gap-1.5">
                <Bookmark className="h-4 w-4" /> Saved
                <span className="ml-1 text-xs text-muted-foreground">{saved.length}</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts tab */}
          <TabsContent value="posts" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <MessagesSquare className="h-5 w-5 text-rose-500" /> Recent posts
              </h2>
              <span className="text-xs text-muted-foreground">{postsTotal} total</span>
            </div>

            {postsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card className="border-dashed border-border/60">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-8 w-8 mx-auto text-rose-400 mb-3" />
                  <p className="font-medium">No posts yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isOwn
                      ? 'Share your first thought with the community.'
                      : 'This heart hasn’t shared anything publicly.'}
                  </p>
                  {isOwn && (
                    <Button
                      onClick={() => navigate('community')}
                      className="mt-4 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white"
                    >
                      <MessageCircle className="h-4 w-4 mr-1.5" /> Go to community
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto scroll-soft pr-1">
                {posts.map((p, idx) => (
                  <PostCard key={p.id} post={p} index={idx} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved tab (own profile only) */}
          {isOwn && (
            <TabsContent value="saved" className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-amber-500" /> Saved posts
                </h2>
                <span className="text-xs text-muted-foreground">{saved.length} saved</span>
              </div>

              {savedLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Card key={i} className="border-border/60">
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : saved.length === 0 ? (
                <Card className="border-dashed border-border/60">
                  <CardContent className="py-12 text-center">
                    <Bookmark className="h-8 w-8 mx-auto text-amber-400 mb-3" />
                    <p className="font-medium">Nothing saved yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tap the bookmark icon on any post to keep it close.
                    </p>
                    <Button
                      onClick={() => navigate('community')}
                      variant="outline"
                      className="mt-4 rounded-full"
                    >
                      <MessageCircle className="h-4 w-4 mr-1.5" /> Browse the community
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 max-h-[640px] overflow-y-auto scroll-soft pr-1">
                  {saved.map((p, idx) => (
                    <PostCard key={p.id} post={p} index={idx} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </motion.section>

      {/* Edit dialog */}
      {isOwn && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          onSaved={(updated) => {
            setProfile((p) => (p ? { ...p, ...updated } : p))
            toast.success('Profile updated')
          }}
        />
      )}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({
  icon,
  value,
  label,
  tint,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  tint: string
}) {
  return (
    <Card className="border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('grid h-9 w-9 place-items-center rounded-xl', tint)}>{icon}</div>
        <div className="min-w-0">
          <p className="font-display text-xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PostCard({ post, index }: { post: ProfilePost; index: number }) {
  const cat = categoryMeta(post.category)
  const mood = moodMeta(post.mood)
  const comments = post._count?.comments ?? 0
  const reactions = post._count?.reactions ?? 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className="border-border/60 hover:border-rose-500/30 hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                cat.color
              )}
            >
              <span>{cat.emoji}</span> {cat.label}
            </span>
            {mood && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground">
                <span>{mood.emoji}</span> {mood.label}
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
          </div>
          <p className="text-sm leading-relaxed line-clamp-4 whitespace-pre-wrap">{post.content}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> {comments}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {reactions}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <Card className="border-dashed border-border/60">
        <CardContent className="py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4">
            {icon}
          </div>
          <h3 className="font-display text-xl font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{description}</p>}
          {action && <div className="mt-5">{action}</div>}
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 md:py-12">
      <Card className="border-border/60">
        <CardContent className="pt-10 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <Skeleton className="h-24 w-24 rounded-full -mt-6" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
          <div className="mt-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="mt-5 flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-3 w-14" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Edit dialog
// ============================================================

function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profile: ProfileData
  onSaved: (updated: Partial<ProfileData>) => void
}) {
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '')
  const [age, setAge] = useState<string>(profile.age != null ? String(profile.age) : '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [selectedInterests, setSelectedInterests] = useState<string[]>(parseInterests(profile.interests))
  const [lookingFor, setLookingFor] = useState<string>(profile.lookingFor ?? 'friendship')
  const [saving, setSaving] = useState(false)
  const [interestQuery, setInterestQuery] = useState('')

  // Reset fields when dialog opens (handles profile changes)
  useEffect(() => {
    if (open) {
      setBio(profile.bio ?? '')
      setAvatarUrl(profile.avatarUrl ?? '')
      setAge(profile.age != null ? String(profile.age) : '')
      setLocation(profile.location ?? '')
      setSelectedInterests(parseInterests(profile.interests))
      setLookingFor(profile.lookingFor ?? 'friendship')
      setInterestQuery('')
    }
  }, [open, profile])

  const filteredInterests = useMemo(() => {
    const q = interestQuery.toLowerCase()
    return INTEREST_OPTIONS.filter((o) => !q || o.toLowerCase().includes(q))
  }, [interestQuery])

  function toggleInterest(it: string) {
    setSelectedInterests((prev) =>
      prev.includes(it) ? prev.filter((x) => x !== it) : prev.length < 10 ? [...prev, it] : prev
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body: any = {
        bio: bio.slice(0, 280),
        avatarUrl: avatarUrl.trim(),
        age: age ? Number(age) : undefined,
        location: location.trim(),
        interests: selectedInterests.join(','),
        lookingFor,
      }
      const updated = await api<Partial<ProfileData>>(`/api/users/${profile.id}`, {
        method: 'PATCH',
        json: body,
      })
      onSaved(updated)
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto scroll-soft">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit your profile</DialogTitle>
          <DialogDescription>
            Tell the community who you are. Username-only — keep it kind and you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar preview + url */}
          <div className="flex items-center gap-4">
            <UserAvatar username={profile.username} avatarUrl={avatarUrl || null} size="lg" />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="avatar-url">Avatar URL</Label>
              <Input
                id="avatar-url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Leave empty for a gradient avatar"
              />
              <p className="text-xs text-muted-foreground">Paste a photo URL, or leave blank for a colorful gradient.</p>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className={cn('text-xs', bio.length > 280 ? 'text-destructive' : 'text-muted-foreground')}>
                {bio.length}/280
              </span>
            </div>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 280))}
              rows={3}
              placeholder="A few warm words about you, your story, or what you're looking for."
            />
          </div>

          {/* Age + location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="—"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value.slice(0, 80))}
                placeholder="City, country (optional)"
              />
            </div>
          </div>

          {/* Looking for */}
          <div className="space-y-1.5">
            <Label>Looking for</Label>
            <Select value={lookingFor} onValueChange={setLookingFor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose what you're open to" />
              </SelectTrigger>
              <SelectContent>
                {LOOKING_FOR_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span>{o.emoji}</span> {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interests (chip picker) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Interests</Label>
              <span className="text-xs text-muted-foreground">{selectedInterests.length}/10</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={interestQuery}
                onChange={(e) => setInterestQuery(e.target.value)}
                placeholder="Search interests…"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scroll-soft rounded-lg border border-border/60 p-2 bg-muted/30">
              {filteredInterests.map((it) => {
                const active = selectedInterests.includes(it)
                return (
                  <button
                    key={it}
                    type="button"
                    onClick={() => toggleInterest(it)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-sm'
                        : 'bg-background hover:bg-rose-500/10 text-foreground border border-border/60'
                    )}
                  >
                    {active ? '✓ ' : ''}{it}
                  </button>
                )
              })}
              {filteredInterests.length === 0 && (
                <p className="text-xs text-muted-foreground px-1 py-0.5">No matches.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Pencil className="h-4 w-4 mr-1.5" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
