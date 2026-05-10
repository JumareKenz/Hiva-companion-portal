'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { FileText, Upload, Trash2, RefreshCw, Bot, ChevronDown, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import {
  useChatbots,
  useChatbotDocuments,
  useUploadChatbotDocument,
  useDeleteChatbotDocument,
  useReprocessChatbotDocument,
} from '@/features/assistants/hooks/useAssistants'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { cn } from '@/lib/utils'
import type { ChatbotDocument } from '@/types/common'

const STATUS_STYLES: Record<string, string> = {
  ready: 'badge-success',
  processing: 'badge-warning',
  pending: 'badge-ghost',
  error: 'badge-error',
}

function DocumentRow({
  doc,
  chatbotId,
}: {
  doc: ChatbotDocument
  chatbotId: string
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteChatbotDocument(chatbotId)
  const { mutate: reprocess, isPending: isReprocessing } = useReprocessChatbotDocument(chatbotId)

  return (
    <tr className="group transition-colors hover:bg-[var(--bg-secondary)]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <span className="max-w-[220px] truncate text-sm font-medium text-[var(--text-primary)]">
            {doc.filename}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'badge text-[10px]',
            STATUS_STYLES[doc.status] ?? 'badge-ghost'
          )}
        >
          {doc.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
        {doc.chunk_count != null ? `${doc.chunk_count}` : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
        {format(new Date(doc.created_at), 'd MMM yyyy')}
      </td>
      <td className="px-4 py-3">
        <AdminOnly>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {doc.status === 'error' && (
              <button
                onClick={() => reprocess(doc.id)}
                disabled={isReprocessing}
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--accent-600)]"
                title="Reprocess"
              >
                <RefreshCw
                  className={cn('h-4 w-4', isReprocessing && 'animate-spin')}
                />
              </button>
            )}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => deleteDoc(doc.id)}
                  disabled={isDeleting}
                  className="rounded border border-[var(--error)] px-2 py-0.5 text-xs text-[var(--error)] hover:bg-[var(--error)]/10"
                >
                  {isDeleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded border border-[var(--border-default)] px-2 py-0.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </AdminOnly>
      </td>
    </tr>
  )
}

function DropZone({ chatbotId }: { chatbotId: string }) {
  const [dragging, setDragging] = useState(false)
  const { mutate: uploadDoc, isPending: isUploading } = useUploadChatbotDocument(chatbotId)

  const upload = useCallback(
    (file: File) => {
      if (!file.name.match(/\.(pdf|docx|txt)$/i)) {
        toast.error('Only PDF, DOCX, and TXT files are supported')
        return
      }
      const fd = new FormData()
      fd.append('file', file)
      uploadDoc(fd)
    },
    [uploadDoc]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) upload(file)
    },
    [upload]
  )

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors',
        isUploading
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-[var(--accent-600)] hover:bg-[var(--bg-secondary)]',
        dragging
          ? 'border-[var(--accent-600)] bg-[var(--accent-600)]/5'
          : 'border-[var(--border-default)]'
      )}
    >
      {/* Input is the label's control — no programmatic .click() needed, no bubble */}
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
          e.target.value = ''
        }}
        disabled={isUploading}
      />
      {isUploading ? (
        <RefreshCw className="h-8 w-8 animate-spin text-[var(--accent-600)]" />
      ) : (
        <Upload className="h-8 w-8 text-[var(--text-faint)]" />
      )}
      <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
        {isUploading ? 'Uploading…' : 'Drop file here or click to browse'}
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">PDF, DOCX, or TXT</p>
    </label>
  )
}

function KnowledgeBaseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const chatbotId = searchParams.get('id') ?? ''

  const { data: chatbotsData, isLoading: chatbotsLoading } = useChatbots({ per_page: 100 })
  const { data: docsData, isLoading: docsLoading, isError: docsError } = useChatbotDocuments(chatbotId)

  const chatbots = chatbotsData?.data ?? []
  const docs: ChatbotDocument[] = Array.isArray(docsData)
    ? docsData
    : (docsData?.data ?? [])

  const hasProcessing = docs.some(
    (d) => d.status === 'processing' || d.status === 'pending'
  )

  // Poll when documents are still processing
  useEffect(() => {
    if (!hasProcessing || !chatbotId) return
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['chatbotDocuments', chatbotId] })
    }, 3000)
    return () => clearInterval(id)
  }, [hasProcessing, chatbotId, queryClient])

  const handleAssistantChange = (id: string) => {
    const params = new URLSearchParams()
    if (id) params.set('id', id)
    router.push(`/live-assistants/knowledge${id ? `?${params}` : ''}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            Knowledge Base
          </h1>
          {chatbotId && docs.length > 0 && (
            <span className="badge badge-accent">{docs.length} documents</span>
          )}
        </div>
      </div>

      {/* Assistant selector */}
      <div className="surface p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Assistant:
            </span>
          </div>
          <div className="relative">
            {chatbotsLoading ? (
              <div className="input min-w-[200px]">
                <SkeletonLoader variant="text" />
              </div>
            ) : (
              <>
                <select
                  value={chatbotId}
                  onChange={(e) => handleAssistantChange(e.target.value)}
                  className="input min-w-[200px] appearance-none pr-8"
                >
                  <option value="">Select an assistant…</option>
                  {chatbots.map((cb) => (
                    <option key={cb.id} value={cb.id}>
                      {cb.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
              </>
            )}
          </div>
        </div>
      </div>

      {!chatbotId ? (
        <div className="surface p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-[var(--text-faint)]" />
          <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)]">
            Select an assistant
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Choose an assistant above to manage its knowledge base documents.
          </p>
        </div>
      ) : (
        <>
          {/* Upload drop zone */}
          <AdminOnly>
            <DropZone chatbotId={chatbotId} />
          </AdminOnly>

          {/* Documents table */}
          <div className="surface overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['DOCUMENT', 'STATUS', 'CHUNKS', 'UPLOADED', 'ACTIONS'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left label">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {docsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-4 py-2.5">
                        <SkeletonLoader variant="row" />
                      </td>
                    </tr>
                  ))
                ) : docsError ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={
                          <AlertTriangle className="h-6 w-6 text-[var(--error)]" />
                        }
                        title="Could not load documents"
                        description="There was a problem fetching this assistant's documents. Please try again."
                      />
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={
                          <FileText className="h-6 w-6 text-[var(--text-faint)]" />
                        }
                        title="No documents yet"
                        description="Upload clinical guidelines to power this assistant."
                      />
                    </td>
                  </tr>
                ) : (
                  docs.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} chatbotId={chatbotId} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default function KnowledgeBasePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <SkeletonLoader variant="row" />
          <div className="surface p-12 text-center">
            <SkeletonLoader variant="card" />
          </div>
        </div>
      }
    >
      <KnowledgeBaseContent />
    </Suspense>
  )
}
