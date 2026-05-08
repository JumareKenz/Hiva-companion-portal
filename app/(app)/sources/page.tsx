'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, Database, CheckCircle, Layers, Globe } from 'lucide-react'

import { chunksService } from '@/services/chunks.service'
import { useChunks, useChunkStats } from '@/features/chunks/hooks/useChunks'
import { StatCard } from '@/components/ui/StatCard'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'
import type { ChunkType } from '@/types/enums'

const CHUNK_TYPE_STYLES: Record<ChunkType, string> = {
  drug_table: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  danger_sign: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  decision_tree: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  protocol: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  faq: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
}

const CHUNK_TYPE_LABELS: Record<ChunkType, string> = {
  drug_table: 'Drug Table',
  danger_sign: 'Danger Sign',
  decision_tree: 'Decision Tree',
  protocol: 'Protocol',
  faq: 'FAQ',
}

export default function SourcesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ChunkType | ''>('')

  const { data: stats, isLoading: statsLoading } = useChunkStats()
  const { data: chunksData, isLoading: chunksLoading } = useChunks({
    page,
    per_page: 20,
    search: search || undefined,
    content_hash: /^[a-f0-9]{64}$/i.test(search) ? search : undefined,
    // Note: type filter is not supported by backend yet — filtered client-side
  })

  const totalPages = chunksData ? Math.ceil(chunksData.meta.total / 20) : 1

  const languageCount = useMemo(() => {
    if (!stats) return 0
    return Object.values(stats.translated_by_lang).filter((c) => c > 0).length
  }, [stats])

  // Client-side type filter since backend doesn't support ?type yet
  const filteredChunks = useMemo(() => {
    if (!chunksData) return []
    if (!typeFilter) return chunksData.data
    return chunksData.data.filter((c) => c.chunk_type === typeFilter)
  }, [chunksData, typeFilter])

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
        Chunk Library
      </h1>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Chunks"
          value={stats?.total ?? '—'}
          icon={<Database className="h-4 w-4 text-[var(--text-faint)]" />}
          className="entrance entrance-d1"
        />
        <StatCard
          label="Compiled"
          value={stats?.compiled ?? '—'}
          icon={<CheckCircle className="h-4 w-4 text-[var(--text-faint)]" />}
          className="entrance entrance-d2"
        />
        <StatCard
          label="Cache Hit Rate"
          value={stats ? `${(stats.reuse_rate * 100).toFixed(1)}%` : '—'}
          icon={<Layers className="h-4 w-4 text-[var(--text-faint)]" />}
          className="entrance entrance-d3"
        />
        <StatCard
          label="Languages"
          value={languageCount}
          icon={<Globe className="h-4 w-4 text-[var(--text-faint)]" />}
          className="entrance entrance-d4"
        />
      </div>

      {/* Translation coverage */}
      {stats && (
        <div className="surface p-5 entrance entrance-d2">
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            Translation Coverage
          </h3>
          <div className="mt-4 space-y-3">
            {(['en', 'pcm', 'ha', 'yo', 'ig'] as const).map((lang) => {
              const count = stats.translated_by_lang[lang] ?? 0
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
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
                    {count} / {stats.total} ({Math.round(pct)}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            type="text"
            placeholder="Search by content or hash…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input pl-9 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as ChunkType | ''); setPage(1) }}
          className="input text-sm w-40"
        >
          <option value="">All types</option>
          {Object.entries(CHUNK_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Chunk table */}
      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {['CONTENT HASH', 'TYPE', 'PREVIEW', 'TONE', 'TRANSLATIONS', 'LAST USED'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left label">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {chunksLoading || statsLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-2.5">
                    <SkeletonLoader variant="row" />
                  </td>
                </tr>
              ))
            ) : filteredChunks.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Database className="h-6 w-6 text-[var(--text-faint)]" />}
                    title="No chunks found"
                    description="Try adjusting your search or filter."
                  />
                </td>
              </tr>
            ) : (
              filteredChunks.map((chunk) => {
                return (
                  <tr
                    key={chunk.id}
                    className="transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <td className="px-4 py-3">
                      <span className="badge badge-ghost font-mono text-[10px]">
                        {chunk.content_hash.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {chunk.chunk_type ? (
                        <span className={cn('badge text-[10px]', CHUNK_TYPE_STYLES[chunk.chunk_type])}>
                          {CHUNK_TYPE_LABELS[chunk.chunk_type]}
                        </span>
                      ) : (
                        <span className="badge badge-ghost text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chunk.compiled_en_preview ? (
                        <span className="text-xs text-[var(--text-secondary)] truncate max-w-[200px] block" title={chunk.compiled_en_preview}>
                          {chunk.compiled_en_preview}
                        </span>
                      ) : (
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-[var(--bg-tertiary)]" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chunk.tone_applied ? (
                        <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                      ) : (
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-[var(--bg-tertiary)]" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {chunk.translations_available.map((lang) => (
                          <span key={lang} className="badge badge-ghost text-[10px]">
                            {lang.toUpperCase()}
                          </span>
                        ))}
                        {chunk.translations_available.length === 0 && (
                          <span className="text-xs text-[var(--text-faint)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {formatDate(chunk.last_used_at)}
                    </td>
                  </tr>
                )
              })
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
  )
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'd MMM yyyy')
  } catch {
    return '—'
  }
}
