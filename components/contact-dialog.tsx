'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useApp } from '@/lib/store'

export function ContactDialog() {
  const { params, setParams } = useApp()
  const open = params.contactOpen === '1'
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!open) {
      setSent(false)
      setSubject('')
      setMessage('')
    }
  }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      toast.error('Please write a message.')
      return
    }
    setLoading(true)
    try {
      await api('/api/contact', { method: 'POST', json: { subject: subject.trim() || 'General enquiry', message: message.trim() } })
      setSent(true)
      toast.success('Message sent. We reply with heart.')
    } catch (err: any) {
      toast.error(err.message || 'Could not send.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => setParams({ ...params, contactOpen: o ? '1' : '' })}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Send className="h-4 w-4 text-rose-500" /> Reach the team
          </DialogTitle>
          <DialogDescription>
            Questions, feedback, or a kind hello — we read everything. Replies come from a real human (our admin).
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold">Message received 💛</p>
              <p className="text-sm text-muted-foreground mt-1">Our admin will reply from the dashboard. Watch your notifications.</p>
            </div>
            <Button variant="outline" onClick={() => setParams({ ...params, contactOpen: '' })}>Close</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject">Subject</Label>
              <Input id="contact-subject" placeholder="What's this about?" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-msg">Message</Label>
              <Textarea id="contact-msg" placeholder="Write from the heart…" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send message
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
