/**
 * Composable for Google login flow: opens/closes auth UI (modal or drawer)
 * and sets player session on successful Google sign-in.
 */
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in'
import { Capacitor } from '@capacitor/core'

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
  id?: string
  name: string
  avatar: string
  image?: string
  email?: string
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
  const { clearSession, setSession } = usePlayerSession()
  const isNativePlatform = computed(() => import.meta.client && Capacitor.isNativePlatform())
  const { signInWithGoogleCredential, upsertAccount } = useAccountApi()

  function openAuth() {
    isOpen.value = true
  }

  function closeAuth() {
    isOpen.value = false
  }

  async function signOut() {
    if (isNativePlatform.value) {
      try {
        await GoogleSignIn.signOut()
      } catch (error) {
        console.error('[google-login] Failed to sign out native Google session:', error)
      }
    }

    clearSession()
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

    setSession(syncedAccount ?? buildLocalSession(identity))
    closeAuth()
  }

  async function signInWithNativeGoogle(legalAcceptedAt?: string) {
    const result = await GoogleSignIn.signIn()

    if (!result.idToken) {
      throw new Error('Google sign-in did not return an ID token')
    }

    const response = await signInWithGoogleCredential(result.idToken, legalAcceptedAt)
    const syncedAccount = mapSyncedAccount(response.user)

    setSession(syncedAccount)
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

      return mapSyncedAccount(response.user)
    } catch (error) {
      console.error('[google-login] Failed to sync account:', error)
      return null
    }
  }

  function buildLocalSession(identity: AccountIdentity): SyncedAccount {
    return {
      name: identity.fullName,
      avatar: '🐶',
      image: identity.image,
      email: identity.email,
      lastLoginAt: identity.lastLoginAt,
    }
  }

  function mapSyncedAccount(user: {
    _id: string
    full_name: string
    avatar_emoji?: string
    profile_image_url?: string
    email: string
    last_login_at: string
  }): SyncedAccount {
    return {
      id: user._id,
      name: user.full_name,
      avatar: user.avatar_emoji || '🐶',
      image: user.profile_image_url,
      email: user.email,
      lastLoginAt: new Date(user.last_login_at).getTime(),
    }
  }

  return {
    isOpen: readonly(isOpen),
    isNativePlatform,
    openAuth,
    closeAuth,
    handleGoogleSuccess,
    signInWithNativeGoogle,
    signOut,
  }
}
