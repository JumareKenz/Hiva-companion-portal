import { compilerApi } from './compilerHttp'
import type { HivRelease, PaginatedResponse } from '@/types/common'

export const releasesService = {
  async list(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<HivRelease>> {
    return compilerApi.get<PaginatedResponse<HivRelease>>('/releases', params)
  },

  async activate(id: string): Promise<HivRelease> {
    return compilerApi.post<HivRelease>(`/releases/${id}/activate`)
  },
}
