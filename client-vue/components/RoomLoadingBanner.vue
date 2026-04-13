<script setup lang="ts">
import { BannerAdPosition } from '@capacitor-community/admob'

const props = withDefaults(defineProps<{
  enabled?: boolean
  position?: BannerAdPosition
}>(), {
  enabled: true,
  position: BannerAdPosition.BOTTOM_CENTER,
})

const admob = useAdMob()

let bannerShown = false
let latestPosition = props.position

async function syncBanner() {
  if (!admob.canUseAdMob.value) {
    if (bannerShown) {
      await admob.removeBanner().catch(() => {})
      bannerShown = false
    }
    return
  }

  if (!props.enabled) {
    if (bannerShown) {
      await admob.removeBanner().catch(() => {})
      bannerShown = false
    }
    return
  }

  if (bannerShown && latestPosition === props.position) return

  if (bannerShown) {
    await admob.removeBanner().catch(() => {})
    bannerShown = false
  }

  const shown = await admob.showBanner(props.position)
  bannerShown = shown
  latestPosition = props.position
}

watch(
  () => [props.enabled, props.position, admob.canUseAdMob.value] as const,
  () => {
    void syncBanner()
  },
  { immediate: true },
)

onUnmounted(() => {
  if (!bannerShown) return
  void admob.removeBanner()
})
</script>

<template></template>
