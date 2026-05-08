import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types/common'

interface AuthState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'hiva-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
)
