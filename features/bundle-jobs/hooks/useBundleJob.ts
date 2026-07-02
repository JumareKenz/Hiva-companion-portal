'use client'

import { useQuery } from '@tanstack/react-query'
import { bundleJobsService } from '@/services/bundleJobs.service'

export function useBundleJobs(params?: { page?: number; per_page?: number; status?: string; sort?: string }) {
  return useQuery({
    queryKey: ['bundleJobs', params],
    queryFn: () => bundleJobsService.list(params),
    staleTime: 10 * 1000,
  })
}

export function useBundleJob(id: string | null) {
  return useQuery({
    queryKey: ['bundleJob', id],
    queryFn: () => bundleJobsService.get(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'queued' || status === 'running') return 5000
      return false
    },
    staleTime: 3 * 1000,
  })
}
