'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { FileStack, Package, Globe, Database } from 'lucide-react'

import { documentsService } from '@/services/documents.service'
import { jobsService } from '@/services/jobs.service'
import { releasesService } from '@/services/releases.service'
import { chunksService } from '@/services/chunks.service'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LogoBackground } from '@/components/ui/LogoBackground'

export default function DashboardPage() {
  const { data: docsData } = useQuery({
    queryKey: ['documents', { per_page: 1, status: 'pending_review' }],
    queryFn: () => documentsService.list({ per_page: 1, status: 'pending_review' }),
    staleTime: 30 * 1000,
  })

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', { page: 1, per_page: 5 }],
    queryFn: () => jobsService.list({ page: 1, per_page: 5 }),
    staleTime: 3 * 1000,
  })

  const { data: releasesData } = useQuery({
    queryKey: ['releases', { page: 1, per_page: 1 }],
    queryFn: () => releasesService.list({ page: 1, per_page: 1 }),
    staleTime: 60 * 1000,
  })

  const { data: chunkStats } = useQuery({
    queryKey: ['chunkStats'],
    queryFn: () => chunksService.stats(),
    staleTime: 120 * 1000,
  })

  const pendingCount = docsData?.meta.total ?? 0
  const activeRelease = releasesData?.data[0]
  const languageCount = activeRelease?.languages.length ?? 0

  const coverage =
    chunkStats && chunkStats.total > 0
      ? Math.round((chunkStats.compiled / chunkStats.total) * 100)
      : 0

  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative space-y-8">
      <LogoBackground size={700} opacity={0.035} fixed={false} spin breathe={false} />
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="entrance">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {format(now, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <a href="/documents?upload=1" className="btn btn-primary btn-sm entrance entrance-d1">
          Upload Document
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Documents in Queue"
          value={pendingCount}
          icon={<FileStack className="h-4 w-4 text-[var(--text-faint)]" />}
          className="entrance entrance-d1"
        />
        <StatCard
          label="Chunks in Library"
          value={chunkStats?.total ?? '—'}
          trend={
            chunkStats
              ? { value: Math.round(chunkStats.reuse_rate * 100), label: 'reuse rate', positive: true }
              : undefined
          }
          icon={<Database className="h-4 w-4 text-[var(--text-faint)]" />}
          className="entrance entrance-d2"
        />
        <StatCard
          label="Compiled Languages"
          value={languageCount}
          icon={<Globe className="h-4 w-4 text-[var(--text-faint)]" />}
          className="entrance entrance-d3"
        />
        <StatCard
          label="Library Coverage"
          value={`${coverage}%`}
          icon={<Package className="h-4 w-4 text-[var(--text-faint)]" />}
          className="entrance entrance-d4"
        />
      </div>

      {/* Recent jobs */}
      <div className="entrance entrance-d2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Recent Jobs</h2>
          <a href="/jobs" className="text-sm text-[var(--accent-600)] hover:underline">
            View all →
          </a>
        </div>

        <div className="surface">
          {!jobsData ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <SkeletonLoader variant="row" />
                </div>
              ))}
            </div>
          ) : jobsData.data.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6 text-[var(--text-faint)]" />}
              title="No compile jobs yet"
              description="Upload and review a document to get started."
            />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {jobsData.data.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm text-[var(--text-primary)]">
                      {job.document_id.slice(0, 8)}…
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {job.chunk_count ?? '—'} chunks · {job.languages?.join(', ')} ·{' '}
                      {job.hiv_file_size_kb ? `${(job.hiv_file_size_kb / 1024).toFixed(2)} MB` : '—'}
                    </div>
                  </div>
                  <StatusBadge status={job.status} type="job" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Translation coverage */}
      {chunkStats && (
        <div className="surface p-5 entrance entrance-d3">
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            Chunk Library Coverage
          </h3>
          <div className="mt-4 space-y-3">
            {(['en', 'pcm', 'ha', 'yo', 'ig'] as const).map((lang) => {
              const count = chunkStats.translated_by_lang[lang] ?? 0
              const pct = chunkStats.total > 0 ? (count / chunkStats.total) * 100 : 0
              return (
                <div key={lang} className="flex items-center gap-3">
                  <span className="badge badge-ghost w-12 justify-center font-mono uppercase">
                    {lang}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent-600)] transition-all duration-700 ease-[var(--ease-out-expo)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 text-right text-xs font-mono text-[var(--text-muted)]">
                    {count} / {chunkStats.total} ({Math.round(pct)}%)
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 rounded-md bg-[var(--accent-600)]/5 p-3 text-sm text-[var(--accent-600)]">
            {Math.round(chunkStats.reuse_rate * 100)}% of chunks served from cache — saving LLM calls
          </div>
        </div>
      )}
    </div>
  )
}
