'use client'

import { useQuery } from '@tanstack/react-query'

import { chunksService } from '@/services/chunks.service'

export function useChunks(params?: {
  page?: number
  per_page?: number
  search?: string
  content_hash?: string
}) {
  return useQuery({
    queryKey: ['chunks', params],
    queryFn: () => chunksService.list(params),
    staleTime: 60 * 1000,
  })
}

export function useChunkStats() {
  return useQuery({
    queryKey: ['chunkStats'],
    queryFn: () => chunksService.stats(),
    staleTime: 120 * 1000,
  })
}
