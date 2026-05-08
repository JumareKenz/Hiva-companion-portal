const STORAGE_KEY = 'hiva-theme'
export type Theme = 'light' | 'dark'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored ?? getSystemTheme()
}

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return (document.documentElement.getAttribute('data-theme') as Theme) || 'light'
}

export function setTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
  localStorage.setItem(STORAGE_KEY, theme)
}

export function toggleTheme(): Theme {
  const current = getTheme()
  const next = current === 'light' ? 'dark' : 'light'
  setTheme(next)
  return next
}
