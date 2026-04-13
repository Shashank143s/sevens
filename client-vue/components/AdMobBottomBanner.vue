<script setup lang="ts">
const admob = useAdMob()

const showBannerReady = computed(() => admob.canUseAdMob.value)

onMounted(() => {
  if (!showBannerReady.value) return
  void admob.showBanner()
})

onUnmounted(() => {
  if (!showBannerReady.value) return
  void admob.removeBanner()
})
</script>

<template></template>
