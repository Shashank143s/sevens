export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  if (
    ['/', '/privacy-policy', '/terms-and-conditions', '/contact', '/downloads', '/instructions', '/blog'].includes(to.path)
    || to.path.startsWith('/blog/')
  ) return

  const { session, hydrateSession } = usePlayerSession()
  const authRedirecting = useState<boolean>('auth-redirecting', () => false)
  hydrateSession()
  if (session.value?.name?.trim()) return

  authRedirecting.value = true
})
