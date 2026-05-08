import { platformApi } from './platformHttp'
import type { AgencyChatbot, PaginatedResponse } from '@/types/common'
import type { ChatbotStatus } from '@/types/enums'

// Normalises every shape the platform API might return for a chatbot list.
// Handles: raw array, { data/chatbots/items/results: [...] }, nested meta or flat total/count.
function toPagedChatbots(
  raw: unknown,
  page: number,
  perPage: number,
): PaginatedResponse<AgencyChatbot> {
  const empty = (): PaginatedResponse<AgencyChatbot> => ({
    data: [],
    meta: { total: 0, page, per_page: perPage, total_pages: 0 },
  })

  if (!raw) return empty()

  // Plain array
  if (Array.isArray(raw)) {
    return { data: raw as AgencyChatbot[], meta: { total: raw.length, page, per_page: perPage, total_pages: 1 } }
  }

  if (typeof raw !== 'object') return empty()

  const obj = raw as Record<string, unknown>

  // Extract the chatbot array from any known key
  const arr = (
    Array.isArray(obj.data) ? obj.data :
    Array.isArray(obj.chatbots) ? obj.chatbots :
    Array.isArray(obj.items) ? obj.items :
    Array.isArray(obj.results) ? obj.results :
    null
  ) as AgencyChatbot[] | null

  if (!arr) return empty()

  // Extract total from nested meta or flat fields
  const meta = (obj.meta ?? {}) as Record<string, unknown>
  const total =
    typeof meta.total === 'number' ? meta.total :
    typeof meta.count === 'number' ? meta.count :
    typeof obj.total === 'number' ? obj.total :
    typeof obj.count === 'number' ? obj.count :
    arr.length

  const totalPages =
    typeof meta.total_pages === 'number' ? meta.total_pages :
    typeof meta.pages === 'number' ? meta.pages :
    Math.ceil(total / perPage) || 1

  return { data: arr, meta: { total, page, per_page: perPage, total_pages: totalPages } }
}

export interface CreateChatbotBody {
  name: string
  template: string
  persona?: {
    system_prompt?: string
    welcome_message?: string
    fallback_message?: string
    brand_color?: string
  }
  rag_config?: {
    temperature?: number
    top_k?: number
    min_confidence?: number
    enable_citations?: boolean
    enable_grounding?: boolean
    strict_domain?: boolean
  }
  domain_keywords?: string[]
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
  domain_keywords?: string[]
}

export const chatbotsService = {
  async list(params?: {
    page?: number
    per_page?: number
    status?: ChatbotStatus
  }): Promise<PaginatedResponse<AgencyChatbot>> {
    const raw = await platformApi.get<unknown>('/agency/chatbots', params)
    return toPagedChatbots(raw, params?.page ?? 1, params?.per_page ?? 20)
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
