/**
 * Composable for Google login flow: opens/closes auth UI (modal or drawer)
 * and sets player session on successful Google sign-in.
 */
const AUTH_OPEN_KEY = 'sevens-google-auth-open'

type GoogleTokenClaims = {
  name?: string
  email?: string
  picture?: string
  iat?: number
}

type AccountIdentity = {
  email?: string
  fullName: string
  image?: string
  lastLoginAt: number
}

type SyncedAccount = {
  id: string
  name: string
  avatar: string
  image?: string
  email: string
  lastLoginAt: number
}

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

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? 'Player',
    lastName: parts.slice(1).join(' ') || 'Unknown',
  }
}

function buildIdentity(claims: Record<string, unknown>, tokenClaims: GoogleTokenClaims | null): AccountIdentity {
  const googleClaims = claims as { name?: string; email?: string; picture?: string }
  const fullName = (googleClaims.name || tokenClaims?.name || googleClaims.email || tokenClaims?.email || 'Player').trim()
  const email = (googleClaims.email || tokenClaims?.email || '').trim() || undefined
  const image = googleClaims.picture || tokenClaims?.picture
  const lastLoginAt = typeof tokenClaims?.iat === 'number' ? tokenClaims.iat * 1000 : Date.now()
  return { email, fullName, image, lastLoginAt }
}

export function useGoogleLogin() {
  const isOpen = useState<boolean>(AUTH_OPEN_KEY, () => false)
  const { setSession } = usePlayerSession()
  const { upsertAccount } = useAccountApi()

  function openAuth() {
    isOpen.value = true
  }

  function closeAuth() {
    isOpen.value = false
  }

  async function handleGoogleSuccess(
    e: { credential: string; claims: Record<string, unknown> },
    legalAcceptedAt?: string,
  ) {
    const tokenClaims = decodeJwtPayload<GoogleTokenClaims>(e.credential)
    const identity = buildIdentity(e.claims, tokenClaims)
    const { firstName, lastName } = splitName(identity.fullName)
    const syncedAccount = identity.email
      ? await syncAccount(identity, firstName, lastName, legalAcceptedAt)
      : null

    setSession(syncedAccount ?? {
      name: identity.fullName,
      avatar: '🐶',
      image: identity.image,
      email: identity.email,
      lastLoginAt: identity.lastLoginAt,
    })
    closeAuth()
  }

  async function syncAccount(
    identity: AccountIdentity,
    firstName: string,
    lastName: string,
    legalAcceptedAt?: string,
  ) {
    try {
      const response = await upsertAccount(identity.email!, {
        email: identity.email!,
        first_name: firstName,
        last_name: lastName,
        full_name: identity.fullName,
        profile_image_url: identity.image,
        avatar_emoji: '🐶',
        last_login_at: new Date(identity.lastLoginAt).toISOString(),
        legal_consent: legalAcceptedAt
          ? {
              privacy_policy_accepted_at: legalAcceptedAt,
              terms_accepted_at: legalAcceptedAt,
            }
          : undefined,
      })

      return {
        id: response.user._id,
        name: response.user.full_name,
        avatar: response.user.avatar_emoji || '🐶',
        image: response.user.profile_image_url,
        email: response.user.email,
        lastLoginAt: new Date(response.user.last_login_at).getTime(),
      } satisfies SyncedAccount
    } catch (error) {
      console.error('[google-login] Failed to sync account:', error)
      return null
    }
  }

  return {
    isOpen: readonly(isOpen),
    openAuth,
    closeAuth,
    handleGoogleSuccess,
  }
}
