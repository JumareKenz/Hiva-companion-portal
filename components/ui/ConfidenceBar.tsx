'use client'

import { cn } from '@/lib/utils'

interface ConfidenceBarProps {
  score: number
  showLabel?: boolean
}

export function ConfidenceBar({ score, showLabel = false }: ConfidenceBarProps) {
  const percentage = Math.min(Math.max(score * 100, 0), 100)

  const colorClass =
    score >= 0.90
      ? 'bg-[var(--success)]'
      : score >= 0.75
        ? 'bg-[var(--warning)]'
        : 'bg-[var(--error)]'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full flex-1 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
        <div
          className={cn('h-full rounded-full transition-all duration-[var(--duration-slow)] ease-[var(--ease-out-expo)]', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 font-mono text-xs text-[var(--text-muted)]">
          {score.toFixed(2)}
        </span>
      )}
    </div>
  )
}
