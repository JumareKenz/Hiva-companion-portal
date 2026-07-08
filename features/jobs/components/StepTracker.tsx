'use client'

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobStep } from '@/types/enums'

const STEPS: JobStep[] = [
  'chunk',
  'deduplicate',
  'translate',
  'package',
  'sign',
]

const STEP_LABELS: Record<JobStep, string> = {
  chunk: 'Chunk',
  deduplicate: 'Dedup',
  translate: 'Translate',
  package: 'Package',
  sign: 'Sign',
  complete: 'Complete',
}

interface StepTrackerProps {
  currentStep: JobStep | 'complete' | 'failed' | null
  failed: boolean
}

export function StepTracker({ currentStep, failed }: StepTrackerProps) {
  const currentIndex =
    currentStep && currentStep !== 'failed' && currentStep !== 'complete'
      ? STEPS.indexOf(currentStep)
      : -1

  return (
    <div className="flex flex-wrap items-start gap-1">
      {STEPS.map((step, index) => {
        let state: 'pending' | 'active' | 'complete' | 'failed' = 'pending'
        if (failed && index === currentIndex) state = 'failed'
        else if (index < currentIndex) state = 'complete'
        else if (index === currentIndex) state = 'active'

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                  state === 'pending' && 'border-2 border-[var(--bg-tertiary)] text-[var(--text-faint)]',
                  state === 'active' && 'bg-[var(--accent-600)] text-[var(--text-inverse)] shadow-[var(--shadow-glow)]',
                  state === 'complete' && 'bg-[var(--success)] text-[var(--text-inverse)]',
                  state === 'failed' && 'bg-[var(--error)] text-[var(--text-inverse)]'
                )}
              >
                {state === 'complete' ? <Check className="h-4 w-4" /> : state === 'failed' ? <X className="h-4 w-4" /> : index + 1}
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                {STEP_LABELS[step]}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1 mt-4 h-0.5 w-6 transition-colors duration-300',
                  index < currentIndex ? 'bg-[var(--success)]' : 'bg-[var(--bg-tertiary)]'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
