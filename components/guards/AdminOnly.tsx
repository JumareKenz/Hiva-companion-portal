'use client'

import { useAuthStore } from '@/stores/auth.store'

interface AdminOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')

  if (!isAdmin) return <>{fallback}</>
  return <>{children}</>
}
