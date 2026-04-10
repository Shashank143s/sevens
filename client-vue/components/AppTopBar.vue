<script setup lang="ts">
const props = withDefaults(defineProps<{
  backTo?: string
  backLabel?: string
}>(), {
  backTo: '',
  backLabel: '',
})

const router = useRouter()
const showBack = computed(() => !!props.backTo && !!props.backLabel)

function goBack() {
  if (!props.backTo) return
  router.push(props.backTo)
}
</script>

<template>
  <div class="app-topbar">
    <header class="app-topbar__header">
      <button
        v-if="showBack"
        type="button"
        class="app-topbar__back"
        @click="goBack"
      >
        ← {{ backLabel }}
      </button>
      <div v-else class="app-topbar__back app-topbar__back--ghost" aria-hidden="true" />
      <AppUserMenu />
    </header>
    <div class="app-topbar__spacer" aria-hidden="true" />
  </div>
</template>

<style scoped>
.app-topbar {
  position: relative;
  z-index: 60;
}

.app-topbar__header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding:
    max(0.9rem, env(safe-area-inset-top))
    max(1rem, env(safe-area-inset-right))
    0
    max(1rem, env(safe-area-inset-left));
}

.app-topbar__back {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 40px rgba(2, 6, 23, 0.24);
  backdrop-filter: blur(16px);
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.95rem;
  font-weight: 700;
  transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
}

.app-topbar__back:hover,
.app-topbar__back:focus-visible {
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  border-color: rgba(212, 175, 55, 0.22);
}

.app-topbar__back--ghost {
  visibility: hidden;
  pointer-events: none;
}

.app-topbar__spacer {
  height: calc(max(0.9rem, env(safe-area-inset-top)) + 2.75rem + 1.1rem);
}
</style>
