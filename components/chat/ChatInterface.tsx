'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Send,
  User,
  Bot,
  Loader2,
  ChevronDown,
  MessageSquare,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'

import { chatService, type ChatMessageResponse } from '@/services/chat.service'
import { cn } from '@/lib/utils'
import type { Language } from '@/types/enums'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
  is_grounded?: boolean
  citations?: Array<{
    document_id: string
    filename: string
    content_preview: string
    score: number
  }>
  agent_phase?: string | null
}

interface ChatInterfaceProps {
  slug: string
  title?: string
  showHeader?: boolean
  compact?: boolean
  className?: string
  onBack?: () => void
  initialMessage?: string
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', label: 'Yoruba', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { code: 'pcm', label: 'Pidgin', flag: '🇳🇬' },
]

const STORAGE_KEY = (slug: string) => `hiva-chat-${slug}`
const SESSION_KEY = (slug: string) => `hiva_session_${slug}`
const CONV_KEY = (slug: string) => `hiva_conv_${slug}`

export function ChatInterface({
  slug,
  title,
  showHeader = true,
  compact = false,
  className,
  onBack,
  initialMessage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState<Language>('en')
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Backend assigns conversation_id on first message; null = no active conversation yet
  const [conversationId, setConversationId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(CONV_KEY(slug))
  })
  // Session ID is frontend-controlled and persisted per slug
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return ''
    const key = SESSION_KEY(slug)
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(key, id)
    return id
  })
  const [config] = useState<{ name: string; brand_color: string; welcome_message: string }>({
    name: title || 'Assistant',
    brand_color: '#155D46',
    welcome_message: 'Hello! How can I help you today?',
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load saved messages on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(slug))
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed)
      } catch {
        // ignore invalid stored data
      }
    }
  }, [slug])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(messages))
    }
  }, [messages, slug])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setInput(initialMessage)
      handleSend(initialMessage)
    }
  }, [initialMessage])

  const handleSend = async (messageToSend?: string) => {
    const messageText = messageToSend || input.trim()
    if (!messageText || isLoading) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response: ChatMessageResponse = await chatService.sendMessage(slug, {
        message: messageText,
        sessionId,
        ...(conversationId ? { conversation_id: conversationId } : {}),
      })

      // Backend assigns conversation_id; persist it to resume on refresh
      if (response.conversation_id && response.conversation_id !== conversationId) {
        setConversationId(response.conversation_id)
        localStorage.setItem(CONV_KEY(slug), response.conversation_id)
      }

      const assistantMessage: ChatMessage = {
        id: response.message_id,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        confidence: response.confidence_level,
        is_grounded: response.is_grounded,
        citations: response.citations,
        agent_phase: response.agent?.phase || null,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Failed to connect. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startNewConversation = () => {
    setMessages([])
    setError(null)
    setConversationId(null)
    localStorage.removeItem(STORAGE_KEY(slug))
    localStorage.removeItem(CONV_KEY(slug))
    inputRef.current?.focus()
  }

  const selectedLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]!

  return (
    <div className={cn('flex flex-col', compact ? 'h-[400px]' : 'h-[600px]', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button onClick={onBack} className="btn btn-ghost btn-sm">
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <Link href="/assistants" className="btn btn-ghost btn-sm">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ backgroundColor: (config?.brand_color || '#155D46') + '20' }}
            >
              <Bot className="h-4 w-4" style={{ color: config?.brand_color || '#155D46' }} />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                {title || config?.name || 'Assistant'}
              </h2>
              {!compact && (
                <span className="text-[10px] text-[var(--text-muted)]">Online</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-2 py-1 text-xs hover:bg-[var(--bg-secondary)]"
              >
                <span>{selectedLang.flag}</span>
                <span className="text-[var(--text-secondary)]">{selectedLang.label}</span>
                <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-md border border-[var(--border-default)] bg-[var(--surface)] shadow-lg">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setShowLangMenu(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)]',
                        language === lang.code && 'text-[var(--accent-600)]'
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New Conversation */}
            <button
              onClick={startNewConversation}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
              title="Start new conversation"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {!compact && <span>New chat</span>}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-[var(--text-faint)] mb-4" />
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              {config.welcome_message}
            </h3>
            {!compact && (
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Ask me anything about the documents in my knowledge base.
              </p>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} compact={compact} />
          ))
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
              <Bot className="h-4 w-4 text-[var(--text-muted)]" />
            </div>
            <div className="rounded-lg bg-[var(--bg-secondary)] px-4 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-md bg-[var(--error)]/10 p-3 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border-default)] p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            className="input flex-1"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="btn btn-primary"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, compact }: { message: ChatMessage; compact: boolean }) {
  const [showCitations, setShowCitations] = useState(false)

  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-[var(--accent-600)]' : 'bg-[var(--bg-secondary)]'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </div>

      <div className={cn('max-w-[70%]', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser
              ? 'bg-[var(--accent-600)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        <div className={cn('mt-1 flex items-center gap-2 text-[10px]', isUser ? 'justify-end' : '', !compact && 'text-[var(--text-muted)]')}>
          <span>{format(new Date(message.timestamp), 'HH:mm')}</span>

          {!isUser && !compact && (
            <>
              {message.confidence && (
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 font-medium',
                    message.confidence === 'HIGH' && 'bg-[var(--success)]/10 text-[var(--success)]',
                    message.confidence === 'MEDIUM' && 'bg-[var(--warning)]/10 text-[var(--warning)]',
                    message.confidence === 'LOW' && 'bg-[var(--error)]/10 text-[var(--error)]'
                  )}
                >
                  {message.confidence}
                </span>
              )}

              {message.is_grounded !== undefined && (
                <span className={cn(
                  'rounded px-1.5 py-0.5',
                  message.is_grounded ? 'bg-[var(--accent-600)]/10 text-[var(--accent-600)]' : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                )}>
                  {message.is_grounded ? 'Grounded' : 'Ungrounded'}
                </span>
              )}

              {message.agent_phase && (
                <span className="rounded bg-[var(--info)]/10 px-1.5 py-0.5 text-[var(--info)]">
                  {message.agent_phase}
                </span>
              )}
            </>
          )}
        </div>

        {/* Citations */}
        {!isUser && !compact && message.citations && message.citations.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-1 text-xs text-[var(--accent-600)] hover:underline"
            >
              {showCitations ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {message.citations.length} source{message.citations.length > 1 ? 's' : ''}
            </button>

            {showCitations && (
              <div className="mt-2 space-y-2 rounded-md bg-[var(--surface-inset)] p-2">
                {message.citations.map((cite, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-medium text-[var(--text-primary)]">{cite.filename}</div>
                    <div className="truncate text-[var(--text-muted)]">{cite.content_preview}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}