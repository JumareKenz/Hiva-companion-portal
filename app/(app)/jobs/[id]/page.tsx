'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { FileStack, Download, ShieldCheck, RotateCw } from 'lucide-react'
import { toast } from 'sonner'

import { jobsService } from '@/services/jobs.service'
import { documentsService } from '@/services/documents.service'
import { useJobStream } from '@/features/jobs/hooks/useJobStream'
import { StepTracker } from '@/features/jobs/components/StepTracker'
import { LogStream } from '@/features/jobs/components/LogStream'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { cn } from '@/lib/utils'

export default function JobPage() {
  const params = useParams()
  const jobId = params.id as string
  const queryClient = useQueryClient()

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsService.get(jobId),
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? 3000 : false,
    staleTime: 3 * 1000,
    enabled: !!jobId,
  })

  const { data: doc } = useQuery({
    queryKey: ['document', job?.document_id],
    queryFn: () => documentsService.get(job!.document_id),
    enabled: !!job?.document_id,
    staleTime: 10 * 1000,
  })

  const {
    logs,
    connectionStatus,
    currentStep,
    progressPct,
    isComplete,
    isFailed,
    error,
  } = useJobStream(jobId)

  const { mutate: downloadJob, isPending: isDownloading } = useMutation({
    mutationFn: async () => {
      const blob = await jobsService.download(jobId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hiva-${jobId.slice(0, 8)}.hiv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => toast.success('Download started'),
    onError: () => toast.error('Failed to download bundle'),
  })

  const { mutate: retryJob, isPending: isRetrying } = useMutation({
    mutationFn: () => jobsService.retry(jobId),
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Retry job queued')
      // Redirect to the new retry job
      window.location.href = `/jobs/${newJob.id}`
    },
    onError: () => toast.error('Failed to retry job'),
  })

  if (isLoading || !job) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="row" />
        <SkeletonLoader variant="card" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sub-header */}
      <div className="flex items-center gap-3">
        <FileStack className="h-5 w-5 text-[var(--text-muted)]" />
        <span className="font-medium text-[var(--text-primary)]">{doc?.name || 'Unknown document'}</span>
        <span className="badge badge-ghost font-mono text-[10px]">v{job.id.slice(0, 6)}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <StepTracker currentStep={currentStep ?? job.current_step} failed={isFailed || job.status === 'failed'} />

          {/* Language pills */}
          <div>
            <span className="label mb-2 block">LANGUAGES</span>
            <div className="flex flex-wrap gap-2">
              {(['en', 'ha', 'yo', 'ig', 'pcm'] as const).map((lang) => {
                const active = job.languages.includes(lang)
                return (
                  <span
                    key={lang}
                    className={cn(
                      'badge',
                      active ? 'badge-accent' : 'badge-ghost'
                    )}
                  >
                    {lang.toUpperCase()}
                  </span>
                )
              })}
            </div>
          </div>

          <LogStream logs={logs} connectionStatus={connectionStatus} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Job metadata */}
          <div className="surface p-5">
            <span className="label mb-3 block">JOB DETAILS</span>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Status</span>
                <StatusBadge status={job.status} type="job" />
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Created</span>
                <span className="text-[var(--text-secondary)]">
                  {formatDistanceToNow(new Date(job.created_at))} ago
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Step</span>
                <span className="badge badge-ghost font-mono text-[10px]">
                  {job.current_step ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Chunks</span>
                <span className="text-[var(--text-secondary)]">{job.chunk_count ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Languages</span>
                <span className="text-[var(--text-secondary)]">{job.languages.join(', ')}</span>
              </div>
            </div>

          </div>

          {/* Bundle ready */}
          {(isComplete || job.status === 'complete') && (
            <div className="rounded-xl border border-[var(--accent-600)]/20 bg-[var(--accent-600)]/5 p-5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-600)]">
                BUNDLE READY
              </span>
              <h3 className="mt-1 font-display font-semibold text-[var(--text-primary)]">
                {doc?.name || 'Bundle'}
              </h3>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">CHUNKS</span>
                  <span className="font-mono">{job.chunk_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">REUSED</span>
                  <span className="font-mono">
                    {job.reused_chunk_count} ({job.chunk_count ? Math.round((job.reused_chunk_count! / job.chunk_count) * 100) : 0}% cache hit)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">LANGUAGES</span>
                  <span className="font-mono">{job.languages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">FILE SIZE</span>
                  <span className="font-mono">
                    {job.hiv_file_size_kb ? `${(job.hiv_file_size_kb / 1024).toFixed(2)} MB` : '—'}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--accent-600)]">
                <ShieldCheck className="h-4 w-4" />
                Signed ✓
              </div>
              <AdminOnly>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => downloadJob()}
                    disabled={isDownloading}
                    className="btn glass-button-primary w-full"
                  >
                    <Download className="h-4 w-4" />
                    {isDownloading ? 'Downloading…' : 'Download .hiv'}
                  </button>
                </div>
              </AdminOnly>
            </div>
          )}

          {/* Build failed */}
          {(isFailed || job.status === 'failed') && (
            <div className="rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5 p-5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--error)]">
                BUILD FAILED
              </span>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {error || job.error_message || 'An unexpected error occurred during compilation.'}
              </p>
              <button
                onClick={() => retryJob()}
                disabled={isRetrying}
                className="btn btn-destructive btn-sm mt-3 w-full"
              >
                <RotateCw className="h-4 w-4" />
                {isRetrying ? 'Queuing…' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
