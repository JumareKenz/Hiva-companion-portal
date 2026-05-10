'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getCompilerToken, clearTokens } from '@/lib/auth'
import type { LogEvent } from '@/types/common'
import type { JobStep } from '@/types/enums'

export function useJobStream(jobId: string) {
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected' | 'connecting'>('connecting')
  const [currentStep, setCurrentStep] = useState<JobStep | 'complete' | 'failed' | null>(null)
  const [progressPct, setProgressPct] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasReconnected = useRef(false)
  // Refs mirror state so WS callbacks don't capture stale closures
  const isCompleteRef = useRef(false)
  const isFailedRef = useRef(false)

  const connect = useCallback(() => {
    if (!jobId) return

    const token = getCompilerToken()
    if (!token) return

    const wsBase = process.env.NEXT_PUBLIC_COMPILER_WS_URL || 'wss://compiler.hiva.chat'
    const wsUrl = `${wsBase.replace(/^http/, 'ws')}/api/jobs/${jobId}/stream?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnectionStatus('connected')
      hasReconnected.current = false
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'heartbeat') return

        if (data.step === 'complete') {
          isCompleteRef.current = true
          setIsComplete(true)
          setCurrentStep('complete')
          setProgressPct(100)
          ws.close()
          return
        }

        if (data.step === 'failed') {
          isFailedRef.current = true
          setIsFailed(true)
          setError(data.message || 'Job failed')
          setCurrentStep('failed')
          ws.close()
          return
        }

        setLogs((prev) => {
          const next = [...prev, data as LogEvent]
          if (next.length > 500) next.shift()
          return next
        })

        if (data.step) setCurrentStep(data.step)
        if (typeof data.progress_pct === 'number') setProgressPct(data.progress_pct)
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = (e) => {
      if (e.code === 4001) {
        clearTokens()
        window.location.href = '/login'
        return
      }

      // Use refs so the callback reads current values, not stale closure values
      if (!isCompleteRef.current && !isFailedRef.current && !hasReconnected.current) {
        hasReconnected.current = true
        setConnectionStatus('reconnecting')
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 2000)
      } else {
        setConnectionStatus('disconnected')
      }
    }

    ws.onerror = () => {
      setConnectionStatus('disconnected')
    }
  }, [jobId])

  useEffect(() => {
    setLogs([])
    setConnectionStatus('connecting')
    setCurrentStep(null)
    setProgressPct(0)
    setIsComplete(false)
    setIsFailed(false)
    setError(null)
    isCompleteRef.current = false
    isFailedRef.current = false
    hasReconnected.current = false

    connect()

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [jobId, connect])

  return {
    logs,
    connectionStatus,
    currentStep,
    progressPct,
    isComplete,
    isFailed,
    error,
  }
}
