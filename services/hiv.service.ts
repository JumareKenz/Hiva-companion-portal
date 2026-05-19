import { compilerApi } from './compilerHttp'
import type { HivVersion } from '@/types/common'

export const hivService = {
  async version(): Promise<HivVersion | null> {
    const res = await fetch('/api/hiv/version')
    if (!res.ok) return null
    return res.json()
  },

  async download(): Promise<Blob> {
    return compilerApi.download('/hiv/download')
  },

  async errorReport(body: Record<string, unknown>): Promise<void> {
    // Public endpoint — no auth required
    return fetch('/api/hiv/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to send error report')
    })
  },

  async feedback(body: {
    version: string
    device_id_hash: string
    query_text: string
    language: string
    chunk_id?: string
    rating: number
    result_rank?: number
    latency_ms?: number
  }): Promise<void> {
    // Public endpoint — no auth required
    return fetch('/api/hiv/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to send feedback')
    })
  },
}
