import { compilerApi } from './compilerHttp'
import type { HealthCheck } from '@/types/common'

export const healthService = {
  async check(): Promise<HealthCheck> {
    return fetch('/api/health').then((res) => res.json())
  },
}
