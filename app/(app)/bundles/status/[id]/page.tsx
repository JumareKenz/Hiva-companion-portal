'use client'

import { useParams, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
  ChevronLeft,
  XCircle,
  CheckCircle2,
  Clock,
  FileStack,
  Globe,
  UserCheck,
} from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useBundleJob } from '@/features/bundle-jobs/hooks/useBundleJob'
import { PipelineTracker } from '@/features/bundle-jobs/components/PipelineTracker'
import { bundleJobsService } from '@/services/bundleJobs.service'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { AdminOnly } from '@/components/guards/AdminOnly'

export default function BuildStatusPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const { data: job, isLoading } = useBundleJob(jobId)

  const { mutate: cancelJob, isPending: isCancelling } = useMutation({
    mutationFn: () => bundleJobsService.cancel(jobId),
    onSuccess: () => {
      toast.success('Build cancelled')
      router.push('/bundles')
    },
    onError: () => toast.error('Failed to cancel build'),
  })

  if (isLoading || !job) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="row" />
        <SkeletonLoader variant="card" />
        <SkeletonLoader variant="card" />
      </div>
    )
  }

  const isTerminal = job.status === 'complete' || job.status === 'failed'
  const isRunning = job.status === 'queued' || job.status === 'running'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/bundles" className="btn btn-ghost btn-sm">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Build Status
          </h1>
          <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
            {job.id}
          </p>
        </div>
        <StatusBadge status={job.status} type="job" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Pipeline Progress
              </h2>
              {isRunning && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Clock className="h-3.5 w-3.5 animate-pulse text-[var(--accent-600)]" />
                  Polling every 5s
                </div>
              )}
            </div>
            <PipelineTracker
              currentStage={job.current_stage}
              status={job.status}
              progress={job.progress}
            />
          </div>

          {job.status === 'awaiting_review' && (
            <div className="surface-raised border-[var(--warning)]/30 bg-[var(--warning)]/5 p-5">
              <div className="flex items-start gap-3">
                <UserCheck className="mt-0.5 h-5 w-5 text-[var(--warning)]" />
                <div className="flex-1">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    Human Review Required
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    The pipeline has extracted clinical rules that need domain expert approval
                    before packaging can continue.
                  </p>
                  <Link
                    href={`/bundles/review/${job.id}`}
                    className="btn btn-primary btn-sm mt-3"
                  >
                    <UserCheck className="h-4 w-4" />
                    Review Rules
                  </Link>
                </div>
              </div>
            </div>
          )}

          {job.status === 'failed' && job.error_message && (
            <div className="surface-raised border-[var(--error)]/30 bg-[var(--error)]/5 p-5">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 text-[var(--error)]" />
                <div>
                  <h3 className="font-medium text-[var(--error)]">Build Failed</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {job.error_message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {job.status === 'complete' && (
            <div className="surface-raised border-[var(--accent-600)]/30 bg-[var(--accent-600)]/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--accent-600)]" />
                <div>
                  <h3 className="font-medium text-[var(--accent-600)]">Build Complete</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Bundle has been packaged and signed.
                    {job.activate_on_complete
                      ? ' It has been automatically activated for distribution.'
                      : ' You can activate it from the releases page.'}
                  </p>
                  {job.release_id && (
                    <Link href="/bundles" className="btn btn-primary btn-sm mt-3">
                      View Release
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h3 className="label mb-3">BUILD DETAILS</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Status</span>
                <StatusBadge status={job.status} type="job" />
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Started</span>
                <span className="text-[var(--text-secondary)]">
                  {job.started_at
                    ? formatDistanceToNow(new Date(job.started_at)) + ' ago'
                    : 'Queued'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Documents</span>
                <span className="text-[var(--text-secondary)]">
                  {job.document_ids.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Created by</span>
                <span className="text-[var(--text-secondary)]">
                  {job.created_by.full_name}
                </span>
              </div>
              {job.activate_on_complete && (
                <div className="mt-2 rounded-md bg-[var(--accent-600)]/5 px-3 py-2 text-xs text-[var(--accent-600)]">
                  Auto-activate on completion
                </div>
              )}
            </div>
          </div>

          <div className="surface p-5">
            <h3 className="label mb-3">LANGUAGES</h3>
            <div className="flex flex-wrap gap-2">
              {job.languages.map((lang) => (
                <span key={lang} className="badge badge-accent">
                  <Globe className="h-3 w-3" />
                  {lang.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="surface p-5">
            <h3 className="label mb-3">DOCUMENTS</h3>
            <div className="space-y-1.5">
              {job.document_ids.map((id) => (
                <div key={id} className="flex items-center gap-2 text-xs">
                  <FileStack className="h-3.5 w-3.5 text-[var(--text-faint)]" />
                  <span className="font-mono text-[var(--text-muted)]">{id.slice(0, 8)}...</span>
                </div>
              ))}
            </div>
          </div>

          <AdminOnly>
            {isRunning && (
              <button
                onClick={() => cancelJob()}
                disabled={isCancelling}
                className="btn btn-destructive w-full"
              >
                <XCircle className="h-4 w-4" />
                {isCancelling ? 'Cancelling...' : 'Cancel Build'}
              </button>
            )}
          </AdminOnly>
        </div>
      </div>
    </div>
  )
}
