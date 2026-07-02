'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ruleReviewsService } from '@/services/ruleReviews.service'
import type { RuleReviewSubmission, ApiError } from '@/types/common'

export function useRulesForReview(jobId: string | null) {
  return useQuery({
    queryKey: ['rulesForReview', jobId],
    queryFn: () => ruleReviewsService.getRulesForReview(jobId!),
    enabled: !!jobId,
    staleTime: 30 * 1000,
  })
}

export function useReviewStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['reviewStatus', jobId],
    queryFn: () => ruleReviewsService.getReviewStatus(jobId!),
    enabled: !!jobId,
    staleTime: 10 * 1000,
  })
}

export function useSubmitRuleReview(jobId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chunkId, body }: { chunkId: string; body: RuleReviewSubmission }) =>
      ruleReviewsService.submitReview(jobId, chunkId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rulesForReview', jobId] })
      queryClient.invalidateQueries({ queryKey: ['reviewStatus', jobId] })
      queryClient.invalidateQueries({ queryKey: ['bundleJob', jobId] })
      toast.success('Review submitted')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to submit review')
    },
  })
}
