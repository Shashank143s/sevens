const ADSENSE_CLIENT = 'ca-pub-7523880309915043'
const ADSENSE_SCRIPT_ID = 'sevens-adsense-script'

function isStandaloneAppSession() {
  if (typeof window === 'undefined') return false

  const isStandaloneDisplayMode = window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: window-controls-overlay)').matches

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
  const isIosStandalone = navigatorWithStandalone.standalone === true
  const isAndroidTwa = document.referrer.startsWith('android-app://')

  return isStandaloneDisplayMode || isIosStandalone || isAndroidTwa
}

function injectAdSenseHead() {
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return

  const meta = document.createElement('meta')
  meta.name = 'google-adsense-account'
  meta.content = ADSENSE_CLIENT
  document.head.appendChild(meta)

  const script = document.createElement('script')
  script.id = ADSENSE_SCRIPT_ID
  script.async = true
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}

export default defineNuxtPlugin(() => {
  if (isStandaloneAppSession()) return
  injectAdSenseHead()
})
