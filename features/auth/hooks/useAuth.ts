'use client'

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { getCompilerToken, isTokenExpired } from '@/lib/auth'
import type { ApiError } from '@/types/common'

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user, setUser, clearUser, isAdmin } = useAuthStore()

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.me(),
    enabled: !!getCompilerToken() && !isTokenExpired(getCompilerToken()!),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const userData = await authService.login(credentials)
      setUser(userData)
      return userData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      router.push('/')
    },
    onError: (error: ApiError) => {
      toast.error(error.detail?.toString() || 'Login failed')
    },
  })

  const logout = useCallback(() => {
    authService.logout()
    clearUser()
    queryClient.clear()
    router.push('/login')
  }, [clearUser, queryClient, router])

  return {
    user: user ?? meQuery.data,
    isLoading: meQuery.isLoading || loginMutation.isPending,
    isAuthenticated: !!getCompilerToken() && !isTokenExpired(getCompilerToken()!),
    isAdmin,
    login: loginMutation.mutate,
    logout,
  }
}
