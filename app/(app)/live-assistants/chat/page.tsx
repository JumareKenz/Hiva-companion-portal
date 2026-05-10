'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Bot, ChevronDown, AlertTriangle } from 'lucide-react'

import { useChatbots } from '@/features/assistants/hooks/useAssistants'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LogoBackground } from '@/components/ui/LogoBackground'
import { cn } from '@/lib/utils'
import type { ChatbotStatus } from '@/types/enums'

const STATUS_BADGE: Record<ChatbotStatus, string> = {
  active: 'badge-success',
  paused: 'badge-warning',
  draft: 'badge-ghost',
  archived: 'badge-error',
}

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatbotId = searchParams.get('id') ?? ''

  const { data: chatbotsData, isLoading: chatbotsLoading } = useChatbots({ per_page: 100 })

  const chatbots = chatbotsData?.data ?? []
  const assistant = chatbots.find((cb) => cb.id === chatbotId) ?? null

  const handleSelect = (id: string) => {
    router.push(id ? `/live-assistants/chat?id=${id}` : '/live-assistants/chat')
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <LogoBackground size={600} opacity={0.02} fixed={false} spin={false} breathe={false} />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Header with assistant selector */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            Chat & Test
          </h1>
          {!chatbotsLoading && chatbots.length > 0 && (
            <div className="relative shrink-0">
              <select
                value={chatbotId}
                onChange={(e) => handleSelect(e.target.value)}
                className="input min-w-[180px] appearance-none pr-8 text-sm"
              >
                <option value="">Select assistant…</option>
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

        {/* No ID selected — show assistant picker list */}
        {!chatbotId ? (
          chatbotsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonLoader key={i} variant="row" />
              ))}
            </div>
          ) : chatbots.length === 0 ? (
            <EmptyState
              icon={<Bot className="h-6 w-6 text-[var(--text-faint)]" />}
              title="No assistants found"
              description="Create an assistant first to test it here."
              action={{
                label: 'Create Assistant',
                onClick: () => router.push('/live-assistants/create'),
              }}
            />
          ) : (
            <div className="surface overflow-hidden">
              <div className="divide-y divide-[var(--border-subtle)]">
                {chatbots.map((chatbot) => {
                  const isActive = chatbot.status === 'active'
                  return (
                    <button
                      key={chatbot.id}
                      onClick={() => handleSelect(chatbot.id)}
                      className={cn(
                        'flex w-full items-center gap-4 p-4 text-left transition-colors',
                        isActive
                          ? 'hover:bg-[var(--bg-secondary)]'
                          : 'opacity-60 hover:bg-[var(--bg-secondary)]'
                      )}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: chatbot.brand_color + '20' }}
                      >
                        <Bot
                          className="h-5 w-5"
                          style={{ color: chatbot.brand_color }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[var(--text-primary)]">
                          {chatbot.name}
                        </div>
                        <div className="text-xs font-mono text-[var(--text-muted)]">
                          /{chatbot.slug}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">
                          {chatbot.document_count} docs
                        </span>
                        <span
                          className={cn(
                            'badge text-[10px] capitalize',
                            STATUS_BADGE[chatbot.status]
                          )}
                        >
                          {chatbot.status}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        ) : chatbotsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLoader key={i} variant="row" />
            ))}
          </div>
        ) : assistant && assistant.status !== 'active' ? (
          /* Selected assistant exists but isn't active — block before sending to API */
          <div className="surface rounded-xl p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--warning)]/10">
              <AlertTriangle className="h-6 w-6 text-[var(--warning)]" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                Assistant not active
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                <strong>{assistant.name}</strong> is currently{' '}
                <span
                  className={cn(
                    'badge text-[10px] capitalize',
                    STATUS_BADGE[assistant.status]
                  )}
                >
                  {assistant.status}
                </span>{' '}
                and cannot receive messages. Activate it first from the{' '}
                <button
                  onClick={() => router.push('/live-assistants')}
                  className="text-[var(--accent-600)] hover:underline"
                >
                  Assistants overview
                </button>
                .
              </p>
            </div>
            <button
              onClick={() => handleSelect('')}
              className="btn btn-secondary btn-sm"
            >
              Choose a different assistant
            </button>
          </div>
        ) : assistant ? (
          <ChatInterface
            slug={assistant.slug}
            title={assistant.name}
            showHeader={true}
            compact={false}
            onBack={() => handleSelect('')}
          />
        ) : (
          <EmptyState
            icon={<Bot className="h-6 w-6 text-[var(--text-faint)]" />}
            title="Assistant not found"
            description="The selected assistant could not be loaded."
          />
        )}
      </div>
    </div>
  )
}

export default function ChatTestPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-4 py-8">
          <SkeletonLoader variant="row" />
          <div className="surface h-[500px]" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
