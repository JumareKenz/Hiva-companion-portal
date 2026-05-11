'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { releasesService, type BuildReleaseRequest } from '@/services/releases.service'
import type { ApiError } from '@/types/common'
import type { Language } from '@/types/enums'

export function useReleases(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['releases', params],
    queryFn: () => releasesService.list(params),
    staleTime: 60 * 1000,
  })
}

export function useActivateRelease() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => releasesService.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] })
      queryClient.invalidateQueries({ queryKey: ['hivVersion'] })
      toast.success('Release activated')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to activate release')
    },
  })
}

export function useBuildRelease() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: BuildReleaseRequest) => releasesService.build(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Release built successfully')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Failed to build release')
    },
  })
}
