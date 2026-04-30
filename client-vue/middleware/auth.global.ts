import { normalizePath } from '~/utils/normalizePath'

export default defineNuxtRouteMiddleware(async (to) => {
  const path = normalizePath(to.path)
  const { session, hydrateSession } = usePlayerSession()
  // const authRedirecting = useState<boolean>('auth-redirecting', () => false)
  hydrateSession()

  if (
    ['/login'].includes(path)
  ) {
    if (session.value?.name?.trim()) {
      return navigateTo({ path: '/' })
    }

    return
  }

  if (
    ['/', '/privacy-policy', '/terms-and-conditions', '/contact', '/downloads', '/instructions', '/blog'].includes(path)
    || path.startsWith('/blog/')
  ) return

  if (session.value?.name?.trim()) return
  // else return navigateTo({
  //   path: '/',
  // })
  // authRedirecting.value = true
})
