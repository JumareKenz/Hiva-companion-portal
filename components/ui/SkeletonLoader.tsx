'use client'

import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  variant: 'card' | 'row' | 'text'
  className?: string
}

export function SkeletonLoader({ variant, className }: SkeletonLoaderProps) {
  const baseClass =
    'shimmer bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-tertiary)] to-[var(--bg-secondary)] bg-[length:200%_100%]'

  return (
    <div
      className={cn(
        baseClass,
        'animate-shimmer rounded-[var(--radius-md)]',
        variant === 'card' && 'h-32 w-full',
        variant === 'row' && 'h-12 w-full',
        variant === 'text' && 'h-4 w-full',
        className
      )}
    />
  )
}
