type CrawlerSessionResponse = {
  authenticated?: boolean
  subject?: string
  expires_at?: string
}

let sessionProbePromise: Promise<boolean> | null = null

export function useCrawlerSession() {
  const runtimeConfig = useRuntimeConfig()
  const crawlerSessionValid = useState<boolean>('crawler-session-valid', () => false)

  async function verifyCrawlerSession(force = false) {
    if (!force && crawlerSessionValid.value) return true

    if (!sessionProbePromise || force) {
      sessionProbePromise = (async () => {
        const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
        const response = await $fetch<CrawlerSessionResponse>(`${runtimeConfig.public.apiBase}/api/session`, {
          method: 'GET',
          credentials: 'include',
          headers,
        })

        return Boolean(response.authenticated)
      })().catch(() => false)
    }

    const valid = await sessionProbePromise
    crawlerSessionValid.value = valid
    if (!valid) {
      sessionProbePromise = null
    }
    return valid
  }

  function setCrawlerSessionValid(next: boolean) {
    crawlerSessionValid.value = next
    sessionProbePromise = null
  }

  return {
    crawlerSessionValid: readonly(crawlerSessionValid),
    setCrawlerSessionValid,
    verifyCrawlerSession,
  }
}
