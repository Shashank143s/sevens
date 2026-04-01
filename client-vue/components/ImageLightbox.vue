<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  src?: string
  alt?: string
}>()

const emit = defineEmits<{
  close: []
}>()

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.visible) {
    emit('close')
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <Transition name="lightbox-fade">
    <div
      v-if="visible && src"
      class="image-lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="alt || 'Image preview'"
      @click.self="emit('close')"
    >
      <div class="image-lightbox__backdrop" />
      <button
        type="button"
        class="image-lightbox__close"
        aria-label="Close image preview"
        @click="emit('close')"
      >
        ✕
      </button>
      <div class="image-lightbox__frame">
        <img :src="src" :alt="alt || 'Image preview'" class="image-lightbox__image">
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.image-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
}

.image-lightbox__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.62);
  backdrop-filter: blur(18px);
}

.image-lightbox__frame {
  position: relative;
  z-index: 1;
  width: min(100%, 68rem);
  max-height: min(100dvh - 3rem, 90rem);
  border-radius: 1.4rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.82);
  box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
}

.image-lightbox__image {
  display: block;
  width: 100%;
  max-height: min(100dvh - 3rem, 90rem);
  object-fit: contain;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
}

.image-lightbox__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 23, 42, 0.82);
  color: #f8fafc;
  font-size: 1rem;
  font-weight: 800;
  box-shadow: 0 14px 32px rgba(2, 6, 23, 0.3);
  backdrop-filter: blur(14px);
}

.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.18s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}
</style>
