'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { documentsService } from '@/services/documents.service'
import { getCompilerToken } from '@/lib/auth'
import type { Document, ApiError } from '@/types/common'
import type { Language } from '@/types/enums'

export function useDocuments(params?: { page?: number; per_page?: number; status?: string }) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsService.list(params),
    staleTime: 30 * 1000,
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsService.get(id),
    staleTime: 10 * 1000,
    enabled: !!id,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => documentsService.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document uploaded — OCR processing has started')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to upload document')
    },
  })
}

export function useMarkReady(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => documentsService.markReady(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document marked as ready to compile')
    },
    onError: (error: ApiError) => {
      if (error.status === 400) {
        if (typeof error.detail === 'object' && error.detail !== null && 'pending_blocks' in error.detail) {
          const { pending_blocks, flagged_blocks } = error.detail as { pending_blocks?: number; flagged_blocks?: number }
          const parts: string[] = []
          if (pending_blocks) parts.push(`${pending_blocks} pending`)
          if (flagged_blocks) parts.push(`${flagged_blocks} flagged`)
          toast.error(`Cannot compile: ${parts.join(', ')} block(s) must be resolved first`)
        } else {
          toast.error(error.detail?.toString() || 'Some blocks are still unapproved')
        }
      } else {
        toast.error(error.detail?.toString() || 'Failed to mark ready')
      }
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => documentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document deleted')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to delete document')
    },
  })
}

export function useCompileDocument() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, languages }: { id: string; languages: Language[] }) =>
      documentsService.compile(id, { languages }),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Compile job started')
      router.push(`/jobs/${job.id}`)
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to start compile')
    },
  })
}

export function useUploadProgress() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const uploadWithProgress = async (formData: FormData): Promise<Document> => {
    return new Promise((resolve, reject) => {
      setIsUploading(true)
      setProgress(0)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/documents/upload')

      const token = getCompilerToken()
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        setIsUploading(false)
        if (xhr.status >= 200 && xhr.status < 300) {
          const json = JSON.parse(xhr.responseText)
          const doc = json.data ?? json
          queryClient.invalidateQueries({ queryKey: ['documents'] })
          resolve(doc)
        } else {
          reject(new Error(xhr.statusText))
        }
      }

      xhr.onerror = () => {
        setIsUploading(false)
        reject(new Error('Upload failed'))
      }

      xhr.send(formData)
    })
  }

  return { progress, isUploading, uploadWithProgress }
}
