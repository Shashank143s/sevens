<script setup lang="ts">
import { useAttrs } from 'vue'

const props = defineProps<{
  name?: string | null
  imageSrc?: string | null
}>()

const attrs = useAttrs()
const imageFailed = ref(false)

const initials = computed(() => {
  const trimmed = (props.name ?? '').trim()
  if (!trimmed) return '?'

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
})

const shouldShowImage = computed(() => Boolean(props.imageSrc) && !imageFailed.value)

watch(
  () => props.imageSrc,
  () => {
    imageFailed.value = false
  },
)

function onImageError() {
  imageFailed.value = true
}
</script>

<template>
  <span v-bind="attrs" class="user-avatar">
    <img
      v-if="shouldShowImage"
      :src="imageSrc ?? ''"
      :alt="name || 'Avatar'"
      class="user-avatar__image"
      @error="onImageError"
    >
    <span v-else class="user-avatar__fallback">{{ initials }}</span>
  </span>
</template>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.user-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar__fallback {
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
</style>
