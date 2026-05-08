import { compilerApi } from './compilerHttp'
import type { Document, CompileJob, PaginatedResponse } from '@/types/common'
import type { Language } from '@/types/enums'

export const documentsService = {
  async upload(formData: FormData): Promise<Document> {
    return compilerApi.upload<Document>('/documents/upload', formData)
  },

  async list(params?: { page?: number; per_page?: number; status?: string }): Promise<PaginatedResponse<Document>> {
    return compilerApi.get<PaginatedResponse<Document>>('/documents', params)
  },

  async get(id: string): Promise<Document> {
    return compilerApi.get<Document>(`/documents/${id}`)
  },

  async markReady(id: string): Promise<Document> {
    return compilerApi.post<Document>(`/documents/${id}/ready`)
  },

  async delete(id: string): Promise<void> {
    return compilerApi.delete<void>(`/documents/${id}`)
  },

  async compile(id: string, body: { languages: Language[] }): Promise<CompileJob> {
    return compilerApi.post<CompileJob>(`/documents/${id}/compile`, body)
  },
}
