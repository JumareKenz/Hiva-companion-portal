'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { AdminOnly } from '@/components/guards/AdminOnly'
import {
  Sun,
  Moon,
  Bell,
  Upload,
  PackageCheck,
} from 'lucide-react'

export function Topbar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const contextCta = (() => {
    if (pathname === '/documents') {
      return { label: 'Upload Document', icon: Upload, href: '/documents?upload=1' }
    }
    if (pathname === '/bundles') {
      return { label: 'Activate Release', icon: PackageCheck, href: '/bundles' }
    }
    return null
  })()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-overlay)] px-5 backdrop-blur-xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-[var(--accent-600)]">HIVA</span>
        <span className="text-[var(--text-faint)]">/</span>
        <span className="text-[var(--text-secondary)]">
          {pathname === '/' ? 'Dashboard' : pathname.split('/')[1]?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
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
          {/* Notification badge placeholder */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--accent-600)] ring-2 ring-[var(--surface-overlay)]" />
        </button>

        {contextCta && (
          <AdminOnly>
            <a
              href={contextCta.href}
              className={cn(
                'btn btn-sm',
                pathname === '/documents' ? 'btn-primary' : 'btn-secondary'
              )}
            >
              <contextCta.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{contextCta.label}</span>
            </a>
          </AdminOnly>
        )}
      </div>
    </header>
  )
}
