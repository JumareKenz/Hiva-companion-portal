'use client'

import { cn } from '@/lib/utils'
import type { DocumentStatus, JobStatus, BundleJobStatus } from '@/types/enums'

const DOCUMENT_STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; class: string; dot?: boolean; pulse?: boolean }
> = {
  uploaded: { label: 'Uploaded', class: 'badge-ghost', dot: false, pulse: false },
  pending_review: { label: 'Pending Review', class: 'badge-ghost', dot: false, pulse: false },
  in_review: { label: 'In Review', class: 'badge-warning', dot: true, pulse: false },
  ready_to_compile: { label: 'Ready', class: 'badge-accent', dot: true, pulse: false },
  compiling: { label: 'Compiling', class: 'badge-accent', dot: true, pulse: true },
  compiled: { label: 'Compiled', class: 'badge-success', dot: false, pulse: false },
  failed: { label: 'Failed', class: 'badge-error', dot: false, pulse: false },
}

const JOB_STATUS_CONFIG: Record<
  JobStatus | BundleJobStatus,
  { label: string; class: string; dot?: boolean; pulse?: boolean }
> = {
  queued: { label: 'Queued', class: 'badge-ghost', dot: true },
  running: { label: 'Running', class: 'badge-accent', dot: true, pulse: true },
  awaiting_review: { label: 'Awaiting Review', class: 'badge-warning', dot: true, pulse: true },
  complete: { label: 'Complete', class: 'badge-success' },
  failed: { label: 'Failed', class: 'badge-error' },
}

interface StatusBadgeProps {
  status: string
  type: 'document' | 'job'
}

type StatusConfig = { label: string; class: string; dot?: boolean; pulse?: boolean }

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const config: StatusConfig | undefined = type === 'document'
    ? DOCUMENT_STATUS_CONFIG[status as DocumentStatus]
    : JOB_STATUS_CONFIG[status as JobStatus | BundleJobStatus]

  if (!config) {
    return <span className="badge badge-ghost">{status}</span>
  }

  const hasDot = config.dot ?? false
  const hasPulse = config.pulse ?? false

  return (
    <span className={cn('badge', config.class)}>
      {hasDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            config.class === 'badge-accent' && 'bg-[var(--accent-600)]',
            config.class === 'badge-warning' && 'bg-[var(--warning)]',
            config.class === 'badge-success' && 'bg-[var(--success)]',
            config.class === 'badge-error' && 'bg-[var(--error)]',
            config.class === 'badge-ghost' && 'bg-[var(--text-faint)]',
            hasPulse && 'animate-pulse'
          )}
        />
      )}
      {config.label}
    </span>
  )
}
