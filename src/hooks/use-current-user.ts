'use client'

import { useSession } from 'next-auth/react'

export type CurrentUser = {
  id: string
  username: string
  email: string
  role: string
}

export function useCurrentUser(): {
  user: CurrentUser | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
  isAdmin: boolean
} {
  const { data: session, status } = useSession()
  const user = session?.user
    ? {
        id: (session.user as any).id,
        username: (session.user as any).username ?? session.user.name ?? '',
        email: session.user.email ?? '',
        role: (session.user as any).role ?? 'user',
      }
    : null
  return {
    user,
    status,
    isLoading: status === 'loading',
    isAdmin: user?.role === 'admin',
  }
}
