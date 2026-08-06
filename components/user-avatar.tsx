'use client'

import { cn } from '@/lib/utils'
import { avatarGradient, initials } from '@/lib/api'

interface UserAvatarProps {
  username: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  online?: boolean
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

const dotSize = {
  xs: 'h-2 w-2',
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
  xl: 'h-4 w-4',
}

export function UserAvatar({ username, avatarUrl, size = 'md', className, online }: UserAvatarProps) {
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {avatarUrl ? (
         
        <img
          src={avatarUrl}
          alt={username}
          className={cn('rounded-full object-cover ring-2 ring-background', sizeMap[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br grid place-items-center font-semibold text-white ring-2 ring-background',
            avatarGradient(username),
            sizeMap[size]
          )}
        >
          {initials(username)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-background',
            dotSize[size],
            online ? 'bg-emerald-500' : 'bg-muted-foreground/40'
          )}
        />
      )}
    </div>
  )
}
