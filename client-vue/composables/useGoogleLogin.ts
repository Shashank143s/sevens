/**
 * Composable for Google login flow: opens/closes auth UI (modal or drawer)
 * and sets player session on successful Google sign-in.
 */
const AUTH_OPEN_KEY = 'sevens-google-auth-open'

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
    // console.log("Google login success=====>", e);
    const claims = e.claims as { name?: string; email?: string; picture?: string }
    const name = (claims.name || claims.email || 'Player').trim()
    setSession(name, '🐶')
    closeAuth()
  }

  return {
    isOpen: readonly(isOpen),
    openAuth,
    closeAuth,
    handleGoogleSuccess,
  }
}
