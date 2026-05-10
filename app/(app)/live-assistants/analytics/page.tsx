'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  MessageSquare,
  TrendingUp,
  Clock,
  ChevronDown,
  BarChart3,
  User,
} from 'lucide-react'

import {
  useChatbots,
  useChatbotStats,
  useGlobalAnalyticsSummary,
  useGlobalTopQueries,
  useGlobalIntentDistribution,
  useChatbotConversations,
} from '@/features/assistants/hooks/useAssistants'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'

const TIME_RANGES = ['7d', '30d', '90d'] as const
type TimeRange = (typeof TIME_RANGES)[number]

interface Conversation {
  id: string
  started_at: string
  message_count: number
  last_message?: string
}

function SummaryCard({
  label,
  value,
  icon,
  loading,
  suffix = '',
}: {
  label: string
  value: number
  icon: React.ReactNode
  loading?: boolean
  suffix?: string
}) {
  return (
    <div className="surface-raised p-5">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        {icon}
        <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)]">
        {loading ? (
          <SkeletonLoader variant="text" />
        ) : (
          `${value.toLocaleString()}${suffix}`
        )}
      </div>
    </div>
  )
}

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatbotId = searchParams.get('id') ?? ''
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [convPage, setConvPage] = useState(1)

  const TIME_RANGE_DAYS: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const days = TIME_RANGE_DAYS[timeRange]

  const { data: chatbotsData, isLoading: chatbotsLoading } = useChatbots({ per_page: 100 })
  const { data: summary, isLoading: summaryLoading } = useGlobalAnalyticsSummary({ days })
  const { data: topQueries, isLoading: queriesLoading } = useGlobalTopQueries({ days })
  const { data: intentDist, isLoading: intentLoading } = useGlobalIntentDistribution({ days })
  const { data: chatbotStats, isLoading: statsLoading } = useChatbotStats(chatbotId, { days })
  const { data: conversationsData, isLoading: convsLoading } = useChatbotConversations(
    chatbotId,
    { page: convPage, per_page: 20 }
  )

  const chatbots = chatbotsData?.data ?? []
  const conversations: Conversation[] =
    (conversationsData as { data?: Conversation[] })?.data ?? []
  const totalConvPages = (conversationsData as { meta?: { total: number } })?.meta
    ? Math.ceil(
        ((conversationsData as { meta: { total: number } }).meta.total) / 20
      )
    : 1

  const handleAssistantChange = (id: string) => {
    setConvPage(1)
    router.push(id ? `/live-assistants/analytics?id=${id}` : '/live-assistants/analytics')
  }

  const statLoading = chatbotId ? statsLoading : summaryLoading

  const summaryValues = {
    conversations: chatbotId
      ? (chatbotStats?.total_conversations ?? 0)
      : (summary?.total_conversations ?? 0),
    messages: chatbotId
      ? (chatbotStats?.total_messages ?? 0)
      : (summary?.total_messages ?? 0),
    avgLength: chatbotId ? (chatbotStats?.average_conversation_length ?? 0) : 0,
    satisfaction: chatbotId
      ? Math.round((chatbotStats?.satisfaction_rate ?? 0) * 100)
      : 0,
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          Analytics
        </h1>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex overflow-hidden rounded-lg border border-[var(--border-default)]">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  timeRange === r
                    ? 'bg-[var(--accent-600)] text-white'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Assistant selector */}
          {!chatbotsLoading && (
            <div className="relative">
              <select
                value={chatbotId}
                onChange={(e) => handleAssistantChange(e.target.value)}
                className="input min-w-[160px] appearance-none pr-8 text-sm"
              >
                <option value="">All assistants</option>
                {chatbots.map((cb) => (
                  <option key={cb.id} value={cb.id}>
                    {cb.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Total Conversations"
          value={summaryValues.conversations}
          icon={<MessageSquare className="h-5 w-5" />}
          loading={statLoading}
        />
        <SummaryCard
          label="Total Messages"
          value={summaryValues.messages}
          icon={<BarChart3 className="h-5 w-5" />}
          loading={statLoading}
        />
        <SummaryCard
          label="Avg. Length"
          value={summaryValues.avgLength}
          icon={<Clock className="h-5 w-5" />}
          loading={statLoading}
          suffix=" msgs"
        />
        <SummaryCard
          label="Satisfaction"
          value={summaryValues.satisfaction}
          icon={<TrendingUp className="h-5 w-5" />}
          loading={statLoading}
          suffix="%"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Queries */}
        <div className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Top Queries
            </h3>
            <span className="badge badge-ghost text-[10px] font-mono">{timeRange}</span>
          </div>
          {queriesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonLoader key={i} variant="row" />
              ))}
            </div>
          ) : (topQueries ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-muted)]">
              No query data yet
            </div>
          ) : (
            <div className="space-y-3">
              {(topQueries ?? []).slice(0, 10).map((q, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-muted)]">
                      {idx + 1}
                    </span>
                    <span className="truncate text-sm text-[var(--text-primary)]">
                      {q.query}
                    </span>
                  </div>
                  <span className="badge badge-ghost shrink-0 text-[10px]">{q.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Intent Distribution */}
        <div className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Intent Distribution
            </h3>
            <span className="badge badge-ghost text-[10px] font-mono">{timeRange}</span>
          </div>
          {intentLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonLoader key={i} variant="row" />
              ))}
            </div>
          ) : (intentDist ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-muted)]">
              No intent data yet
            </div>
          ) : (
            <div className="space-y-3">
              {(intentDist ?? []).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-primary)]">{item.intent}</span>
                    <span className="text-[var(--text-muted)]">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent-600)]"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation history — only when assistant is selected */}
      {chatbotId && (
        <div className="surface overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Conversation History
            </h3>
          </div>
          {convsLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonLoader key={i} variant="row" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-6 w-6 text-[var(--text-faint)]" />}
              title="No conversations yet"
              description="This assistant hasn't had any conversations."
            />
          ) : (
            <>
              <div className="divide-y divide-[var(--border-subtle)]">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
                        <User className="h-4 w-4 text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          Conversation {conv.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {conv.message_count} messages
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {format(new Date(conv.started_at), 'd MMM yyyy, HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
              {totalConvPages > 1 && (
                <div className="flex justify-center border-t border-[var(--border-subtle)] px-5 py-4">
                  <Pagination
                    page={convPage}
                    totalPages={totalConvPages}
                    onPageChange={setConvPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Global scope note */}
      {!chatbotId && (
        <p className="rounded-lg border border-[var(--border-default)] px-4 py-3 text-xs text-[var(--text-muted)]">
          Showing global analytics across all assistants. Select an assistant above to
          see per-assistant stats and conversation history.
        </p>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <SkeletonLoader variant="row" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface p-4">
                <SkeletonLoader variant="text" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  )
}
