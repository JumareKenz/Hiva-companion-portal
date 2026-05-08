'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { LogEvent } from '@/types/common'

interface LogStreamProps {
  logs: LogEvent[]
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected' | 'connecting'
}

export function LogStream({ logs, connectionStatus }: LogStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const statusDot =
    connectionStatus === 'connected'
      ? 'bg-[var(--success)]'
      : connectionStatus === 'reconnecting'
        ? 'bg-[var(--warning)] animate-pulse'
        : 'bg-[var(--text-faint)]'

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#141210] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
          Live Logs
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', statusDot)} />
          <span className="text-[10px] font-mono text-[var(--text-faint)]">
            {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'reconnecting' ? 'Reconnecting…' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-72 overflow-y-auto font-mono text-[13px] leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-[var(--text-faint)]">
            Waiting for logs…
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 py-0.5">
              <span className="mt-0.5 shrink-0 text-[11px] text-[var(--n-600)]">
                {format(new Date(log.timestamp), 'HH:mm:ss')}
              </span>
              <span
                className={cn(
                  'shrink-0 text-[11px] font-bold',
                  log.level === 'info' && 'text-blue-400',
                  log.level === 'warn' && 'text-amber-400',
                  log.level === 'error' && 'text-red-400'
                )}
              >
                {log.level === 'info' ? 'INF' : log.level === 'warn' ? 'WRN' : 'ERR'}
              </span>
              <span className="text-[var(--n-200)]">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
