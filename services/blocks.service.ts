import { compilerApi } from './compilerHttp'
import type { Block, PaginatedResponse } from '@/types/common'

export const blocksService = {
  async list(
    docId: string,
    params?: { page?: number; per_page?: number; status?: string }
  ): Promise<PaginatedResponse<Block>> {
    return compilerApi.get<PaginatedResponse<Block>>(`/documents/${docId}/blocks`, params)
  },

  async patch(
    id: string,
    body: {
      structured_content?: Record<string, unknown>
      status?: string
      reviewer_notes?: string
    }
  ): Promise<Block> {
    return compilerApi.patch<Block>(`/blocks/${id}`, body)
  },

  async reprocess(id: string): Promise<Block> {
    return compilerApi.post<Block>(`/blocks/${id}/reprocess`)
  },
}
