import { compilerApi } from './compilerHttp'
import type { RuleForReview, RuleReviewSubmission, ReviewStatusSummary } from '@/types/common'

export const ruleReviewsService = {
  getRulesForReview(jobId: string) {
    return compilerApi.get<RuleForReview[]>(`/jobs/${jobId}/rules-for-review`)
  },

  submitReview(jobId: string, chunkId: string, body: RuleReviewSubmission) {
    return compilerApi.post<void>(`/jobs/${jobId}/rules/${chunkId}/review`, body)
  },

  getReviewStatus(jobId: string) {
    return compilerApi.get<ReviewStatusSummary>(`/jobs/${jobId}/review-status`)
  },
}
