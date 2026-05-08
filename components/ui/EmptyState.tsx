'use client'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center py-16 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-[var(--text-secondary)]">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-[var(--text-muted)]">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary btn-sm mt-4"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
