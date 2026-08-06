'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useApp, type ViewKey } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Heart,
  Home,
  MessageCircle,
  BookHeart,
  Sparkles,
  Flame,
  Shield,
  User as UserIcon,
  Menu,
  LogOut,
  Sun,
  Moon,
  Mail,
  Bell,
  Settings,
  Wind,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { api, timeAgo } from '@/lib/api'
import { UserAvatar } from '@/components/user-avatar'
import { toast } from 'sonner'
import Link from 'next/link'

const NAV: { key: ViewKey; label: string; icon: any; auth?: boolean; admin?: boolean }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'community', label: 'Community', icon: MessageCircle },
  { key: 'advisor', label: 'Aria AI', icon: Sparkles, auth: true },
  { key: 'breathe', label: 'Breathe', icon: Wind },
  { key: 'discover', label: 'Discover', icon: Flame, auth: true },
  { key: 'messages', label: 'Messages', icon: BookHeart, auth: true },
  { key: 'journal', label: 'Journal', icon: Heart, auth: true },
  { key: 'quiz', label: 'Quizzes', icon: Heart },
]

export function AppHeader() {
  const { view, navigate, openAuth } = useApp()
  const { user, isLoading, isAdmin } = useCurrentUser()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => setMounted(true), [])

  // poll notifications
  useEffect(() => {
    if (!user) return
    let active = true
    const load = async () => {
      try {
        const res = await api<{ notes: any[]; unreadCount: number }>('/api/notifications?unread=0')
        if (!active) return
        setNotifications(res.notes.slice(0, 8))
        setUnread(res.unreadCount)
      } catch {}
    }
    load()
    const t = setInterval(load, 25000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [user])

  async function markAllRead() {
    try {
      await api('/api/notifications', { method: 'PATCH', json: { all: true } })
      setNotifications((n) => n.map((x) => ({ ...x, read: true })))
      setUnread(0)
    } catch {}
  }

  function handleNav(item: (typeof NAV)[number]) {
    if (item.auth && !user) {
      openAuth('login')
      return
    }
    navigate(item.key)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="group flex items-center gap-2 mr-2 shrink-0"
          aria-label="HeartSpace home"
        >
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 shadow-lg shadow-rose-500/30 transition-transform group-hover:scale-105">
            <Heart className="h-5 w-5 fill-white text-white" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="font-display text-lg font-bold leading-none tracking-tight">
              Heart<span className="text-gradient-rose">Space</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">love · psychology · us</p>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = view === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item)}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-rose-600 bg-rose-500/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className={cn('h-4 w-4', active && 'fill-rose-500/20')} />
                {item.label}
                {active && (
                  <span className="absolute -bottom-[1px] left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500" />
                )}
              </button>
            )
          })}
          {isAdmin && (
            <button
              onClick={() => navigate('admin')}
              className={cn(
                'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                view === 'admin' ? 'text-amber-600 bg-amber-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

          {/* Contact */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex text-muted-foreground hover:text-foreground"
            onClick={() => useApp.setState({ params: { ...useApp.getState().params, contactOpen: '1' } })}
          >
            <Mail className="h-4 w-4 mr-1.5" /> Contact
          </Button>

          {user ? (
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Bell className="h-4 w-4" />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-rose-600 hover:underline">Mark all read</button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto scroll-soft">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                        <Bell className="mx-auto h-6 w-6 mb-2 opacity-40" />
                        Nothing yet. Connect with people to get updates.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          className="flex-col items-start gap-0.5 py-2.5 px-3 cursor-pointer"
                          onClick={() => {
                            if (n.link) navigate(n.link.split('?view=')[1]?.split('&')[0] as ViewKey, Object.fromEntries(new URLSearchParams(n.link.split('?')[1] || '')))
                            api('/api/notifications', { method: 'PATCH', json: { id: n.id } }).catch(() => {})
                            setUnread((u) => Math.max(0, u - 1))
                            setNotifications((arr) => arr.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
                          }}
                        >
                          <div className="flex w-full items-start gap-2">
                            <span className={cn('mt-1 h-2 w-2 rounded-full shrink-0', n.read ? 'bg-transparent' : 'bg-rose-500')} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight">{n.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-transparent hover:ring-rose-500/30 transition">
                    <UserAvatar username={user.username} size="sm" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <UserAvatar username={user.username} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">@{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('profile')}>
                    <UserIcon className="h-4 w-4 mr-2" /> My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('journal')}>
                    <Sparkles className="h-4 w-4 mr-2" /> My journal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('messages')}>
                    <MessageCircle className="h-4 w-4 mr-2" /> Messages
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('admin')}>
                        <Shield className="h-4 w-4 mr-2" /> Admin dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={async () => {
                      await signOut({ redirect: false })
                      toast.success('Signed out. Take care of your heart 💛')
                      setTimeout(() => window.location.reload(), 300)
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            !isLoading && (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => openAuth('login')} className="hidden sm:flex">
                  Sign in
                </Button>
                <Button size="sm" onClick={() => openAuth('register')} className="bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white shadow-md shadow-rose-500/30">
                  Join free
                </Button>
              </div>
            )
          )}

          {/* Mobile nav */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex items-center gap-2 p-4 border-b bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
                  <Heart className="h-5 w-5 fill-white" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold leading-none">HeartSpace</p>
                  <p className="text-xs text-white/80 mt-0.5">{user ? `@${user.username}` : 'not signed in'}</p>
                </div>
              </div>
              <nav className="p-3 space-y-1">
                {NAV.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNav(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        view === item.key ? 'bg-rose-500/10 text-rose-600' : 'hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  )
                })}
                {isAdmin && (
                  <button
                    onClick={() => navigate('admin')}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      view === 'admin' ? 'bg-amber-500/10 text-amber-600' : 'hover:bg-muted'
                    )}
                  >
                    <Shield className="h-4 w-4" /> Admin
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
