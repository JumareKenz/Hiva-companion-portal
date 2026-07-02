'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  CheckCircle2,
  Edit3,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { useRulesForReview, useReviewStatus, useSubmitRuleReview } from '@/features/rule-reviews/hooks/useRuleReviews'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import type { RuleForReview, RuleReviewSubmission } from '@/types/common'
import type { ReviewDecision } from '@/types/enums'

const DRAFT_KEY_PREFIX = 'hiva-review-draft-'

interface DraftDecision {
  decision: ReviewDecision
  notes: string
}

export default function RuleReviewPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const { data: rules, isLoading: rulesLoading } = useRulesForReview(jobId)
  const { data: reviewStatus } = useReviewStatus(jobId)
  const { mutate: submitReview, isPending: isSubmitting } = useSubmitRuleReview(jobId)

  const [drafts, setDrafts] = useState<Record<string, DraftDecision>>({})
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY_PREFIX + jobId)
    if (saved) {
      try {
        setDrafts(JSON.parse(saved))
      } catch { /* ignore */ }
    }
  }, [jobId])

  useEffect(() => {
    if (Object.keys(drafts).length > 0) {
      localStorage.setItem(DRAFT_KEY_PREFIX + jobId, JSON.stringify(drafts))
    }
  }, [drafts, jobId])

  const setDraft = (chunkId: string, draft: DraftDecision) => {
    setDrafts((prev) => ({ ...prev, [chunkId]: draft }))
  }

  const handleSubmit = (rule: RuleForReview) => {
    const draft = drafts[rule.chunk_id]
    if (!draft) {
      toast.error('Select a decision first')
      return
    }

    const body: RuleReviewSubmission = {
      decision: draft.decision,
      notes: draft.notes || undefined,
    }

    submitReview(
      { chunkId: rule.chunk_id, body },
      {
        onSuccess: () => {
          setDrafts((prev) => {
            const next = { ...prev }
            delete next[rule.chunk_id]
            return next
          })
        },
      }
    )
  }

  const handleBulkApprove = () => {
    if (!rules) return
    const pending = rules.filter((r) => r.status === 'PENDING')
    if (pending.length === 0) return

    if (!confirm(`Approve all ${pending.length} pending rules? This cannot be undone.`)) return

    pending.forEach((rule) => {
      submitReview({ chunkId: rule.chunk_id, body: { decision: 'APPROVED' } })
    })
  }

  if (rulesLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="row" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLoader key={i} variant="card" />
        ))}
      </div>
    )
  }

  if (!rules || rules.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="h-8 w-8 text-[var(--text-faint)]" />}
        title="No rules to review"
        description="This build has no extracted rules requiring review."
        action={{ label: 'Back to Builds', onClick: () => router.push('/bundles') }}
      />
    )
  }

  const pendingRules = rules.filter((r) => r.status === 'PENDING')
  const reviewedRules = rules.filter((r) => r.status !== 'PENDING')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/bundles/status/${jobId}`} className="btn btn-ghost btn-sm">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Clinical Rule Review
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Review extracted rules before packaging
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {reviewedRules.length} of {rules.length} rules reviewed
            </div>
            {reviewStatus && !reviewStatus.can_package && reviewStatus.blocking_issues.length > 0 && (
              <div className="mt-1 text-xs text-[var(--warning)]">
                {reviewStatus.blocking_issues[0]}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pendingRules.length > 0 && (
              <button
                onClick={handleBulkApprove}
                disabled={isSubmitting}
                className="btn btn-secondary btn-sm"
              >
                Approve All Pending ({pendingRules.length})
              </button>
            )}
            {reviewStatus?.can_package && (
              <div className="flex items-center gap-1.5 text-sm text-[var(--success)]">
                <CheckCircle2 className="h-4 w-4" />
                Ready to package
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
          <div
            className="h-full rounded-full bg-[var(--accent-600)] transition-all duration-500"
            style={{ width: `${(reviewedRules.length / rules.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Rule cards */}
      <div className="space-y-4">
        {rules.map((rule, index) => (
          <RuleCard
            key={rule.chunk_id}
            rule={rule}
            index={index}
            draft={drafts[rule.chunk_id]}
            isExpanded={expandedRule === rule.chunk_id}
            onToggle={() => setExpandedRule(expandedRule === rule.chunk_id ? null : rule.chunk_id)}
            onDraftChange={(draft) => setDraft(rule.chunk_id, draft)}
            onSubmit={() => handleSubmit(rule)}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </div>
  )
}

interface RuleCardProps {
  rule: RuleForReview
  index: number
  draft: DraftDecision | undefined
  isExpanded: boolean
  onToggle: () => void
  onDraftChange: (draft: DraftDecision) => void
  onSubmit: () => void
  isSubmitting: boolean
}

function RuleCard({ rule, index, draft, isExpanded, onToggle, onDraftChange, onSubmit, isSubmitting }: RuleCardProps) {
  const isReviewed = rule.status !== 'PENDING'

  return (
    <div className={cn(
      'surface overflow-hidden transition-all',
      isReviewed && 'opacity-60',
      rule.status === 'REJECTED' && 'border-[var(--error)]/30'
    )}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-secondary)]"
      >
        <div className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          rule.status === 'APPROVED' && 'bg-[var(--success)]/10 text-[var(--success)]',
          rule.status === 'EDITED' && 'bg-[var(--info)]/10 text-[var(--info)]',
          rule.status === 'REJECTED' && 'bg-[var(--error)]/10 text-[var(--error)]',
          rule.status === 'PENDING' && 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
        )}>
          {rule.status === 'APPROVED' && <CheckCircle2 className="h-4 w-4" />}
          {rule.status === 'EDITED' && <Edit3 className="h-4 w-4" />}
          {rule.status === 'REJECTED' && <XCircle className="h-4 w-4" />}
          {rule.status === 'PENDING' && (index + 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--text-primary)]">
              {rule.display_title}
            </span>
            <span className="badge badge-ghost text-[10px]">{rule.rule_type}</span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Chunk: {rule.chunk_id.slice(0, 8)}
          </span>
        </div>
        <StatusPill status={rule.status} />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-[var(--border-subtle)] px-5 py-4 space-y-4">
          {/* Raw text */}
          <div>
            <h4 className="label mb-2">SOURCE TEXT</h4>
            <div className="rounded-lg bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)] font-mono leading-relaxed whitespace-pre-wrap">
              {rule.raw_text}
            </div>
          </div>

          {/* Extracted logic */}
          <div>
            <h4 className="label mb-2">EXTRACTED LOGIC</h4>
            <div className="rounded-lg border border-[var(--border-subtle)] p-4 text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {rule.plain_language}
            </div>
          </div>

          {/* Review actions */}
          {!isReviewed && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <h4 className="label mb-3">YOUR DECISION</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => onDraftChange({ decision: 'APPROVED', notes: draft?.notes || '' })}
                  className={cn(
                    'btn btn-sm flex-1',
                    draft?.decision === 'APPROVED' ? 'btn-primary' : 'btn-secondary'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => onDraftChange({ decision: 'EDITED', notes: draft?.notes || '' })}
                  className={cn(
                    'btn btn-sm flex-1',
                    draft?.decision === 'EDITED' ? 'btn-primary' : 'btn-secondary'
                  )}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDraftChange({ decision: 'REJECTED', notes: draft?.notes || '' })}
                  className={cn(
                    'btn btn-sm flex-1',
                    draft?.decision === 'REJECTED' ? 'btn-destructive' : 'btn-secondary'
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>

              {draft?.decision && (
                <div className="mt-3 space-y-3">
                  <textarea
                    value={draft.notes}
                    onChange={(e) => onDraftChange({ ...draft, notes: e.target.value })}
                    placeholder="Optional reviewer notes..."
                    className="input w-full resize-none text-sm"
                    rows={2}
                  />
                  <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="btn btn-primary w-full"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Submit Review
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Already reviewed */}
          {isReviewed && rule.reviewer_notes && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <h4 className="label mb-2">REVIEWER NOTES</h4>
              <p className="text-sm text-[var(--text-secondary)]">{rule.reviewer_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const config = {
    PENDING: { className: 'badge badge-ghost', label: 'Pending' },
    APPROVED: { className: 'badge badge-success', label: 'Approved' },
    EDITED: { className: 'badge badge-info', label: 'Edited' },
    REJECTED: { className: 'badge badge-error', label: 'Rejected' },
  }[status] ?? { className: 'badge badge-ghost', label: status }

  return <span className={config.className}>{config.label}</span>
}
