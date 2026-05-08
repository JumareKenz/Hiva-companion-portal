'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { getCompilerToken } from '@/lib/auth'
import { healthService } from '@/services/health.service'
import { hivService } from '@/services/hiv.service'
import { Avatar } from '@/components/ui/Avatar'
import { LogoBackground } from '@/components/ui/LogoBackground'
import { BadgeCheck, Copy, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { AdminGuard } from '@/features/auth/components/AdminGuard'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const token = getCompilerToken()
  const [showToken, setShowToken] = useState(false)

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthService.check(),
    staleTime: 30 * 1000,
  })

  const { data: hivVersion } = useQuery({
    queryKey: ['hivVersion'],
    queryFn: () => hivService.version(),
    staleTime: 60 * 1000,
  })

  const copyToken = () => {
    if (token) navigator.clipboard.writeText(token)
  }

  return (
    <AdminGuard>
    <div className="relative mx-auto max-w-3xl space-y-8">
      <LogoBackground size={600} opacity={0.02} fixed={false} spin={false} breathe={false} />
      <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Settings</h1>

      {/* Account */}
      <section className="surface p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Account</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={user?.full_name || 'User'} size="lg" />
          <div>
            <div className="font-medium text-[var(--text-primary)]">{user?.full_name}</div>
            <div className="text-sm text-[var(--text-muted)]">{user?.email}</div>
            <span className="badge badge-accent mt-1">{user?.role}</span>
          </div>
        </div>
      </section>

      {/* Workspace */}
      <section className="surface p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Workspace</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Compiler Health</span>
            <span className={health?.status === 'ok' ? 'badge badge-success' : 'badge badge-error'}>
              {health?.status === 'ok' ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Platform URL</span>
            <code className="rounded bg-[var(--bg-secondary)] px-2 py-1 font-mono text-xs text-[var(--text-muted)]">
              https://api.hiva.chat
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Compiler URL</span>
            <code className="rounded bg-[var(--bg-secondary)] px-2 py-1 font-mono text-xs text-[var(--text-muted)]">
              https://compiler.hiva.chat
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">HIV Version</span>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {hivVersion?.version ?? 'No active release'}
            </span>
          </div>
        </div>
      </section>

      {/* API */}
      <section className="surface p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">API Token</h2>
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 overflow-hidden rounded bg-[var(--bg-secondary)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
            {token ? (showToken ? token : `${token.slice(0, 12)}…${token.slice(-6)}`) : 'No token'}
          </code>
          <button onClick={() => setShowToken(!showToken)} className="btn btn-ghost btn-sm">
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button onClick={copyToken} className="btn btn-secondary btn-sm">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
    </AdminGuard>
  )
}
