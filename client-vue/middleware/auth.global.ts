import { normalizePath } from '~/utils/normalizePath'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const path = normalizePath(to.path)

  if (
    ['/', '/privacy-policy', '/terms-and-conditions', '/contact', '/downloads', '/instructions', '/blog'].includes(path)
    || path.startsWith('/blog/')
  ) return

  const { session, hydrateSession } = usePlayerSession()
  const authRedirecting = useState<boolean>('auth-redirecting', () => false)
  hydrateSession()
  if (session.value?.name?.trim()) return

  authRedirecting.value = true
})
