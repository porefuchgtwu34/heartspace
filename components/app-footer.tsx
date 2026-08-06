'use client'

import { Heart, Mail, Github, Sparkles } from 'lucide-react'
import { useApp } from '@/lib/store'

export function AppFooter() {
  const { navigate, openAuth, setView } = useApp()
  return (
    <footer className="mt-auto border-t border-border/60 bg-gradient-to-b from-background to-rose-500/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-fuchsia-600">
                <Heart className="h-4 w-4 fill-white text-white" />
              </div>
              <p className="font-display text-lg font-bold">
                Heart<span className="text-gradient-rose">Space</span>
              </p>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
              A warm, anonymous community for love, relationships, behaviour and psychology.
              Share your heart. Find your people. Grow together — by username, never by name.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Community online
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600">
                <Sparkles className="h-3 w-3" /> Kindness first
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Explore</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button className="hover:text-rose-600 transition" onClick={() => navigate('community')}>Community feed</button></li>
              <li><button className="hover:text-rose-600 transition" onClick={() => navigate('quiz')}>Love quizzes</button></li>
              <li><button className="hover:text-rose-600 transition" onClick={() => navigate('discover')}>Discover people</button></li>
              <li><button className="hover:text-rose-600 transition" onClick={() => navigate('journal')}>Mood journal</button></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Get in touch</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button className="inline-flex items-center gap-1.5 hover:text-rose-600 transition" onClick={() => useApp.setState({ params: { ...useApp.getState().params, contactOpen: '1' } })}>
                  <Mail className="h-3.5 w-3.5" /> Contact support
                </button>
              </li>
              <li>
                <button className="hover:text-rose-600 transition" onClick={() => openAuth('register')}>
                  Create an account
                </button>
              </li>
              <li>
                <button className="hover:text-rose-600 transition" onClick={() => openAuth('login')}>
                  Sign in
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} HeartSpace. Made with <Heart className="inline h-3 w-3 fill-rose-500 text-rose-500 heartbeat" /> for kinder hearts.</p>
          <div className="flex items-center gap-4">
            <button className="hover:text-foreground transition" onClick={() => useApp.setState({ params: { ...useApp.getState().params, contactOpen: '1' } })}>Privacy</button>
            <button className="hover:text-foreground transition" onClick={() => useApp.setState({ params: { ...useApp.getState().params, contactOpen: '1' } })}>Terms</button>
            <span className="inline-flex items-center gap-1">
              <Github className="h-3 w-3" /> Vercel-ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
