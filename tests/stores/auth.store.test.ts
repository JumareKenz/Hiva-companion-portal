import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/types/common'

const mockUser: User = {
  id: 'user-1',
  email: 'admin@hiva.ng',
  full_name: 'Admin User',
  role: 'admin',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

describe('stores/auth.store.ts — useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null })
  })

  describe('setUser', () => {
    it('should set user object', () => {
      const { setUser } = useAuthStore.getState()
      setUser(mockUser)
      expect(useAuthStore.getState().user).toMatchObject({ id: 'user-1', email: 'admin@hiva.ng' })
    })

    it('should overwrite existing user', () => {
      const { setUser } = useAuthStore.getState()
      setUser(mockUser)
      setUser({ ...mockUser, full_name: 'New Name', role: 'reviewer' })
      expect(useAuthStore.getState().user?.full_name).toBe('New Name')
      expect(useAuthStore.getState().user?.role).toBe('reviewer')
    })
  })

  describe('clearUser', () => {
    it('should set user to null', () => {
      const { setUser, clearUser } = useAuthStore.getState()
      setUser(mockUser)
      clearUser()
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('should be idempotent (clearing already null)', () => {
      const { clearUser } = useAuthStore.getState()
      clearUser()
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('isAdmin', () => {
    it('should return true when role is admin', () => {
      const { setUser, isAdmin } = useAuthStore.getState()
      setUser({ ...mockUser, role: 'admin' })
      expect(isAdmin()).toBe(true)
    })

    it('should return false when role is reviewer', () => {
      const { setUser, isAdmin } = useAuthStore.getState()
      setUser({ ...mockUser, role: 'reviewer' })
      expect(isAdmin()).toBe(false)
    })

    it('should return false when no user', () => {
      const { isAdmin } = useAuthStore.getState()
      expect(isAdmin()).toBe(false)
    })
  })

  describe('sessionStorage persistence', () => {
    it('should call sessionStorage.setItem when user is set', () => {
      const setItemSpy = sessionStorage.setItem as ReturnType<typeof vi.fn>
      setItemSpy.mockClear()
      const { setUser } = useAuthStore.getState()
      setUser(mockUser)
      // Verify persist middleware attempted to write (mock setItem is a spy)
      expect(setItemSpy).toHaveBeenCalled()
      const hivaCall = setItemSpy.mock.calls.find(([k]: [string]) => k === 'hiva-auth')
      expect(hivaCall).toBeDefined()
      expect(JSON.parse(hivaCall![1]).state.user).toMatchObject({ id: 'user-1' })
    })

    it('should call sessionStorage.setItem with user null after clearUser', () => {
      const { setUser, clearUser } = useAuthStore.getState()
      setUser(mockUser)
      clearUser()
      const calls = (sessionStorage.setItem as ReturnType<typeof vi.fn>).mock.calls
      const lastHivaCall = [...calls].reverse().find(([k]: [string]) => k === 'hiva-auth')
      expect(lastHivaCall).toBeDefined()
      expect(JSON.parse(lastHivaCall![1]).state.user).toBeNull()
    })

    it('should only persist user field (no actions or tokens)', () => {
      const { setUser } = useAuthStore.getState()
      setUser(mockUser)
      const calls = (sessionStorage.setItem as ReturnType<typeof vi.fn>).mock.calls
      const hivaCall = calls.find(([k]: [string]) => k === 'hiva-auth')
      expect(hivaCall).toBeDefined()
      const parsed = JSON.parse(hivaCall![1])
      // partialize should strip action functions and leave only { user }
      expect(Object.keys(parsed.state)).toEqual(['user'])
    })
  })

  describe('state subscriptions', () => {
    it('should trigger re-render on user change', () => {
      const { setUser } = useAuthStore.getState()
      let renderCount = 0
      useAuthStore.subscribe(() => { renderCount++ })
      setUser(mockUser)
      setUser(null)
      expect(renderCount).toBeGreaterThanOrEqual(1)
    })
  })
})