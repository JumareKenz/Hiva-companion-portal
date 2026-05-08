'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QueryClientProvider } from '@tanstack/react-query'
import { getCompilerToken, isTokenExpired } from '@/lib/auth'
import { queryClient } from '@/lib/queryClient'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const token = getCompilerToken()
    if (token && !isTokenExpired(token)) {
      router.replace('/')
    }
  }, [router])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen">
        {children}
      </div>
    </QueryClientProvider>
  )
}
