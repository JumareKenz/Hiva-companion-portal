'use client'

import { cn } from '@/lib/utils'

interface FileTypeBadgeProps {
  type: '.pdf' | '.docx'
}

export function FileTypeBadge({ type }: FileTypeBadgeProps) {
  const isPdf = type === '.pdf'

  return (
    <span
      className={cn(
        'badge font-mono text-[10px] uppercase tracking-wider',
        isPdf
          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
      )}
    >
      {type.replace('.', '').toUpperCase()}
    </span>
  )
}
