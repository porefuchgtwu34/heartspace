'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'

// Subtle floating hearts behind the hero. Lightweight, pointer-events-none.
export function FloatingHearts() {
  const [hearts, setHearts] = useState<{ id: number; left: number; size: number; duration: number; delay: number; opacity: number }[]>([])

  useEffect(() => {
    const arr = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 8 + Math.random() * 18,
      duration: 14 + Math.random() * 16,
      delay: Math.random() * 20,
      opacity: 0.08 + Math.random() * 0.14,
    }))
    setHearts(arr)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {hearts.map((h) => (
        <Heart
          key={h.id}
          className="heart-float text-rose-400"
          style={{
            left: `${h.left}%`,
            width: h.size,
            height: h.size,
            opacity: h.opacity,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            fill: 'currentColor',
          }}
        />
      ))}
    </div>
  )
}
