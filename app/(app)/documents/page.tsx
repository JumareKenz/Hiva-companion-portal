'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileStack,
  Eye,
  Play,
  Trash2,
  ChevronDown,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDocuments, useDeleteDocument } from '@/features/documents/hooks/useDocuments'
import { UploadModal } from '@/features/documents/components/UploadModal'
import { CompileModal } from '@/features/documents/components/CompileModal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { FileTypeBadge } from '@/components/ui/FileTypeBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { LogoBackground } from '@/components/ui/LogoBackground'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { useDebounce } from '@/hooks/useDebounce'
import { format } from 'date-fns'
import type { DocumentStatus } from '@/types/enums'

const TABS: { label: string; value?: DocumentStatus }[] = [
  { label: 'All' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Ready', value: 'ready_to_compile' },
  { label: 'Compiled', value: 'compiled' },
  { label: 'Failed', value: 'failed' },
]

export default function DocumentQueuePage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | undefined>()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [sort, setSort] = useState<'recent' | 'name'>('recent')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [compileDoc, setCompileDoc] = useState<{ id: string; name: string } | null>(null)

  const { data, isLoading } = useDocuments({
    page,
    per_page: 20,
    status: statusFilter,
  })

  const { mutate: deleteDoc } = useDeleteDocument()

  const filteredItems =
    data?.data.filter((d) =>
      debouncedSearch ? d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) : true
    ) ?? []

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const totalPages = data?.meta ? Math.ceil(data.meta.total / 20) : 1

  return (
    <div className="relative space-y-6">
      <LogoBackground size={700} opacity={0.025} fixed={false} spin={false} breathe={false} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Document Queue</h1>
          {data?.meta && (
            <span className="badge badge-accent">{data.meta.total} documents</span>
          )}
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn btn-primary btn-sm">
          Upload Document
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors',
              statusFilter === tab.value || (!tab.value && !statusFilter)
                ? 'border-b-2 border-[var(--accent-600)] text-[var(--accent-600)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'recent' | 'name')}
            className="input appearance-none pr-8 text-sm"
          >
            <option value="recent">Most recent</option>
            <option value="name">Name A–Z</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-[var(--text-faint)]" />
        </div>
      </div>

      {/* Table */}
      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {['DOCUMENT', 'UPLOADED', 'STATUS', 'ACTIONS'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left label">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-4 py-2.5">
                    <SkeletonLoader variant="row" />
                  </td>
                </tr>
              ))
            ) : sortedItems.length === 0 ? (
              <tr>
                <td colSpan={4}>
          <EmptyState
              icon={<FileStack className="h-6 w-6 text-[var(--text-faint)]" />}
              title="No documents"
              description="Upload your first clinical document to get started."
              action={{ label: 'Upload Document', onClick: () => setUploadOpen(true) }}
            />
                </td>
              </tr>
            ) : (
              sortedItems.map((doc) => (
                <tr
                  key={doc.id}
                  className="group transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileTypeBadge type={doc.file_extension} />
                      <div>
                        <Link
                          href={`/documents/${doc.id}`}
                          className="font-medium text-sm text-[var(--text-primary)] hover:text-[var(--accent-600)]"
                        >
                          {doc.name}
                        </Link>
                        <div className="text-xs text-[var(--text-muted)]">{doc.source}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {format(new Date(doc.created_at), 'd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} type="document" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-600)]"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <AdminOnly>
                        {doc.status === 'ready_to_compile' && (
                          <button
                            onClick={() => setCompileDoc({ id: doc.id, name: doc.name })}
                            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-600)]"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteDoc(doc.id)}
                          className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--error)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AdminOnly>
                    </div>
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

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
      {compileDoc && (
        <CompileModal
          open={!!compileDoc}
          onOpenChange={(open) => !open && setCompileDoc(null)}
          documentId={compileDoc.id}
          documentName={compileDoc.name}
        />
      )}
    </div>
  )
}
