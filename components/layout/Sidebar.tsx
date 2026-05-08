'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { Avatar } from '@/components/ui/Avatar'
import { LogoAnimated } from '@/components/ui/LogoAnimated'
import {
  LayoutDashboard,
  FileStack,
  Package,
  Rocket,
  Library,
  ScrollText,
  Settings,
  LogOut,
  Bot,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Globe,
  FolderOpen,
  Key,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

interface NavSection {
  id: string
  label: string
  icon: React.ElementType
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    id: 'hivaline',
    label: 'HIVALINE ASSISTANT',
    icon: Smartphone,
    items: [
      { href: '/', label: 'Home', icon: LayoutDashboard },
      { href: '/documents', label: 'Document Queue', icon: FileStack },
      { href: '/bundles', label: 'Compiled Bundles', icon: Package },
      { href: '/access-codes', label: 'Access Codes', icon: Key },
    ],
  },
  {
    id: 'live',
    label: 'LIVE CHATBOTS',
    icon: Globe,
    items: [
      { href: '/assistants', label: 'Assistants', icon: Bot },
      { href: '/deployments', label: 'Deployments', icon: Rocket },
    ],
  },
  {
    id: 'workspace',
    label: 'WORKSPACE',
    icon: FolderOpen,
    items: [
      { href: '/sources', label: 'Sources', icon: Library },
      { href: '/audit', label: 'Audit Log', icon: ScrollText },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const STORAGE_KEY = 'hiva-sidebar-sections'

function getInitialExpanded(pathname: string): Record<string, boolean> {
  // Default: all sections expanded
  const defaultState: Record<string, boolean> = {
    hivaline: true,
    live: true,
    workspace: true,
  }

  // Try load from storage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>
        // Merge with defaults (new sections default to expanded)
        return { ...defaultState, ...parsed }
      }
    } catch {
      // ignore parse errors
    }
  }

  return defaultState
}

function getSectionForPath(pathname: string): string | null {
  if (pathname === '/' || pathname.startsWith('/documents') || pathname.startsWith('/bundles')) {
    return 'hivaline'
  }
  if (pathname.startsWith('/assistants') || pathname.startsWith('/deployments')) {
    return 'live'
  }
  if (pathname.startsWith('/sources') || pathname.startsWith('/audit') || pathname.startsWith('/settings')) {
    return 'workspace'
  }
  return null
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, clearUser } = useAuthStore()

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    getInitialExpanded(pathname)
  )

  // Auto-expand section containing active route
  useEffect(() => {
    const activeSection = getSectionForPath(pathname)
    if (activeSection && !expanded[activeSection]) {
      setExpanded((prev) => {
        const next = { ...prev, [activeSection]: true }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
  }, [pathname])

  const toggleSection = useCallback((sectionId: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const handleLogout = () => {
    authService.logout()
    clearUser()
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[200px] flex-col bg-[var(--accent-800)] text-white">
      {/* Subtle warm texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse_at_top_left,rgba(201,169,110,0.06),transparent)',
        }}
      />

      {/* Logo */}
      <div className="relative flex h-14 shrink-0 items-center gap-2.5 px-5">
        <LogoAnimated size={32} className="text-white" spin pulse dotPulse />
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold leading-none">HIVA</span>
          <span className="text-[10px] leading-none text-white/50">Companion Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {SECTIONS.map((section) => {
            const isExpanded = expanded[section.id] ?? true
            const hasActiveChild = section.items.some(
              (item) => pathname === item.href || pathname.startsWith(item.href + '/')
            )

            return (
              <li key={section.id}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-[10px] font-mono font-medium uppercase tracking-widest transition-colors',
                    hasActiveChild
                      ? 'text-[var(--brand-tan)]'
                      : 'text-white/40 hover:text-white/70'
                  )}
                >
                  <section.icon className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">{section.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  ) : (
                    <ChevronRight className="h-3 w-3 opacity-60" />
                  )}
                </button>

                {/* Section items */}
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)]',
                    isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <ul className="mt-0.5 space-y-0.5 pl-2">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href || pathname.startsWith(item.href + '/')
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              'relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)]',
                              isActive
                                ? 'bg-[var(--accent-600)] text-white'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                            )}
                          >
                            {isActive && (
                              <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-[var(--brand-tan)]" />
                            )}
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="relative shrink-0 border-t border-white/10 px-3 py-3">
        <div className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/5">
          <Avatar name={user?.full_name || 'U'} size="sm" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{user?.full_name || 'User'}</span>
            <span className="text-xs font-mono text-white/50">{user?.role || 'reviewer'}</span>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <LogOut className="h-4 w-4 text-white/50 hover:text-white" />
          </button>
        </div>
      </div>
    </aside>
  )
}
