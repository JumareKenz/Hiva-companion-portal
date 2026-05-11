import { compilerApi } from './compilerHttp'
import type { HivRelease, PaginatedResponse } from '@/types/common'
import type { Language } from '@/types/enums'

export interface BuildReleaseRequest {
  document_ids: string[]
  languages: Language[]
  activate: boolean
}

export interface BuildReleaseResponse {
  id: string
  version: string
  status: string
}

export const releasesService = {
  async list(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<HivRelease>> {
    return compilerApi.get<PaginatedResponse<HivRelease>>('/releases', params)
  },

  async activate(id: string): Promise<HivRelease> {
    return compilerApi.post<HivRelease>(`/releases/${id}/activate`)
  },

  async build(body: BuildReleaseRequest): Promise<BuildReleaseResponse> {
    return compilerApi.post<BuildReleaseResponse>('/releases/build', body)
  },
}
