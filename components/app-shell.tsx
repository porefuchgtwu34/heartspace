'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
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

const viewFade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

const viewTransition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
}

function ViewFrame({ viewKey, children }: { viewKey: ViewKey; children: React.ReactNode }) {
  return (
    <motion.div
      key={viewKey}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={viewFade}
      transition={viewTransition}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

export function AppShell() {
  const { view, navigate, openAuth, setParams } = useApp()
  const { user, isLoading } = useCurrentUser()

  // hydrate view + email verification / password reset from URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const v = url.searchParams.get('view') as ViewKey | null
    if (v) {
      const p: Record<string, string> = {}
      url.searchParams.forEach((val, key) => {
        if (key !== 'view' && key !== 'verify' && key !== 'reset') p[key] = val
      })
      navigate(v, p)
    }

    const verifyToken = url.searchParams.get('verify')
    if (verifyToken) {
      ;(async () => {
        try {
          const res = await api<{ ok?: boolean; message?: string }>(
            '/api/auth/verify-email',
            { method: 'POST', json: { token: verifyToken } }
          )
          toast.success(res.message || 'Email verified! You can sign in.')
          openAuth('login')
        } catch (e: any) {
          toast.error(e?.message || 'Verification failed. Request a new link.')
          openAuth('verify')
        } finally {
          url.searchParams.delete('verify')
          window.history.replaceState({}, '', url.toString())
        }
      })()
    }

    const resetToken = url.searchParams.get('reset')
    if (resetToken) {
      setParams({ resetToken })
      openAuth('reset')
      url.searchParams.delete('reset')
      window.history.replaceState({}, '', url.toString())
    }
  }, [navigate, openAuth, setParams])

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
      <main className="flex-1 w-full relative">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'home' && (
            <ViewFrame viewKey="home">
              <HomeView />
            </ViewFrame>
          )}
          {view === 'community' && (
            <ViewFrame viewKey="community">
              <CommunityView />
            </ViewFrame>
          )}
          {view === 'messages' && (
            <ViewFrame viewKey="messages">
              <MessagesView />
            </ViewFrame>
          )}
          {view === 'journal' && (
            <ViewFrame viewKey="journal">
              <JournalView />
            </ViewFrame>
          )}
          {view === 'quiz' && (
            <ViewFrame viewKey="quiz">
              <QuizView />
            </ViewFrame>
          )}
          {view === 'discover' && (
            <ViewFrame viewKey="discover">
              <DiscoverView />
            </ViewFrame>
          )}
          {view === 'advisor' && (
            <ViewFrame viewKey="advisor">
              <AdvisorView />
            </ViewFrame>
          )}
          {view === 'breathe' && (
            <ViewFrame viewKey="breathe">
              <BreatheView />
            </ViewFrame>
          )}
          {view === 'profile' && (
            <ViewFrame viewKey="profile">
              <ProfileView />
            </ViewFrame>
          )}
          {view === 'admin' && (
            <ViewFrame viewKey="admin">
              <AdminView />
            </ViewFrame>
          )}
        </AnimatePresence>
      </main>
      <AppFooter />
      <AuthModal />
      <ContactDialog />
    </div>
  )
}
