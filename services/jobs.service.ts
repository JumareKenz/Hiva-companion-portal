import { compilerApi } from './compilerHttp'
import type { CompileJob, PaginatedResponse } from '@/types/common'

export const jobsService = {
  async list(params?: { page?: number; per_page?: number; status?: string; document_id?: string }): Promise<PaginatedResponse<CompileJob>> {
    return compilerApi.get<PaginatedResponse<CompileJob>>('/jobs', params)
  },

  async get(id: string): Promise<CompileJob> {
    return compilerApi.get<CompileJob>(`/jobs/${id}`)
  },

  async download(id: string): Promise<Blob> {
    return compilerApi.download(`/jobs/${id}/download`)
  },

  async retry(id: string): Promise<CompileJob> {
    return compilerApi.post<CompileJob>(`/jobs/${id}/retry`)
  },

  async failed(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<{
    id: string
    job_id: string
    queue: string
    exc_info: string
    enqueued_at: string
    started_at: string | null
    ended_at: string | null
  }>> {
    return compilerApi.get('/jobs/failed', params)
  },
}
