import { login, logout } from '@/lib/auth'
import { compilerApi } from './compilerHttp'
import type { User } from '@/types/common'

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<User> {
    return login(credentials.email, credentials.password)
  },

  async refresh(): Promise<{ access_token: string; token_type: string }> {
    return compilerApi.post('/auth/refresh')
  },

  async me(): Promise<User> {
    return compilerApi.get<User>('/auth/me')
  },

  async logout(): Promise<void> {
    return logout()
  },
}
