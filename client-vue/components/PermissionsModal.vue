<script setup lang="ts">
import { useAppSource } from '~/composables/useAppSource'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const {
  isGranted: notificationsGranted,
  isSupported: notificationsSupported,
  statusLabel: notificationsStatusLabel,
  notificationsEnabled,
  requestPermission,
  openSystemSettings,
  disableNotifications,
} = useNotificationPermission()
const { isAndroidApp, isWebApp } = useAppSource()
const config = useRuntimeConfig()
const isCompact = computed(() => config.public.uiDensityLobby === 'compact')

const notificationsActive = computed(() => notificationsEnabled.value)
const toggleLabel = computed(() => {
  if (!notificationsSupported.value) return ''
  if (notificationsGranted.value) return notificationsActive.value ? 'On' : 'Off'
  return notificationsActive.value ? 'On' : 'Off'
})

async function toggleNotifications() {
  if (!notificationsSupported.value) return
  if (notificationsActive.value) {
    if (isAndroidApp.value) {
      await openSystemSettings()
      return
    }
    disableNotifications()
    return
  }

  await requestPermission()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && (isWebApp || isAndroidApp)"
      class="permissions-modal"
      :class="{ 'permissions-modal--compact': isCompact }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permissions-modal-title"
    >
      <div class="permissions-modal__backdrop" @click="emit('close')" />
      <section class="permissions-modal__panel">
        <header class="permissions-modal__header">
          <p class="permissions-modal__eyebrow">Permissions</p>
          <h2 id="permissions-modal-title">Manage app permissions</h2>
          <p class="permissions-modal__subtitle">
            Choose what Sevens Royale can access on this device.
          </p>
        </header>

        <div class="permissions-modal__body">
          <div class="permissions-modal__items">
            <div class="permissions-modal__item">
              <div class="permissions-modal__item-copy">
                <h3>Notifications</h3>
                <p>{{ notificationsStatusLabel }}</p>
              </div>
              <span
                class="permissions-modal__switch"
                :class="{ 'permissions-modal__switch--on': notificationsActive }"
                :aria-checked="notificationsActive ? 'true' : 'false'"
                role="switch"
                tabindex="0"
                @click="toggleNotifications"
                @keydown.enter.prevent="toggleNotifications"
                @keydown.space.prevent="toggleNotifications"
              >
                <span class="permissions-modal__switch-thumb" />
                <span class="permissions-modal__switch-label">{{ toggleLabel }}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            class="permissions-modal__done"
            @click="emit('close')"
          >
            Done
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.permissions-modal {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.permissions-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(8px);
}

.permissions-modal__panel {
  position: relative;
  width: min(100%, 30rem);
  border-radius: 1.5rem;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 55px rgba(2, 6, 23, 0.45);
  overflow: hidden;
}

.permissions-modal__header {
  padding: 1.2rem 1.4rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.1), transparent 28%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.08), transparent 35%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.96));
}

.permissions-modal__body {
  padding: 1.15rem 1.4rem 1.25rem;
}

.permissions-modal__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.permissions-modal__panel h2 {
  margin: 0.35rem 0 0;
  color: #f8f4ec;
}

.permissions-modal__subtitle {
  margin: 0.62rem 0 0;
  color: rgba(203, 213, 225, 0.8);
  font-size: 0.86rem;
  line-height: 1.5;
}

.permissions-modal__items {
  display: grid;
  gap: 0.85rem;
}

.permissions-modal__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.95rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.permissions-modal__item-copy {
  min-width: 0;
}

.permissions-modal__item-copy h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 1rem;
  font-weight: 800;
}

.permissions-modal__item-copy p {
  margin: 0.35rem 0 0;
  color: rgba(148, 163, 184, 0.9);
  font-size: 0.9rem;
  line-height: 1.4;
}

.permissions-modal__switch {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  width: 4.2rem;
  height: 1.7rem;
  margin-top: 0.08rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(51, 65, 85, 0.86);
  transition: background-color 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  user-select: none;
}

