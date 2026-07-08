'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import {
  Sun,
  Moon,
  Bell,
} from 'lucide-react'

export function Topbar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const getBreadcrumb = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/bundles/status/')) return 'Build Status'
    if (pathname.startsWith('/bundles/build')) return 'Build Bundle'
    if (pathname.startsWith('/bundles')) return 'Bundles'
    if (pathname.startsWith('/documents/')) return 'Document Details'
    if (pathname.startsWith('/documents')) return 'Documents'
    if (pathname.startsWith('/access-codes')) return 'Access Codes'
    if (pathname.startsWith('/ocr')) return 'PDF to Text'
    if (pathname.startsWith('/sources')) return 'Chunk Library'
    if (pathname.startsWith('/audit')) return 'Audit Log'
    if (pathname.startsWith('/settings')) return 'Settings'
    return pathname.split('/')[1]?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-overlay)] px-5 backdrop-blur-xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-[var(--accent-600)]">HIVA-OS</span>
        <span className="text-[var(--text-faint)]">/</span>
        <span className="text-[var(--text-secondary)]">{getBreadcrumb()}</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="btn btn-ghost btn-sm"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button aria-label="Notifications" className="btn btn-ghost btn-sm relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--accent-600)] ring-2 ring-[var(--surface-overlay)]" />
        </button>
      </div>
    </header>
  )
}
