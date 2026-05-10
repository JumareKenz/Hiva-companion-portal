'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { chatbotsService } from '@/services/chatbots.service'
import { chatbotDocumentsService } from '@/services/chatbotDocuments.service'
import { chatbotAnalyticsService } from '@/services/chatbotAnalytics.service'
import type { ApiError, AgencyChatbot, ChatbotDocument, EmbedCode, PaginatedResponse } from '@/types/common'
import type {
  QualityMetrics,
  AnalyticsSummary,
  TopQuery,
  IntentDistribution,
  HourlyActivity,
} from '@/services/chatbotAnalytics.service'
import type { ChatbotStatus } from '@/types/enums'

/* ─── Chatbots ─── */

export function useChatbots(params?: { page?: number; per_page?: number; status?: ChatbotStatus }) {
  return useQuery({
    queryKey: ['chatbots', params],
    queryFn: () => chatbotsService.list(params),
    staleTime: 30 * 1000,
  })
}

export function useChatbot(id: string) {
  return useQuery({
    queryKey: ['chatbot', id],
    queryFn: () => chatbotsService.get(id),
    staleTime: 10 * 1000,
    enabled: !!id,
  })
}

export function useCreateChatbot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatbotsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] })
      toast.success('Assistant created successfully')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to create assistant')
    },
  })
}

export function useUpdateChatbot(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Parameters<typeof chatbotsService.patch>[1]) =>
      chatbotsService.patch(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', id] })
      queryClient.invalidateQueries({ queryKey: ['chatbots'] })
      toast.success('Assistant updated')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to update assistant')
    },
  })
}

export function useActivateChatbot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatbotsService.activate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', id] })
      queryClient.invalidateQueries({ queryKey: ['chatbots'] })
      toast.success('Assistant activated')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to activate assistant')
    },
  })
}

export function usePauseChatbot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatbotsService.pause,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', id] })
      queryClient.invalidateQueries({ queryKey: ['chatbots'] })
      toast.success('Assistant paused')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to pause assistant')
    },
  })
}

export function useArchiveChatbot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatbotsService.archive,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', id] })
      queryClient.invalidateQueries({ queryKey: ['chatbots'] })
      toast.success('Assistant archived')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to archive assistant')
    },
  })
}

export function useDeleteChatbot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatbotsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] })
      toast.success('Assistant deleted')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to delete assistant')
    },
  })
}

/* ─── Documents ─── */

export function useChatbotDocuments(chatbotId: string) {
  return useQuery({
    queryKey: ['chatbotDocuments', chatbotId],
    queryFn: async () => {
      const response = await chatbotDocumentsService.list(chatbotId)
      // API returns { items: [...], total, pages, page, page_size }
      const raw = response as unknown as Record<string, unknown>
      if (raw && Array.isArray(raw.items)) {
        return {
          data: raw.items as ChatbotDocument[],
          meta: {
            total: (raw.total as number) ?? 0,
            page: (raw.page as number) ?? 1,
            per_page: (raw.page_size as number) ?? 20,
            total_pages: (raw.pages as number) ?? 1,
          },
        }
      }
      if (Array.isArray(response)) {
        return { data: response, meta: { total: response.length, page: 1, per_page: response.length, total_pages: 1 } }
      }
      return response
    },
    staleTime: 10 * 1000,
    enabled: !!chatbotId,
  })
}

export function useUploadChatbotDocument(chatbotId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => chatbotDocumentsService.upload(chatbotId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbotDocuments', chatbotId] })
      toast.success('Document uploaded to assistant')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to upload document')
    },
  })
}

export function useDeleteChatbotDocument(chatbotId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => chatbotDocumentsService.delete(chatbotId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbotDocuments', chatbotId] })
      toast.success('Document removed')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to delete document')
    },
  })
}


export function useReprocessChatbotDocument(chatbotId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => chatbotDocumentsService.reprocess(chatbotId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbotDocuments', chatbotId] })
      toast.success('Document reprocessing started')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to reprocess document')
    },
  })
}

/* ─── Analytics ─── */

export function useChatbotStats(chatbotId: string, params?: { days?: number }) {
  return useQuery({
    queryKey: ['chatbotStats', chatbotId, params],
    queryFn: () => chatbotAnalyticsService.getQualityMetrics(chatbotId, params),
    staleTime: 60 * 1000,
    enabled: !!chatbotId,
  })
}

export function useChatbotEmbedCode(chatbotId: string) {
  return useQuery({
    queryKey: ['chatbotEmbedCode', chatbotId],
    queryFn: () => chatbotAnalyticsService.getEmbedCode(chatbotId),
    staleTime: 120 * 1000,
    enabled: !!chatbotId,
  })
}

export function useChatbotConversations(
  chatbotId: string,
  params?: { page?: number; per_page?: number }
) {
  return useQuery({
    queryKey: ['chatbotConversations', chatbotId, params],
    queryFn: () => chatbotAnalyticsService.getConversations(chatbotId, params),
    staleTime: 30 * 1000,
    enabled: !!chatbotId,
  })
}

export function useChatbotAnomalies(chatbotId: string) {
  return useQuery({
    queryKey: ['chatbotAnomalies', chatbotId],
    queryFn: () => chatbotAnalyticsService.getAnomalies(chatbotId),
    staleTime: 60 * 1000,
    enabled: !!chatbotId,
  })
}

/* ─── Global Analytics ─── */

export function useGlobalAnalyticsSummary(params?: { days?: number }) {
  return useQuery({
    queryKey: ['analyticsSummary', params],
    queryFn: () => chatbotAnalyticsService.getSummary(params),
    staleTime: 60 * 1000,
  })
}

export function useGlobalTopQueries(params?: { days?: number }) {
  return useQuery({
    queryKey: ['analyticsTopQueries', params],
    queryFn: () => chatbotAnalyticsService.getTopQueries(params),
    staleTime: 60 * 1000,
  })
}

export function useGlobalIntentDistribution(params?: { days?: number }) {
  return useQuery({
    queryKey: ['analyticsIntentDistribution', params],
    queryFn: () => chatbotAnalyticsService.getIntentDistribution(params),
    staleTime: 60 * 1000,
  })
}

export function useGlobalHourlyActivity(params?: { days?: number }) {
  return useQuery({
    queryKey: ['analyticsHourlyActivity', params],
    queryFn: () => chatbotAnalyticsService.getHourlyActivity(params),
    staleTime: 60 * 1000,
  })
}