.permissions-modal__switch--on {
  border-color: rgba(52, 211, 153, 0.34);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.9));
}

.permissions-modal__switch-thumb {
  width: 1.18rem;
  height: 1.18rem;
  margin-left: 0.2rem;
  border-radius: 999px;
  background: #f8fafc;
  box-shadow: 0 4px 10px rgba(2, 6, 23, 0.24);
  transition: transform 0.2s ease;
}

.permissions-modal__switch--on .permissions-modal__switch-thumb {
  transform: translateX(2.62rem);
}

.permissions-modal__switch-label {
  position: absolute;
  right: 0.42rem;
  top: 50%;
  transform: translateY(-50%);
  color: #f8fafc;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1;
  pointer-events: none;
}

.permissions-modal__switch--on .permissions-modal__switch-label {
  right: auto;
  left: 0.42rem;
}

.permissions-modal__done {
  width: 100%;
  margin-top: 1.15rem;
  min-height: 3.25rem;
  border-radius: 999px;
  background: #d4af37;
  color: #111827;
  font-weight: 800;
  transition: transform 0.18s ease, background-color 0.18s ease;
}

.permissions-modal__done:hover,
.permissions-modal__done:focus-visible {
  transform: translateY(-1px);
  background: #e3bf57;
}

.permissions-modal--compact {
  padding: 0.65rem;
}

.permissions-modal--compact .permissions-modal__panel {
  width: min(100%, 22.75rem);
  border-radius: 1.05rem;
  border-color: rgba(148, 163, 184, 0.16);
  box-shadow: 0 16px 34px rgba(2, 6, 23, 0.42);
}

.permissions-modal--compact .permissions-modal__header {
  padding: 0.82rem 0.9rem 0.74rem;
}

.permissions-modal--compact .permissions-modal__body {
  padding: 0.82rem 0.9rem 0.92rem;
}

.permissions-modal--compact .permissions-modal__eyebrow {
  font-size: 0.62rem;
  letter-spacing: 0.18em;
}

.permissions-modal--compact .permissions-modal__panel h2 {
  margin-top: 0.22rem;
  font-size: 1.02rem;
  line-height: 1.2;
}

.permissions-modal--compact .permissions-modal__subtitle {
  margin-top: 0.42rem;
  font-size: 0.73rem;
  line-height: 1.36;
}

.permissions-modal--compact .permissions-modal__items {
  gap: 0.55rem;
}

.permissions-modal--compact .permissions-modal__item {
  gap: 0.6rem;
  padding: 0.7rem 0.74rem 0.68rem;
  border-radius: 0.85rem;
}

.permissions-modal--compact .permissions-modal__item-copy h3 {
  font-size: 0.84rem;
}

.permissions-modal--compact .permissions-modal__item-copy p {
  margin-top: 0.2rem;
  font-size: 0.74rem;
}

.permissions-modal--compact .permissions-modal__switch {
  width: 3.22rem;
  height: 1.3rem;
  margin-top: 0;
}

.permissions-modal--compact .permissions-modal__switch-thumb {
  width: 0.9rem;
  height: 0.9rem;
  margin-left: 0.16rem;
}

.permissions-modal--compact .permissions-modal__switch--on .permissions-modal__switch-thumb {
  transform: translateX(1.98rem);
}

.permissions-modal--compact .permissions-modal__switch-label {
  right: 0.31rem;
  font-size: 0.53rem;
  letter-spacing: 0.02em;
}

.permissions-modal--compact .permissions-modal__switch--on .permissions-modal__switch-label {
  left: 0.25rem;
}

.permissions-modal--compact .permissions-modal__done {
  margin-top: 0.68rem;
  min-height: 2.55rem;
  border-radius: 0.82rem;
  font-size: 0.89rem;
}

@media (max-width: 420px) {
  .permissions-modal__item {
    align-items: flex-start;
    flex-direction: column;
  }

  .permissions-modal__switch {
    margin-top: 0.4rem;
  }
}
</style>
