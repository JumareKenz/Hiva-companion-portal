import { platformApi } from './platformHttp'
import type { Language } from '@/types/enums'

export interface ChatMessageRequest {
  message: string
  sessionId: string
  conversation_id?: string
}

export interface ChatCitation {
  document_id: string
  filename: string
  chunk_index: number
  content_preview: string
  score: number
}

export interface ChatMessageResponse {
  message_id: string
  conversation_id: string
  answer: string
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence_score: number
  is_grounded: boolean
  retrieval_time_ms: number
  generation_time_ms: number
  citations: ChatCitation[]
  agent?: {
    mode: 'agentic' | 'passive'
    phase: string | null
    confidence: number | null
    is_clinical: boolean
  }
}

export interface ChatbotConfig {
  slug: string
  name: string
  brand_color: string
  welcome_message: string
  fallback_message: string
  primary_language: Language
}

class ChatApiClient {
  private baseUrl = '/api/v1/chat'

  async sendMessage(slug: string, request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const response = await fetch(`${this.baseUrl}/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Chatbot "${slug}" not found or not active. Please check the chatbot status.`)
      }
      const error = await response.json().catch(() => ({ detail: 'Chat request failed' }))
      throw new Error(error.detail || `Failed to send message: ${response.status}`)
    }

    return response.json()
  }

  async getConfig(slug: string): Promise<ChatbotConfig> {
    const response = await fetch(`${this.baseUrl}/${slug}/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Return default config if endpoint doesn't exist
        return {
          slug,
          name: slug,
          brand_color: '#155D46',
          welcome_message: 'Hello! How can I help you today?',
          fallback_message: 'I apologize, but I am unable to respond at the moment. Please try again later.',
          primary_language: 'en'
        }
      }
      throw new Error(`Failed to get config: ${response.status}`)
    }

    return response.json()
  }

  async createConversation(
    slug: string,
    externalUserId: string,
  ): Promise<{ conversation_id: string; chatbot_name?: string; welcome_message?: string }> {
    const qs = new URLSearchParams({ channel: 'web', external_user_id: externalUserId })
    const response = await fetch(`${this.baseUrl}/${slug}/conversations?${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.status}`)
    }

    return response.json()
  }
}

export const chatService = new ChatApiClient()