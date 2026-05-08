'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: { value: number; label: string; positive: boolean }
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, trend, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'surface-raised flex flex-col gap-1 p-5 transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="label">{label}</span>
        {icon}
      </div>
      <span className="font-display text-3xl font-bold text-[var(--text-primary)]">{value}</span>
      {trend && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'font-medium',
              trend.positive ? 'text-[var(--success)]' : 'text-[var(--error)]'
            )}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
          <span className="text-[var(--text-muted)]">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
