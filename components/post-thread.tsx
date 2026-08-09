'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Flag, Send, MessageCircle } from 'lucide-react'
import { api, timeAgo } from '@/lib/api'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useApp } from '@/lib/store'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Comment = {
  id: string
  content: string
  createdAt: string
  author: { id: string; username: string; avatarUrl?: string | null }
}

type PostDetail = {
  id: string
  content: string
  category?: string | null
  mood?: string | null
  createdAt: string
  author: { id: string; username: string; avatarUrl?: string | null }
  comments: Comment[]
  _count?: { comments?: number; reactions?: number }
}

export function PostThread({
  postId,
  open,
  onOpenChange,
}: {
  postId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { user, openAuth } = useCurrentUser() as any
  const app = useApp()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('harassment')
  const [details, setDetails] = useState('')

  useEffect(() => {
    if (!open || !postId) return
    let active = true
    setLoading(true)
    api<PostDetail>(`/api/posts/${postId}`)
      .then((p) => {
        if (active) setPost(p)
      })
      .catch((e) => toast.error(e?.message || 'Could not load post'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [open, postId])

  async function submitComment() {
    if (!user) {
      app.openAuth('login')
      return
    }
    if (!text.trim() || !postId) return
    setSending(true)
    try {
      const c = await api<Comment>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        json: { content: text.trim() },
      })
      setPost((p) => (p ? { ...p, comments: [...(p.comments || []), c] } : p))
      setText('')
      toast.success('Comment shared')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to comment')
    } finally {
      setSending(false)
    }
  }

  async function submitReport() {
    if (!user) {
      app.openAuth('login')
      return
    }
    if (!postId) return
    try {
      await api('/api/reports', {
        method: 'POST',
        json: { targetType: 'post', targetId: postId, reason, details },
      })
      toast.success('Report sent — thank you for helping keep HeartSpace kind')
      setReportOpen(false)
      setDetails('')
    } catch (e: any) {
      toast.error(e?.message || 'Could not send report')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Conversation</DialogTitle>
            <DialogDescription>Read the full post and leave a kind reply.</DialogDescription>
          </DialogHeader>

          {loading || !post ? (
            <div className="py-12 grid place-items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <UserAvatar username={post.author.username} avatarUrl={post.author.avatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">@{post.author.username}</p>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-rose-600 inline-flex items-center gap-1"
                      onClick={() => setReportOpen(true)}
                    >
                      <Flag className="h-3.5 w-3.5" /> Report
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2 inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-rose-500" />
                  Comments ({post.comments?.length ?? 0})
                </p>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {(post.comments || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Be the first to reply with care.</p>
                  ) : (
                    post.comments.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <UserAvatar username={c.author.username} avatarUrl={c.author.avatarUrl} size="sm" />
                        <div className="rounded-xl bg-muted/50 px-3 py-2 flex-1">
                          <p className="text-xs font-medium">@{c.author.username}</p>
                          <p className="text-sm mt-0.5">{c.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(c.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 1000))}
                    placeholder="Write a kind reply…"
                    rows={2}
                    className="min-h-[60px]"
                  />
                  <Button
                    size="icon"
                    className="shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"
                    disabled={sending || !text.trim()}
                    onClick={submitComment}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
            <DialogDescription>Reports are reviewed by a human. Thank you for protecting the space.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="harassment">Harassment or bullying</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="hate">Hate or discrimination</SelectItem>
                <SelectItem value="self-harm">Self-harm concern</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Optional details"
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
            />
            <Button className="w-full rounded-full" onClick={submitReport}>
              Submit report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
