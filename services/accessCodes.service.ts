import { compilerApi } from './compilerHttp'
import type { AccessCode, PaginatedResponse } from '@/types/common'

export interface CreateAccessCodeInput {
  name: string
  max_users?: number | null
  expires_at?: string | null
  code_suffix?: string | null
  notes?: string | null
}

export interface UpdateAccessCodeInput {
  name?: string
  max_users?: number | null
  expires_at?: string | null
  notes?: string | null
  is_active?: boolean
}

export const accessCodesService = {
  list(params?: { active_only?: boolean; page?: number; per_page?: number }) {
    return compilerApi.get<PaginatedResponse<AccessCode>>('/access-codes', params)
  },

  create(input: CreateAccessCodeInput) {
    return compilerApi.post<AccessCode>('/access-codes', input)
  },

  update(id: string, input: UpdateAccessCodeInput) {
    return compilerApi.patch<AccessCode>(`/access-codes/${id}`, input)
  },

  revoke(id: string) {
    return compilerApi.delete<void>(`/access-codes/${id}`)
  },
}