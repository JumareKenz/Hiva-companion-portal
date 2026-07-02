import { compilerApi } from './compilerHttp'
import type { BundleJob, PaginatedResponse } from '@/types/common'

export const bundleJobsService = {
  list(params?: { page?: number; per_page?: number; status?: string; sort?: string }) {
    return compilerApi.get<PaginatedResponse<BundleJob>>('/bundle-jobs', params)
  },

  get(id: string) {
    return compilerApi.get<BundleJob>(`/bundle-jobs/${id}`)
  },

  cancel(id: string) {
    return compilerApi.post<void>(`/bundle-jobs/${id}/cancel`)
  },
}
