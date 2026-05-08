'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import {
  Rocket,
  Globe,
  Copy,
  Check,
  Play,
  Pause,
  MessageSquare,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

import { chatbotsService } from '@/services/chatbots.service'
import { chatbotAnalyticsService } from '@/services/chatbotAnalytics.service'
import { useActivateChatbot, usePauseChatbot } from '@/features/assistants/hooks/useAssistants'
import { AdminGuard } from '@/features/auth/components/AdminGuard'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import type { AgencyChatbot } from '@/types/common'

function EmbedRow({ chatbot }: { chatbot: AgencyChatbot }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'script' | 'iframe' | 'url' | null>(null)

  const { data: embedCode, isLoading } = useQuery({
    queryKey: ['embedCode', chatbot.id],
    queryFn: () => chatbotAnalyticsService.getEmbedCode(chatbot.id),
    enabled: open,
    staleTime: 60 * 1000,
  })

  const copy = (text: string, key: 'script' | 'iframe' | 'url') => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-secondary)] transition-colors"
      >
        <span className="text-sm font-medium text-[var(--accent-600)]">Embed Code</span>
        {open ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
      </button>
      {open && (
        <div className="border-t border-[var(--border-subtle)] p-4 space-y-3 bg-[var(--bg-secondary)]">
          {isLoading ? (
            <SkeletonLoader variant="row" />
          ) : embedCode ? (
            <>
              <EmbedEntry label="Direct URL" value={embedCode.direct_url} isCopied={copied === 'url'} onCopy={() => copy(embedCode.direct_url, 'url')} />
              <EmbedEntry label="Script Tag" value={embedCode.script_tag} isCopied={copied === 'script'} onCopy={() => copy(embedCode.script_tag, 'script')} />
              <EmbedEntry label="iFrame" value={embedCode.iframe_code} isCopied={copied === 'iframe'} onCopy={() => copy(embedCode.iframe_code, 'iframe')} />
            </>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Embed code unavailable</p>
          )}
        </div>
      )}
    </div>
  )
}

