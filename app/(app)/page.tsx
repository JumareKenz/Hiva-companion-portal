'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  FileStack,
  Package,
  Globe,
  Database,
  Rocket,
  Clock,
  ShieldCheck,
  Key,
  ArrowRight,
} from 'lucide-react'

import { documentsService } from '@/services/documents.service'
import { bundleJobsService } from '@/services/bundleJobs.service'
import { releasesService } from '@/services/releases.service'
import { chunksService } from '@/services/chunks.service'
import { accessCodesService } from '@/services/accessCodes.service'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LogoBackground } from '@/components/ui/LogoBackground'
import { AdminOnly } from '@/components/guards/AdminOnly'

export default function DashboardPage() {
  const { data: docsData } = useQuery({
    queryKey: ['documents', { per_page: 1, status: 'ready_to_compile' }],
    queryFn: () => documentsService.list({ per_page: 1, status: 'ready_to_compile' }),
    staleTime: 30 * 1000,
  })

  const { data: bundleJobs } = useQuery({
    queryKey: ['bundleJobs', { page: 1, per_page: 5, sort: 'created_at:desc' }],
    queryFn: () => bundleJobsService.list({ page: 1, per_page: 5, sort: 'created_at:desc' }),
    staleTime: 10 * 1000,
  })

  const { data: releasesData } = useQuery({
    queryKey: ['releases', { page: 1, per_page: 1, active: true }],
    queryFn: () => releasesService.list({ page: 1, per_page: 1, active: true }),
    staleTime: 60 * 1000,
  })

  const { data: chunkStats } = useQuery({
    queryKey: ['chunkStats'],
    queryFn: () => chunksService.stats(),
    staleTime: 120 * 1000,
  })

  const { data: accessCodesData } = useQuery({
    queryKey: ['access-codes-summary'],
    queryFn: () => accessCodesService.list({ active_only: true, per_page: 1 }),
    staleTime: 60 * 1000,
  })

  const readyCount = docsData?.meta.total ?? 0
  const activeRelease = releasesData?.data[0]
  const activeCodesCount = accessCodesData?.meta.total ?? 0
  const jobs = bundleJobs?.data ?? []
  const activeJobs = jobs.filter((j) => j.status === 'running' || j.status === 'queued')

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative space-y-8">
      <LogoBackground size={700} opacity={0.035} fixed={false} spin breathe={false} />

      {/* Header */}
      <div className="flex items-end justify-between entrance">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {format(now, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/documents?upload=1" className="btn btn-secondary btn-sm">
            Upload Document
          </Link>
          <AdminOnly>
            <Link href="/bundles/build" className="btn btn-primary btn-sm">
              <Rocket className="h-4 w-4" />
              New Build
            </Link>
          </AdminOnly>
        </div>
      </div>

      {/* Operational alerts */}
      {activeJobs.length > 0 && (
        <div className="space-y-3 entrance entrance-d1">
          {activeJobs.map((job) => (
            <Link
              key={job.id}
              href={`/bundles/status/${job.id}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--accent-600)]/20 bg-[var(--accent-600)]/5 p-4 transition-colors hover:bg-[var(--accent-600)]/10"
            >
              <Clock className="h-5 w-5 animate-pulse text-[var(--accent-600)]" />
              <div className="flex-1">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Build in progress
                </span>
                <span className="ml-2 text-xs text-[var(--text-muted)]">
                  Stage {job.current_stage ?? 0} · {job.progress}% complete
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--accent-600)]" />
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 entrance entrance-d1">
        <StatCard
          label="Ready to Compile"
          value={readyCount}
          icon={<FileStack className="h-4 w-4 text-[var(--text-faint)]" />}
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
        />
        <StatCard
          label="Active Release"
          value={activeRelease?.version ?? 'None'}
          icon={<ShieldCheck className="h-4 w-4 text-[var(--text-faint)]" />}
        />
        <StatCard
          label="Active Access Codes"
          value={activeCodesCount}
          icon={<Key className="h-4 w-4 text-[var(--text-faint)]" />}
        />
      </div>

      {/* Active release card */}
      {activeRelease && (
        <div className="surface-raised relative overflow-hidden p-5 entrance entrance-d2">
          <div className="absolute inset-0 opacity-30" style={{
            background: 'radial-gradient(ellipse at top right, rgba(21,93,70,0.08), transparent)'
          }} />
          <div className="relative flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-600)]">
                CURRENTLY DISTRIBUTED
              </span>
              <h2 className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)]">
                v{activeRelease.version}
              </h2>
              <div className="mt-1.5 flex items-center gap-3 text-sm text-[var(--text-muted)]">
                <span>{activeRelease.chunk_count} chunks</span>
                <span>·</span>
                <span>{activeRelease.languages.join(', ')}</span>
                <span>·</span>
                <span>{(activeRelease.size_kb / 1024).toFixed(1)} MB</span>
              </div>
            </div>
            <Link href="/bundles" className="btn btn-secondary btn-sm">
              View Releases
            </Link>
          </div>
        </div>
      )}

      {/* Recent builds */}
      <div className="entrance entrance-d2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Recent Builds</h2>
          <Link href="/bundles" className="text-sm text-[var(--accent-600)] hover:underline">
            View all →
          </Link>
        </div>

        <div className="surface">
          {!bundleJobs ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <SkeletonLoader variant="row" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6 text-[var(--text-faint)]" />}
              title="No builds yet"
              description="Start a bundle build to compile documents for distribution."
              action={{ label: 'Start Build', onClick: () => window.location.href = '/bundles/build' }}
            />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/bundles/status/${job.id}`}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[var(--text-primary)]">
                        {job.id.slice(0, 8)}
                      </span>
                      {job.current_stage !== null && (
                        <span className="text-xs text-[var(--text-faint)]">
                          Stage {job.current_stage}/4
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {job.document_ids.length} docs · {job.languages.join(', ')} · {job.created_by.full_name}
                    </div>
                  </div>
                  <StatusBadge status={job.status} type="job" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Language coverage */}
      {chunkStats && (
        <div className="surface p-5 entrance entrance-d3">
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            Translation Coverage
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
            {Math.round(chunkStats.reuse_rate * 100)}% of chunks served from cache
          </div>
        </div>
      )}
    </div>
  )
}
