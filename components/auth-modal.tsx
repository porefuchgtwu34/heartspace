'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Heart, Mail, Lock, User, Sparkles, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useApp } from '@/lib/store'

export function AuthModal() {
  const { authModal, closeAuth, openAuth } = useApp()
  const [loading, setLoading] = useState(false)
  const [resetPreview, setResetPreview] = useState<string | null>(null)

  // login
  const [loginId, setLoginId] = useState('')
  const [loginPass, setLoginPass] = useState('')
  // register
  const [regUser, setRegUser] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regBio, setRegBio] = useState('')
  // reset
  const [resetEmail, setResetEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetPass, setResetPass] = useState('')

  const open = authModal !== null

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!loginId.trim() || !loginPass) {
      toast.error('Please fill in both fields.')
      return
    }
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        identifier: loginId.trim(),
        password: loginPass,
        redirect: false,
      })
      if (!res || res.error) {
        toast.error(res?.error || 'Could not sign in.')
      } else {
        toast.success('Welcome back 💕')
        closeAuth()
        setLoginId('')
        setLoginPass('')
        setTimeout(() => window.location.reload(), 300)
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!regUser.trim() || !regEmail.trim() || !regPass) {
      toast.error('Please fill in all fields.')
      return
    }
    if (regPass.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (!/[a-zA-Z]/.test(regPass) || !/[0-9]/.test(regPass)) {
      toast.error('Password must include at least one letter and one number.')
      return
    }
    setLoading(true)
    try {
      await api('/api/auth/register', {
        method: 'POST',
        json: { username: regUser.trim(), email: regEmail.trim(), password: regPass, bio: regBio.trim() || undefined },
      })
      // auto sign in
      const res = await signIn('credentials', {
        identifier: regUser.trim(),
        password: regPass,
        redirect: false,
      })
      if (res && !res.error) {
        toast.success('Your HeartSpace is open. Welcome! 🌹')
        closeAuth()
        setRegUser('')
        setRegEmail('')
        setRegPass('')
        setRegBio('')
        setTimeout(() => window.location.reload(), 300)
      } else {
        toast.success('Account created — please sign in.')
        openAuth('login')
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail.trim()) {
      toast.error('Enter your email.')
      return
    }
    setLoading(true)
    try {
      const res = await api<{ preview: string | null; token?: string }>('/api/auth/reset-request', {
        method: 'POST',
        json: { email: resetEmail.trim() },
      })
      setResetPreview(res.preview)
      if (res.token) setResetToken(res.token)
      toast.success('If that email exists, a reset link has been sent.')
    } catch (err: any) {
      toast.error(err.message || 'Could not process request.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetToken.trim() || !resetPass) {
      toast.error('Paste your reset token and choose a new password.')
      return
    }
    if (resetPass.length < 8 || !/[a-zA-Z]/.test(resetPass) || !/[0-9]/.test(resetPass)) {
      toast.error('Password must be at least 8 characters with a letter and a number.')
      return
    }
    setLoading(true)
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        json: { token: resetToken.trim(), password: resetPass },
      })
      toast.success('Password updated. Please sign in.')
      setResetToken('')
      setResetPass('')
      setResetPreview(null)
      setResetEmail('')
      openAuth('login')
    } catch (err: any) {
      toast.error(err.message || 'Reset failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : closeAuth())}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0">
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 p-6 pb-8 text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex items-center gap-2">
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-white/20 backdrop-blur">
              <Heart className="h-5 w-5 fill-white" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold leading-none">HeartSpace</p>
              <p className="text-xs text-white/80 mt-1">Share your heart. Find your people.</p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-5">
          {authModal === 'reset' ? (
            <div className="space-y-4">
              <div>
                <Button variant="ghost" size="sm" className="-ml-2 mb-1 text-muted-foreground" onClick={() => openAuth('login')}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in
                </Button>
                <h3 className="font-display text-lg font-semibold">Reset your password</h3>
                <p className="text-sm text-muted-foreground">We'll send a reset link to your email.</p>
              </div>
              {!resetPreview ? (
                <form onSubmit={handleResetRequest} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="reset-email" type="email" placeholder="you@example.com" className="pl-9" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Send reset link
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                    {resetPreview}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-token">Reset token</Label>
                    <Input id="reset-token" placeholder="paste token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-pass">New password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="reset-pass" type="password" placeholder="8+ chars, letter + number" className="pl-9" value={resetPass} onChange={(e) => setResetPass(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Update password
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <Tabs defaultValue={authModal === 'register' ? 'register' : 'login'} key={authModal}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={() => openAuth('login')}>Sign in</TabsTrigger>
                <TabsTrigger value="register" onClick={() => openAuth('register')}>Join</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-id">Username or email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="login-id" placeholder="username or email" className="pl-9" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-pass">Password</Label>
                      <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => openAuth('reset')}>Forgot?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="login-pass" type="password" placeholder="••••••••" className="pl-9" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-4">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-user">Username <span className="text-muted-foreground">(public identity)</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="reg-user" placeholder="choose a username" className="pl-9" value={regUser} onChange={(e) => setRegUser(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email <span className="text-muted-foreground">(kept private)</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="reg-email" type="email" placeholder="you@example.com" className="pl-9" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-pass">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="reg-pass" type="password" placeholder="8+ chars, letter + number" className="pl-9" value={regPass} onChange={(e) => setRegPass(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-bio">Bio <span className="text-muted-foreground">(optional)</span></Label>
                    <Textarea id="reg-bio" placeholder="a line about your heart…" rows={2} value={regBio} onChange={(e) => setRegBio(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Heart className="h-4 w-4 mr-2" />}
                    Create my space
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    By joining you agree to be kind. Always.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
