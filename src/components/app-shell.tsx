'use client'

import { useEffect } from 'react'
import { useApp, type ViewKey } from '@/lib/store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { api } from '@/lib/api'
import { AppHeader } from '@/components/app-header'
import { AppFooter } from '@/components/app-footer'
import { AuthModal } from '@/components/auth-modal'
import { ContactDialog } from '@/components/contact-dialog'
import { HomeView } from '@/components/views/home-view'
import { CommunityView } from '@/components/views/community-view'
import { MessagesView } from '@/components/views/messages-view'
import { JournalView } from '@/components/views/journal-view'
import { QuizView } from '@/components/views/quiz-view'
import { DiscoverView } from '@/components/views/discover-view'
import { AdvisorView } from '@/components/views/advisor-view'
import { BreatheView } from '@/components/views/breathe-view'
import { ProfileView } from '@/components/views/profile-view'
import { AdminView } from '@/components/views/admin-view'
import { FloatingHearts } from '@/components/floating-hearts'

export function AppShell() {
  const { view, navigate, params } = useApp()
  const { user, isLoading } = useCurrentUser()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const v = url.searchParams.get('view') as ViewKey | null
    if (v) {
      const p: Record<string, string> = {}
      url.searchParams.forEach((val, key) => {
        if (key !== 'view') p[key] = val
      })
      navigate(v, p)
    }
    api('/api/seed', { method: 'POST' }).catch(() => {})
  }, [navigate])

  useEffect(() => {
    if (isLoading) return
    const authRequired: ViewKey[] = ['messages', 'journal', 'admin', 'profile', 'discover', 'advisor']
    if (!user && authRequired.includes(view)) {
      useApp.getState().openAuth('login')
    }
  }, [view, user, isLoading])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <FloatingHearts />
      <AppHeader />
      <main className="flex-1 w-full">
        {view === 'home' && <HomeView />}
        {view === 'community' && <CommunityView />}
        {view === 'messages' && <MessagesView />}
        {view === 'journal' && <JournalView />}
        {view === 'quiz' && <QuizView />}
        {view === 'discover' && <DiscoverView />}
        {view === 'advisor' && <AdvisorView />}
        {view === 'breathe' && <BreatheView />}
        {view === 'profile' && <ProfileView />}
        {view === 'admin' && <AdminView />}
      </main>
      <AppFooter />
      <AuthModal />
      <ContactDialog />
    </div>
  )
}
