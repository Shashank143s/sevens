export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  if (['/', '/privacy-policy', '/terms-and-conditions'].includes(to.path)) return

  const { session, hydrateSession } = usePlayerSession()
  const authRedirecting = useState<boolean>('auth-redirecting', () => false)
  hydrateSession()
  if (session.value?.name?.trim()) return

  authRedirecting.value = true
})
