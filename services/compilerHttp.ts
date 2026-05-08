import { getCompilerToken, clearTokens } from '@/lib/auth'
import type { ApiError } from '@/types/common'

const BASE = '/api'

class CompilerApiClient {
  async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown
      formData?: FormData
      params?: Record<string, string | number | boolean | undefined>
      blob?: boolean
    }
  ): Promise<T> {
    const token = getCompilerToken()
    const url = new URL(BASE + path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

    if (options?.params) {
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v))
        }
      })
    }

    const headers: HeadersInit = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (options?.body) headers['Content-Type'] = 'application/json'

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: options?.formData ?? (options?.body ? JSON.stringify(options.body) : undefined),
    })

    if (res.status === 401) {
      clearTokens()
      throw { status: 401, message: 'Unauthorized', detail: 'Session expired' } as ApiError
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw { status: res.status, message: res.statusText, detail: err.detail } as ApiError
    }

    if (res.status === 204) return undefined as T
    if (options?.blob) return res.blob() as unknown as T

    const json = await res.json()

    if (json && typeof json === 'object' && 'data' in json && !('meta' in json)) {
      return json.data as T
    }

    return json as T
  }

  get = <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    this.request<T>('GET', path, { params })

  post = <T>(path: string, body?: unknown) =>
    this.request<T>('POST', path, { body })

  patch = <T>(path: string, body: unknown) =>
    this.request<T>('PATCH', path, { body })

  delete = <T>(path: string) =>
    this.request<T>('DELETE', path)

  upload = <T>(path: string, formData: FormData) =>
    this.request<T>('POST', path, { formData })

  download = (path: string) =>
    this.request<Blob>('GET', path, { blob: true })
}

export const compilerApi = new CompilerApiClient()
