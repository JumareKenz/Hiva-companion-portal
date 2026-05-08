'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle, Flag, RotateCw, AlertTriangle, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { useDebounce } from '@/hooks/useDebounce'
import type { Block } from '@/types/common'
import type { BlockType, BlockStatus } from '@/types/enums'

const BLOCK_TYPE_STYLES: Record<BlockType, string> = {
  paragraph: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  heading: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  table: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  image_placeholder: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
}

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: 'Paragraph',
  heading: 'Heading',
  table: 'Table',
  image_placeholder: 'Image',
}

const STATUS_BORDER: Record<BlockStatus, string> = {
  pending: 'border-l-[var(--bg-tertiary)]',
  approved: 'border-l-[var(--success)]',
  flagged: 'border-l-[var(--warning)]',
}

interface BlockCardProps {
  block: Block
  onApprove: () => void
  onFlag: () => void
  onReprocess: () => void
  onEdit: (content: string) => void
  onEditNotes?: (notes: string) => void
}

export function BlockCard({ block, onApprove, onFlag, onReprocess, onEdit, onEditNotes }: BlockCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(block.raw_content)
  const [noteValue, setNoteValue] = useState(block.reviewer_notes || '')

  const debouncedEdit = useDebounce(editValue, 30000)
  const debouncedNote = useDebounce(noteValue, 30000)

  // Refs for unmount flush
  const editValueRef = useRef(editValue)
  const noteValueRef = useRef(noteValue)
  const blockRef = useRef(block)
  const onEditRef = useRef(onEdit)
  const onEditNotesRef = useRef(onEditNotes)

  editValueRef.current = editValue
  noteValueRef.current = noteValue
  blockRef.current = block
  onEditRef.current = onEdit
  onEditNotesRef.current = onEditNotes

  // Auto-save on debounce
  useEffect(() => {
    if (debouncedEdit !== block.raw_content) {
      onEdit(debouncedEdit)
    }
  }, [debouncedEdit, block.raw_content, onEdit])

  useEffect(() => {
    if (onEditNotes && debouncedNote !== (block.reviewer_notes || '')) {
      onEditNotes(debouncedNote)
    }
  }, [debouncedNote, block.reviewer_notes, onEditNotes])

  // Flush pending edits on unmount
  useEffect(() => {
    return () => {
      if (editValueRef.current !== blockRef.current.raw_content) {
        onEditRef.current(editValueRef.current)
      }
      if (onEditNotesRef.current && noteValueRef.current !== (blockRef.current.reviewer_notes || '')) {
        onEditNotesRef.current(noteValueRef.current)
      }
    }
  }, [])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    if (editValue !== block.raw_content) {
      onEdit(editValue)
    }
  }, [editValue, block.raw_content, onEdit])

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border-default)] bg-[var(--surface)] p-3 transition-colors duration-200',
        'border-l-[3px]',
        STATUS_BORDER[block.status]
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="badge badge-ghost font-mono text-[10px]">#{block.block_index}</span>
        <span className={cn('badge text-[10px]', BLOCK_TYPE_STYLES[block.block_type])}>
          {BLOCK_TYPE_LABELS[block.block_type]}
        </span>
        <div className="mx-2 flex-1">
          <ConfidenceBar score={block.confidence_score} />
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onApprove}
            aria-label="Approve block"
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-600)]"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button
            onClick={onFlag}
            aria-label="Flag block"
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--warning)]"
          >
            <Flag className="h-4 w-4" />
          </button>
          <button
            onClick={onReprocess}
            aria-label="Reprocess block"
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-2">
        {block.block_type === 'image_placeholder' ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)] p-4">
            <ImageIcon className="h-5 w-5 text-[var(--text-faint)]" />
            <p className="text-xs text-[var(--text-muted)]">Image region — add description</p>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              className="input min-h-[60px] text-sm"
              placeholder="Describe this image..."
            />
          </div>
        ) : block.block_type === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {block.structured_content && typeof block.structured_content === 'object' ? (
                  Object.entries(block.structured_content).map(([key, val]) => (
                    <tr key={key} className="border-b border-[var(--border-subtle)]">
                      <td className="py-1 pr-3 font-mono font-medium text-[var(--text-muted)]">{key}</td>
                      <td className="py-1 text-[var(--text-secondary)]">{String(val)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-[var(--text-muted)]">No structured data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : isEditing ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className="input min-h-[80px] text-sm"
          />
        ) : (
          <p
            onClick={() => setIsEditing(true)}
            className="cursor-text text-sm leading-relaxed text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            {block.raw_content}
          </p>
        )}
      </div>

      {/* Low confidence warning */}
      {block.confidence_score < 0.75 && (
        <div className="mt-2 flex items-start gap-2 rounded-md bg-[var(--warning)]/5 p-2 text-xs text-[var(--warning)]">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          Low confidence — verify before approving.
        </div>
      )}

      {/* Flagged notes */}
      {block.status === 'flagged' && (
        <div className="mt-2">
          <textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={() => {
              if (noteValue !== (block.reviewer_notes || '')) {
                // Note: parent should handle saving via onFlag or separate call
              }
            }}
            placeholder="Add reviewer note (required)"
            className="input min-h-[60px] text-sm"
          />
        </div>
      )}
    </div>
  )
}
