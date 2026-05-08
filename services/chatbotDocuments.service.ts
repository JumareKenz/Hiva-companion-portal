import { platformApi } from './platformHttp'
import type { ChatbotDocument, PaginatedResponse } from '@/types/common'

export const chatbotDocumentsService = {
  async list(chatbotId: string): Promise<PaginatedResponse<ChatbotDocument>> {
    return platformApi.get<PaginatedResponse<ChatbotDocument>>(
      `/agency/chatbots/${chatbotId}/documents`
    )
  },

  async upload(chatbotId: string, formData: FormData): Promise<ChatbotDocument> {
    return platformApi.upload<ChatbotDocument>(
      `/agency/chatbots/${chatbotId}/documents/upload`,
      formData
    )
  },

  async getStatus(documentId: string): Promise<ChatbotDocument> {
    return platformApi.get<ChatbotDocument>(`/agency/documents/${documentId}/status`)
  },

  async reprocess(documentId: string): Promise<void> {
    return platformApi.post<void>(`/agency/documents/${documentId}/reprocess`)
  },

  async delete(documentId: string): Promise<void> {
    return platformApi.delete<void>(`/agency/documents/${documentId}`)
  },
}
