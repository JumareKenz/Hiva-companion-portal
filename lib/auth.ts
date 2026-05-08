const PLATFORM_TOKEN_KEY = 'platform_token'
const COMPILER_TOKEN_KEY = 'compiler_token'

interface JwtPayload {
  sub?: string
  email?: string
  full_name?: string
  name?: string
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
  const t = sessionStorage.getItem(PLATFORM_TOKEN_KEY)
  return t && t !== 'undefined' && t !== 'null' ? t : null
}

export function getCompilerToken(): string | null {
  if (typeof window === 'undefined') return null
  const t = sessionStorage.getItem(COMPILER_TOKEN_KEY)
  return t && t !== 'undefined' && t !== 'null' ? t : null
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

function extractToken(data: Record<string, unknown>): string | null {
  // handle common token field names
  const token = data.access_token ?? data.token ?? data.jwt ?? data.id_token
  return typeof token === 'string' && token.length > 0 ? token : null
}

function buildUserFromJwt(token: string): {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'reviewer'
} | null {
  const claims = decodeJwt(token)
  if (!claims.sub) return null
  return {
    id: claims.sub,
    email: claims.email ?? '',
    full_name: claims.full_name ?? claims.name ?? '',
    role: (claims.role as 'admin' | 'reviewer') ?? 'admin',
  }
}

export async function login(email: string, password: string) {
  // Step 1: Login to the platform (admin-api.hiva.chat)
  const loginRes = await fetch('/api/v1/agency/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({})) as Record<string, unknown>
    throw { status: loginRes.status, message: 'Login failed', detail: err.detail ?? err.message ?? 'Invalid credentials' }
  }
  const platformData = await loginRes.json() as Record<string, unknown>
  const platformToken = extractToken(platformData)
  if (!platformToken) throw { status: 401, message: 'Login failed', detail: 'No token returned by platform' }

  // Store platform token immediately — chatbot API calls need this
  setPlatformToken(platformToken)

  // Step 2: Try to exchange for compiler token (used for HIVA bundle features)
  // This is optional — chatbot functionality works with platform token alone
  let compilerUser: ReturnType<typeof buildUserFromJwt> = null
  try {
    const exchangeRes = await fetch('/api/auth/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_token: platformToken }),
    })
    if (exchangeRes.ok) {
      const exchangeData = await exchangeRes.json() as Record<string, unknown>
      const compilerToken = extractToken(exchangeData)
      if (compilerToken) {
        setCompilerToken(compilerToken)
        compilerUser = (exchangeData.user as ReturnType<typeof buildUserFromJwt>)
          ?? buildUserFromJwt(compilerToken)
      }
    }
  } catch {
    // Compiler service unavailable — continue with platform-only access
  }

  // Fall back: use user from platform response or decode from JWT
  const platformUser = platformData.user as ReturnType<typeof buildUserFromJwt> | undefined
  const user = compilerUser ?? platformUser ?? buildUserFromJwt(platformToken)

  if (!user) throw { status: 401, message: 'Login failed', detail: 'Could not determine user identity' }

  // If no compiler token was issued, use the platform token as the auth token too
  // so AuthGuard (which checks compiler token) can still pass
  if (!getCompilerToken()) {
    setCompilerToken(platformToken)
  }

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
