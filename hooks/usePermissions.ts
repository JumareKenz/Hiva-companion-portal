'use client'

import { useAuthStore } from '@/stores/auth.store'

export function usePermissions() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')

  return {
    canCompile: () => isAdmin,
    canDelete: () => isAdmin,
    canDownload: () => isAdmin,
    canActivateRelease: () => isAdmin,
    canReview: () => true,
  }
}
