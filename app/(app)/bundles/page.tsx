'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Package,
  Download,
  PackageCheck,
  ShieldCheck,
  Plus,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'

import { releasesService } from '@/services/releases.service'
import { bundleJobsService } from '@/services/bundleJobs.service'
import { documentsService } from '@/services/documents.service'
import { hivService } from '@/services/hiv.service'
import { useReleases, useActivateRelease } from '@/features/releases/hooks/useReleases'
import { useBundleJobs } from '@/features/bundle-jobs/hooks/useBundleJob'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { AdminGuard } from '@/features/auth/components/AdminGuard'
import { LogoBackground } from '@/components/ui/LogoBackground'
import { cn } from '@/lib/utils'

type Tab = 'releases' | 'builds'

export default function BundlesPage() {
  const [tab, setTab] = useState<Tab>('releases')
  const [releasePage, setReleasePage] = useState(1)
  const [buildsPage, setBuildsPage] = useState(1)

  const { data: releasesData, isLoading: releasesLoading } = useReleases({ page: releasePage, per_page: 20 })
  const { data: buildsData, isLoading: buildsLoading } = useBundleJobs({ page: buildsPage, per_page: 20, sort: 'created_at:desc' })
  const { data: documentsData } = useQuery({
    queryKey: ['documentsAll'],
    queryFn: () => documentsService.list({ per_page: 100 }),
    staleTime: 30 * 1000,
  })
  const { mutate: activate, isPending: isActivating } = useActivateRelease()

  const documents = documentsData?.data ?? []

  const getDocumentNames = (docIds: string[]) =>
    docIds.map((id) => documents.find((d) => d.id === id)?.name ?? id.slice(0, 8))

  const { mutate: downloadRelease, isPending: isDownloading } = useMutation({
    mutationFn: async (releaseId: string) => {
      const blob = await releasesService.download(releaseId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hiva-release.hiv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => toast.success('Download started'),
    onError: () => toast.error('Failed to download bundle'),
  })

  const activeRelease = releasesData?.data.find((r) => r.is_active)
  const releaseTotalPages = releasesData ? Math.ceil(releasesData.meta.total / 20) : 1
  const buildsTotalPages = buildsData ? Math.ceil(buildsData.meta.total / 20) : 1

  return (
    <AdminGuard>
      <div className="relative space-y-6">
        <LogoBackground size={700} opacity={0.025} fixed={false} spin={false} breathe={false} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
              Bundles
            </h1>
            {activeRelease && (
              <span className="badge badge-success">
                <ShieldCheck className="h-3 w-3" />
                Active: v{activeRelease.version}
              </span>
            )}
          </div>
          <AdminOnly>
            <Link href="/bundles/build" className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" />
              New Build
            </Link>
          </AdminOnly>
        </div>

        {/* Active release hero */}
        {activeRelease && (
          <div className="surface-raised relative overflow-hidden p-6 bg-gradient-to-br from-[var(--accent-600)]/5 to-transparent border-[var(--accent-600)]/20">
            <div className="absolute inset-0 opacity-30" style={{
              background: 'radial-gradient(ellipse at top right, rgba(21,93,70,0.1), transparent)'
            }} />
            <div className="relative flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-600)]">
                  ACTIVE RELEASE
                </span>
                <h2 className="mt-1 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  v{activeRelease.version}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
                  <span>{activeRelease.chunk_count} chunks</span>
                  <span>·</span>
                  <span>{activeRelease.languages.join(', ')}</span>
                  <span>·</span>
                  <span>{(activeRelease.size_kb / 1024).toFixed(2)} MB</span>
                  <span>·</span>
                  <span className="font-mono text-xs">SHA {activeRelease.sha256.slice(0, 8)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {getDocumentNames(activeRelease.document_ids).map((name, i) => (
                    <span key={i} className="badge badge-ghost text-[10px]" title={name}>{name}</span>
                  ))}
                </div>
              </div>
              <AdminOnly>
                <button
                  onClick={() => downloadRelease(activeRelease.id)}
                  disabled={isDownloading}
                  className="btn glass-button-primary btn-sm"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Downloading...' : 'Download .hiv'}
                </button>
              </AdminOnly>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border-default)]">
          <button
            onClick={() => setTab('releases')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === 'releases'
                ? 'border-b-2 border-[var(--accent-600)] text-[var(--accent-600)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            Releases
          </button>
          <button
            onClick={() => setTab('builds')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === 'builds'
                ? 'border-b-2 border-[var(--accent-600)] text-[var(--accent-600)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            Build History
          </button>
        </div>

        {/* Releases tab */}
        {tab === 'releases' && (
          <>
            <div className="surface overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    {['VERSION', 'DOCUMENTS', 'SIZE', 'LANGUAGES', 'STATUS', 'ACTIONS'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left label">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {releasesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-4 py-2.5"><SkeletonLoader variant="row" /></td></tr>
                    ))
                  ) : releasesData?.data.length === 0 ? (
                    <tr><td colSpan={6}>
                      <EmptyState
                        icon={<Package className="h-6 w-6 text-[var(--text-faint)]" />}
                        title="No releases yet"
                        description="Build your first bundle to create a release."
                      />
                    </td></tr>
                  ) : (
                    releasesData?.data.map((release) => (
                      <tr key={release.id} className="transition-colors hover:bg-[var(--bg-secondary)]">
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm text-[var(--text-primary)]">{release.version}</div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {format(new Date(release.created_at || Date.now()), 'd MMM yyyy')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {getDocumentNames(release.document_ids).map((name, i) => (
                              <span key={i} className="badge badge-ghost text-[10px] max-w-[80px] truncate" title={name}>{name}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-[var(--text-secondary)]">
                          {(release.size_kb / 1024).toFixed(1)} MB
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {release.languages.map((l) => (
                              <span key={l} className="badge badge-ghost text-[10px] font-mono">{l}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {release.is_active ? (
                            <span className="badge badge-success">Active</span>
                          ) : (
                            <span className="badge badge-ghost">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <AdminOnly>
                            <div className="flex items-center gap-1">
                              {!release.is_active && (
                                <button
                                  onClick={() => activate(release.id)}
                                  disabled={isActivating}
                                  className="btn btn-secondary btn-sm"
                                >
                                  <PackageCheck className="h-3.5 w-3.5" />
                                  Activate
                                </button>
                              )}
                              <button
                                onClick={() => downloadRelease(release.id)}
                                disabled={isDownloading}
                                className="btn btn-ghost btn-sm"
                                title="Download bundle"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </AdminOnly>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {releaseTotalPages > 1 && (
              <div className="flex justify-center">
                <Pagination page={releasePage} totalPages={releaseTotalPages} onPageChange={setReleasePage} />
              </div>
            )}
          </>
        )}

        {/* Builds tab */}
        {tab === 'builds' && (
          <>
            <div className="surface overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    {['BUILD ID', 'STAGE', 'DOCUMENTS', 'LANGUAGES', 'STATUS', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left label">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {buildsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-4 py-2.5"><SkeletonLoader variant="row" /></td></tr>
                    ))
                  ) : buildsData?.data.length === 0 ? (
                    <tr><td colSpan={6}>
                      <EmptyState
                        icon={<Clock className="h-6 w-6 text-[var(--text-faint)]" />}
                        title="No builds yet"
                        description="Start a bundle build from the Build page."
                      />
                    </td></tr>
                  ) : (
                    buildsData?.data.map((job) => (
                      <tr key={job.id} className="transition-colors hover:bg-[var(--bg-secondary)]">
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm text-[var(--text-primary)]">{job.id.slice(0, 8)}</div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {job.created_by.full_name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {job.current_stage !== null ? (
                            <span className="font-mono text-sm text-[var(--text-secondary)]">
                              {job.current_stage}/4
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-faint)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          {job.document_ids.length}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {job.languages.map((l) => (
                              <span key={l} className="badge badge-ghost text-[10px] font-mono">{l}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={job.status} type="job" />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/bundles/status/${job.id}`}
                            className="btn btn-ghost btn-sm text-xs"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {buildsTotalPages > 1 && (
              <div className="flex justify-center">
                <Pagination page={buildsPage} totalPages={buildsTotalPages} onPageChange={setBuildsPage} />
              </div>
            )}
          </>
        )}
      </div>
    </AdminGuard>
  )
}
