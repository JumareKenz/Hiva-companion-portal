import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { decodeJwt, isTokenExpired, getTokenClaims, getCompilerToken, getPlatformToken, setCompilerToken, setPlatformToken, clearTokens } from '@/lib/auth'

vi.stubGlobal('sessionStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
})

describe('lib/auth.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.getItem.mockReturnValue(null)
  })

  describe('decodeJwt', () => {
    it('should decode a valid JWT payload', () => {
      const payload = { sub: 'user-123', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 }
      const token = `header.${btoa(JSON.stringify(payload)).replace(/=/g, '')}.signature`
      const result = decodeJwt(token)
      expect(result.sub).toBe('user-123')
      expect(result.role).toBe('admin')
    })

    it('should return empty object for invalid JWT', () => {
      expect(decodeJwt('not-a-valid-token')).toEqual({})
      expect(decodeJwt('')).toEqual({})
      expect(decodeJwt('only-two-parts')).toEqual({})
    })

    it('should handle base64url padding', () => {
      const payload = { sub: 'test', role: 'reviewer' }
      const encoded = btoa(JSON.stringify(payload)).replace(/=/g, '')
      const token = `header.${encoded}.signature`
      expect(decodeJwt(token).sub).toBe('test')
    })

    it('should handle malformed base64', () => {
      const token = 'header.invalid!!!base64.signature'
      expect(decodeJwt(token)).toEqual({})
    })

    it('should handle missing payload part', () => {
      expect(decodeJwt('only-header.')).toEqual({})
    })
  })

  describe('isTokenExpired', () => {
    it('should return true when exp is in the past', () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }
      const token = `h.${btoa(JSON.stringify(expiredPayload))}.s`
      expect(isTokenExpired(token)).toBe(true)
    })

    it('should return false when exp is in the future', () => {
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }
      const token = `h.${btoa(JSON.stringify(validPayload))}.s`
      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true when no exp claim', () => {
      const noExpPayload = { sub: 'user-123' }
      const token = `h.${btoa(JSON.stringify(noExpPayload))}.s`
      expect(isTokenExpired(token)).toBe(true)
    })
  })

  describe('getTokenClaims', () => {
    it('should return decoded JWT payload', () => {
      const payload = { sub: 'user-456', role: 'reviewer', exp: Math.floor(Date.now() / 1000) + 600 }
      const token = `h.${btoa(JSON.stringify(payload))}.s`
      const claims = getTokenClaims(token)
      expect(claims.sub).toBe('user-456')
      expect(claims.role).toBe('reviewer')
    })
  })

  describe('token storage helpers', () => {
    it('getCompilerToken should return null on server', () => {
      vi.stubGlobal('window', undefined)
      expect(getCompilerToken()).toBeNull()
      vi.stubGlobal('window', globalThis)
    })

    it('getPlatformToken should call sessionStorage.getItem', () => {
      sessionStorage.getItem.mockReturnValue('platform-token-abc')
      expect(getPlatformToken()).toBe('platform-token-abc')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('platform_token')
    })

    it('getCompilerToken should return null when no token stored', () => {
      sessionStorage.getItem.mockReturnValue(null)
      expect(getCompilerToken()).toBeNull()
    })

    it('setCompilerToken should call sessionStorage.setItem', () => {
      setCompilerToken('new-compiler-token')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('compiler_token', 'new-compiler-token')
    })

    it('setPlatformToken should call sessionStorage.setItem', () => {
      setPlatformToken('new-platform-token')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('platform_token', 'new-platform-token')
    })

    it('clearTokens should remove both keys', () => {
      clearTokens()
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('platform_token')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('compiler_token')
    })
  })

  describe('login flow', () => {
    it('should throw when platform login fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false }))
      const { login } = await import('@/lib/auth')
      await expect(login('bad@test.com', 'password')).rejects.toThrow('Invalid credentials')
    })

    it('should store tokens on successful login and exchange', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'platform-token' }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'compiler-token', user: { id: 'u1', email: 'a@b.com', full_name: 'Test', role: 'admin' } }) })
      vi.stubGlobal('fetch', mockFetch)
      const { login } = await import('@/lib/auth')
      const user = await login('admin@test.com', 'password123')
      expect(user.role).toBe('admin')
    })
  })
})