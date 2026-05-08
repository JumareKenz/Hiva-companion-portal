'use client'

import { useCallback } from 'react'
import { getTheme, setTheme, toggleTheme as libToggleTheme } from '@/lib/theme'

export function useTheme() {
  const theme = getTheme()

  const handleSetTheme = useCallback((t: 'light' | 'dark') => {
    setTheme(t)
  }, [])

  const handleToggleTheme = useCallback(() => {
    libToggleTheme()
  }, [])

  return {
    theme,
    setTheme: handleSetTheme,
    toggleTheme: handleToggleTheme,
  }
}
