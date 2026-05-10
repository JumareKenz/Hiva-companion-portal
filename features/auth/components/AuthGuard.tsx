'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { getCompilerToken, isTokenExpired } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth.store'
import { LogoAnimated } from '@/components/ui/LogoAnimated'
import { LogoBackground } from '@/components/ui/LogoBackground'
import { authService } from '@/services/auth.service'

interface AuthGuardProps {
  children: React.ReactNode
}

function readUser() {
  return useAuthStore.getState().user
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()

  const token = getCompilerToken()
  const user = readUser()

  const isTokenValid = token && !isTokenExpired(token)
  const hasUser = !!user

  useEffect(() => {
    if (!isTokenValid) {
      useAuthStore.getState().clearUser()
      router.replace('/login')
      return
    }

    if (!hasUser) {
      authService
        .me()
        .then((u) => useAuthStore.getState().setUser(u))
        .catch(() => {
          useAuthStore.getState().clearUser()
          router.replace('/login')
        })
    }
  }, [isTokenValid, hasUser, router])

  if (!isTokenValid || !hasUser) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[var(--bg-primary)]">
        <LogoBackground size={500} opacity={0.05} fixed={false} spin breathe />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <LogoAnimated size={48} className="text-[var(--accent-600)]" spin pulse dotPulse breathe />
          <span className="font-display text-lg font-semibold text-[var(--text-primary)]">HIVA Companion Portal</span>
          <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-600)]" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}