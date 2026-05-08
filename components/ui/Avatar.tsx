'use client'

import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const COLOURS = [
  'bg-accent-600 text-white',
  'bg-amber-600 text-white',
  'bg-blue-600 text-white',
  'bg-purple-600 text-white',
  'bg-rose-600 text-white',
  'bg-teal-600 text-white',
  'bg-indigo-600 text-white',
  'bg-orange-600 text-white',
] as const

const SIZE_MAP = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const firstWord = words[0] ?? ''
  const lastWord = words[words.length - 1] ?? ''
  const initials =
    words.length > 1
      ? `${firstWord[0] ?? ''}${lastWord[0] ?? ''}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()

  const colorIndex = name.charCodeAt(0) % COLOURS.length

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-display font-semibold',
        COLOURS[colorIndex],
        SIZE_MAP[size],
        className
      )}
    >
      {initials}
    </div>
  )
}
