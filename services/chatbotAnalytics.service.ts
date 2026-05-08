import { platformApi } from './platformHttp'
import type { ChatbotStats, EmbedCode } from '@/types/common'

export const chatbotAnalyticsService = {
  async getStats(chatbotId: string): Promise<ChatbotStats> {
    return platformApi.get<ChatbotStats>(`/agency/chatbots/${chatbotId}/stats`)
  },

  async getSummary(): Promise<{
    total_conversations: number
    total_messages: number
    active_chatbots: number
  }> {
    return platformApi.get('/agency/analytics/summary')
  },

  async getEmbedCode(chatbotId: string): Promise<EmbedCode> {
    return platformApi.get<EmbedCode>(`/agency/chatbots/${chatbotId}/embed-code`)
  },
}
