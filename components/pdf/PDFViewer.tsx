'use client'

import { useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { Loader2 } from 'lucide-react'
import { getCompilerToken } from '@/lib/auth'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  filePath: string
  pageNumber: number
  scale?: number
}

export default function PDFViewer({ filePath, pageNumber, scale = 1.2 }: PDFViewerProps) {
  const isDocx = filePath.toLowerCase().endsWith('.docx')
  
  if (isDocx) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
        <span>DOCX files require conversion to PDF for viewing</span>
        <span className="text-xs text-[var(--text-faint)]">The document will be available as PDF after OCR processing</span>
      </div>
    )
  }

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let revoked = false

    async function loadPdf() {
      try {
        const token = getCompilerToken()

        let url: string
        if (filePath.startsWith('http')) {
          url = filePath
        } else if (filePath.startsWith('/storage/') || filePath.startsWith('/app/storage/')) {
          url = `/api${filePath}`
        } else {
          url = `/api/${filePath.startsWith('/') ? filePath.slice(1) : filePath}`
        }

        const headers: HeadersInit = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(url, { headers })
        if (!res.ok) throw new Error(`Failed to load PDF (${res.status})`)
        const blob = await res.blob()
        if (cancelled) return
        const objectUrl = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          revoked = true
          return
        }
        setBlobUrl(objectUrl)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load PDF')
      }
    }

    loadPdf()
    return () => {
      cancelled = true
      if (blobUrl && !revoked) URL.revokeObjectURL(blobUrl)
    }
  }, [filePath])

  if (error) {
    const isDocx = filePath.toLowerCase().endsWith('.docx')
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
        {isDocx ? (
          <>
            <span>DOCX files require conversion to PDF for viewing</span>
            <span className="text-xs text-[var(--text-faint)]">The document will be converted during the OCR process</span>
          </>
        ) : (
          <>
            <span>Unable to load PDF</span>
            <span className="text-xs text-[var(--text-faint)]">{error}</span>
          </>
        )}
      </div>
    )
  }

  if (!blobUrl) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-600)]" />
      </div>
    )
  }

  return (
    <Document
      file={blobUrl}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      onLoadError={() => setError('Failed to render PDF')}
      loading={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-600)]" />
        </div>
      }
    >
      <Page
        pageNumber={Math.min(pageNumber, numPages || 1)}
        scale={scale}
        renderTextLayer
        renderAnnotationLayer
        className="shadow-md"
      />
    </Document>
  )
}