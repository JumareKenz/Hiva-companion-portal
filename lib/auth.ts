const PLATFORM_TOKEN_KEY = 'platform_token'
const COMPILER_TOKEN_KEY = 'compiler_token'

interface JwtPayload {
  sub?: string
  role?: string
  exp?: number
  iat?: number
}

export function decodeJwt(token: string): JwtPayload {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return {}
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as JwtPayload
  } catch {
    return {}
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload.exp) return true
  return payload.exp * 1000 < Date.now()
}

export function getTokenClaims(token: string): JwtPayload {
  return decodeJwt(token)
}

export function getPlatformToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(PLATFORM_TOKEN_KEY)
}

export function getCompilerToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(COMPILER_TOKEN_KEY)
}

export function setPlatformToken(token: string): void {
  sessionStorage.setItem(PLATFORM_TOKEN_KEY, token)
}

export function setCompilerToken(token: string): void {
  sessionStorage.setItem(COMPILER_TOKEN_KEY, token)
}

export function clearTokens(): void {
  sessionStorage.removeItem(PLATFORM_TOKEN_KEY)
  sessionStorage.removeItem(COMPILER_TOKEN_KEY)
}

export async function login(email: string, password: string) {
  // Step 1: Login to chatbot platform
  const loginRes = await fetch('/api/v1/agency/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!loginRes.ok) throw new Error('Invalid credentials')
  const { access_token: platformToken } = await loginRes.json()

  // Step 2: Exchange for compiler token
  const exchangeRes = await fetch('/api/auth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider_token: platformToken }),
  })
  if (!exchangeRes.ok) throw new Error('Compiler access denied')
  const { access_token: compilerToken, user } = await exchangeRes.json()

  setPlatformToken(platformToken)
  setCompilerToken(compilerToken)

  return user as { id: string; email: string; full_name: string; role: 'admin' | 'reviewer' }
}

export async function logout(): Promise<void> {
  const compilerToken = getCompilerToken()
  if (compilerToken) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${compilerToken}` },
      })
    } catch {
      // Best effort — clear tokens regardless
    }
  }
  clearTokens()
}