function EmbedEntry({ label, value, isCopied, onCopy }: { label: string; value: string; isCopied: boolean; onCopy: () => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
        <button onClick={onCopy} className="flex items-center gap-1 text-xs text-[var(--accent-600)] hover:underline">
          {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto rounded bg-[var(--bg-primary)] px-3 py-2 text-xs font-mono text-[var(--text-secondary)]">
        {value}
      </pre>
    </div>
  )
}

export default function DeploymentsPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => chatbotAnalyticsService.getSummary(),
    staleTime: 60 * 1000,
  })

  const { data: botsData, isLoading: botsLoading } = useQuery({
    queryKey: ['chatbots', { page: 1, per_page: 100 }],
    queryFn: () => chatbotsService.list({ page: 1, per_page: 100 }),
    staleTime: 30 * 1000,
  })

  const { mutate: activate, isPending: isActivating } = useActivateChatbot()
  const { mutate: pause, isPending: isPausing } = usePauseChatbot()

  const bots: AgencyChatbot[] = botsData?.data ?? []
  const activeBots = bots.filter((b) => b.status === 'active')
  const draftBots = bots.filter((b) => b.status === 'draft')
  const pausedBots = bots.filter((b) => b.status === 'paused')

  return (
    <AdminGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
              Deployments
            </h1>
            {!botsLoading && bots.length > 0 && (
              <span className="badge badge-accent">{bots.length} assistants</span>
            )}
          </div>
          <Link href="/assistants/new" className="btn btn-primary btn-sm">
            <Rocket className="h-4 w-4" />
            New Assistant
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label="Active"
            value={botsLoading ? '—' : String(activeBots.length)}
            icon={<Globe className="h-4 w-4" />}
            accent="success"
          />
          <SummaryCard
            label="Draft"
            value={botsLoading ? '—' : String(draftBots.length)}
            icon={<Bot className="h-4 w-4" />}
            accent="default"
          />
          <SummaryCard
            label="Total Conversations"
            value={summaryLoading ? '—' : String(summary?.total_conversations ?? 0)}
            icon={<MessageSquare className="h-4 w-4" />}
            accent="default"
          />
          <SummaryCard
            label="Total Messages"
            value={summaryLoading ? '—' : String(summary?.total_messages ?? 0)}
            icon={<BarChart3 className="h-4 w-4" />}
            accent="default"
          />
        </div>

        {/* Assistant deployment list */}
        {botsLoading ? (
          <div className="surface p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} variant="row" />)}
          </div>
        ) : bots.length === 0 ? (
          <EmptyState
            icon={<Rocket className="h-6 w-6 text-[var(--text-faint)]" />}
            title="No assistants deployed"
            description="Create your first assistant and activate it to deploy."
            action={{ label: 'New Assistant', onClick: () => {} }}
          />
        ) : (
          <div className="space-y-4">
            {bots.map((bot) => (
              <div key={bot.id} className="surface p-5 space-y-4">
                {/* Bot header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: bot.brand_color + '20' }}
                    >
                      <Bot className="h-5 w-5" style={{ color: bot.brand_color }} />
                    </div>
                    <div>
                      <Link
                        href={`/assistants/${bot.id}`}
                        className="font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent-600)]"
                      >
                        {bot.name}
                      </Link>
                      <div className="text-xs font-mono text-[var(--text-muted)]">{bot.slug}</div>
                    </div>
                    <StatusBadge status={bot.status} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      {bot.document_count} doc{bot.document_count !== 1 ? 's' : ''}
                      {' · '}created {format(new Date(bot.created_at), 'd MMM yyyy')}
                    </span>
                    {bot.status === 'draft' && (
                      <button
                        onClick={() => activate(bot.id)}
                        disabled={isActivating}
                        className="btn btn-primary btn-sm"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Activate
                      </button>
                    )}
                    {bot.status === 'active' && (
                      <button
                        onClick={() => pause(bot.id)}
                        disabled={isPausing}
                        className="btn btn-secondary btn-sm"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </button>
                    )}
                    {bot.status === 'paused' && (
                      <button
                        onClick={() => activate(bot.id)}
                        disabled={isActivating}
                        className="btn btn-primary btn-sm"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Resume
                      </button>
                    )}
                  </div>
                </div>

                {/* Channel pills */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-2.5 py-1 text-xs">
                    <Globe className={cn('h-3.5 w-3.5', bot.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--text-faint)]')} />
                    <span className={bot.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--text-faint)]'}>
                      Web Embed {bot.status === 'active' ? '· Live' : '· Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-2.5 py-1 text-xs text-[var(--text-faint)]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    WhatsApp · Coming soon
                  </div>
                </div>

                {/* Embed code accordion — only for active */}
                {bot.status === 'active' && <EmbedRow chatbot={bot} />}

                {/* Footer links */}
                <div className="flex items-center gap-3 pt-1 border-t border-[var(--border-subtle)]">
                  <Link href={`/assistants/${bot.id}`} className="text-xs text-[var(--accent-600)] hover:underline">
                    View details →
                  </Link>
                  <Link href={`/assistants/${bot.id}?tab=Documents`} className="text-xs text-[var(--text-muted)] hover:underline">
                    Manage documents
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paused assistants section */}
        {!botsLoading && pausedBots.length > 0 && (
          <div className="rounded-lg border border-[var(--border-default)] p-4">
            <p className="text-xs text-[var(--text-muted)]">
              {pausedBots.length} assistant{pausedBots.length !== 1 ? 's are' : ' is'} paused and not serving requests.
              Resume from the card above or from the{' '}
              <Link href="/assistants" className="text-[var(--accent-600)] hover:underline">
                Assistants page
              </Link>.
            </p>
          </div>
        )}
      </div>
    </AdminGuard>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent: 'success' | 'default'
}) {
  return (
    <div className="surface-raised rounded-xl border border-[var(--border-subtle)] p-5">
      <div className={cn('flex items-center gap-2', accent === 'success' ? 'text-[var(--success)]' : 'text-[var(--text-muted)]')}>
        {icon}
        <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)]">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active' ? 'badge-success'
    : status === 'paused' ? 'badge-warning'
    : status === 'archived' ? 'badge-error'
    : 'badge-ghost'
  return <span className={cn('badge text-[10px] capitalize', cls)}>{status}</span>
}
