'use client'

import { Check, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PIPELINE_STAGES, type PipelineStage, type BundleJobStatus } from '@/types/enums'

interface PipelineTrackerProps {
  currentStage: PipelineStage | null
  status: BundleJobStatus
  progress?: number
}

export function PipelineTracker({ currentStage, status, progress }: PipelineTrackerProps) {
  const currentIndex = currentStage ?? -1

  const getStageState = (stage: PipelineStage) => {
    if (status === 'failed' && stage === currentIndex) return 'failed'
    if (status === 'complete') return 'complete'
    if (stage < currentIndex) return 'complete'
    if (stage === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="space-y-1">
      {PIPELINE_STAGES.map(({ stage, label, description }) => {
        const state = getStageState(stage)

        return (
          <div
            key={stage}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-300',
              state === 'active' && 'bg-[var(--accent-600)]/5 border border-[var(--accent-600)]/20',
              state === 'failed' && 'bg-[var(--error)]/5 border border-[var(--error)]/20',
              state === 'complete' && 'opacity-70',
              state === 'pending' && 'opacity-40'
            )}
          >
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                state === 'pending' && 'border-2 border-[var(--border-default)] text-[var(--text-faint)]',
                state === 'active' && 'bg-[var(--accent-600)] text-white shadow-[var(--shadow-glow)]',
                state === 'complete' && 'bg-[var(--success)] text-white',
                state === 'failed' && 'bg-[var(--error)] text-white'
              )}
            >
              {state === 'complete' && <Check className="h-3.5 w-3.5" />}
              {state === 'failed' && <X className="h-3.5 w-3.5" />}
              {state === 'active' && <Clock className="h-3.5 w-3.5 animate-pulse" />}
              {state === 'pending' && stage}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-medium',
                  state === 'active' && 'text-[var(--accent-600)]',
                  state === 'failed' && 'text-[var(--error)]',
                  state === 'complete' && 'text-[var(--text-secondary)]',
                  state === 'pending' && 'text-[var(--text-muted)]'
                )}>
                  {label}
                </span>
                {state === 'active' && progress !== undefined && (
                  <span className="text-xs font-mono text-[var(--accent-600)]">{progress}%</span>
                )}
              </div>
              {state === 'active' && (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
              )}
            </div>

            {state === 'active' && progress !== undefined && (
              <div className="w-16">
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-600)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
