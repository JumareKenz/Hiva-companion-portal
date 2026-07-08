'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Upload,
  FileText,
  X,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ocrService, type OcrJob } from '@/services/ocr.service'
import { getCompilerToken } from '@/lib/auth'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

const MAX_FILE_SIZE = 50 * 1024 * 1024

// ── Upload panel ─────────────────────────────────────────────────────────────

function UploadPanel({ onJobCreated }: { onJobCreated: (job: OcrJob) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  // auto-upload fields
  const [autoUpload, setAutoUpload] = useState(false)
  const [name, setName] = useState('')
  const [source, setSource] = useState('')
  const [year, setYear] = useState('')

  const handleFile = useCallback((f: File | null | undefined) => {
    if (!f) return
    if (f.type !== 'application/pdf') {
      toast.error('Only PDF files are supported for OCR extraction')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error('File too large — maximum is 50 MB')
      return
    }
    setFile(f)
    if (!name) setName(f.name.replace(/\.pdf$/i, ''))
  }, [name])

  const canSubmit = file && (!autoUpload || (name.trim() && source.trim() && /^\d{4}$/.test(year)))

  const handleExtract = async () => {
    if (!file) return
    setUploading(true)
    setUploadPct(0)

    const formData = new FormData()
    formData.append('file', file)
    if (autoUpload) {
      formData.append('auto_upload', 'true')
      formData.append('name', name.trim())
      formData.append('source', source.trim())
      formData.append('year', year.trim())
    } else {
      formData.append('auto_upload', 'false')
    }

    try {
      // Use XHR for upload progress
      const token = getCompilerToken()
      const result = await new Promise<{ job_id: string; status: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/ocr/extract')
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 90))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadPct(100)
            try { resolve(JSON.parse(xhr.responseText)) }
            catch { reject(new Error('Invalid response')) }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })

      // Fetch initial job state to hand back
      const job = await ocrService.getJob(result.job_id)
      onJobCreated(job)

      toast.success('PDF queued for extraction')
      setFile(null)
      setName('')
      setSource('')
      setYear('')
      setAutoUpload(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadPct(0)
    }
  }

  return (
    <div className="surface p-5 space-y-4">
      <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
        Extract text from PDF
      </h2>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => !uploading && document.getElementById('ocr-file-input')?.click()}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-colors',
          uploading ? 'cursor-default opacity-60' : 'cursor-pointer',
          dragActive
            ? 'border-[var(--accent-600)] bg-[var(--accent-600)]/5'
            : 'border-[var(--border-default)] hover:border-[var(--accent-600)] hover:bg-[var(--accent-600)]/5'
        )}
      >
        <Upload className="h-8 w-8 text-[var(--accent-600)]" />
        <p className="mt-2 font-medium text-[var(--text-primary)]">Drop PDF here</p>
        <p className="text-sm text-[var(--text-muted)]">
          or <span className="text-[var(--accent-600)] underline">browse files</span>
        </p>
        <input
          id="ocr-file-input"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {file && (
        <div className="flex items-center gap-2 rounded-md bg-[var(--bg-secondary)] px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <span className="flex-1 truncate text-sm text-[var(--text-primary)]">{file.name}</span>
          <span className="text-xs text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          {!uploading && (
            <button type="button" onClick={() => setFile(null)} className="text-[var(--text-faint)] hover:text-[var(--error)]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {uploading && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            <div
              className="h-full rounded-full bg-[var(--accent-600)] transition-all duration-300"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
          <p className="text-right text-xs text-[var(--text-muted)]">{uploadPct}%</p>
        </div>
      )}

      {/* Auto-upload toggle */}
      <div className="rounded-lg border border-[var(--border-subtle)] p-3 space-y-3">
        <div
          onClick={() => setAutoUpload(!autoUpload)}
          className="flex cursor-pointer items-center gap-3"
        >
          <div className={cn(
            'flex h-5 w-5 items-center justify-center rounded border transition-colors',
            autoUpload ? 'bg-[var(--accent-600)] border-[var(--accent-600)]' : 'border-[var(--border-default)]'
          )}>
            {autoUpload && <CheckCircle2 className="h-3 w-3 text-white" />}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Auto-upload to Documents after extraction
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Creates a document and starts block extraction immediately
            </p>
          </div>
        </div>

        {autoUpload && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="col-span-2">
              <label className="label mb-1 block">Document name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g. Malaria Guidelines 2024"
              />
            </div>
            <div>
              <label className="label mb-1 block">Source org *</label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input"
                placeholder="e.g. National Health Ministry"
              />
            </div>
            <div>
              <label className="label mb-1 block">Year *</label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="input"
                placeholder="2024"
                maxLength={4}
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleExtract}
        disabled={!canSubmit || uploading}
        className="btn btn-primary w-full"
      >
        {uploading ? (
          <><RefreshCw className="h-4 w-4 animate-spin" /> Uploading…</>
        ) : (
          <><Upload className="h-4 w-4" /> Extract Text</>
        )}
      </button>
    </div>
  )
}

