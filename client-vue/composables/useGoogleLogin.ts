/**
 * Composable for Google login flow: opens/closes auth UI (modal or drawer)
 * and sets player session on successful Google sign-in.
 */
const AUTH_OPEN_KEY = 'sevens-google-auth-open'

function decodeJwtPayload<T>(token: string): T | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')
    const json = atob(padded)
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

export function useGoogleLogin() {
  const isOpen = useState<boolean>(AUTH_OPEN_KEY, () => false)
  const { setSession } = usePlayerSession()

  function openAuth() {
    isOpen.value = true
  }

  function closeAuth() {
    isOpen.value = false
  }

  function handleGoogleSuccess(e: { credential: string; claims: Record<string, unknown> }) {
    const tokenClaims = decodeJwtPayload<{
      name?: string
      email?: string
      picture?: string
      iat?: number
    }>(e.credential)
    const claims = e.claims as { name?: string; email?: string; picture?: string }
    const name = (claims.name || tokenClaims?.name || claims.email || tokenClaims?.email || 'Player').trim()
    const email = (claims.email || tokenClaims?.email || '').trim() || undefined
    const picture = claims.picture || tokenClaims?.picture
    const issuedAt = typeof tokenClaims?.iat === 'number' ? tokenClaims.iat * 1000 : Date.now()

    setSession({
      name,
      avatar: '🐶',
      image: picture,
      email,
      lastLoginAt: issuedAt,
    })
    closeAuth()
  }

  return {
    isOpen: readonly(isOpen),
    openAuth,
    closeAuth,
    handleGoogleSuccess,
  }
}
