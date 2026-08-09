'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ViewKey =
  | 'home'
  | 'community'
  | 'messages'
  | 'journal'
  | 'quiz'
  | 'discover'
  | 'advisor'
  | 'breathe'
  | 'profile'
  | 'admin'

export type AuthMode = 'login' | 'register' | 'reset' | 'verify'

interface AppState {
  view: ViewKey
  setView: (v: ViewKey) => void
  params: Record<string, string>
  setParams: (p: Record<string, string>) => void
  navigate: (v: ViewKey, params?: Record<string, string>) => void
  authModal: AuthMode | null
  openAuth: (mode: AuthMode) => void
  closeAuth: () => void
  composeOpen: boolean
  setComposeOpen: (v: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      view: 'home',
      setView: (view) => set({ view }),
      params: {},
      setParams: (params) => set({ params }),
      navigate: (view, params = {}) => {
        set({ view, params, sidebarOpen: false })
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.set('view', view)
          Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
          window.history.replaceState({}, '', url.toString())
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      },
      authModal: null,
      openAuth: (authModal) => set({ authModal }),
      closeAuth: () => set({ authModal: null }),
      composeOpen: false,
      setComposeOpen: (composeOpen) => set({ composeOpen }),
      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'heartspace-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ view: s.view }),
    }
  )
)