// ── Job row ───────────────────────────────────────────────────────────────────

function JobRow({ job, onDownload }: { job: OcrJob; onDownload: (id: string) => void }) {
  const isActive = job.status === 'queued' || job.status === 'running'

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <FileText className="h-4 w-4 shrink-0 text-[var(--text-faint)]" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--text-primary)]">
            {job.filename}
          </span>
          {job.output_chars != null && job.status === 'complete' && (
            <span className="text-xs text-[var(--text-faint)]">
              {(job.output_chars / 1000).toFixed(0)}k chars
            </span>
          )}
        </div>
        {isActive && (
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
              <div
                className="h-full rounded-full bg-[var(--accent-600)] transition-all duration-700"
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">{job.progress}%</span>
          </div>
        )}
        {job.status === 'failed' && job.error && (
          <p className="mt-0.5 text-xs text-[var(--error)] truncate">{job.error}</p>
        )}
      </div>

      {/* Status icon */}
      <div className="shrink-0">
        {job.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
        {job.status === 'failed' && <XCircle className="h-4 w-4 text-[var(--error)]" />}
        {isActive && <Clock className="h-4 w-4 animate-pulse text-[var(--accent-600)]" />}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {job.status === 'complete' && job.has_output && (
          <button
            onClick={() => onDownload(job.id)}
            className="btn btn-ghost btn-sm text-xs"
            title="Download .txt"
          >
            <Download className="h-3.5 w-3.5" />
            .txt
          </button>
        )}
        {job.status === 'complete' && job.document_id && (
          <Link
            href={`/documents/${job.document_id}`}
            className="btn btn-secondary btn-sm text-xs"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Document
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OcrPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<OcrJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const pollRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Load recent jobs on mount
  useEffect(() => {
    ocrService.listJobs()
      .then((list) => {
        setJobs(list)
        list.filter(j => j.status === 'queued' || j.status === 'running').forEach(startPolling)
      })
      .catch(() => toast.error('Failed to load recent extractions'))
      .finally(() => setLoadingJobs(false))

    return () => {
      pollRefs.current.forEach(clearInterval)
    }
  }, [])

  const startPolling = useCallback((job: OcrJob) => {
    if (pollRefs.current.has(job.id)) return

    const timer = setInterval(async () => {
      try {
        const updated = await ocrService.getJob(job.id)
        setJobs((prev) => prev.map((j) => j.id === updated.id ? updated : j))

        if (updated.status === 'complete' || updated.status === 'failed') {
          clearInterval(timer)
          pollRefs.current.delete(updated.id)

          if (updated.status === 'complete') {
            toast.success(`Extraction complete: ${updated.filename}`)
            // If auto-uploaded, redirect to document
            if (updated.document_id) {
              router.push(`/documents/${updated.document_id}`)
            }
          } else {
            toast.error(`Extraction failed: ${updated.error ?? 'Unknown error'}`)
          }
        }
      } catch {
        // Transient errors — keep polling
      }
    }, 2500)

    pollRefs.current.set(job.id, timer)
  }, [router])

  const handleJobCreated = useCallback((job: OcrJob) => {
    setJobs((prev) => [job, ...prev])
    startPolling(job)
  }, [startPolling])

  const handleDownload = useCallback(async (jobId: string) => {
    try {
      const blob = await ocrService.download(jobId)
      const job = jobs.find((j) => j.id === jobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = (job?.filename ?? jobId).replace(/\.pdf$/i, '.txt')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    }
  }, [jobs])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          PDF to Text
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Extract clean text from PDFs using OCR, then optionally upload as a document for block extraction.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Upload panel — left col */}
        <div className="lg:col-span-2">
          <UploadPanel onJobCreated={handleJobCreated} />
        </div>

        {/* Recent extractions — right col */}
        <div className="lg:col-span-3 surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3">
            <h2 className="font-medium text-[var(--text-primary)]">Recent Extractions</h2>
            {jobs.some((j) => j.status === 'queued' || j.status === 'running') && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--accent-600)]">
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                Polling every 2.5s
              </span>
            )}
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {loadingJobs ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5">
                  <SkeletonLoader variant="row" />
                </div>
              ))
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <FileText className="h-8 w-8 text-[var(--text-faint)]" />
                <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">No extractions yet</p>
                <p className="text-xs text-[var(--text-muted)]">Upload a PDF to get started</p>
              </div>
            ) : (
              jobs.map((job) => (
                <JobRow key={job.id} job={job} onDownload={handleDownload} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
