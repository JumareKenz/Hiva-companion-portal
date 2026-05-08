import { compilerApi } from './compilerHttp'
import type { ChunkLibraryEntry, ChunkStats, PaginatedResponse } from '@/types/common'

export const chunksService = {
  async list(
    params?: {
      page?: number
      per_page?: number
      search?: string
      content_hash?: string
    }
  ): Promise<PaginatedResponse<ChunkLibraryEntry>> {
    return compilerApi.get<PaginatedResponse<ChunkLibraryEntry>>('/chunks', params)
  },

  async stats(): Promise<ChunkStats> {
    return compilerApi.get<ChunkStats>('/chunks/stats')
  },
}
