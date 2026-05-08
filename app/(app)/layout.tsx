'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
          <Sidebar />
          <div className="ml-[200px] flex flex-1 flex-col">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-5">{children}</main>
          </div>
        </div>
      </AuthGuard>
    </QueryClientProvider>
  )
}
