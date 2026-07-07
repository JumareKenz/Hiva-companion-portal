'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useUploadDocument, useUploadProgress } from '@/features/documents/hooks/useDocuments'

const MAX_FILE_SIZE = 50 * 1024 * 1024

const uploadSchema = z.object({
  name: z.string().trim().min(1, 'Document name is required'),
  source: z.string().trim().min(1, 'Source organization is required'),
  year: z.string().regex(/^\d{4}$/, 'Enter a valid year'),
  origin_language: z.string().default('English'),
})

type UploadForm = z.infer<typeof uploadSchema>

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const { progress, isUploading, uploadWithProgress } = useUploadProgress()
  const { mutate: uploadMutation } = useUploadDocument()
  const modalRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    mode: 'onChange',
  })

  // Focus trap: keep tab cycling within modal + auto-focus first input
  useEffect(() => {
    if (!open) return
    const modal = modalRef.current
    if (!modal) return

    // Auto-focus first input
    const firstInput = modal.querySelector<HTMLElement>('input:not([type="file"]), select, textarea')
    firstInput?.focus()

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

  const handleFile = useCallback((f: File | null | undefined) => {
    if (!f) return
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'].includes(f.type)) {
      toast.error('Only PDF, DOCX, TXT, and MD files are supported')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error(`File too large — maximum is ${MAX_FILE_SIZE / 1024 / 1024} MB`)
      return
    }
    setFile(f)
  }, [])

  const onSubmit = async (data: UploadForm) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', data.name)
    formData.append('source', data.source)
    formData.append('year', data.year)
    formData.append('origin_language', data.origin_language)

    try {
      await uploadWithProgress(formData)
      onOpenChange(false)
      reset()
      setFile(null)
      router.refresh()
    } catch {
      // Error handled by mutation
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && !isUploading && onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div ref={modalRef} className="relative w-full max-w-lg surface-overlay p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Upload clinical document</h2>
          {!isUploading && (
            <button onClick={() => onOpenChange(false)} className="btn btn-ghost btn-sm">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => document.getElementById('file-input')?.click()}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer',
              dragActive
                ? 'border-[var(--accent-600)] bg-[var(--accent-600)]/5'
                : 'border-[var(--border-default)] hover:border-[var(--accent-600)] hover:bg-[var(--accent-600)]/5'
            )}
          >
            <Upload className="h-8 w-8 text-[var(--accent-600)]" />
            <p className="mt-2 font-medium text-[var(--text-primary)]">Drag PDF or DOCX here</p>
            <p className="text-sm text-[var(--text-muted)]">
              or <span className="text-[var(--accent-600)] underline">browse files</span>
            </p>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              id="file-input"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 rounded-md bg-[var(--bg-secondary)] px-3 py-2">
              <FileText className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="flex-1 truncate text-sm text-[var(--text-primary)]">{file.name}</span>
              <span className="text-xs text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              <button type="button" onClick={() => setFile(null)} className="text-[var(--text-faint)] hover:text-[var(--error)]">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {isUploading && (
            <div className="space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                <div className="h-full rounded-full bg-[var(--accent-600)] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-right text-xs text-[var(--text-muted)]">{progress}%</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Document name *</label>
              <input {...register('name')} className={cn('input', errors.name && 'input-error')} placeholder="e.g. Malaria Guidelines 2024" />
              {errors.name && <p className="error-msg">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label mb-1.5 block">Source org *</label>
              <input {...register('source')} className={cn('input', errors.source && 'input-error')} placeholder="e.g. National Health Ministry" />
              {errors.source && <p className="error-msg">{errors.source.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Year *</label>
              <input {...register('year')} className={cn('input', errors.year && 'input-error')} placeholder="2024" />
              {errors.year && <p className="error-msg">{errors.year.message}</p>}
            </div>
            <div>
              <label className="label mb-1.5 block">Origin language</label>
              <select {...register('origin_language')} className="input">
                <option>English</option>
                <option>Hausa</option>
                <option>Yoruba</option>
                <option>Igbo</option>
                <option>Pidgin</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} disabled={isUploading} className="btn btn-secondary btn-md">
              Cancel
            </button>
            <button type="submit" disabled={!file || !isValid || isUploading} className="btn btn-primary btn-md">
              {isUploading ? 'Uploading…' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
