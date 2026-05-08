'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDocument } from '@/features/documents/hooks/useDocuments'
import { useBlocks, usePatchBlock, useReprocessBlock } from '@/features/blocks/hooks/useBlockActions'
import { useMarkReady } from '@/features/documents/hooks/useDocuments'
import { BlockCard } from '@/features/blocks/components/BlockCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { FileTypeBadge } from '@/components/ui/FileTypeBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { AdminOnly } from '@/components/guards/AdminOnly'

const PDFViewer = dynamic(() => import('@/components/pdf/PDFViewer'), { ssr: false })

export default function DocumentReviewPage() {
  const params = useParams()
  const docId = params.id as string
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [focusedIndex, setFocusedIndex] = useState(0)

  const { data: document, isLoading: docLoading } = useDocument(docId)
  const { data: blocksData, isLoading: blocksLoading } = useBlocks(docId, { page: 1, per_page: 50 })
  const { mutate: patchBlock } = usePatchBlock(docId)
  const { mutate: reprocessBlock } = useReprocessBlock(docId)
  const { mutate: markReady } = useMarkReady(docId)

  const blocks = blocksData?.data ?? []
  const approvedCount = blocks.filter((b) => b.status === 'approved').length
  const flaggedCount = blocks.filter((b) => b.status === 'flagged').length
  const pendingCount = blocks.filter((b) => b.status === 'pending').length

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return

      if (e.key === 'a' || e.key === 'A') {
        const block = blocks[focusedIndex]
        if (block) patchBlock({ id: block.id, body: { status: 'approved' } })
      }
      if (e.key === 'f' || e.key === 'F') {
        const block = blocks[focusedIndex]
        if (block) patchBlock({ id: block.id, body: { status: 'flagged', reviewer_notes: '' } })
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        setFocusedIndex((i) => (e.shiftKey ? Math.max(0, i - 1) : Math.min(blocks.length - 1, i + 1)))
      }
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(1, p - 1))
      if (e.key === 'ArrowRight') setPage((p) => p + 1)
    },
    [blocks, focusedIndex, patchBlock]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (docLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="row" />
        <SkeletonLoader variant="card" />
      </div>
    )
  }

  if (!document) {
    return <div className="text-[var(--text-muted)]">Document not found</div>
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
      {/* Sub-header */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface)] px-6">
        <div className="flex items-center gap-3">
          <span className="font-medium text-[var(--text-primary)]">{document.name}</span>
          <span className="text-sm text-[var(--text-muted)]">{document.source}</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={document.status} type="document" />
          <FileTypeBadge type={document.file_extension} />
          <span className="text-xs text-[var(--text-muted)]">OCR: Docling</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — PDF */}
        <div className="flex flex-1 flex-col border-r border-[var(--border-default)] bg-[var(--surface)]">
          <div className="flex h-10 items-center justify-between border-b border-[var(--border-default)] px-4">
            <span className="text-sm font-medium text-[var(--text-primary)]">Original Document</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn btn-ghost btn-sm">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-[var(--text-muted)]">Page {page}</span>
              <button onClick={() => setPage((p) => p + 1)} className="btn btn-ghost btn-sm">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={() => setScale((s) => Math.max(0.5, s - 0.2))} className="btn btn-ghost btn-sm">
                <ZoomOut className="h-4 w-4" />
              </button>
              <button onClick={() => setScale((s) => Math.min(3, s + 0.2))} className="btn btn-ghost btn-sm">
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <PDFViewer filePath={document.file_path} pageNumber={page} scale={scale} />
          </div>
        </div>

        {/* Right panel — Blocks */}
        <div className="flex w-[380px] flex-col bg-[var(--bg-primary)]">
          <div className="flex h-10 items-center justify-between border-b border-[var(--border-default)] px-4">
            <span className="text-sm font-medium text-[var(--text-primary)]">Structured Output</span>
            <span className="text-xs text-[var(--text-muted)]">{blocks.length} blocks</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {blocksLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonLoader key={i} variant="card" />
              ))
            ) : (
              blocks.map((block, index) => (
                <div
                  key={block.id}
                  onClick={() => setFocusedIndex(index)}
                  className={cn(
                    'group cursor-pointer rounded-lg transition-shadow',
                    focusedIndex === index && 'ring-2 ring-[var(--accent-600)]/30'
                  )}
                >
                  <BlockCard
                    block={block}
                    onApprove={() => patchBlock({ id: block.id, body: { status: 'approved' } })}
                    onFlag={() => patchBlock({ id: block.id, body: { status: 'flagged', reviewer_notes: '' } })}
                    onReprocess={() => reprocessBlock(block.id)}
                    onEdit={(content) => patchBlock({ id: block.id, body: { structured_content: { text: content } } })}
                    onEditNotes={(notes) => patchBlock({ id: block.id, body: { reviewer_notes: notes } })}
                  />
                </div>
              ))
            )}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between border-t border-[var(--border-default)] px-4 py-3">
            <div>
              <p className="text-sm text-[var(--text-muted)]">
                {approvedCount} of {blocks.length} reviewed · {flaggedCount} flagged
              </p>
              <div className="mt-1 h-1 w-40 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-600)] transition-all"
                  style={{ width: `${blocks.length > 0 ? (approvedCount / blocks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <AdminOnly>
              <button
                onClick={() => markReady()}
                disabled={pendingCount > 0}
                className="btn btn-primary btn-sm disabled:opacity-50"
              >
                Mark as Ready →
              </button>
            </AdminOnly>
          </div>
        </div>
      </div>
    </div>
  )
}
