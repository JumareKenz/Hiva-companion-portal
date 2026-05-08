'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/')
    }
  }, [user, router])

  if (!user || user.role !== 'admin') return null

  return <>{children}</>
}
