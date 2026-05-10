import { platformApi } from './platformHttp'
import type { ChatbotDocument, PaginatedResponse } from '@/types/common'

export const chatbotDocumentsService = {
  async list(chatbotId: string): Promise<PaginatedResponse<ChatbotDocument>> {
    return platformApi.get<PaginatedResponse<ChatbotDocument>>(
      `/chatbots/${chatbotId}/documents`
    )
  },

  async get(chatbotId: string, documentId: string): Promise<ChatbotDocument> {
    return platformApi.get<ChatbotDocument>(
      `/chatbots/${chatbotId}/documents/${documentId}`
    )
  },

  async upload(chatbotId: string, formData: FormData): Promise<ChatbotDocument> {
    return platformApi.upload<ChatbotDocument>(
      `/chatbots/${chatbotId}/documents`,
      formData
    )
  },

  async delete(chatbotId: string, documentId: string): Promise<void> {
    return platformApi.delete<void>(`/chatbots/${chatbotId}/documents/${documentId}`)
  },

  async reprocess(chatbotId: string, documentId: string): Promise<void> {
    return platformApi.post<void>(
      `/chatbots/${chatbotId}/documents/${documentId}/reprocess`
    )
  },
}
