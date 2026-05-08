import { platformApi } from './platformHttp'
import type { EmbedCode } from '@/types/common'

export interface QualityMetrics {
  total_conversations: number
  total_messages: number
  average_conversation_length: number
  satisfaction_rate: number
}

export interface AnalyticsSummary {
  total_conversations: number
  total_messages: number
  active_chatbots: number
}

export interface TopQuery {
  query: string
  count: number
}

export interface IntentDistribution {
  intent: string
  count: number
  percentage: number
}

export interface HourlyActivity {
  hour: number
  count: number
}

export const chatbotAnalyticsService = {
  async getQualityMetrics(chatbotId: string): Promise<QualityMetrics> {
    return platformApi.get<QualityMetrics>(`/agency/chatbots/${chatbotId}/quality-metrics`)
  },

  async getAnomalies(chatbotId: string): Promise<unknown[]> {
    return platformApi.get<unknown[]>(`/agency/chatbots/${chatbotId}/anomalies`)
  },

  async getConversations(chatbotId: string, params?: { page?: number; per_page?: number }) {
    return platformApi.get(`/agency/chatbots/${chatbotId}/conversations`, params)
  },

  async getSummary(): Promise<AnalyticsSummary> {
    return platformApi.get<AnalyticsSummary>('/agency/analytics/summary')
  },

  async getTopQueries(): Promise<TopQuery[]> {
    return platformApi.get<TopQuery[]>('/agency/analytics/top-queries')
  },

  async getIntentDistribution(): Promise<IntentDistribution[]> {
    return platformApi.get<IntentDistribution[]>('/agency/analytics/intent-distribution')
  },

  async getHourlyActivity(): Promise<HourlyActivity[]> {
    return platformApi.get<HourlyActivity[]>('/agency/analytics/hourly-activity')
  },

  async getEmbedCode(chatbotId: string): Promise<EmbedCode> {
    return platformApi.get<EmbedCode>(`/agency/chatbots/${chatbotId}/embed-code`)
  },
}
