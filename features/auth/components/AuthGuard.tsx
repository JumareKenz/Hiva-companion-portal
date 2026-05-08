'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { getCompilerToken, isTokenExpired } from '@/lib/auth'
import { LogoAnimated } from '@/components/ui/LogoAnimated'
import { LogoBackground } from '@/components/ui/LogoBackground'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { user, setUser, clearUser } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function validate() {
      const token = getCompilerToken()
      if (!token || isTokenExpired(token)) {
        clearUser()
        router.replace('/login')
        setIsChecking(false)
        return
      }

      if (!user) {
        try {
          const me = await authService.me()
          setUser(me)
        } catch {
          clearUser()
          router.replace('/login')
        }
      }

      setIsChecking(false)
    }

    validate()
  }, [user, setUser, clearUser, router])

  if (isChecking) {
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
