import { compilerApi } from './compilerHttp'
import type { HivRelease, BundleJob, PaginatedResponse } from '@/types/common'
import type { Language } from '@/types/enums'

export interface BuildReleaseRequest {
  document_ids: string[]
  languages: Language[]
  activate: boolean
}

export const releasesService = {
  list(params?: { page?: number; per_page?: number; active?: boolean }) {
    return compilerApi.get<PaginatedResponse<HivRelease>>('/releases', params)
  },

  get(id: string) {
    return compilerApi.get<HivRelease>(`/releases/${id}`)
  },

  activate(id: string) {
    return compilerApi.post<HivRelease>(`/releases/${id}/activate`)
  },

  download(id: string) {
    return compilerApi.download(`/releases/${id}/download`)
  },

  delete(id: string) {
    return compilerApi.delete<void>(`/releases/${id}`)
  },

  build(body: BuildReleaseRequest): Promise<BundleJob> {
    return compilerApi.post<BundleJob>('/releases/build', body)
  },
}
