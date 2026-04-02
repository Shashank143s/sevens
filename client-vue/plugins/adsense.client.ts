const ADSENSE_CLIENT = 'ca-pub-7523880309915043'

function isStandaloneAppSession() {
  if (typeof window === 'undefined') return false

  const isStandaloneDisplayMode = window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: window-controls-overlay)').matches

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
  const isIosStandalone = navigatorWithStandalone.standalone === true
  const isAndroidTwa = document.referrer.startsWith('android-app://')

  return isStandaloneDisplayMode || isIosStandalone || isAndroidTwa
}

export default defineNuxtPlugin(() => {
  if (isStandaloneAppSession()) return

  useHead({
    meta: [
      { name: 'google-adsense-account', content: ADSENSE_CLIENT },
    ],
    script: [
      {
        async: true,
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
        crossorigin: 'anonymous',
      },
    ],
  })
})
