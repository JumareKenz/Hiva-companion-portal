'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | string)[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (!pages.includes(i)) pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    if (!pages.includes(totalPages)) pages.push(totalPages)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="btn btn-ghost btn-sm inline-flex items-center gap-1 disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-[var(--text-faint)]">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              'btn btn-sm min-w-[2rem]',
              page === p
                ? 'btn-primary'
                : 'btn-ghost'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="btn btn-ghost btn-sm inline-flex items-center gap-1 disabled:opacity-40"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
