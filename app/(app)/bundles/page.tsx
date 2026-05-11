'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Package,
  Download,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { releasesService } from '@/services/releases.service'
import { documentsService } from '@/services/documents.service'
import { hivService } from '@/services/hiv.service'
import { useReleases, useActivateRelease } from '@/features/releases/hooks/useReleases'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { AdminGuard } from '@/features/auth/components/AdminGuard'
import { LogoBackground } from '@/components/ui/LogoBackground'
import { cn } from '@/lib/utils'

export default function BundlesPage() {
  const [page, setPage] = useState(1)

  const { data: releasesData, isLoading } = useReleases({ page, per_page: 20 })
  const { data: documentsData } = useQuery({
    queryKey: ['documentsAll'],
    queryFn: () => documentsService.list({ per_page: 100 }),
    staleTime: 30 * 1000,
  })
  const { data: hivVersion } = useQuery({
    queryKey: ['hivVersion'],
    queryFn: () => hivService.version(),
    staleTime: 60 * 1000,
  })
  const { mutate: activate, isPending: isActivating } = useActivateRelease()

  const documents = documentsData?.data ?? []

  const getDocumentNames = (docIds: string[]) => {
    return docIds.map((id) => {
      const doc = documents.find((d) => d.id === id)
      return doc?.name ?? id.slice(0, 8)
    })
  }

  const { mutate: downloadActive, isPending: isDownloading } = useMutation({
    mutationFn: async () => {
      const blob = await hivService.download()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hiva-active.hiv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => toast.success('Download started'),
    onError: () => toast.error('Failed to download bundle'),
  })

  const activeRelease = releasesData?.data.find((r) => r.is_active)
  const totalPages = releasesData ? Math.ceil(releasesData.meta.total / 20) : 1

  return (
    <AdminGuard>
    <div className="relative space-y-8">
      <LogoBackground size={700} opacity={0.025} fixed={false} spin={false} breathe={false} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            Compiled Bundles
          </h1>
          {hivVersion && (
            <span className="badge badge-success">
              <ShieldCheck className="h-3 w-3" />
              Active: v{hivVersion.version}
            </span>
          )}
        </div>
        <AdminOnly>
          <Link href="/bundles/build" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" />
            Build Bundle
          </Link>
        </AdminOnly>
      </div>

      {/* Active release hero */}
      {activeRelease && (
        <div
          className={cn(
            'surface-raised relative overflow-hidden p-6',
            'bg-gradient-to-br from-[var(--accent-600)]/5 to-transparent',
            'border-[var(--accent-600)]/20'
          )}
        >
          <div className="absolute inset-0 opacity-30" style={{
            background: 'radial-gradient(ellipse at top right, rgba(21,93,70,0.1), transparent)'
          }} />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-600)]">
                ACTIVE RELEASE
              </span>
              {activeRelease.needs_review && (
                <span className="badge badge-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Flagged for review
                </span>
              )}
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[var(--text-primary)]">
              {activeRelease.version}
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
            <AdminOnly>
                <div className="mt-4 flex gap-2">
                <button
                  onClick={() => downloadActive()}
                  disabled={isDownloading}
                  className="btn glass-button-primary btn-sm"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Downloading…' : 'Download'}
                </button>
              </div>
            </AdminOnly>
          </div>
        </div>
      )}

      {/* Releases table */}
      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {['VERSION', 'DOCUMENTS', 'SIZE', 'CHUNKS', 'STATUS', 'ACTIONS'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left label">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-2.5">
                    <SkeletonLoader variant="row" />
                  </td>
                </tr>
              ))
            ) : releasesData?.data.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Package className="h-6 w-6 text-[var(--text-faint)]" />}
                    title="No bundles compiled yet"
                    description="Upload and compile a document to create your first bundle."
                  />
                </td>
              </tr>
            ) : (
              releasesData?.data.map((release) => (
                <tr
                  key={release.id}
                  className="transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm text-[var(--text-primary)]">
                      {release.version}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {format(new Date(release.created_at || Date.now()), 'd MMM yyyy')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getDocumentNames(release.document_ids).map((name, i) => (
                        <span key={i} className="badge badge-ghost text-[10px] max-w-[80px] truncate" title={name}>
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-[var(--text-secondary)]">
                    {(release.size_kb / 1024).toFixed(1)} MB
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {release.chunk_count}
                  </td>
                  <td className="px-4 py-3">
                    {release.is_active ? (
                      <span className="badge badge-success">Active</span>
                    ) : release.needs_review ? (
                      <span className="badge badge-warning">Needs Review</span>
                    ) : (
                      <span className="badge badge-ghost">Archived</span>
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
                        {release.is_active && (
                          <button
                            onClick={() => downloadActive()}
                            disabled={isDownloading}
                            className="btn btn-ghost btn-sm"
                            title="Download active bundle"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </AdminOnly>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
    </AdminGuard>
  )
}
