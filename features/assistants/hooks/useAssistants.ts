'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { chatbotsService } from '@/services/chatbots.service'
import { chatbotDocumentsService } from '@/services/chatbotDocuments.service'
import { chatbotAnalyticsService } from '@/services/chatbotAnalytics.service'
import type { ApiError, AgencyChatbot, ChatbotDocument, EmbedCode } from '@/types/common'
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
    queryFn: () => chatbotDocumentsService.list(chatbotId),
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
    mutationFn: chatbotDocumentsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbotDocuments', chatbotId] })
      toast.success('Document removed')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to delete document')
    },
  })
}

/* ─── Analytics ─── */

export function useChatbotStats(chatbotId: string) {
  return useQuery({
    queryKey: ['chatbotStats', chatbotId],
    queryFn: () => chatbotAnalyticsService.getQualityMetrics(chatbotId),
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
