'use client'

import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompileDocument } from '@/features/documents/hooks/useDocuments'
import type { Language } from '@/types/enums'

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ig', label: 'Igbo' },
  { code: 'pcm', label: 'Pidgin' },
]

interface CompileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentName: string
}

export function CompileModal({ open, onOpenChange, documentId, documentName }: CompileModalProps) {
  const [selected, setSelected] = useState<Language[]>(['en'])
  const { mutate: compile, isPending } = useCompileDocument()
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap
  useEffect(() => {
    if (!open) return
    const modal = modalRef.current
    if (!modal) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !(el as HTMLButtonElement | HTMLInputElement).disabled)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const toggleLang = (code: Language) => {
    if (code === 'en') return
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleCompile = () => {
    compile({ id: documentId, languages: selected })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && !isPending && onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div ref={modalRef} className="relative w-full max-w-md surface-overlay p-6">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Compile {documentName}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Select target languages for this bundle.</p>

        <div className="mt-4 space-y-2">
          {LANGUAGES.map((lang) => {
            const isSelected = selected.includes(lang.code)
            const isEn = lang.code === 'en'
            return (
              <button
                key={lang.code}
                type="button"
                disabled={isEn}
                onClick={() => toggleLang(lang.code)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition-all',
                  isSelected
                    ? 'border-[var(--accent-600)] bg-[var(--accent-600)]/5'
                    : 'border-[var(--border-default)] hover:bg-[var(--bg-secondary)]',
                  isEn && 'opacity-60 cursor-not-allowed'
                )}
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {lang.label} {isEn && <span className="text-[var(--text-muted)]">(required)</span>}
                </span>
                {isSelected && <Check className="h-4 w-4 text-[var(--accent-600)]" />}
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => onOpenChange(false)} disabled={isPending} className="btn btn-secondary btn-md">
            Cancel
          </button>
          <button onClick={handleCompile} disabled={isPending || selected.length < 1} className="btn btn-primary btn-md">
            {isPending ? 'Starting…' : 'Start Compile'}
          </button>
        </div>
      </div>
    </div>
  )
}
