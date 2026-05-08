'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Bot,
  Play,
  Pause,
  Archive,
  Trash2,
  Plus,
  Globe,
  MessageSquare,
} from 'lucide-react'

import { useChatbots, useActivateChatbot, usePauseChatbot, useArchiveChatbot, useDeleteChatbot } from '@/features/assistants/hooks/useAssistants'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { cn } from '@/lib/utils'
import type { ChatbotStatus } from '@/types/enums'
import { AlertTriangle } from 'lucide-react'

const STATUS_STYLES: Record<ChatbotStatus, string> = {
  active: 'badge badge-success',
  paused: 'badge badge-warning',
  draft: 'badge badge-ghost',
  archived: 'badge badge-error',
}

const STATUS_LABELS: Record<ChatbotStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  draft: 'Draft',
  archived: 'Archived',
}

export default function AssistantsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error } = useChatbots({ page, per_page: 20 })

  const { mutate: activate, isPending: isActivating } = useActivateChatbot()
  const { mutate: pause, isPending: isPausing } = usePauseChatbot()
  const { mutate: archive, isPending: isArchiving } = useArchiveChatbot()
  const { mutate: remove, isPending: isDeleting } = useDeleteChatbot()

  const items = data?.data ?? []
  const totalPages = data?.meta ? Math.ceil(data.meta.total / 20) : 1

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            Assistants
          </h1>
          {data?.meta && (
            <span className="badge badge-accent">{data.meta.total} assistants</span>
          )}
        </div>
        <AdminOnly>
          <Link href="/assistants/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" />
            New Assistant
          </Link>
        </AdminOnly>
      </div>

      {/* Table */}
      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {['NAME', 'STATUS', 'DOCUMENTS', 'CHANNELS', 'CREATED', 'ACTIONS'].map((h) => (
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
            ) : isError ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<AlertTriangle className="h-6 w-6 text-[var(--warning)]" />}
                    title="Failed to load assistants"
                    description={
                      (() => {
                        const e = error as { status?: number; detail?: unknown; message?: string } | null
                        if (!e) return 'Unknown error'
                        const detail = typeof e.detail === 'string' ? e.detail : e.message ?? 'Request failed'
                        return e.status ? `${e.status} — ${detail}` : detail
                      })()
                    }
                  />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Bot className="h-6 w-6 text-[var(--text-faint)]" />}
                    title="No assistants yet"
                    description="Create your first AI assistant to deploy online."
                  />
                </td>
              </tr>
            ) : (
              items.map((assistant) => (
                <tr
                  key={assistant.id}
                  className="transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-md"
                        style={{ backgroundColor: assistant.brand_color + '20' }}
                      >
                        <Bot className="h-4 w-4" style={{ color: assistant.brand_color }} />
                      </div>
                      <div>
                        <Link
                          href={`/assistants/${assistant.id}`}
                          className="font-medium text-sm text-[var(--text-primary)] hover:text-[var(--accent-600)]"
                        >
                          {assistant.name}
                        </Link>
                        <div className="text-xs font-mono text-[var(--text-muted)]">
                          {assistant.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px]', STATUS_STYLES[assistant.status])}>
                      {STATUS_LABELS[assistant.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {assistant.document_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <span
                        className="badge badge-ghost text-[10px]"
                        title="Web embed"
                      >
                        <Globe className="h-3 w-3" />
                        Web
                      </span>
                      <span
                        className="badge badge-ghost text-[10px]"
                        title="WhatsApp (coming soon)"
                      >
                        <MessageSquare className="h-3 w-3" />
                        WA
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {format(new Date(assistant.created_at), 'd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <AdminOnly>
                      <div className="flex items-center gap-1">
                        {assistant.status === 'draft' && (
                          <button
                            onClick={() => activate(assistant.id)}
                            disabled={isActivating}
                            className="btn btn-secondary btn-sm"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Activate
                          </button>
                        )}
                        {assistant.status === 'active' && (
                          <button
                            onClick={() => pause(assistant.id)}
                            disabled={isPausing}
                            className="btn btn-secondary btn-sm"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            Pause
                          </button>
                        )}
                        {(assistant.status === 'paused' || assistant.status === 'draft') && (
                          <button
                            onClick={() => archive(assistant.id)}
                            disabled={isArchiving}
                            className="btn btn-ghost btn-sm"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => remove(assistant.id)}
                          disabled={isDeleting}
                          className="btn btn-ghost btn-sm text-[var(--error)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
