import { platformApi } from './platformHttp'
import type { AgencyChatbot, PaginatedResponse } from '@/types/common'
import type { ChatbotStatus, AgentMode, Language, PersonaTemplate } from '@/types/enums'

export interface CreateChatbotBody {
  name: string
  slug: string
  description?: string
  organization_id: string
  primary_language: Language
  secondary_languages?: Language[]
  persona_template: PersonaTemplate
  system_prompt?: string
  welcome_message?: string
  fallback_message?: string
  brand_color?: string
  temperature?: number
  top_k?: number
  min_confidence?: number
  enable_citations?: boolean
  enable_grounding?: boolean
  strict_domain?: boolean
  agent_mode?: AgentMode
  domain_keywords?: string[]
  tone?: {
    formality: number
    verbosity: number
    empathy: number
  }
  guidelines?: {
    citeSources: boolean
    includePolicyNumbers: boolean
    allowOffTopic: boolean
    escalateComplex: boolean
  }
}

export interface UpdateChatbotBody {
  name?: string
  system_prompt?: string
  welcome_message?: string
  fallback_message?: string
  brand_color?: string
  temperature?: number
  top_k?: number
  min_confidence?: number
  enable_citations?: boolean
  enable_grounding?: boolean
  strict_domain?: boolean
  agent_mode?: AgentMode
  domain_keywords?: string[]
}

export const chatbotsService = {
  async list(params?: {
    page?: number
    per_page?: number
    status?: ChatbotStatus
  }): Promise<PaginatedResponse<AgencyChatbot>> {
    return platformApi.get<PaginatedResponse<AgencyChatbot>>('/agency/chatbots', params)
  },

  async create(body: CreateChatbotBody): Promise<AgencyChatbot> {
    return platformApi.post<AgencyChatbot>('/agency/chatbots/create', body)
  },

  async get(id: string): Promise<AgencyChatbot> {
    return platformApi.get<AgencyChatbot>(`/agency/chatbots/${id}`)
  },

  async patch(id: string, body: UpdateChatbotBody): Promise<AgencyChatbot> {
    return platformApi.patch<AgencyChatbot>(`/agency/chatbots/${id}`, body)
  },

  async activate(id: string): Promise<void> {
    return platformApi.post<void>(`/agency/chatbots/${id}/activate`, {})
  },

  async pause(id: string): Promise<void> {
    return platformApi.post<void>(`/agency/chatbots/${id}/pause`, {})
  },

  async archive(id: string): Promise<void> {
    return platformApi.post<void>(`/agency/chatbots/${id}/archive`, {})
  },

  async delete(id: string): Promise<void> {
    return platformApi.delete<void>(`/agency/chatbots/${id}`)
  },
}
