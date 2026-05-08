'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { blocksService } from '@/services/blocks.service'
import type { ApiError } from '@/types/common'

export function useBlocks(docId: string, params?: { page?: number; per_page?: number; status?: string }) {
  return useQuery({
    queryKey: ['blocks', docId, params],
    queryFn: () => blocksService.list(docId, params),
    staleTime: 5 * 1000,
    enabled: !!docId,
  })
}

export function usePatchBlock(docId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: {
        structured_content?: Record<string, unknown>
        status?: string
        reviewer_notes?: string
      }
    }) => blocksService.patch(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', docId] })
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to update block')
    },
  })
}

export function useReprocessBlock(docId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => blocksService.reprocess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', docId] })
      toast.success('Block queued for reprocessing')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to reprocess block')
    },
  })
}
