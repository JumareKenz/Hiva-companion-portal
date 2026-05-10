'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Save,
  Loader2,
} from 'lucide-react'

import {
  useChatbots,
  useUpdateChatbot,
  useDeleteChatbot,
} from '@/features/assistants/hooks/useAssistants'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { cn } from '@/lib/utils'
import type { AgencyChatbot } from '@/types/common'
import type { ChatbotStatus } from '@/types/enums'
import type { UpdateChatbotBody } from '@/services/chatbots.service'

const STATUS_STYLES: Record<ChatbotStatus, string> = {
  active: 'badge badge-success',
  paused: 'badge badge-warning',
  draft: 'badge badge-ghost',
  archived: 'badge badge-error',
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ha: 'Hausa',
  yo: 'Yoruba',
  ig: 'Igbo',
  pcm: 'Pidgin',
}

function EditModal({
  assistant,
  onClose,
}: {
  assistant: AgencyChatbot
  onClose: () => void
}) {
  const { mutate: update, isPending } = useUpdateChatbot(assistant.id)
  const [values, setValues] = useState<UpdateChatbotBody>({
    name: assistant.name,
    system_prompt: assistant.system_prompt ?? '',
    welcome_message: assistant.welcome_message,
    fallback_message: assistant.fallback_message ?? '',
    brand_color: assistant.brand_color,
    temperature: assistant.temperature,
    top_k: assistant.top_k,
    min_confidence: assistant.min_confidence,
    enable_citations: assistant.enable_citations,
    enable_grounding: assistant.enable_grounding,
    strict_domain: assistant.strict_domain,
  })

  const save = () => update(values, { onSuccess: onClose })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg surface rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            Edit Assistant
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label mb-1 block">Name</label>
            <input
              value={values.name ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              className="input w-full"
            />
          </div>
          <div>
            <label className="label mb-1 block">System Prompt</label>
            <textarea
              value={values.system_prompt ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, system_prompt: e.target.value }))}
              className="input w-full min-h-[80px] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1 block">Welcome Message</label>
              <input
                value={values.welcome_message ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, welcome_message: e.target.value }))}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label mb-1 block">Brand Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={values.brand_color ?? '#155D46'}
                  onChange={(e) => setValues((v) => ({ ...v, brand_color: e.target.value }))}
                  className="h-9 w-9 cursor-pointer rounded border border-[var(--border-default)]"
                />
                <input
                  value={values.brand_color ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, brand_color: e.target.value }))}
                  className="input flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label mb-1 block">Temperature</label>
              <input
                type="number"
                step={0.1}
                min={0}
                max={1}
                value={values.temperature ?? 0.7}
                onChange={(e) =>
                  setValues((v) => ({ ...v, temperature: parseFloat(e.target.value) }))
                }
                className="input w-full"
              />
            </div>
            <div>
              <label className="label mb-1 block">Top K</label>
              <input
                type="number"
                min={1}
                max={100}
                value={values.top_k ?? 10}
                onChange={(e) =>
                  setValues((v) => ({ ...v, top_k: parseInt(e.target.value) }))
                }
                className="input w-full"
              />
            </div>
            <div>
              <label className="label mb-1 block">Min Confidence</label>
              <input
                type="number"
                step={0.05}
                min={0}
                max={1}
                value={values.min_confidence ?? 0.7}
                onChange={(e) =>
                  setValues((v) => ({ ...v, min_confidence: parseFloat(e.target.value) }))
                }
                className="input w-full"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {(
              [
                { key: 'enable_citations', label: 'Citations' },
                { key: 'enable_grounding', label: 'Grounding' },
                { key: 'strict_domain', label: 'Strict Domain' },
              ] as { key: keyof UpdateChatbotBody; label: string }[]
            ).map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!(values[key])}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.checked }))}
                  className="rounded border-[var(--border-default)] text-[var(--accent-600)]"
                />
                <span className="text-sm text-[var(--text-primary)]">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
          <button onClick={onClose} className="btn btn-secondary btn-md">
            Cancel
          </button>
          <button onClick={save} disabled={isPending} className="btn btn-primary btn-md">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({
  assistant,
  onClose,
  onConfirm,
  isPending,
}: {
  assistant: AgencyChatbot
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm surface rounded-xl p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Delete Assistant
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Are you sure you want to delete{' '}
          <strong className="text-[var(--text-primary)]">{assistant.name}</strong>? This
          cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary btn-md">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="btn btn-destructive btn-md"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LiveAssistantsPage() {
  const { data, isLoading, isError, error } = useChatbots({ page: 1, per_page: 100 })
  const { mutate: remove, isPending: isDeleting } = useDeleteChatbot()

  const [editingAssistant, setEditingAssistant] = useState<AgencyChatbot | null>(null)
  const [deletingAssistant, setDeletingAssistant] = useState<AgencyChatbot | null>(null)

  const items = data?.data ?? []

  const handleDelete = () => {
    if (!deletingAssistant) return
    remove(deletingAssistant.id, { onSuccess: () => setDeletingAssistant(null) })
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
              Live Assistants
            </h1>
            {data?.meta && (
              <span className="badge badge-accent">{data.meta.total}</span>
            )}
          </div>
          <AdminOnly>
            <Link href="/live-assistants/create" className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" />
              Create Assistant
            </Link>
          </AdminOnly>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface p-5">
                <SkeletonLoader variant="card" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="surface p-8">
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6 text-[var(--warning)]" />}
              title="Failed to load assistants"
              description={(() => {
                const e = error as {
                  status?: number
                  detail?: unknown
                  message?: string
                } | null
                if (!e) return 'Unknown error'
                const detail =
                  typeof e.detail === 'string' ? e.detail : (e.message ?? 'Request failed')
                return e.status ? `${e.status} — ${detail}` : detail
              })()}
            />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && items.length === 0 && (
          <div className="surface p-12">
            <EmptyState
              icon={<Bot className="h-8 w-8 text-[var(--text-faint)]" />}
              title="No assistants yet"
              description="Create your first AI assistant to start serving users."
              action={{
                label: 'Create Assistant',
                onClick: () => {
                  window.location.href = '/live-assistants/create'
                },
              }}
            />
          </div>
        )}

        {/* Cards grid */}
        {!isLoading && !isError && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((assistant) => (
              <div
                key={assistant.id}
                className="surface-raised flex flex-col space-y-4 p-5"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: assistant.brand_color + '20' }}
                    >
                      <Bot
                        className="h-5 w-5"
                        style={{ color: assistant.brand_color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-semibold text-[var(--text-primary)]">
                        {assistant.name}
                      </div>
                      <div className="truncate text-xs font-mono text-[var(--text-muted)]">
                        {assistant.slug}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-[10px]',
                      STATUS_STYLES[assistant.status]
                    )}
                  >
                    {assistant.status}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span>{assistant.document_count} docs</span>
                  <span>·</span>
                  <span>
                    {LANGUAGE_LABELS[assistant.primary_language] ??
                      assistant.primary_language}
                  </span>
                  <span>·</span>
                  <span>{format(new Date(assistant.updated_at), 'd MMM yyyy')}</span>
                </div>

                {/* Actions */}
                <AdminOnly>
                  <div className="flex gap-2 border-t border-[var(--border-subtle)] pt-3">
                    <button
                      onClick={() => setEditingAssistant(assistant)}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingAssistant(assistant)}
                      className="btn btn-ghost btn-sm text-[var(--error)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </AdminOnly>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {editingAssistant && (
        <EditModal
          assistant={editingAssistant}
          onClose={() => setEditingAssistant(null)}
        />
      )}
      {deletingAssistant && (
        <DeleteConfirmModal
          assistant={deletingAssistant}
          onClose={() => setDeletingAssistant(null)}
          onConfirm={handleDelete}
          isPending={isDeleting}
        />
      )}
    </>
  )
}
