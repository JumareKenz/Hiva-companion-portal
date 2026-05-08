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
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPdf() {
      try {
        const token = getCompilerToken()

        const url = filePath.startsWith('http') ? filePath : `/api${filePath.startsWith('/') ? '' : '/'}${filePath}`
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error('Failed to load PDF')
        const blob = await res.blob()
        setBlobUrl(URL.createObjectURL(blob))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load PDF')
      }
    }

    loadPdf()
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [filePath])

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--text-muted)]">
        {error}
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
